#!/usr/bin/env python3
"""
inventory.py: deterministic project inventory for code audits.

Walks a project tree (or extracts a zip first), and emits a COMPACT JSON summary:
languages by LOC, detected frameworks, dependency manifests, likely entry points,
config/CI/infra files, potential secret files, complexity/churn hotspots, and git stats.

The goal is to give the auditor a cheap, high-signal map so it doesn't have to read the
whole tree. Lists are capped so the output stays small. Standard library only: runs anywhere.

Usage:
    python inventory.py <path-to-dir-or-zip> [--json-out FILE] [--top N]
"""

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
import zipfile
from collections import defaultdict

# --- Directories/files we skip when counting code (still noted if present) ---
SKIP_DIRS = {
    ".git", ".hg", ".svn", "node_modules", "bower_components", "vendor",
    "dist", "build", "out", "target", "bin", "obj", ".next", ".nuxt",
    "__pycache__", ".pytest_cache", ".mypy_cache", ".ruff_cache", ".tox",
    "venv", ".venv", "env", ".env.d", "site-packages", ".gradle", ".idea",
    ".vscode", "coverage", ".coverage", "htmlcov", ".cache", "tmp", ".terraform",
    "Pods", "DerivedData", ".dart_tool", "elm-stuff", "_build", "deps",
}

# --- extension -> language ---
EXT_LANG = {
    ".py": "Python", ".pyi": "Python",
    ".js": "JavaScript", ".mjs": "JavaScript", ".cjs": "JavaScript", ".jsx": "JavaScript",
    ".ts": "TypeScript", ".tsx": "TypeScript",
    ".java": "Java", ".kt": "Kotlin", ".kts": "Kotlin", ".scala": "Scala", ".groovy": "Groovy",
    ".go": "Go",
    ".rb": "Ruby", ".erb": "Ruby",
    ".php": "PHP", ".phtml": "PHP",
    ".cs": "C#", ".fs": "F#", ".vb": "VB.NET",
    ".rs": "Rust",
    ".c": "C", ".h": "C", ".cc": "C++", ".cpp": "C++", ".cxx": "C++", ".hpp": "C++",
    ".swift": "Swift", ".m": "Objective-C", ".mm": "Objective-C",
    ".dart": "Dart",
    ".ex": "Elixir", ".exs": "Elixir",
    ".clj": "Clojure", ".cljs": "Clojure",
    ".hs": "Haskell",
    ".lua": "Lua",
    ".r": "R", ".R": "R",
    ".pl": "Perl", ".pm": "Perl",
    ".sh": "Shell", ".bash": "Shell", ".zsh": "Shell",
    ".sql": "SQL",
    ".html": "HTML", ".htm": "HTML", ".vue": "Vue", ".svelte": "Svelte",
    ".css": "CSS", ".scss": "CSS", ".sass": "CSS", ".less": "CSS",
}

# --- manifest filename -> ecosystem ---
MANIFESTS = {
    "package.json": "npm", "package-lock.json": "npm", "yarn.lock": "yarn",
    "pnpm-lock.yaml": "pnpm", "bun.lockb": "bun",
    "requirements.txt": "pip", "requirements-dev.txt": "pip", "pyproject.toml": "python",
    "Pipfile": "pipenv", "Pipfile.lock": "pipenv", "poetry.lock": "poetry", "setup.py": "python",
    "setup.cfg": "python", "environment.yml": "conda",
    "pom.xml": "maven", "build.gradle": "gradle", "build.gradle.kts": "gradle",
    "settings.gradle": "gradle", "go.mod": "go", "go.sum": "go",
    "Gemfile": "bundler", "Gemfile.lock": "bundler",
    "composer.json": "composer", "composer.lock": "composer",
    "Cargo.toml": "cargo", "Cargo.lock": "cargo",
    "Package.swift": "swiftpm", "pubspec.yaml": "pub", "mix.exs": "mix",
}

INFRA_FILES = {
    "Dockerfile", "docker-compose.yml", "docker-compose.yaml", "compose.yml",
    ".dockerignore", "Makefile", "Procfile", "Vagrantfile",
    ".gitlab-ci.yml", ".travis.yml", "azure-pipelines.yml", "Jenkinsfile",
    "netlify.toml", "vercel.json", "serverless.yml", "template.yaml",
    "requirements.lock",
}

# filenames that often hold secrets / sensitive material
SECRET_FILE_HINTS = re.compile(
    r"(^\.env$|^\.env\.|\.pem$|\.key$|\.p12$|\.pfx$|_rsa$|id_dsa$|"
    r"credentials|secrets?\.(json|ya?ml|txt)|\.pgpass$|\.htpasswd$)", re.IGNORECASE
)

# entry-point-ish filenames
ENTRY_HINTS = re.compile(
    r"^(main|index|app|server|application|wsgi|asgi|manage|cli|run|program|"
    r"bootstrap|entrypoint)\.[A-Za-z0-9]+$", re.IGNORECASE
)

# lightweight hardcoded-secret smell (a quick flag only; run_scanners.py does the real pass)
SECRET_PATTERNS = [
    re.compile(r"AKIA[0-9A-Z]{16}"),                        # AWS access key id
    re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----"),      # private key block
    re.compile(r"(?i)(api[_-]?key|secret|token|passwd|password)\s*[:=]\s*['\"][^'\"]{8,}['\"]"),
    re.compile(r"gh[pousr]_[A-Za-z0-9]{20,}"),              # GitHub token
    re.compile(r"xox[baprs]-[A-Za-z0-9-]{10,}"),            # Slack token
]

TEXT_EXTS = set(EXT_LANG) | {
    ".json", ".yaml", ".yml", ".toml", ".ini", ".cfg", ".xml", ".md", ".txt",
    ".env", ".conf", ".properties", ".gradle", ".tf",
}

MAX_FILE_SCAN_BYTES = 2_000_000  # don't read files larger than this for secret smell

# Many Linux scripts are extensionless; classify them by their shebang line.
SHEBANG_LANG = [
    (re.compile(r"\b(bash|dash|zsh|ksh|/sh)\b"), "Shell"),
    (re.compile(r"\bpython[0-9.]*\b"), "Python"),
    (re.compile(r"\bnode\b"), "JavaScript"),
    (re.compile(r"\bruby\b"), "Ruby"),
    (re.compile(r"\bperl\b"), "Perl"),
    (re.compile(r"\bphp\b"), "PHP"),
]
SHEBANG_SCAN_CAP = 3000  # cap extensionless files we peek, to bound cost on large repos


def detect_by_shebang(path):
    """Return a language for an extensionless file based on its shebang, else None."""
    try:
        if os.path.getsize(path) > 200_000:
            return None
        with open(path, "r", encoding="utf-8", errors="ignore") as fh:
            first = fh.readline(200)
        if not first.startswith("#!"):
            return None
        for pat, lang in SHEBANG_LANG:
            if pat.search(first):
                return lang
    except Exception:
        return None
    return None



def count_loc(path):
    """Count non-blank lines; return (loc, first_kb_text_or_none)."""
    try:
        if os.path.getsize(path) > MAX_FILE_SCAN_BYTES:
            return None, None
        with open(path, "r", encoding="utf-8", errors="ignore") as fh:
            text = fh.read()
        loc = sum(1 for line in text.splitlines() if line.strip())
        return loc, text
    except Exception:
        return None, None


def detect_frameworks(manifest_contents):
    """Infer frameworks from manifest contents. Returns sorted list of strings."""
    fw = set()
    blob = "\n".join(manifest_contents.values()).lower()

    js_map = {
        "react": "React", "next": "Next.js", "vue": "Vue", "nuxt": "Nuxt",
        "@angular/core": "Angular", "svelte": "Svelte", "express": "Express",
        "koa": "Koa", "fastify": "Fastify", "@nestjs/core": "NestJS",
        "electron": "Electron", "react-native": "React Native", "gatsby": "Gatsby",
        "socket.io": "Socket.IO", "graphql": "GraphQL",
    }
    py_map = {
        "django": "Django", "flask": "Flask", "fastapi": "FastAPI",
        "tornado": "Tornado", "pyramid": "Pyramid", "aiohttp": "aiohttp",
        "sqlalchemy": "SQLAlchemy", "celery": "Celery", "scrapy": "Scrapy",
        "streamlit": "Streamlit", "pydantic": "Pydantic",
    }
    other_map = {
        "spring-boot": "Spring Boot", "org.springframework": "Spring",
        "quarkus": "Quarkus", "micronaut": "Micronaut",
        "laravel/framework": "Laravel", "symfony/": "Symfony",
        "rails": "Ruby on Rails", "sinatra": "Sinatra",
        "gin-gonic/gin": "Gin", "gofiber/fiber": "Fiber", "labstack/echo": "Echo",
        "actix-web": "Actix", "rocket": "Rocket", "axum": "Axum",
        "aspnetcore": "ASP.NET Core", "microsoft.aspnetcore": "ASP.NET Core",
    }
    for m in (js_map, py_map, other_map):
        for needle, name in m.items():
            if needle in blob:
                fw.add(name)
    return sorted(fw)


def git_stats(root):
    """Return git churn / activity stats if a git repo is present and git is available."""
    if not os.path.isdir(os.path.join(root, ".git")):
        return None
    out = {}
    def run(args):
        try:
            r = subprocess.run(["git", "-C", root] + args, capture_output=True,
                               text=True, timeout=20)
            return r.stdout.strip() if r.returncode == 0 else None
        except Exception:
            return None
    commits = run(["rev-list", "--count", "HEAD"])
    if commits:
        out["commit_count"] = int(commits)
    last = run(["log", "-1", "--format=%cs"])
    if last:
        out["last_commit_date"] = last
    authors = run(["shortlog", "-sne", "HEAD"])
    if authors:
        out["contributor_count"] = len([l for l in authors.splitlines() if l.strip()])
    # churn: files changed most often (best hotspot signal)
    log = run(["log", "--name-only", "--pretty=format:", "--since=1.year"])
    if log:
        counts = defaultdict(int)
        for line in log.splitlines():
            line = line.strip()
            if line and not line.startswith((".git",)):
                counts[line] += 1
        top = sorted(counts.items(), key=lambda kv: -kv[1])[:12]
        out["most_changed_files"] = [{"file": f, "changes": c} for f, c in top if c > 1]
    return out or None


def build_inventory(root, top_n):
    lang_loc = defaultdict(int)
    lang_files = defaultdict(int)
    manifests = {}
    manifest_contents = {}
    infra = []
    ci_workflows = []
    secret_files = []
    entry_points = []
    secret_smell = []
    file_sizes = []          # (relpath, loc)
    dir_loc = defaultdict(int)
    total_files = 0
    total_loc = 0
    has_tests = False
    has_readme = False
    shebang_checked = 0

    root = os.path.abspath(root)
    for dirpath, dirnames, filenames in os.walk(root):
        # detect CI workflows before pruning
        rel_dir = os.path.relpath(dirpath, root)
        if os.path.basename(dirpath) == "workflows" and ".github" in rel_dir.split(os.sep):
            for f in filenames:
                if f.endswith((".yml", ".yaml")):
                    ci_workflows.append(os.path.join(rel_dir, f))
        # prune heavy dirs
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith(".egg")]

        for fname in filenames:
            fpath = os.path.join(dirpath, fname)
            rel = os.path.relpath(fpath, root)
            lower = fname.lower()

            if fname in MANIFESTS:
                manifests[rel] = MANIFESTS[fname]
                loc, text = count_loc(fpath)
                if text is not None:
                    manifest_contents[rel] = text[:20000]
            if fname in INFRA_FILES:
                infra.append(rel)
            if SECRET_FILE_HINTS.search(fname):
                secret_files.append(rel)
            if ENTRY_HINTS.match(fname):
                entry_points.append(rel)
            if lower.startswith("readme"):
                has_readme = True
            if "test" in rel.lower() or "spec" in lower:
                has_tests = True

            ext = os.path.splitext(fname)[1]
            lang = EXT_LANG.get(ext)
            if lang is None and ext == "" and shebang_checked < SHEBANG_SCAN_CAP:
                shebang_checked += 1
                lang = detect_by_shebang(fpath)
                if lang:
                    # extensionless script (e.g. a shell entrypoint): likely an entry point
                    entry_points.append(rel)
            if lang is not None:
                total_files += 1
                loc, text = count_loc(fpath)
                if loc is not None:
                    lang_loc[lang] += loc
                    lang_files[lang] += 1
                    total_loc += loc
                    file_sizes.append((rel, loc))
                    top_dir = rel.split(os.sep)[0] if os.sep in rel else "."
                    dir_loc[top_dir] += loc
                    # secret smell on source + config text (incl. shebang-detected scripts)
                    if text and (ext in TEXT_EXTS or ext == ""):
                        for pat in SECRET_PATTERNS:
                            if pat.search(text):
                                secret_smell.append(rel)
                                break

    # rank things, capped
    langs = sorted(lang_loc.items(), key=lambda kv: -kv[1])
    languages = [
        {"language": l, "loc": loc, "files": lang_files[l],
         "pct": round(100 * loc / total_loc, 1) if total_loc else 0}
        for l, loc in langs
    ]
    largest = sorted(file_sizes, key=lambda kv: -kv[1])[:top_n]
    biggest_dirs = sorted(dir_loc.items(), key=lambda kv: -kv[1])[:top_n]

    inv = {
        "root": root,
        "totals": {"source_files": total_files, "source_loc": total_loc},
        "languages": languages,
        "primary_language": languages[0]["language"] if languages else None,
        "frameworks": detect_frameworks(manifest_contents),
        "dependency_manifests": manifests,
        "infra_files": sorted(set(infra))[:top_n],
        "ci_workflows": sorted(set(ci_workflows))[:top_n],
        "likely_entry_points": sorted(set(entry_points))[:top_n],
        "largest_files": [{"file": f, "loc": loc} for f, loc in largest],
        "biggest_top_dirs": [{"dir": d, "loc": loc} for d, loc in biggest_dirs],
        "has_tests": has_tests,
        "has_readme": has_readme,
        "potential_secret_files": sorted(set(secret_files))[:top_n],
        "hardcoded_secret_smell_files": sorted(set(secret_smell))[:top_n],
        "git": git_stats(root),
    }
    return inv


def maybe_extract_zip(path):
    """If path is a zip, extract into a temp dir and return the extraction root."""
    if os.path.isfile(path) and zipfile.is_zipfile(path):
        dest = tempfile.mkdtemp(prefix="audit_extract_")
        with zipfile.ZipFile(path) as zf:
            zf.extractall(dest)
        # if the zip has a single top-level dir, descend into it
        entries = [e for e in os.listdir(dest) if not e.startswith("__MACOSX")]
        if len(entries) == 1 and os.path.isdir(os.path.join(dest, entries[0])):
            return os.path.join(dest, entries[0])
        return dest
    return path


def main():
    ap = argparse.ArgumentParser(description="Inventory a code project for auditing.")
    ap.add_argument("path", help="Path to a project directory or a .zip archive")
    ap.add_argument("--json-out", help="Also write JSON to this file")
    ap.add_argument("--top", type=int, default=15, help="Cap for ranked lists (default 15)")
    args = ap.parse_args()

    if not os.path.exists(args.path):
        print(json.dumps({"error": f"path not found: {args.path}"}))
        sys.exit(1)

    root = maybe_extract_zip(args.path)
    inv = build_inventory(root, args.top)
    text = json.dumps(inv, indent=2)
    print(text)
    if args.json_out:
        with open(args.json_out, "w") as fh:
            fh.write(text)


if __name__ == "__main__":
    main()

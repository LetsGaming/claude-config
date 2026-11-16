#!/usr/bin/env python3
"""
run_scanners.py: run available static-analysis / security tools over a project and
normalize their output, with guaranteed toolless fallbacks.

Strategy (tools-when-available, degrade gracefully):
  1. Detect languages present.
  2. Optionally pip-install a small set of pure-Python tools reachable from PyPI
     (ruff, bandit, pip-audit). Disable with --no-install.
  3. Run whatever tools are available for the languages present, each with a timeout.
     Tools that need a heavy toolchain or unreachable network are probed and skipped
     gracefully (recorded with a reason) rather than failing the run.
  4. ALWAYS run two toolless baselines that need no external tools or network:
       - a dependency/version reader (parses manifests/lockfiles)
       - a regex secret scan
  5. Normalize everything to a common finding shape and print COMPACT JSON, including a
     tools_run / tools_skipped section so audit coverage can be reported honestly.

Every finding a tool reports is a LEAD TO VERIFY, not a verdict. Tools miss things and
produce false positives; confirm against the real code before trusting them.

Usage:
    python run_scanners.py <path> [--no-install] [--languages py,js] [--max PER_TOOL]
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import zipfile
import tempfile
from collections import defaultdict

SKIP_DIRS = {
    ".git", ".hg", ".svn", "node_modules", "bower_components", "vendor",
    "dist", "build", "out", "target", "bin", "obj", ".next", ".nuxt",
    "__pycache__", ".pytest_cache", ".mypy_cache", ".ruff_cache", ".tox",
    "venv", ".venv", "env", "site-packages", ".gradle", ".idea", ".vscode",
    "coverage", "htmlcov", ".cache", "tmp", ".terraform", "Pods", ".dart_tool",
}

EXT_LANG = {
    ".py": "py", ".js": "js", ".mjs": "js", ".cjs": "js", ".jsx": "js",
    ".ts": "js", ".tsx": "js", ".go": "go", ".rb": "rb", ".php": "php",
    ".java": "java", ".kt": "java", ".cs": "cs", ".rs": "rs",
    ".sh": "sh", ".bash": "sh", ".zsh": "sh", ".ksh": "sh",
}

# Shebang for shell scripts (many Linux scripts are extensionless).
SHELL_SHEBANG = re.compile(r"^#!\s*/\S*\b(bash|sh|dash|zsh|ksh)\b")
# Any script shebang (used to decide whether to secret-scan an extensionless file).
ANY_SHEBANG = re.compile(r"^#!\s*/\S")

# Secret patterns (superset of the inventory smell test).
SECRET_PATTERNS = [
    ("aws_access_key_id", re.compile(r"AKIA[0-9A-Z]{16}")),
    ("aws_secret_access_key", re.compile(r"(?i)aws.{0,20}['\"][0-9a-zA-Z/+]{40}['\"]")),
    ("private_key_block", re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----")),
    ("github_token", re.compile(r"gh[pousr]_[A-Za-z0-9]{20,}")),
    ("slack_token", re.compile(r"xox[baprs]-[A-Za-z0-9-]{10,}")),
    ("google_api_key", re.compile(r"AIza[0-9A-Za-z\-_]{35}")),
    ("stripe_key", re.compile(r"sk_live_[0-9a-zA-Z]{20,}")),
    ("slack_webhook", re.compile(r"https://hooks\.slack\.com/services/[A-Za-z0-9/]+")),
    ("jwt", re.compile(r"eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}")),
    ("generic_secret_assignment", re.compile(
        r"(?i)(api[_-]?key|secret|token|passwd|password|client[_-]?secret)"
        r"\s*[:=]\s*['\"][^'\"\s]{8,}['\"]")),
]

TEXT_EXTS = set(EXT_LANG) | {
    ".json", ".yaml", ".yml", ".toml", ".ini", ".cfg", ".xml", ".env",
    ".conf", ".properties", ".tf", ".sh", ".bash", ".txt", ".md", ".html", ".vue",
}
MAX_SCAN_BYTES = 1_500_000


# ----------------------------- helpers -----------------------------

def run_cmd(args, cwd=None, timeout=180):
    """Run a command; return (returncode, stdout, stderr) or (None, '', reason)."""
    try:
        r = subprocess.run(args, cwd=cwd, capture_output=True, text=True, timeout=timeout)
        return r.returncode, r.stdout, r.stderr
    except FileNotFoundError:
        return None, "", "not installed"
    except subprocess.TimeoutExpired:
        return None, "", "timed out"
    except Exception as e:  # pragma: no cover
        return None, "", f"error: {e}"


def have(tool):
    return shutil.which(tool) is not None


def detect_languages(root):
    langs = set()
    manifests = set()
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for f in filenames:
            ext = os.path.splitext(f)[1]
            if ext in EXT_LANG:
                langs.add(EXT_LANG[ext])
            manifests.add(f)
    return langs, manifests


def find_files(root, names):
    """Return list of paths whose basename is in `names`."""
    found = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for f in filenames:
            if f in names:
                found.append(os.path.join(dirpath, f))
    return found


def rel(root, path):
    try:
        return os.path.relpath(path, root)
    except Exception:
        return path


def add(findings, source, category, severity, rule, message, file=None, line=None):
    findings.append({
        "source": source, "category": category, "severity": (severity or "unknown").lower(),
        "rule": rule, "message": (message or "")[:300], "file": file, "line": line,
    })


# ----------------------------- installers -----------------------------

def try_install(pkgs, log):
    """Best-effort pip install of pure-Python tools. Never fatal."""
    code, out, err = run_cmd(
        [sys.executable, "-m", "pip", "install", "--break-system-packages", "-q", *pkgs],
        timeout=240,
    )
    if code == 0:
        log["installs"].append({"pkgs": pkgs, "ok": True})
    else:
        log["installs"].append({"pkgs": pkgs, "ok": False, "reason": (err or "install failed")[:200]})


def try_apt_install(pkgs, log):
    """Best-effort apt install of system tools (e.g. shellcheck). Never fatal.

    Only works where apt-get exists and the process has permission (e.g. root or
    passwordless sudo). Silently records the reason when it can't, so the scanner
    degrades to probe-only elsewhere (Claude Code on a laptop, CI without root, etc.).
    """
    if not shutil.which("apt-get"):
        log["installs"].append({"pkgs": pkgs, "ok": False, "reason": "apt-get not available", "via": "apt"})
        return
    if os.geteuid() != 0 and shutil.which("sudo") is None:
        log["installs"].append({"pkgs": pkgs, "ok": False, "reason": "no root/sudo for apt", "via": "apt"})
        return
    prefix = [] if os.geteuid() == 0 else ["sudo", "-n"]
    code, out, err = run_cmd(prefix + ["apt-get", "install", "-y", "-q", *pkgs], timeout=180)
    if code == 0:
        log["installs"].append({"pkgs": pkgs, "ok": True, "via": "apt"})
    else:
        log["installs"].append({"pkgs": pkgs, "ok": False, "reason": (err or "apt install failed")[:200], "via": "apt"})


# ----------------------------- python tools -----------------------------

def run_ruff(root, findings, log):
    if not have("ruff"):
        log["tools_skipped"].append({"tool": "ruff", "reason": "not installed"}); return
    # curated high-signal selection: real errors, bugbear (bugs), security, async/perf
    code, out, err = run_cmd(
        ["ruff", "check", "--select", "E9,F,B,S,ASYNC,PERF,BLE,DTZ",
         "--output-format", "json", root], timeout=180)
    if out is None or (code is None):
        log["tools_skipped"].append({"tool": "ruff", "reason": err}); return
    try:
        items = json.loads(out) if out.strip() else []
    except Exception:
        log["tools_skipped"].append({"tool": "ruff", "reason": "unparseable output"}); return
    for it in items:
        rule = it.get("code") or ""
        cat = "security" if rule.startswith("S") else ("bug" if rule.startswith(("B", "E9", "F")) else "quality")
        loc = it.get("location") or {}
        add(findings, "ruff", cat, "medium" if cat == "security" else "low",
            rule, it.get("message"), rel(root, it.get("filename", "")), loc.get("row"))
    log["tools_run"].append({"tool": "ruff", "findings": len(items)})


def run_bandit(root, findings, log):
    if not have("bandit"):
        log["tools_skipped"].append({"tool": "bandit", "reason": "not installed"}); return
    code, out, err = run_cmd(["bandit", "-r", root, "-f", "json", "-q"], timeout=180)
    if not out:
        log["tools_skipped"].append({"tool": "bandit", "reason": err or "no output"}); return
    try:
        data = json.loads(out)
    except Exception:
        log["tools_skipped"].append({"tool": "bandit", "reason": "unparseable output"}); return
    results = data.get("results", [])
    sev_map = {"HIGH": "high", "MEDIUM": "medium", "LOW": "low"}
    for r in results:
        add(findings, "bandit", "security", sev_map.get(r.get("issue_severity"), "medium"),
            r.get("test_id"), r.get("issue_text"),
            rel(root, r.get("filename", "")), r.get("line_number"))
    log["tools_run"].append({"tool": "bandit", "findings": len(results)})


def run_pip_audit(root, findings, log):
    if not have("pip-audit"):
        log["tools_skipped"].append({"tool": "pip-audit", "reason": "not installed"}); return
    reqs = find_files(root, {"requirements.txt"})
    args = ["pip-audit", "-f", "json"]
    if reqs:
        args += ["-r", reqs[0], "--no-deps", "--disable-pip"]
    code, out, err = run_cmd(args, cwd=root, timeout=180)
    if not out:
        log["tools_skipped"].append({"tool": "pip-audit", "reason": (err or "no output/network")[:150]}); return
    try:
        data = json.loads(out)
    except Exception:
        log["tools_skipped"].append({"tool": "pip-audit", "reason": "unparseable/network"}); return
    deps = data.get("dependencies", data if isinstance(data, list) else [])
    n = 0
    for d in deps:
        for v in d.get("vulns", []):
            n += 1
            add(findings, "pip-audit", "dependency", "high",
                v.get("id"), f"{d.get('name')} {d.get('version')}: {v.get('description','')}")
    log["tools_run"].append({"tool": "pip-audit", "findings": n})


# ----------------------------- js tools -----------------------------

def run_npm_audit(root, findings, log):
    locks = find_files(root, {"package-lock.json"})
    if not locks:
        log["tools_skipped"].append({"tool": "npm-audit", "reason": "no package-lock.json"}); return
    if not have("npm"):
        log["tools_skipped"].append({"tool": "npm-audit", "reason": "npm not installed"}); return
    proj = os.path.dirname(locks[0])
    code, out, err = run_cmd(["npm", "audit", "--json"], cwd=proj, timeout=180)
    if not out:
        log["tools_skipped"].append({"tool": "npm-audit", "reason": (err or "no output")[:150]}); return
    try:
        data = json.loads(out)
    except Exception:
        log["tools_skipped"].append({"tool": "npm-audit", "reason": "unparseable output"}); return
    vulns = data.get("vulnerabilities", {})
    n = 0
    for name, info in vulns.items():
        n += 1
        add(findings, "npm-audit", "dependency", info.get("severity", "unknown"),
            name, f"{name}: {info.get('severity','')} severity advisory")
    log["tools_run"].append({"tool": "npm-audit", "findings": n})


def run_eslint(root, findings, log):
    # The eslint binary and config in the audited tree are untrusted code, so they are never run.
    log["tools_skipped"].append({"tool": "eslint", "reason": "not run: binaries and configs in the audited tree are untrusted"})


# ----------------- probe-only tools (never installed here) -----------------

def probe_run_json(tool, args, root, category, findings, log, parse):
    if not have(tool):
        log["tools_skipped"].append({"tool": tool, "reason": "not installed"}); return
    code, out, err = run_cmd(args, cwd=root, timeout=180)
    if not out:
        log["tools_skipped"].append({"tool": tool, "reason": (err or "no output")[:150]}); return
    try:
        parse(out, findings)
        log["tools_run"].append({"tool": tool, "findings": "see findings"})
    except Exception:
        log["tools_skipped"].append({"tool": tool, "reason": "unparseable output"})


def find_shell_files(root, cap=3000):
    """Return shell scripts: by extension, plus extensionless files with a shell shebang."""
    files = []
    extless_checked = 0
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for f in filenames:
            ext = os.path.splitext(f)[1]
            path = os.path.join(dirpath, f)
            if ext in (".sh", ".bash", ".zsh", ".ksh"):
                files.append(path)
            elif ext == "" and extless_checked < cap:
                extless_checked += 1
                try:
                    if os.path.getsize(path) > MAX_SCAN_BYTES:
                        continue
                    with open(path, "r", encoding="utf-8", errors="ignore") as fh:
                        first = fh.readline(200)
                    if SHELL_SHEBANG.match(first):
                        files.append(path)
                except Exception:
                    continue
    return files


def run_shellcheck(root, findings, log):
    """Run shellcheck over shell scripts. shellcheck focuses on correctness/robustness
    (quoting, word splitting, unsafe rm, etc.); pair with references/languages/bash.md for
    the security-specific review (eval, curl|bash, secrets on the command line)."""
    if not have("shellcheck"):
        log["tools_skipped"].append({"tool": "shellcheck", "reason": "not installed"}); return
    sh_files = find_shell_files(root)
    if not sh_files:
        log["tools_skipped"].append({"tool": "shellcheck", "reason": "no shell scripts found"}); return
    sev_map = {"error": "high", "warning": "medium", "info": "low", "style": "info"}
    n = 0
    CHUNK = 150
    for i in range(0, len(sh_files), CHUNK):
        chunk = sh_files[i:i + CHUNK]
        # -S info drops pure-style noise but keeps important quoting/globbing warnings
        code, out, err = run_cmd(["shellcheck", "-f", "json", "-S", "info", *chunk], timeout=180)
        if not out:
            continue
        try:
            items = json.loads(out)
        except Exception:
            continue
        for it in items:
            n += 1
            level = it.get("level", "")
            cat = "bug" if level in ("error", "warning") else "quality"
            add(findings, "shellcheck", cat, sev_map.get(level, "low"),
                "SC" + str(it.get("code", "")), it.get("message"),
                rel(root, it.get("file", "")), it.get("line"))
    log["tools_run"].append({"tool": "shellcheck", "findings": n, "files": len(sh_files)})


def run_semgrep(root, findings, log):
    if not have("semgrep"):
        log["tools_skipped"].append({"tool": "semgrep", "reason": "not installed"}); return
    code, out, err = run_cmd(
        ["semgrep", "scan", "--config", "auto", "--json", "--quiet", "--timeout", "30", root],
        timeout=300)
    if not out:
        log["tools_skipped"].append(
            {"tool": "semgrep", "reason": (err or "no output; rules may need network")[:150]}); return
    try:
        data = json.loads(out)
    except Exception:
        log["tools_skipped"].append({"tool": "semgrep", "reason": "unparseable output"}); return
    n = 0
    for r in data.get("results", []):
        n += 1
        extra = r.get("extra", {})
        sev = {"ERROR": "high", "WARNING": "medium", "INFO": "low"}.get(
            extra.get("severity", "").upper(), "medium")
        add(findings, "semgrep", "security", sev, r.get("check_id"),
            extra.get("message"), rel(root, r.get("path", "")),
            (r.get("start") or {}).get("line"))
    log["tools_run"].append({"tool": "semgrep", "findings": n})


def run_gosec(root, findings, log):
    def parse(out, findings):
        data = json.loads(out)
        for i in data.get("Issues", []):
            add(findings, "gosec", "security",
                {"HIGH": "high", "MEDIUM": "medium", "LOW": "low"}.get(i.get("severity", "").upper(), "medium"),
                i.get("rule_id"), i.get("details"), rel(root, i.get("file", "")), i.get("line"))
    probe_run_json("gosec", ["gosec", "-fmt", "json", "-quiet", "./..."], root,
                   "security", findings, log, parse)


def run_brakeman(root, findings, log):
    def parse(out, findings):
        data = json.loads(out)
        for w in data.get("warnings", []):
            add(findings, "brakeman", "security", (w.get("confidence") or "medium").lower(),
                w.get("warning_type"), w.get("message"), rel(root, w.get("file", "")), w.get("line"))
    probe_run_json("brakeman", ["brakeman", "-f", "json", "-q", root], root,
                   "security", findings, log, parse)


# ----------------------------- toolless baselines -----------------------------

def read_dependencies(root):
    """Parse dependency manifests without any external tool. Best-effort, capped."""
    deps = defaultdict(list)

    def add_dep(eco, name, ver):
        if name:
            deps[eco].append({"name": name.strip(), "version": (ver or "").strip()})

    # requirements.txt
    for p in find_files(root, {"requirements.txt", "requirements-dev.txt"}):
        try:
            for line in open(p, encoding="utf-8", errors="ignore"):
                line = line.strip()
                if not line or line.startswith("#") or line.startswith("-"):
                    continue
                m = re.match(r"([A-Za-z0-9_.\-]+)\s*([=<>!~]=?.*)?", line)
                if m:
                    add_dep("pip", m.group(1), (m.group(2) or "").lstrip("=<>!~ "))
        except Exception:
            pass
    # package.json
    for p in find_files(root, {"package.json"}):
        try:
            data = json.load(open(p, encoding="utf-8", errors="ignore"))
            for sect in ("dependencies", "devDependencies"):
                for name, ver in (data.get(sect) or {}).items():
                    add_dep("npm", name, ver)
        except Exception:
            pass
    # go.mod
    for p in find_files(root, {"go.mod"}):
        try:
            for line in open(p, encoding="utf-8", errors="ignore"):
                m = re.match(r"\s*([\w./\-]+)\s+v([\w.\-]+)", line)
                if m and "require" not in m.group(1) and "module" not in m.group(1):
                    add_dep("go", m.group(1), "v" + m.group(2))
        except Exception:
            pass
    # Gemfile.lock (specs)
    for p in find_files(root, {"Gemfile.lock"}):
        try:
            for line in open(p, encoding="utf-8", errors="ignore"):
                m = re.match(r"\s{4}([a-zA-Z0-9_\-]+) \(([^)]+)\)", line)
                if m:
                    add_dep("bundler", m.group(1), m.group(2))
        except Exception:
            pass
    # composer.json
    for p in find_files(root, {"composer.json"}):
        try:
            data = json.load(open(p, encoding="utf-8", errors="ignore"))
            for sect in ("require", "require-dev"):
                for name, ver in (data.get(sect) or {}).items():
                    add_dep("composer", name, ver)
        except Exception:
            pass
    # Cargo.toml (naive [dependencies] block)
    for p in find_files(root, {"Cargo.toml"}):
        try:
            in_dep = False
            for line in open(p, encoding="utf-8", errors="ignore"):
                s = line.strip()
                if s.startswith("["):
                    in_dep = s.startswith("[dependencies")
                    continue
                if in_dep and "=" in s:
                    name = s.split("=")[0].strip()
                    add_dep("cargo", name, "")
        except Exception:
            pass

    # cap
    for eco in deps:
        deps[eco] = deps[eco][:200]
    return {"ecosystems": dict(deps),
            "counts": {eco: len(v) for eco, v in deps.items()}}


def scan_secrets(root, findings, log):
    hits = 0
    scanned = 0
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for f in filenames:
            ext = os.path.splitext(f)[1]
            path = os.path.join(dirpath, f)
            if ext not in TEXT_EXTS and f not in (".env",):
                # allow extensionless script files (e.g. shell entrypoints) via shebang
                if ext == "":
                    try:
                        if os.path.getsize(path) > MAX_SCAN_BYTES:
                            continue
                        with open(path, "r", encoding="utf-8", errors="ignore") as fh:
                            if not ANY_SHEBANG.match(fh.readline(200)):
                                continue
                    except Exception:
                        continue
                else:
                    continue
            try:
                if os.path.getsize(path) > MAX_SCAN_BYTES:
                    continue
                scanned += 1
                for i, line in enumerate(open(path, encoding="utf-8", errors="ignore"), 1):
                    for name, pat in SECRET_PATTERNS:
                        if pat.search(line):
                            snippet = line.strip()[:80]
                            # mask the middle to avoid echoing the full secret
                            masked = re.sub(r"['\"][^'\"]{6,}['\"]",
                                            lambda m: m.group(0)[:4] + "***" + m.group(0)[-2:], snippet)
                            add(findings, "secret-scan", "secret", "high",
                                name, masked, rel(root, path), i)
                            hits += 1
                            break
                    if hits > 400:
                        break
            except Exception:
                continue
    log["tools_run"].append({"tool": "secret-scan(builtin)", "findings": hits,
                             "files_scanned": scanned})


# ----------------------------- orchestration -----------------------------

def maybe_extract_zip(path):
    if os.path.isfile(path) and zipfile.is_zipfile(path):
        dest = tempfile.mkdtemp(prefix="audit_extract_")
        with zipfile.ZipFile(path) as zf:
            zf.extractall(dest)
        entries = [e for e in os.listdir(dest) if not e.startswith("__MACOSX")]
        if len(entries) == 1 and os.path.isdir(os.path.join(dest, entries[0])):
            return os.path.join(dest, entries[0])
        return dest
    return path


def main():
    ap = argparse.ArgumentParser(description="Run available scanners over a project.")
    ap.add_argument("path", help="Project directory or .zip")
    ap.add_argument("--no-install", action="store_true",
                    help="Do not attempt to pip-install any tools")
    ap.add_argument("--languages", help="Comma-separated language hints (py,js,go,rb,php,java,cs,rs)")
    ap.add_argument("--max", type=int, default=250, help="Max findings kept per source")
    ap.add_argument("--json-out", help="Also write JSON to this file")
    args = ap.parse_args()

    if not os.path.exists(args.path):
        print(json.dumps({"error": f"path not found: {args.path}"})); sys.exit(1)

    root = maybe_extract_zip(args.path)
    langs, _manifests = detect_languages(root)
    if args.languages:
        langs |= {l.strip() for l in args.languages.split(",") if l.strip()}

    log = {"tools_run": [], "tools_skipped": [], "installs": []}
    findings = []

    # Optional install of pure-Python, PyPI-reachable tools relevant to languages present.
    if not args.no_install:
        wanted = []
        if "py" in langs:
            wanted += ["ruff", "bandit", "pip-audit"]
        # ruff is a great general linter even without Python? It's Python-only; skip otherwise.
        if wanted:
            missing = [w for w in wanted if not have(w)]
            if missing:
                try_install(missing, log)
        # shellcheck (system package) for shell scripts, where apt + permission allow it.
        if "sh" in langs and not have("shellcheck"):
            try_apt_install(["shellcheck"], log)

    # Python
    if "py" in langs:
        run_ruff(root, findings, log)
        run_bandit(root, findings, log)
        run_pip_audit(root, findings, log)
    # JS/TS
    if "js" in langs:
        run_npm_audit(root, findings, log)
        run_eslint(root, findings, log)
    # Probe-only tools (any language; run if the user already has them installed)
    run_semgrep(root, findings, log)
    if "go" in langs:
        run_gosec(root, findings, log)
    if "rb" in langs:
        run_brakeman(root, findings, log)
    if "sh" in langs:
        run_shellcheck(root, findings, log)

    # Toolless baselines (always)
    scan_secrets(root, findings, log)
    dependencies = read_dependencies(root)

    # cap findings per source
    per_source = defaultdict(int)
    capped = []
    for f in findings:
        if per_source[f["source"]] < args.max:
            capped.append(f)
            per_source[f["source"]] += 1

    # summarize
    by_sev = defaultdict(int)
    by_cat = defaultdict(int)
    for f in capped:
        by_sev[f["severity"]] += 1
        by_cat[f["category"]] += 1

    result = {
        "root": root,
        "languages_detected": sorted(langs),
        "summary": {
            "total_findings": len(capped),
            "by_severity": dict(by_sev),
            "by_category": dict(by_cat),
        },
        "tool_coverage": log,
        "dependencies": dependencies,
        "findings": capped,
    }
    text = json.dumps(result, indent=2)
    print(text)
    if args.json_out:
        with open(args.json_out, "w") as fh:
            fh.write(text)


if __name__ == "__main__":
    main()

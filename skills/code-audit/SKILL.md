---
name: code-audit
description: >
  Deep, evidence-based audit of a whole code project, producing a dense ranked Markdown
  report covering security vulnerabilities, correctness/reliability bugs, code quality and
  refactoring, dependency health, and a future-feature roadmap scored by value vs. effort.
  Every finding is ranked by severity with a concrete, project-specific fix. Works across
  languages and frameworks (Python, JS/TS, Java/Kotlin, Go, PHP, Ruby, C#/.NET, Rust, and
  more) and runs real tools (linters, npm audit, bandit, semgrep, CVE scanners) when
  available, falling back to manual review. Use whenever the user wants to audit, review, or
  deep-dive a codebase, repo, or uploaded project zip; find bugs, security holes, or
  vulnerabilities; get a quality, refactoring, or technical-debt assessment; or get a feature
  roadmap for a project. Trigger even without the word "audit"
  (e.g. "look through my repo and tell me what's wrong", "is my app secure", "what should I
  refactor"). Do NOT trigger for a single short snippet, or for writing new code.
---

# Code Audit

Produce a rigorous, ranked audit of a whole codebase and hand back a report the user's team
can act on immediately: what's broken, how bad it is, exactly how to fix it, what to refactor,
and what to build next.

## What good looks like

Three qualities separate a useful audit from a generic one. Hold onto all three:

1. **Evidence over assertion.** Every finding names a real `file:line` you actually read and,
   where useful, shows a few lines of the offending code. If you can't point at the code, you
   can't claim the finding: mark it "suspected, needs verification" or drop it. Auditors lose
   all credibility the moment a reader finds one hallucinated issue, so hold a high bar.
2. **Project-specific fixes.** "Use parameterized queries" is worthless. "In `db/users.py:42`
   the f-string query is built from `request.args['id']`; switch to
   `cursor.execute('... WHERE id = %s', (user_id,))`" is an audit. Fixes reference the actual
   file, the framework and version in use, and the project's own conventions.
3. **Density.** The report is measured in signal per token. Prefer tables to paragraphs, give
   each finding a short ID and cross-reference it, keep code snippets to the few lines that
   matter, and cut every sentence that doesn't change what the reader would do. This is a stated
   goal for this skill: a tight, information-dense report beats a long one every time.

## Documentation scope (default: excluded)

**By default, repository documentation files are completely out of scope. Audit source code
only.** Documentation files means READMEs, `docs/` and `wiki/` trees, standalone `.md`/`.rst`/
`.adoc`/`.txt` prose, changelogs, and similar. Do not read them, do not evaluate them, do not
base findings on them. (In-code comments and docstrings are part of the source and stay in
scope; dependency manifests and config files are code artifacts, not docs.)

Two conditional exceptions, both requiring an explicit user request:

- **Docs explicitly included in the audit scope.** Even then, documentation is **never proof of
  implementation.** "The README says inputs are validated" confirms nothing: only the code
  does. Evidence rules are unchanged: every finding still needs a real `file:line` in source.
  Whenever the source code contradicts the documentation, the *documentation* is the defect:
  flag it as inaccurate (give it a `DOC-xx` ID) and report what the code actually does.
- **A documentation review, only if the user explicitly asks for one.** Evaluate docs solely on
  three criteria: **Clarity** (readability, structure, audience fit), **Coverage** (are the
  public APIs/modules/setup paths documented?), and **Accuracy** (does every documented claim
  match the actual code? verify against source, never take the doc's word). Nothing else: no
  style nitpicks beyond clarity, no findings about docs outside these three axes. Deliver as its
  own report section with `DOC-xx` IDs.

## The workflow

Work through these steps in order. Steps 1 and 3 run bundled scripts that do the deterministic
heavy lifting and hand you back compact JSON: lean on them so you spend your token budget on
judgment, not on re-deriving structure or reading raw tool logs.

### Step 0: Locate and stage the code

The usual input is an uploaded zip or set of files under `/mnt/user-data/uploads/`. Also handle
a local directory path or a Git URL if that's what you're given.

```bash
ls -la /mnt/user-data/uploads/          # see what arrived
mkdir -p /home/claude/audit_work
# If a zip: extract it (inventory.py can also do this for you, see Step 1)
unzip -q /mnt/user-data/uploads/<file>.zip -d /home/claude/audit_work
```

If it's a Git URL and the network allows it, `git clone --depth 1 <url> /home/claude/audit_work`.
Work out of `/home/claude/audit_work` (or wherever the extracted root is); write nothing to the
read-only uploads dir.

### Step 1: Inventory the project

Run the inventory script. It walks the tree (skipping vendored/build dirs), detects languages and
frameworks, finds dependency manifests, measures size, flags likely entry points and hotspots, and
computes churn where git history is present (the best single hotspot signal). It prints compact JSON.

```bash
python /path/to/skill/scripts/inventory.py /home/claude/audit_work
# Pass a .zip directly and it will extract first:
# python /path/to/skill/scripts/inventory.py /mnt/user-data/uploads/project.zip
```

Read the JSON, not the whole tree. It's your map: it tells you which languages are in play (so you
know which references to load), where the attack surface and complexity live, and how big the job is.

### Step 2: Load the right references

Based on the languages the inventory found, read the matching files. Read only what's relevant,
that's the point of splitting them out.

- `references/methodology.md`: **read this first.** How to read a codebase efficiently for audit
  (follow the trust/data flow from inputs to dangerous sinks), the high-signal grep patterns, the
  token-discipline rules, and the evidence rules that keep findings honest.
- `references/severity-and-ranking.md`: the scoring rubric. How to assign Critical/High/Medium/Low
  and order the ranked list. Consult before you rate anything.
- `references/security.md`: the language-agnostic security checklist, organized by vulnerability
  class, each with what to look for and how to confirm it's real (not a framework false-positive).
- `references/quality-and-refactoring.md`: smells, complexity, architecture, testing/CI, performance,
  and dependency health.
- `references/roadmap.md`: how to derive and score the future-feature roadmap.
- `references/languages/<lang>.md`: language- and framework-specific vulnerability patterns, common
  bugs, and the exact scanner/linter commands. Available: `python`, `javascript-typescript`,
  `java-kotlin`, `go`, `php`, `ruby`, `csharp-dotnet`, `rust`, and `bash` (shell scripts: audit
  these wherever they live: `.sh` files, extensionless shebang scripts, Dockerfile `RUN` lines, and
  CI `run:` steps). Load one per language present. For any language **without** a dedicated file,
  load `references/languages/general.md`, which maps the universal vulnerability/bug classes onto any
  language and lists the right tools to reach for.

### Step 3: Run the scanners

Run the scanner script. It detects which tools are already installed, optionally installs a small set
of high-value pure-Python tools from PyPI (reachable from the sandbox), runs what it can with
timeouts, and normalizes everything to a common finding shape. It always includes two toolless
baselines (a dependency/version reader and a regex secret scan) so you get signal even when no
external scanner is available.

```bash
python /path/to/skill/scripts/run_scanners.py /home/claude/audit_work
# Restrict/allow installs and pick languages explicitly if you want:
# python /path/to/skill/scripts/run_scanners.py /home/claude/audit_work --no-install
```

Treat scanner output as **leads to verify, not verdicts.** Tools miss things and cry wolf. Confirm
each reported issue against the real code before it earns a place in the report, and note in the
report's scope section which tools ran and which were skipped (and why) so coverage is honest.

### Step 4: Targeted deep read

Now read code: but selectively. Guided by the inventory hotspots, the scanner leads, and the
methodology reference, prioritize:

- **Attack surface:** every place external input enters. HTTP routes/handlers, API endpoints, CLI
  args, message consumers, file/upload handlers, deserialization points.
- **Dangerous sinks:** DB queries, shell/`exec`/`eval`, filesystem paths, outbound HTTP, template
  rendering, auth and session code, crypto, secret handling.
- **Config & infra:** `.env` handling, framework config (debug flags, CORS, TLS verification),
  Dockerfiles, CI workflows.
- **Complexity/churn hotspots** from the inventory: the biggest and most-changed files are where
  bugs concentrate.

Read files in targeted ranges, not whole. Follow the data: trace a piece of untrusted input from
where it enters to where it's used. Confirm each finding and record its `file:line`.

### Step 5: Rank

Apply the rubric in `severity-and-ranking.md`. Give each finding a stable ID (`SEC-01`, `BUG-03`,
`QUAL-02`), assign a severity from impact × likelihood × blast radius, and order the master list
Critical → Low. Reserve Critical for genuinely urgent things (exploitable RCE, auth bypass, leaked
live secret, data-loss bug). Don't inflate: an over-severe report gets ignored.

### Step 6: Write project-specific fixes

For each finding, write the fix that fits *this* project: name the file, use the framework's idiom
and the versions actually installed, and respect the project's existing patterns. Where a one-line
change fixes it, give the line. Where it needs a broader change, give the shape of the change and
the tradeoff.

### Step 7: Quality, refactoring, and dependencies

Using `quality-and-refactoring.md`, surface: general improvement themes, a prioritized list of
refactor targets (each with an effort estimate and expected payoff, pointing at real files), testing
and CI gaps, and dependency health (outdated, vulnerable, abandoned, or bloated deps).

### Step 8: Feature roadmap

Using `roadmap.md`, infer what the project is for (from structure, routes, and code: not from
documentation files, which are out of scope by default), then propose
future features. Score each on **value/impact**, **effort/complexity**, and **ease given the current
architecture**. Deliver a quick-wins matrix (high value / low effort first) and a sequenced Now /
Next / Later roadmap with a one-line rationale each. Ground every item in the actual project: no
generic SaaS wishlist.

### Step 9: Assemble and deliver the report

Build the report from `assets/report-template.md`. Default to a **single Markdown file** in
`/mnt/user-data/outputs/`. Split into a small folder (`audit/summary.md`, `audit/security.md`,
`audit/quality.md`, `audit/roadmap.md`) only when a single file would be unwieldy: as a rule of
thumb, when the project is large (say 50k+ LOC or 20+ significant findings) and one file would bury
the summary. When you split, keep `summary.md` as the entry point with the executive summary and the
ranked table, and link out to the rest.

Write the report to `/mnt/user-data/outputs/` (e.g. `audit-<project>.md`), then call `present_files`
with the report as the first path. Keep any closing message short; the report speaks for itself.

## Scaling to project size

- **Small (< ~5k LOC):** you can read most of it. Still lead with inventory + scanners so the report
  is grounded and fast.
- **Medium:** sample by priority, full read of the attack surface and hotspots, breadth-skim the
  rest. Say so in the scope section.
- **Large (50k+ LOC):** you cannot read everything, and pretending to is dishonest. Audit the highest
  risk/complexity/churn areas in depth, sample the rest, and be explicit in the scope section about
  what was and wasn't covered. Consider splitting the report.

## Token discipline (non-negotiable)

The stated goal is maximum information for minimum tokens. Concretely: use the inventory and scanner
JSON as your map instead of reading the whole tree; read files in ranges; grep for high-signal
patterns rather than skimming linearly; distill tool output rather than pasting it; and in the report,
use tables, short IDs, and snippets of only a few lines. Every finding should carry its weight.

## A note on honesty and scope

If you couldn't run a scanner, say so. If you sampled rather than read everything, say so. If a
finding is suspected rather than confirmed, label it. A smaller audit that's completely trustworthy is
worth more than a big one the reader has to second-guess. The "Scope & limitations" section of the
report exists precisely so you can be upfront about coverage.

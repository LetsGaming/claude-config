# Audit Methodology

How to review a whole codebase efficiently, find the issues that matter, and keep every
finding honest. Read this before you start reading code.

## The mental model: follow the trust boundary

Most serious issues live where **untrusted input meets a powerful operation**. So don't read
a codebase top-to-bottom: trace it. For each entry point, follow the data:

```
[ external input ] → [ parsing / validation ] → [ business logic ] → [ dangerous sink ]
   HTTP params          (or lack of it)             (auth checks?)      SQL / exec / fs / http / template
```

A finding is usually "untrusted value X reaches sink Y without the check/encoding it needs."
When you can name X, the path, and Y, you have a real, defensible finding. When you can't,
you have a hunch: treat it as one.

**Entry points** (where X comes from): HTTP routes/controllers, GraphQL resolvers, API
handlers, WebSocket/message-queue consumers, CLI argument parsers, file/upload handlers,
webhook receivers, deserialization of external data.

**Dangerous sinks** (Y): database queries, `exec`/`eval`/`system`/shell, filesystem paths,
outbound HTTP (SSRF), template rendering (XSS/SSTI), reflection/class loading, cryptographic
operations, auth/session decisions, response bodies (info leak).

## Reading order (spend tokens where risk is)

1. **Start from the map, not the tree.** Use the inventory + scanner JSON. They already tell
   you the languages, the frameworks, the entry points, the hotspots (biggest/most-churned
   files), the dependency list, and the scanner leads. Don't re-derive this by reading files.
2. **Read config first.** Framework config and env handling reveal the security posture fast:
   debug flags, secret management, CORS, TLS verification, allowed hosts, session settings,
   Dockerfiles, CI workflows. A single `DEBUG=True` in prod config is a finding you get almost
   for free.
3. **Read the attack surface.** Open each entry-point file and trace inputs to sinks.
4. **Read the hotspots.** The biggest and most-changed files concentrate bugs and complexity.
5. **Breadth-sample the rest.** Skim remaining modules for the patterns below; you don't need
   every line.

## grep first, read second

Grepping for high-signal patterns is far cheaper than reading files and points you straight at
the lines worth reading. A starter set (adapt per language: see the language reference):

```bash
ROOT=/home/claude/audit_work
# injection / dangerous execution
grep -rnE "eval\(|exec\(|system\(|popen|subprocess.*shell\s*=\s*True|child_process|Runtime\.getRuntime" "$ROOT" --include=*.{py,js,ts,rb,php,java,go}
# raw / string-built SQL
grep -rnE "SELECT .*\+|f\"SELECT|format\(.*SELECT|execute\(.*%|query\(.*\$\{" "$ROOT"
# secrets
grep -rnE "(api[_-]?key|secret|token|password|passwd)\s*[:=]" "$ROOT" --include=*.{py,js,ts,env,yml,yaml,json}
# weak crypto / disabled verification
grep -rnE "md5|sha1|DES|ECB|verify\s*=\s*False|rejectUnauthorized\s*:\s*false|InsecureSkipVerify|NODE_TLS_REJECT" "$ROOT"
# dangerous deserialization
grep -rnE "pickle\.loads|yaml\.load\(|Marshal\.load|unserialize\(|ObjectInputStream|JsonConvert.*TypeNameHandling" "$ROOT"
# debug / TODO / FIXME (roadmap + risk signal)
grep -rnE "DEBUG\s*=\s*True|TODO|FIXME|HACK|XXX|@app.route|createServer" "$ROOT"
```

`ruff`/`bandit`/`semgrep` in the scanner script already cover much of this for supported
languages: use grep to fill gaps and to double-check the tools didn't miss an obvious sink.

## The evidence rule (this is what makes an audit trustworthy)

A reader who finds one invented issue stops trusting the whole report. So:

- **Every finding cites a real `file:line` you actually opened.** Not "somewhere in the auth
  module": the line.
- **Confirmed vs. suspected.** If you read the code and the issue is real, it's confirmed. If
  a scanner flagged something you couldn't fully verify (e.g. you can't see whether input is
  sanitized upstream), label it "suspected: needs verification" and say what would confirm it.
- **Account for framework protections** so you don't false-positive. An ORM `.filter(id=x)` is
  not SQL injection; React `{userValue}` in JSX is auto-escaped; a parameterized query with
  `%s` placeholders is safe. The language references list these per framework. A confident,
  wrong finding is worse than a missing one.
- **Cluster, don't pad.** Ten instances of the same missing-auth pattern are one finding with a
  representative location and a note that it recurs: not ten findings. Padding the count to
  look thorough erodes trust and burns tokens.
- **No generic advice.** If a recommendation would apply verbatim to any codebase, it doesn't
  belong. Tie it to this code.

## Calibration

- Reserve your deepest scrutiny and highest severities for the trust-boundary issues. A missing
  docstring and an unauthenticated admin endpoint are not the same class of problem; the report
  should make that obvious.
- If the project is large and you sampled, the honest move is to say so in the scope section and
  name what you covered: not to imply full coverage.
- It's fine, and useful, to note "no issues found in X" for a class you actively checked. That's
  information too.

## Token discipline recap

Use the JSON maps as your guide; grep before you read; read files in ranges; distill tool
output instead of pasting it; cluster repeated issues; and write the report in tables with short
IDs. The target is maximum actionable signal per token.

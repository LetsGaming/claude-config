# Audit Report Template

Fill this in for the deliverable. It's built for density: tables over prose, short cross-referenced
IDs, code snippets only where they change what the reader does. Drop sections that don't apply
rather than padding them. Keep prose tight: this is a working document, not an essay.

Default output: a single `.md` file in `/mnt/user-data/outputs/`. For large projects, split into
`audit/summary.md` (this executive summary + ranked table, linking out) plus
`audit/security.md`, `audit/quality.md`, `audit/roadmap.md`.

---

```markdown
# Code Audit: <Project Name>

**What it is:** <one line inferred from the code structure (docs only if explicitly in scope)>
**Scope:** <languages, ~LOC, what was reviewed> · **Date:** <YYYY-MM-DD>
**Coverage:** <full read | prioritized sample of X> · **Tools run:** <ruff, bandit, npm audit, …>; **skipped:** <tool (reason), …>

## Executive summary

**Overall health:** <one-paragraph verdict, a few sentences, plain-spoken>

**Top risks:**
- <one line> (→ SEC-01)
- <one line> (→ BUG-01)
- <one line> (→ DEP-01)

| Metric | Value |
|---|---|
| Languages | <e.g. Python 80%, TS 20%> |
| Size | <files / LOC> |
| Dependencies | <count by ecosystem> |
| Tests | <present? rough coverage of critical paths> |
| Findings | Critical <n> · High <n> · Medium <n> · Low <n> |

## Ranked findings

| ID | Sev | Type | Location | Issue | Fix (short) |
|---|---|---|---|---|---|
| SEC-01 | Critical | Security | `db/users.py:42` | SQL injection via `id` param | Parameterize query |
| SEC-02 | High | Security | `auth/jwt.py:15` | JWT signature not verified | Verify with pinned alg |
| BUG-01 | High | Bug | `orders/calc.py:88` | Money handled as float | Use Decimal |
| DEP-01 | High | Dependency | `requirements.txt` | `requests 2.20.0` (CVE-2023-xxxx) | Upgrade to ≥ 2.31 |
| QUAL-01 | Medium | Quality | `services/orders.py` | 600-LOC God module | Split by concern |

*(Ordered Critical→Low, then likelihood. Medium/Low may stay table-only.)*

## Detailed findings (Critical & High)

### [SEC-01] SQL injection in user lookup: Critical · `db/users.py:42`
- **What:** the query is built by string interpolation from `request.args['id']`.
- **Impact:** an unauthenticated attacker can read/modify the entire users table.
- **Evidence:**
  ```python
  q = "SELECT * FROM users WHERE id = '%s'" % uid
  ```
- **Fix:** pass parameters separately:
  ```python
  cur.execute("SELECT * FROM users WHERE id = %s", (uid,))
  ```

*(Repeat this compact block for each Critical/High finding. Medium/Low: one-liner or table only.)*

## Security posture
Per-class status for classes you actively checked (only the interesting ones):
- Injection: **at risk** → SEC-01. Auth: **at risk** → SEC-02. Secrets: **at risk** → SEC-03.
- Crypto: OK (uses `bcrypt`). XSS: OK (React auto-escaping, no raw-HTML sinks found).

## Code quality & refactoring
**General improvements (themes):**
- <theme with representative evidence>
- <theme>

**Refactor targets:**

| Target | Problem | Effort | Payoff |
|---|---|---|---|
| `services/orders.py` | Mixed HTTP/logic/SQL; untestable | M | High: enables tests + isolates SEC-01 fix |

**Testing & CI:** <gaps, especially around the findings above>
**Dependency health:**

| Package | Current | Issue | Action |
|---|---|---|---|
| requests | 2.20.0 | CVE-2023-xxxx | Upgrade ≥ 2.31 |

## Feature roadmap
**What this is:** <anchor line>

| Feature | Value | Effort | Ease (this codebase) | Prereqs / notes |
|---|---|---|---|---|
| Password reset | High | S | Easy: auth+email exist | - |
| Per-tenant isolation | High | L | Hard: global state first | QUAL-02; migration |

**Quick wins (do first):** <High-value / Low-effort / Easy items>

**Sequenced:**
- **Now:** <items + one-line why>
- **Next:** <items + why>
- **Later:** <items + prerequisite note>

## Scope & limitations
- Reviewed: <what>. Sampled/not reviewed: <what>.
- Documentation files: <excluded (default) | included at user request, treated as claims, not evidence>.
- Tools run: <…>. Skipped: <tool, reason>.
- Assumptions: <e.g. "assumed prod config = `settings/prod.py`">.
- Findings marked "suspected" need verification against runtime behavior.
```

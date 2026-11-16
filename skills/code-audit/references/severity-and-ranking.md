# Severity & Ranking

A consistent rubric so findings are ranked the same way every time, and the reader can trust
that "Critical" means "drop everything." Applies to security issues, bugs, and quality debt
alike (with security-specific notes below).

## The three axes

Rate every finding on three axes, then combine:

1. **Impact**: how bad is the outcome if this goes wrong / is exploited?
   - *Critical:* remote code execution, full auth bypass, mass data breach, leaked live
     credentials, data loss/corruption, financial loss.
   - *High:* access to sensitive data for one account/tenant, privilege escalation, persistent
     XSS, a crash/DoS of a core path, silent wrong results in important logic.
   - *Medium:* limited info disclosure, self-XSS, a bug affecting an edge case, degraded
     performance under load.
   - *Low:* cosmetic, minor inefficiency, defense-in-depth gap with no direct exploit.

2. **Likelihood / Exploitability**: how easily does it actually happen?
   - *High:* reachable by an unauthenticated remote user with no special conditions; a bug on a
     common code path.
   - *Medium:* needs authentication, a specific role, a particular config, or an uncommon path.
   - *Low:* needs local access, chained conditions, or a very unlikely input.

3. **Blast radius**: how much is affected? Whole system / all users, one module / one tenant,
   or a single isolated spot. Use this to break ties.

## Combining into a level

Use this as a guide, not a rigid formula: judgment wins when a case is borderline.

| Impact ↓ / Likelihood → | High likelihood | Medium likelihood | Low likelihood |
|---|---|---|---|
| **Critical impact** | Critical | Critical / High | High |
| **High impact** | High | High / Medium | Medium |
| **Medium impact** | Medium | Medium | Low |
| **Low impact** | Low | Low | Info |

Then nudge up/down one step for blast radius if it's clearly system-wide or clearly isolated.

## Don't inflate

The fastest way to get an audit ignored is to mark everything Critical/High. Discipline:

- **Critical** is rare. It means an attacker can, right now, with the code as written, achieve a
  worst-case outcome: or a bug is actively losing/corrupting data. If you're rating something
  Critical, you should be able to describe the concrete exploit or failure in one sentence.
- If a framework protection or config actually blocks the issue, it's not the severity the raw
  pattern suggests: downgrade and note why.
- A wall of Lows is noise. Roll routine style/lint issues into a single "Code hygiene" finding
  with counts, rather than listing each.

## Security-specific: a CVSS-lite shortcut

For security findings you can sanity-check severity with a lightweight read of CVSS factors,
no need to compute a full score:

- **Attack Vector:** Network (worse) → Adjacent → Local → Physical.
- **Attack Complexity:** Low (worse) → High.
- **Privileges Required:** None (worse) → Low → High.
- **User Interaction:** None (worse) → Required.
- **Impact (C/I/A):** how much confidentiality, integrity, availability is lost.

Network + Low complexity + No privileges + No interaction + High impact ≈ Critical. Push any of
those the other way and the rating drops. If a real CVE is involved (from `pip-audit`/`npm
audit`), you can cite its published severity directly.

## Assigning IDs and ordering the list

- Give each finding a stable, human-readable ID by type: `SEC-01`, `SEC-02` for security;
  `BUG-01` for correctness/reliability bugs; `QUAL-01` for quality/refactor; `DEP-01` for
  dependency issues. IDs let the summary, tables, and detail sections cross-reference cheaply.
- Order the master ranked table by **severity first, then likelihood, then blast radius.** Within
  the same severity, put security ahead of quality.
- Number stably as you go so the same finding keeps its ID across the report.

## What each finding must carry

At minimum: ID, severity, type, `file:line`, a one-line "what," a one-line "why it matters," and
a concrete fix. Critical/High findings additionally get a short evidence snippet and, for
security, the exploit/impact in a sentence. Medium/Low can live in the table with a one-liner to
keep the report dense.

# Code Quality & Refactoring

How to assess maintainability, correctness-adjacent risk, architecture, testing, performance, and
dependency health: and how to turn that into a prioritized list of refactor targets the team can
actually pick up. This is the "general improvements / spots to rework" part of the audit.

The goal isn't to list every smell. It's to identify the changes with the best payoff-to-effort
ratio and point at the real files. Rank refactor targets the same way you rank bugs: by impact
(how much pain the current state causes) and effort.

## 1. Correctness-adjacent risks (near-bugs)
These aren't exploited by an attacker but cause wrong behavior or outages. Often the highest-value
non-security findings.
- **Swallowed errors:** bare `except`/`catch {}` that hides failures; ignored return values/error
  codes (common in Go: `_ = err`). Confirm the swallow hides a real failure path.
- **Unhandled edge cases:** missing null/None checks, off-by-one, unchecked array/map access,
  unhandled empty/large input, integer overflow, float/money in floating point.
- **Concurrency:** shared mutable state without synchronization, race conditions, missing
  locks/atomics, unbounded goroutines/threads, deadlock-prone lock ordering.
- **Resource leaks:** files/sockets/DB connections/locks not closed (missing
  `with`/`defer`/`try-with-resources`/`using`); unbounded caches; connection pools misconfigured.
- **Time/timezone bugs:** naive datetimes, local-time assumptions, DST, non-monotonic timing.

## 2. Code smells (maintainability)
- Long functions / God classes doing too much; deeply nested conditionals; long parameter lists.
- Duplication (same logic copy-pasted: a bug fixed in one copy but not others is a real risk).
- Dead code, commented-out blocks, unreachable branches, unused exports.
- Magic numbers/strings; primitive obsession; inconsistent naming and style.
- Feature envy / leaky abstractions; modules reaching into each other's internals.
Use the inventory's largest/most-churned files as the starting list: that's where these
concentrate and where fixing them pays off most.

## 3. Architecture & structure
- Layering: is there a clear separation (handlers → services → data), or is business logic tangled
  into controllers and SQL scattered everywhere?
- Coupling & cohesion: tight coupling between modules; circular dependencies; a "utils" grab-bag.
- Global mutable state / singletons that make testing and reasoning hard.
- Configuration sprawl: settings read from many places, no single source of truth.
- Consistency: multiple ways of doing the same thing (three HTTP clients, two ORMs), a sign of
  accretion that raises maintenance cost.
Frame architecture findings as themes with representative evidence, not a file-by-file list.

## 4. Testing & CI
- Is there a test suite at all? What's the rough coverage of **critical paths** (auth, payments,
  data mutations)? Coverage of the risky code matters more than a global percentage.
- Missing tests for the bugs/edge cases you found: call these out specifically.
- Flaky patterns: tests depending on real network/time/ordering; no fixtures/mocks.
- CI: is there a pipeline? Does it run tests + lint + a security/dependency scan? Are secrets
  handled safely in CI? Are deploys gated on green?
- Reproducibility: pinned dependencies, lockfiles committed, deterministic builds.

## 5. Performance
Only flag performance issues you can point at: not speculative micro-optimization.
- **N+1 queries** (a query inside a loop over rows): very common, high impact.
- Missing pagination/limits on large result sets; loading whole tables into memory.
- Synchronous/blocking I/O on hot or request paths; missing async where it matters.
- Missing indexes implied by query patterns; full-table scans.
- Unbounded memory growth; missing caching on expensive, repeated work; inefficient algorithms
  (accidental O(n²)) on data that can grow.

## 6. Dependency health
Using the scanner's dependency list:
- **Vulnerable:** versions with known CVEs (from `pip-audit`/`npm audit`) → these are DEP findings,
  ranked by the advisory severity.
- **Outdated:** significantly behind latest, especially frameworks and security-sensitive libs.
- **Unpinned:** wildcards/ranges that make builds non-reproducible.
- **Abandoned / risky:** unmaintained packages, or heavy deps pulled in for trivial use.
- **Bloat:** large dependency trees; duplicated functionality across deps.

## 7. Developer experience & docs
- README quality: can a new dev set it up and run it? Are env vars documented?
- Type usage (type hints / TypeScript strictness) and whether it's enforced.
- Lint/format config present and enforced (or inconsistent style everywhere).
- API/interface documentation for anything others consume.

## Turning this into refactor targets
Produce a prioritized list, each item shaped like:

| Target (file/area) | Problem | Effort | Payoff |
|---|---|---|---|
| `services/orders.py` (600 LOC) | God module: HTTP, business logic, and SQL mixed; hard to test | M | High, unblocks testing and isolates the SQLi fixes |

- **Effort:** S (hours), M (a day or few), L (multi-day/coordinated).
- **Payoff:** tie it to something concrete, fewer bugs, testability, performance, security,
  onboarding speed. If you can't name the payoff, it's probably not worth listing.
- Order by payoff-to-effort. Put the quick, high-payoff refactors up top; note the big ones as
  strategic bets with their rationale.

Cross-reference: if a refactor also enables a security fix or a roadmap feature, say so, those
compound-value items should rise to the top.

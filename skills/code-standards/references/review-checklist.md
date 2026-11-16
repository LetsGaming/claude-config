# Review checklist

Run this gate before calling any change done: whether you wrote it or you're reviewing a diff. Same
questions every time; that consistency is what keeps recurring problems from returning. A matching
`projects/<name>.md` overlay may add project-specific items: run those too.

## Before you write
- **What boundary does this belong behind?** Service (a decision), repository/data module (queries),
  hook/composable (component logic), adapter (an upstream), a shared contract module (a type/constant/
  limit), or a design token (a style value). If it's about to go into a handler or a view, check it
  isn't really one of those.
- **Does this shape already exist?** Import an existing type/constant/limit/helper: don't redefine it
  in this layer.
- **Is this the third copy?** If so, extract before writing it again.

## Correctness & types
- [ ] No `any`, no suppressed type/lint errors.
- [ ] **No unsafe cast on query results or parsed data**: mapped through a checked reader.
- [ ] Optional/indexed access is narrowed, not force-asserted.
- [ ] Expected failures are typed return values, not thrown; `throw` reserved for the exceptional; no
      empty `catch`.
- [ ] Variants use discriminated unions + exhaustive handling; const objects instead of enums.

## Boundaries & single responsibility
- [ ] Handlers validate + wire; **no rule-bearing branch in a handler** (it's in a service).
- [ ] Views render + emit; **no fetch or business logic** (it's in a hook/composable).
- [ ] All queries are in a repository/data module returning **domain types**, not raw rows.
- [ ] Upstream access is behind a port via one resilient client.
- [ ] No god component/module: split if it does more than one job.

## DRY & magic values
- [ ] No duplicated logic across layers (helpers used).
- [ ] No value duplicated across a boundary (shared limits/constants in a shared module).
- [ ] No magic literals: domain strings are const objects; key conventions / singleton ids / schedules
      / defaults are named; **style values are tokens**.

## Validation, security, data
- [ ] Every write validates input at the boundary, from one schema definition.
- [ ] Parameterized queries; constant-time secret compare; cookies `HttpOnly`+`SameSite`+`Secure`
      (prod); public writes rate-limited via a shared limiter; auth fails closed.
- [ ] Uploads: size + real type + re-encode; active content sanitized by a parser, not a regex.
- [ ] **Schema changed? A numbered migration was added** (no in-place edits; no editing applied
      migrations).
- [ ] Errors flow through one handler; nothing leaks internals; logs redact PII.

## Frontend specifics
- [ ] Hydration is deliberate (not blanket eager); static where possible; server fragments for
      slow/personalized content.
- [ ] Props not mutated; idiomatic two-way binding; derived values computed, not synced via effects.
- [ ] Style values reference tokens; one shared base URL/config.
- [ ] An icon ships: a favicon set for a browser UI (or the platform icon set otherwise), declared in
      the head/manifest and served from the build's own assets.

## Tests & tooling (the machine holds the line)
- [ ] Meaningful behavior is tested (real assertions, not "it renders"); a fixed bug gets a regression
      test.
- [ ] New integration: mock added **and** covered by the shared contract suite.
- [ ] Typecheck, lint, tests, and a dependency vulnerability scan are green; any architectural boundary
      check passes (core stays dependency-free; direction points inward).
- [ ] A decision worth remembering got a short ADR/note.

## The delete test
Could a teammate delete this file/function and predict what breaks from names and boundaries alone?
If not, the seams aren't clean yet.

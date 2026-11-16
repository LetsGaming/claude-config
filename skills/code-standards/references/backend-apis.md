# Backend APIs

Framework-agnostic rules for HTTP/API and server code. Read this when writing routes, handlers,
services, or server wiring.

## Layering: route → validation → service → data
Keep handlers tiny: validate input, call one service or data function, shape the response. **No
business logic in handlers.**

- **Thin CRUD may call the data layer directly**: a handler that validates a body and upserts a row
  doesn't need a ceremonial service (that would violate KISS/YAGNI).
- **Decisions go in a service.** If a handler contains an `if` that encodes a *rule* (not just input
  shape), an allowed state transition, a placement/validation policy, a derived side effect: that
  rule belongs in a service function where it's testable without HTTP.
- A service **makes decisions**; the data layer **answers questions**. Don't blur them.

## Validate at the boundary, from one definition
Every write validates body, params, and query at the edge before anything reaches the data layer.
Derive the validation schema **and** the static type from one definition, and share input
constraints (length limits, enums) with any client that also enforces them: don't hand-write the
same limits in two places.

## Kill repetitive endpoints with a helper
When several endpoints differ only by name/schema/target (e.g. CRUD for many entities), factor a
small registration helper and drive it from a table, rather than copy-pasting near-identical
handlers. Keep the genuinely different parts explicit.

## One error handler over typed failures
Register a single error handler that maps typed failures (from the service/`Result` layer) to status
codes and a consistent response body, and **never leaks internals or stack traces**. This removes
the duplicated `respond-with-400/500` scattered through handlers and centralizes the contract.
Configure structured logging to **redact** anything resembling PII/secrets.

## Config: parse once, fail fast
Read configuration into **one typed object at startup**, with explicit coercion and defaults, and
**crash on missing/malformed required values**: a missing credential should fail boot, not surface
as a 500 hours later. Never scatter raw environment reads through the codebase. Treat "empty string"
as unset where the platform passes empties.

## Security baseline
- **Parameterize every query**: one string-interpolated value is the injection.
- **Compare secrets/tokens in constant time** (a vetted constant-time compare), never `===`, which
  leaks length and prefix through timing.
- **Session cookies:** `HttpOnly`, `SameSite`, `Secure` in production; scope narrowly. Credentialed
  cross-origin + cookies is a CSRF surface: lock allowed origins and check same-origin on mutations.
- **Rate-limit public writes** with **one shared utility**, not a per-endpoint copy. Add honeypots
  where relevant.
- **Security headers:** HSTS, a real CSP for any HTML surface, and the standard hardening set (frame,
  content-type, referrer).
- **Uploads:** cap size, verify real content type, re-encode raster images, and run active content
  (e.g. SVG) through a **parser-based** sanitizer (never a regex strip) before storing/serving.
- **Fail closed.** Auth/permission checks default to deny.

## Lifecycle
Handle graceful shutdown: stop accepting connections, finish in-flight work, stop schedulers/cron,
close the datastore. If you run in-process schedulers, guard a job from overlapping its own interval,
and remember that assumes a single instance: horizontal scaling means moving the scheduler out of
process.

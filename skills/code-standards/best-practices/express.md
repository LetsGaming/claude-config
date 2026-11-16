# Express best practices

Express-specific rules (Express 5+, TypeScript) that sit **on top of** `backend-apis.md`. The general
backend layering: route → validation → service → data, no logic in handlers, one error handler,
config-once, a security baseline: is the whole job here, because Express gives you almost no
structure of its own. This file names how those rules land in Express and adds Express-only concerns
(read `data-persistence.md` and `external-integrations.md` too). Applies whenever touching routes,
middleware, or app setup.

## Express imposes no architecture: you build the seams

- **Thin route handlers.** A handler validates input, calls a **service**, and shapes the response,
  it holds no business rules and runs no queries. Business decisions live in services; all data access
  lives in a repository/data module returning domain types (`backend-apis.md`, `data-persistence.md`).
  A `fetch`/SQL call or a rule-bearing branch inside a handler is on the wrong side of a seam.
- **Router module per resource.** Use `express.Router()`, one focused module per resource; mount them
  in app setup. No god router file.

## Express 5 specifics (they bite on upgrade)

- **Async errors are auto-forwarded.** In Express 5 a rejected promise from an async handler is passed
  to the error handler automatically: you no longer need a `try/catch` + `next(err)` in every async
  handler, nor an `asyncHandler` wrapper. Just `throw` a typed error.
- **Named wildcards are required.** Bare `*` no longer works as a route; use a named pattern
  (`/files/{*splat}`). Review every wildcard/optional route on the 4→5 upgrade.
- **Query-string parsing and a few removed helpers changed too** (e.g. `app.del`, `res.sendfile`
  gone). Audit on upgrade rather than assuming v4 behavior.

## One error handler; typed failures

- **Register a single error-handling middleware last**: the 4-arg `(err, req, res, next)` form, and
  map typed failures to responses there. Don't hand-build `res.status(400).json({error})` in each
  handler; that duplication drifts (`backend-apis.md`).
- **Throw typed errors, reserve `throw` for the exceptional**, and let the one handler translate them.
  Nothing leaks internals or stack traces to the client.

## Validate at the boundary, from one schema

- **Never trust `req.body` / `req.query` / `req.params`.** Validate at the edge with one schema
  (zod/valibot/ajv) via middleware, then hand the parsed, typed value to the service: a single source
  of truth for the shape, not re-checked ad hoc downstream (`backend-apis.md`, `types-and-contracts.md`).
- **In TypeScript, don't let `req.body` stay `any`**: validate, then work with the narrowed type.

## Middleware: explicit order, cross-cutting only

- **Order is deliberate:** security headers (`helmet`) → CORS → body parsing (`express.json()`, now
  bundled) → auth → rate limiting → routes → error handler **last**.
- **Cross-cutting concerns are middleware, not copy-paste.** Auth, logging, rate limiting, and request
  context live in middleware applied once: never re-implemented per route.

## Security baseline and config

- **Baseline (`backend-apis.md`):** `helmet`; CORS locked to known origins (never `*` with
  credentials); a rate limiter on public writes; cookies `HttpOnly` + `SameSite` + `Secure` in prod;
  constant-time secret compare; parameterized queries only.
- **Config once.** Read env once into a typed, validated config object at boot (refuse missing/dev
  secrets); never scatter `process.env` reads through the codebase.
- **Don't block the event loop.** Everything I/O is async; offload CPU-heavy work; a slow handler
  starves every other request.

## Red flags (refactor soon)

- Business logic or raw DB/`fetch` calls inside a route handler.
- `res.status(...).json({error})` hand-built across many routes; no central error handler.
- `try/catch`-and-`next(err)` boilerplate in every async handler (unneeded in Express 5).
- Unvalidated `req.body`/`req.query` flowing into a service.
- `process.env` read in many files instead of one typed config.
- CORS `*` with credentials; missing helmet/rate-limit on public writes.
- A single god router/app file instead of per-resource modules.

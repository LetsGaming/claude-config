# Fastify best practices

Fastify-specific rules (Fastify 5+, TypeScript) that sit **on top of** `backend-apis.md`. The general
backend layering: route → validation → service → data, no logic in handlers, one error handler,
config-once, a security baseline: still holds; Fastify gives you native tools for most of it, so this
file is mostly about *using them properly* (read `data-persistence.md`, `external-integrations.md`,
`types-and-contracts.md` too). Applies whenever touching routes, plugins, schemas, or app setup.

## Schemas are the point: define them for every route

- **Attach a JSON Schema (or TypeBox/zod via a type provider) to body, query, params, headers, AND
  the response.** Validation runs automatically at the boundary, and the response serializer is
  *compiled from the response schema*: faster, and it prevents accidentally leaking fields the schema
  doesn't list. This is `backend-apis.md`'s "validate from one schema" done natively: define the shape
  once, get validation + serialization + typing + docs from it.
- **Use a type provider** (`@fastify/type-provider-typebox` or a zod provider) so the schema's types
  flow into the handler: one source of truth for the request/response shape, no hand-written duplicate
  interface.

## Encapsulated plugins are the boundary system

- **Structure the app as plugins per domain** (a db plugin, an auth plugin, a routes plugin).
  Fastify's encapsulation means decorators and hooks registered in a plugin don't leak to siblings,
  that isolation *is* the seam. Share something intentionally by wrapping it with `fastify-plugin`.
- **Decorate the instance with services** (`fastify.decorate('userService', …)`) and reach them via
  `fastify.userService` / `request.server` rather than importing ad-hoc singletons: keeps
  dependencies explicit, encapsulated, and testable.
- **No god plugin.** Split by responsibility; a plugin that registers routes *and* db *and* auth is
  three plugins.

## Thin handlers; one error handler; hooks for cross-cutting

- **Handlers validate (via schema) + wire + call a service.** No business rules, no queries inline
  (`backend-apis.md`, `data-persistence.md`).
- **One `setErrorHandler`; map typed failures to responses there.** Don't hand-build
  `reply.code(400).send({error})` across routes: that scattered duplication is a known anti-pattern.
  Nothing leaks internals.
- **Cross-cutting concerns are hooks, scoped to a plugin:** `onRequest` for auth, `preHandler` for
  authorization, `onSend` for response tweaks. Apply once; don't repeat per route.

## Logging, config, security

- **Use the built-in Pino logger** via `request.log` / `fastify.log`: never `console.log`. Redact PII
  in the logger config.
- **Config once:** load env once into a typed, validated config at boot, refuse dev/placeholder
  secrets, and read config from there: never scatter `process.env` (`backend-apis.md`).
- **Security baseline:** `@fastify/helmet`, `@fastify/cors` locked to known origins, `@fastify/rate-limit`
  on public writes, secure cookies, constant-time secret compare, parameterized queries only.
- **Keep apps with different threat models separate.** A public read API and an authed write/admin API
  should not share a surface: session/auth concerns don't leak into the public path.

## Resilient upstreams

Wrap every external call in one resilient client returning a typed result (timeout, retry-with-care,
typed failure) behind a port: don't scatter bare `fetch`/`axios` through handlers
(`external-integrations.md`). A dead upstream degrades to a typed failure, not a 500.

## Red flags (refactor soon)

- Routes without schemas (no validation, uncompiled serialization, fields leaking in responses).
- `reply.code(...).send({error})` hand-built across routes; no `setErrorHandler`.
- Business logic or queries inside a handler.
- Imported singleton services instead of instance decorators; hooks leaking across plugins.
- `console.log` instead of the Pino logger; unredacted PII in logs.
- `process.env` scattered instead of one typed config.
- A god plugin doing several jobs; public and authed APIs sharing one surface.

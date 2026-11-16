---
name: code-standards
description: >
  General engineering standards for writing, editing, reviewing, or refactoring code in any
  project. DRY/KISS/SOLID/YAGNI discipline, type safety, clean boundaries (services, repositories,
  adapters, presentation/logic separation), no magic values, resilient integrations, and a review
  gate. Use this skill WHENEVER writing or changing non-trivial code, designing a module, API,
  schema, or component, or reviewing a diff/PR: even when the user only says "add X", "fix Y",
  "clean up Z", or "review this" without mentioning standards. When writing in a supported UI or
  server framework, ALSO read the matching guide in `best-practices/`. When working inside a known
  project, ALSO read the matching overlay in `projects/` and apply its stack-specific rules and known
  anti-patterns on top of these general ones. Consult this by default so recurring problems: missing
  service/hook seams, unsafe casts, duplicated logic, magic values, over-eager hydration, hardcoded
  style values: don't come back.
---

# Code Standards

Discipline for writing code that stays correct, readable, and easy to change. The rules are general;
project-specific stacks, conventions, and known traps live in `projects/`.

## How to use this skill

1. **Read the general reference(s)** for the layer you're touching (listed below). Each is short.
2. **Check `best-practices/` for the framework(s) in play.** Guides exist for UI frameworks (Vue,
   React, Svelte, Angular, Astro, Ionic), server frameworks (Express, Fastify, Django, Flask), and
   Discord bots (discord.js, discord.py): read the matching one(s). They sit on top of the general
   references, naming how the general rules land in that framework and adding framework-only
   conventions. Ionic layers on a host framework, so read `ionic.md` *together with* the base guide
   (Angular/React/Vue).
3. **Check `projects/` for a matching overlay.** If the code belongs to a project with a file there
   (e.g. `projects/<name>.md`), read it: it names the stack, adds project-specific rules, and
   lists real anti-patterns that project has hit. **Project overlay wins on specifics; the general
   rules still hold.** If no overlay exists and the project is worth standardizing, offer to create
   one from `projects/_TEMPLATE.md`.
4. **Write the code behind the right seam** (see the prime directive).
5. **Run `references/review-checklist.md`** before calling it done.

## Repository documentation: zero-doc default

**Ignore all repository documentation by default.** Do not read or evaluate READMEs, `docs/`
trees, wikis, architecture write-ups, contributing guides, or other doc files when writing,
editing, or reviewing code. The sources of truth are: this skill's references, the matching
`projects/` overlay, and the code itself. (Project overlays are part of this skill, not
repository documentation: always read the matching one.)

**Conditional alignment: only on an explicit user request.** If the user explicitly asks to
align code with specific repository docs:

1. Read the requested docs and judge them against this skill's own quality standards (the
   architecture non-negotiables, the priority order, the relevant references). Docs get no
   authority just for existing in the repo.
2. **Docs pass the bar** → treat them as an additional standard for this task: flag code that
   falls short of what the docs prescribe, alongside the usual checks.
3. **Docs are low quality** (contradict the non-negotiables, vague, outdated, or internally
   inconsistent) → reject them: say briefly why they don't meet the bar, and use this skill
   definition as the sole source of truth for the task.

## The prime directive: build the seam the design assumes

Most defects trace to one root cause: **the seam the architecture implies isn't built, so work
leaks past a boundary.** Business rules land in HTTP handlers or UI components; data rows are
force-cast instead of mapped; integrations throw instead of returning typed failures; style values
are hardcoded instead of tokenized. Writing good code is largely *building the seam instead of
stepping over it.*

Before writing anything, ask: **what boundary does this belong behind?**
- a **service** (a decision / business rule),
- a **repository or data module** (persistence + all queries),
- a **hook/composable/controller** (component logic, kept out of the view),
- an **adapter** (anything talking to an external system),
- a **shared contract module** (a type, constant, or limit needed by more than one layer),
- a **design token** (any style value).

If the thing you're about to write is a rule inside a handler, a `fetch` inside a component, a cast
on a query result, or a hex code in a stylesheet: it's on the wrong side of a seam.

## Non-negotiable architecture (applies everywhere)

- **Dependency direction points inward.** Apps depend on libraries; libraries depend on a
  dependency-free core; nothing reaches sideways or upward. A shared "core/domain" layer stays free
  of framework and I/O dependencies.
- **Ports & adapters.** Depend on a contract/interface, never a concrete integration. External
  quirks stay inside the adapter.
- **Persistence is isolated.** All queries live in a repository/data module that returns **domain
  types**, never raw rows. No SQL/ORM calls in handlers, services, or views.
- **Presentation and logic are separate.** Views render and emit; logic lives in
  hooks/composables/services. Routes validate and wire; decisions live in services.
- **No global mutable state on the client.** State lives in a component/island or on the server.

## Priority order when principles conflict

Simplicity over cleverness → explicit over implicit → composition over inheritance → type safety
over runtime safety → small focused modules → understandable in six months → easy to delete → easy
to test → minimal dependencies. Patterns reduce complexity; never add one because it exists.

## General references (read the relevant one(s))

- `references/engineering-principles.md`: DRY, KISS, SOLID, YAGNI, magic values, naming, comments. Read for any non-trivial change.
- `references/types-and-contracts.md`: type safety, unsafe casts, discriminated unions, const-over-enum, errors-as-values, shared contracts. (Examples in TypeScript.)
- `references/backend-apis.md`: layering (route → validation → service → data), no logic in handlers, validation single-source, one error handler, config-once, security baseline.
- `references/data-persistence.md`: repository pattern, map-don't-cast, versioned migrations, transactions, connection/pragma hygiene.
- `references/external-integrations.md`: ports/adapters for upstreams, resilient fetch (timeout/cache/typed failure), mock + contract tests, degrade-don't-fail.
- `references/frontend.md`: static-first, deliberate hydration, view/logic separation, props-down/events-up, design tokens, sanitizing sinks.
- `references/review-checklist.md`: the gate every change passes. Run it every time.

## Framework best-practices (read the one(s) for your stack)

Framework-specific guides that sit on top of the general references. UI frameworks build on
`frontend.md`, server frameworks on `backend-apis.md` (plus `data-persistence.md` etc.). Read the
matching one(s) alongside the general references. Meta-framework guidance is folded into its base
framework. SvelteKit lives in `svelte.md`, Next.js/RSC notes in `react.md`, Nuxt in `vue.md`.

UI / client:
- `best-practices/vue.md`: Vue 3 + `<script setup>` + TS: view/component split, composables (and vs.
  stores), business-logic layering, service layer, composables in the Options API, common smells.
- `best-practices/react.md`: React 19 + hooks + TS: pure render, effects-as-last-resort, logic in
  custom hooks, composition over config, compiler-era memoization, Server Components, state scope.
- `best-practices/svelte.md`: Svelte 5 (runes) + SvelteKit + TS: `$state`/`$derived`/`$effect`,
  reactive logic in `.svelte.ts`, snippets/callback props, server `load` + form actions.
- `best-practices/angular.md`: Angular 19/20+: standalone components, signals, thin components with
  logic in DI services, new control flow, signals-vs-RxJS, lazy routes.
- `best-practices/astro.md`: Astro 6: static-first with island leaves, deliberate `client:`
  directives, serializable island props, content collections, server islands, actions.
- `best-practices/ionic.md`: Ionic 8 + Capacitor (on Angular/React/Vue): read with the base-framework
  guide; platform components, Ionic routing, page-lifecycle gotcha, native-behind-a-service, theming.

Server / backend:
- `best-practices/express.md`: Express 5 + TS: impose the route→service→data layering, one error
  handler, boundary validation, v5 async-errors/named-wildcards, middleware order, security baseline.
- `best-practices/fastify.md`: Fastify 5 + TS: schemas for validation+serialization, encapsulated
  plugins as the boundary, `setErrorHandler`, instance decorators, Pino logging, config-once.
- `best-practices/django.md`: Django 5.x + DRF: thin views/logic in services+models, managers as the
  query seam, migrations, serializer validation, keep the security defaults, async/ORM caveats.
- `best-practices/flask.md`: Flask 3.x: app factory + blueprints, boundary validation (no built-in),
  central error handler, data module + Alembic, config-once, WSGI/sync model.

Bots / event-driven services (interaction = request, command = route, gateway/REST = upstream; build
on `backend-apis.md` + `external-integrations.md`):
- `best-practices/discordjs.md`: discord.js 14 + TS: slash commands + minimal intents, thin command
  over a service, one defer/permissions/errors wrapper, out-of-band command registration, shared
  clients, embed-color/snowflake constants, sanitized console/API sinks.
- `best-practices/discordpy.md`: discord.py 2.7+ (Python 3.11+): `app_commands` + cogs, `setup_hook`
  + out-of-band `tree.sync`, one `tree.error` handler, no blocking calls on the asyncio loop, shared
  `aiohttp`/DB clients, typed handlers.

New framework guide? Copy `best-practices/_TEMPLATE.md`: it encodes the approach (verify the current
major, attribute features to the right release, build on the general references, add a version-traps
section) and add its index line here under the right group.

## Project overlays

- `projects/_TEMPLATE.md`: copy this to `projects/<name>.md` to standardize a new project: its
  stack, its extra non-negotiables, an anti-pattern index (real mistakes → the rule → the general
  reference), and its exemplary/reference implementations.
- `projects/private/`: gitignored, local-only overlays for your own projects. Not part of the public repo.

## The one-line test for every change

**Is it behind the right seam** (service/repo/hook/adapter/contract/token, not a handler/view)?
**Is there one source of truth** (no duplicated logic, limits, or style values)?
**Is it type-safe at the boundary** (no unsafe cast, no untyped throw)? If any answer is no, fix it
before it ships.

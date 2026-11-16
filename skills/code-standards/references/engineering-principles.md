# Engineering principles

Language-agnostic discipline for every change. Read this for any non-trivial edit.

## DRY: remove real duplication, don't chase perfect DRY
The same rule expressed in three places will drift. But a little duplication is cheaper than the
wrong abstraction. Use the **Rule of Three**: one occurrence, leave it; two, note it; three,
abstract.

- **Watch for duplication that spans layers.** The costliest kind is the same shape repeated in the
  route/controller *and* the data layer *and* the client, so one change means several near-identical
  edits. When you write the third copy of a shape, stop and extract.
- **Extract the boilerplate, keep the meaningful part explicit.** For repetitive CRUD, keep per-entity
  queries readable but factor the mechanical wrapper (`deleteById(table, id)`, a `mapRows(stmt, fn)`
  reader, a `registerCrud({ path, schema, upsert, remove })` helper). Don't reach for a heavy
  abstraction (a full ORM, a code generator) to remove light duplication.
- **Never duplicate a value across a boundary.** A validation limit written in both the UI and the
  server will silently drift: put shared constraints in a shared module and consume both sides.
- **One derivation, one place.** A base URL, a formatter, a key convention: define once, import
  everywhere.

## KISS: the simplest thing that reads clearly
If a reviewer has to ask "what does this do," it's too clever.
- **Delete no-op and dead code.** A function that returns its input, a wrapper that only forwards, a
  "just in case" branch that never runs: remove it.
- **One level of abstraction per function.** A function either orchestrates (calls named steps) or
  does one concrete thing: not both.
- **Guard clauses / early returns.** Handle the invalid/empty case first and return; don't nest the
  happy path inside layers of `if`.

## SOLID: applied pragmatically
- **Single Responsibility** is the one that fails most often. Each thing has one job:
  - a **route/controller** validates and wires: it does not decide;
  - a **view/component** renders and emits: it does not fetch or hold business logic;
  - a **repository** answers questions (`findPublished()`); a **service** makes decisions
    (`publishLatest()`); keep them apart;
  - a file/function/component that has grown to do many jobs (the "god" object) is an SRP failure,
    split it. A giant `if/switch` over a type discriminant usually wants a lookup map or polymorphism.
- **Open/Closed** cautiously; **Liskov** for any subtype; **Interface Segregation**: small focused
  contracts; **Dependency Inversion**: depend on contracts, not concretions. Prefer composition to
  inheritance; most modern code has little reason to reach for class hierarchies.

## YAGNI: build for the requirement in front of you
Speculative generality (config for a case that doesn't exist, a plugin system for one plugin, an
abstraction for a single caller) is debt you pay interest on before it's used. Add the seam when the
second real case arrives, not in anticipation of it.

## No magic values: one named source of truth
A literal that carries meaning gets a name. The genuinely self-evident (`0`, `1`, an array index)
is exempt until it takes on domain meaning.
- **Domain strings → a `const` object + derived type** (or the language's equivalent), never loose
  string literals scattered across files.
- **Key/prefix conventions → one helper.** If a string format (`user:{id}`, a cache key, a route
  segment) appears in more than one place, wrap it once.
- **Repeated infra values get a name**: a singleton row id, a schedule expression, a default
  identifier, a timeout. Name it once.
- **Style values are tokens, not literals** (see `frontend.md`).

## Naming, comments, and the boy-scout rule
- Names state intent: `calculateReadingTime()`, `isPublished`, not `process()`, `data2`. Booleans
  read as predicates (`isX`, `hasX`, `canX`). When code collects in `utils.ts` / `helpers.ts` /
  `common.ts`, the architecture is drifting: move it nearer where it's used.
- Comments explain **why** (a tradeoff, an invariant, a non-obvious constraint), not what. Delete
  commented-out code; version control remembers it.
- Leave each file a little cleaner than you found it. Small constant cleanup beats a "big refactor"
  that never gets scheduled.

## The delete test
Could a teammate delete this file/function and predict what breaks from names and boundaries alone?
If the blast radius is unclear, the seams aren't clean yet.

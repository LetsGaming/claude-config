# <Framework> best practices

> Copy this file to `best-practices/<framework>.md` and fill it in. A framework guide **sits on top
> of** the general references: it does not restate them. Its job is to (1) name **how the general
> rules land** in this framework, (2) add **framework-only** conventions, and (3) call out
> **version-specific traps**. Keep it dense and high-signal like the existing guides (~50–70 lines of
> tight bullets, not prose). Delete these quote lines when done.
>
> **Approach checklist before writing:**
> - **Verify the current major.** Web-search the framework's latest stable release; don't trust
>   memory. Put the version in the title line and pin examples to it.
> - **Attribute features to the right version.** If you mention a feature as "new", confirm which
>   release actually introduced/stabilized it. Misattributing an older feature to the newest major is
>   the most common error: call out what's genuinely new vs. what only feels new.
> - **Point at the general reference(s) this builds on** (below) and reference them inline
>   (`backend-apis.md`, etc.) rather than re-explaining the underlying principle.
> - **Then add this framework's index line to `SKILL.md`** under the right group so it gets read.

<Framework>-specific rules (**<Framework> <major>+**, <language>) that sit **on top of**
`<general-reference>.md` [and `<second-reference>.md`]. [One or two sentences: what the general rules
already cover for this layer, framed for this framework: e.g. "an interaction is a request, a command
is a route"; or "the general backend layering is the whole job because <framework> gives you no
structure of its own".] This file names how those land in <Framework> and adds <Framework>-only
concerns (read `<other-reference>.md` too). Applies whenever touching <the relevant surface: routes /
components / commands / client setup>.

## <How the core general rule lands here>

- **<The seam this framework tempts you to skip>.** State the framework-shaped version of "build the
  seam": where business logic / data access / an upstream `fetch` must go instead of the handler,
  view, or command. Reference the general rule in parens (`backend-apis.md`, `data-persistence.md`).
- **<The framework's default unit of organization>** (module / component / cog / router-per-resource):
  what it is and the "no god file" rule for it.

## <Second framework-shaped concern>

- Tight bullets. Each names a concrete rule and, where relevant, the general reference behind it.
- Prefer imperative, specific guidance ("validate at the edge with one schema, then hand the typed
  value to the service") over generic advice the references already cover.

## <Framework> <major> specifics (they bite on upgrade)

- **<Breaking change / new default that surprises people on the version bump>.** What changed and
  what to do. This section is where version accuracy earns its keep: keep it factual and current.
- **<A feature people misattribute>.** If the ecosystem credits the newest major with an older
  feature, correct it here (feature X shipped in <major−1>; only Y and Z are new in <major>).

## <Config, safety, resources: as applicable>

- **Config once.** Read env once into a typed, validated object at boot; never scatter env reads.
  Secrets stay in env, gitignored, unlogged, rotated if leaked.
- **Don't block the <event loop / request>.** I/O is async; offload CPU work; a slow handler starves
  everything else. Share long-lived clients (DB pool, HTTP, Redis): instantiate once, never per
  request/interaction.
- **Sanitize sinks; validate at the boundary.** Any untrusted input into a dangerous sink
  (HTML injection, a shell/console command, a query) passes one shared sanitizer/validator: never a
  hand-rolled second copy.

## Red flags (refactor soon)

> Mirror the rules above as concrete smells. Each line = something a reviewer can spot in a diff.

- <Business logic or raw data access on the wrong side of a seam, in framework terms>.
- <The framework's signature over-<X> mistake: e.g. over-hydration, god router, all-intents-on>.
- <Per-handler duplication of what should be one handler/config/constant>.
- <The version-specific trap from the specifics section, stated as a smell>.
- <A magic value / duplicated contract / unsafe cast in this framework's idiom>.

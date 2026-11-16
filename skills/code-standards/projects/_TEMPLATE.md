# Project overlay: <NAME>

> Copy this file to `projects/<name>.md` and fill it in to standardize a project. Apply it **on top
> of** the general references; where it gets specific, it wins. Delete these quote lines when done.
>
> The goal of an overlay is to (1) name the stack and map it to the general references, (2) record the
> project's extra non-negotiables, (3) list the **real anti-patterns this project has actually hit** so
> they don't recur, and (4) point at the code worth copying. Keep it grounded in this codebase: real
> file names and real findings, not generic advice (that's what the general references are for).

## What it is
One or two sentences: what the project does and its shape (services, worker, site, etc.).

## Stack (maps to the general references)
| Layer | This project | General reference |
|---|---|---|
| Language / build | e.g. TypeScript strict, ESM, pnpm | `types-and-contracts.md` |
| Backend | e.g. Fastify / Express / Nest | `backend-apis.md` |
| Data | e.g. Postgres + Drizzle / SQLite raw | `data-persistence.md` |
| Integrations | e.g. Stripe, GitHub, internal svc | `external-integrations.md` |
| Frontend | e.g. Next / Astro+Vue / SvelteKit | `frontend.md` |

## Project non-negotiables (beyond the general ones)
- Rules unique to this repo: enforced dependency directions, layers that must stay separate, things
  deliberately not used, invariants (privacy, tenancy, etc.).

## Anti-pattern index: what was found here → the rule → where
> Fill from a real audit/review. Each row = a concrete pattern in this repo, the rule that prevents it,
> and the general reference with the underlying principle.

| Found in this repo | Rule | Reference |
|---|---|---|
| `path/to/file`: describe the real smell | the corrective rule | `<reference>.md` |

## Reference implementations to copy (what this repo did right)
- `path/to/good/file`: why it's the model; extend/match it.

## Local conventions
- Testing, CI gates, telemetry/privacy rules, ADR location, naming: the project-specific habits a
  new contributor needs to match.

---
name: isolated-dev-sessions
description: >
  Pattern + ready-to-adapt templates for per-session isolated dev environments: one dev-up.mjs /
  dev-down.mjs pair per agent/session id, each getting its own free ports, its own scoped
  database/data dir, its own log dir, and (for projects that need it) a content-hashed seed-data
  cache so repeated seeding is fast without ever coupling one session's data to another's. Use
  this WHENEVER setting up local dev tooling for a project where multiple Claude Code
  sessions/agents may work in the same checkout concurrently, or when asked to build "dev-up/
  dev-down scripts", "isolated dev sessions", "per-agent dev environment", "avoid port/db
  collisions between agents", or to seed a database with realistic mock/demo data for manual
  testing. Skip it when the project's own CLAUDE.md already documents `dev-up`/`dev-down` scripts;
  follow those instead. Distilled from a working implementation in a Fastify+Vue monorepo: read
  `reference.md` for the war-story detail behind each rule, and `templates/` for scripts to copy
  and adapt into a new project.
---

# Isolated dev sessions

The problem this solves: multiple Claude Code sessions (or a human + several agents) working in
the *same checkout* at the same time will otherwise fight over the same dev server port, the same
database file, and each other's manually-seeded state. The fix is always the same shape, regardless
of stack: a pair of scripts, `dev-up.mjs` / `dev-down.mjs`, that namespace everything mutable by a
session id and never touch anything shared without explicit opt-in.

## When to reach for this

- The project has a server + client (or any long-running dev process) that a session needs running
  to do manual/browser verification, and more than one session could plausibly run it at once.
- You're asked to set this up from scratch, or a project's CLAUDE.md already documents a
  `dev-up.mjs`/`dev-down.mjs` pair and you need to either use it (just follow that project's docs)
  or extend it (add seeding for a new feature: see "Extending an existing setup" below).
- Don't reach for this on a single-developer, single-session project with no concurrency concern,
  it's overhead a plain `pnpm dev` doesn't need. The whole point is solving cross-session
  collisions; if there's only ever one session, there's nothing to isolate.

## The shape (five rules)

1. **Namespace every mutable resource by `--id`.** Data dir, log dir, database file, session-state
   file: all under `data/agent-<id>/` and `logs/agent-<id>/` (or your project's equivalent). Never
   a fixed path. Default `--id` to something like `"default"` so the bare command still works for a
   lone human, but every agent/session picks its own short id (e.g. `rank-decay-bug`).
2. **Pick free ports, don't hardcode them.** Bind a throwaway `net.createServer()` to port 0, read
   back the OS-assigned port, close it, reuse that number for the real server. Do this once per
   port needed, immediately before starting the real process (small race window, acceptable for
   local dev). This is *why* concurrent sessions don't collide even though they all run "the same"
   dev server.
3. **Track PIDs, tear down by PID only: never by process name/command-line match.** Write the
   started child PIDs to a session-state JSON file in the session's own data dir. `dev-down.mjs`
   reads that file and kills exactly those PIDs (`taskkill /PID <pid> /T /F` on Windows,
   `process.kill(pid, "SIGTERM")` elsewhere). A name-based kill (`pkill node`, `taskkill /IM
   node.exe`) can't tell your dev server apart from another session's, or the maintainer's own
   long-running process: never do it.
4. **Split resources into scoped-per-session vs. genuinely-shared.** Anything that's slow to
   produce but *content-identical* regardless of which session asks for it (downloaded fixture
   assets, a static reference dataset) belongs in an ordinary shared dir that every session reads
   but nothing ever deletes wholesale. Anything that represents *this session's own state* (the
   database, logs) is scoped. Getting this split right is most of the design work: see
   `reference.md` for the concrete example.
5. **`dev-up.mjs` defensively wipes its own id's stale state before starting** (in case a prior run
   crashed before `dev-down.mjs` ran), and **`dev-down.mjs` always fully cleans up its own id's
   state after**, even on an abnormal session end. Neither ever touches another id's directory or
   the shared dir.

## Adding a seed-data cache (optional, for anything with a real ingest/seed pipeline)

If bringing a session's database to a useful *populated* state (not just migrated-empty) is slow,
running an ingest pipeline, seeding realistic mock data through the real write path so derived
state (ranks, aggregates, computed fields) comes out correct: cache the *result*, not just the
raw fixture inputs:

- Hash the content of everything that can affect what seeding produces: schema/migration files, the
  seed script itself, the services/repositories it drives, any static catalog/reference data it
  ingests. **Deliberately broad**: whole directories, not a precisely-tracked dependency graph.
  Over-invalidating just costs an occasional extra reseed; under-invalidating silently serves stale
  data from an old code version, which is the failure mode that actually matters.
- On a cache hit, copy the cached, already-seeded database file straight into the new session's own
  scoped path: the session's own server then starts against an already-correct file, and its
  normal startup migration is a no-op.
- On a miss, run the real seed pipeline, then have the seed script itself publish the result to the
  cache (write-to-temp-then-atomic-rename, so a concurrent publish of the same hash from another
  session can't corrupt it: whichever rename lands last just harmlessly overwrites the other with
  identical content).
- Prune the cache to the N most-recently-written entries so it doesn't grow unbounded as the hash
  drifts with every code change over time.
- Add a `--fresh` flag that bypasses the cache read (but still repopulates it after) for the rare
  case a session specifically needs today-relative timestamps in the seeded data.

## Extending an existing setup

If a project already has this pattern (check its CLAUDE.md and `scripts/`), and you're adding a
feature that needs new seed data: extend the *existing* seed script rather than hand-faking data
directly in a database. Seeding through the real write path is what makes derived/computed state
come out correct instead of merely plausible-looking. A new screen or feature with no seeded data
is untested by every future dev-up run, not just the one you're in: extend the seed in the same
change that adds the feature.

## Building this fresh in a new project

1. Read `reference.md` for the concrete gotchas (Windows process spawning, event-loop teardown,
   auto-login convenience, health-check polling) before writing anything: they're easy to
   rediscover the hard way otherwise.
2. Copy `templates/dev-up.mjs`, `templates/dev-down.mjs`, and (only if a seed cache is warranted)
   `templates/seedCache.mjs` into the target project's `scripts/` dir.
3. Fill in the placeholders (marked `TODO:` in each template) with the project's actual start
   commands, health-check endpoint, env vars for port/db path, and package manager.
4. Document the pair in the project's CLAUDE.md the same way this rule set describes: when to run
   it, what `--id` means, that `pnpm dev`/`npm run dev` (or equivalent) should never be run directly
   once this exists, and the matching `dev-down` for every `dev-up`.

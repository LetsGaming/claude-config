# Data & persistence

Framework/DB-agnostic rules for the data layer. Read this when touching persistence or the schema.
Treat the datastore as the system of record: data integrity outranks convenience.

## Repository pattern
- **All queries live in a repository/data module.** Handlers, services, and views never issue queries
  directly.
- **Repositories return domain types, never raw rows.** Map storage shapes (column casing,
  JSON-in-text, integer booleans) to clean domain types at the repository edge, so nothing downstream
  knows the storage format.
- **Export factories** (`createUserRepository(db)`), not shared mutable singletons.

## Map rows: never force-cast them
The single most important data rule: do not cast query results onto a type (see the cast trap in
`types-and-contracts.md`). Route every read through one checked mapper and select explicit columns.
```ts
const mapRows = <T>(stmt, fn: (raw: Record<string, unknown>) => T): T[] =>
  (stmt.all() as Record<string, unknown>[]).map(fn);
```
Prefer `SELECT col, col2` over `SELECT *` + cast: the latter breaks silently when columns change.

## Extract the boilerplate, keep the queries explicit
Per-entity SQL should stay readable. Factor only the mechanical repetition: a `deleteById(table, id)`,
a `setField(col, value)` for singleton rows, a boolean↔integer helper, and named constants for magic
infra values (a singleton row id, a retention window). Don't hide the actual queries behind a
generic query builder.

## Migrations: versioned, forward-only, transactional
Never evolve a schema by re-running a create script or by ad-hoc `ALTER`s in a swallow-all
`try/catch`. Use a real migration system:
- numbered, **immutable** migration files applied in order;
- a `schema_migrations` table recording version + checksum + timestamp;
- a runner that applies pending migrations **each in a transaction**, records the checksum, and
  **refuses to start** if an already-applied file's checksum changed;
- never edit an applied migration: add a new one; never swallow migration errors.

## Transactions & integrity
Wrap multi-statement writes that must succeed or fail together in a transaction. Enforce constraints
(foreign keys, uniqueness, not-null) in the schema, not only in application code. Add indexes for the
columns you filter/sort on instead of sorting large sets in memory.

## Connection & concurrency hygiene
Configure the datastore for your workload at open (for SQLite: WAL journaling, a `busy_timeout` so a
brief lock retries instead of erroring, and the safe fast durability pairing; foreign keys on). Keep
request-path queries small and indexed; push heavy/bulk work (aggregation, imports, retention) to a
background job, not a request handler. Know your writer model (e.g. single-writer stores serialize
writes) and design around it.

## Backups
Whatever holds the durable state is the thing to back up. Know which file/volume that is and that it
is actually being backed up.

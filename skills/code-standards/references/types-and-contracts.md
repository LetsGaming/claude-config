# Types & contracts

Static types are only worth having if you don't defeat them at the boundaries. Examples are in
TypeScript, but the rules apply to any typed language. Read this for any typed code.

## Turn strictness on and leave it on
- Use the strictest reasonable compiler settings (in TS: `strict`, `noUncheckedIndexedAccess`,
  `verbatimModuleSyntax`, `noImplicitOverride`, `noFallthroughCasesInSwitch`). Share one base config
  so strictness can't drift between packages.
- **No escape hatches:** no `any`, no `@ts-ignore`/suppressions, never disable a type or lint error to
  make code compile. Give real types; narrow `unknown` before use.
- Where indexed/optional access yields `T | undefined`, **narrow it explicitly**: don't assert it
  away with `!`.

## The cast trap: the highest-value type rule
An unchecked cast (`value as unknown as T`, or an equivalent forced cast) is `any` in disguise: it
asserts a shape with zero verification, so a changed field still compiles and fails at runtime: at
the exact boundary types are supposed to protect. This shows up most on **query results and parsed
JSON**.

```ts
// ❌ forces a shape onto untyped data: breaks silently when the source changes
const rows = query("SELECT * FROM projects").all() as unknown as Project[];

// ✅ map through one checked reader; select explicit fields, not *
const rows = mapRows(
  query("SELECT id, name, tag, featured FROM projects"),
  toProject, // (raw: unknown) => Project, narrows/validates the shape in one place
);
```
Keep any unavoidable unsafe cast in **one audited helper**, not sprinkled across every call site.

## Model shapes precisely
- **Discriminated unions instead of a loose `status: string`**: so exhaustive `switch` and narrowing
  work and an unhandled case is a compile error.
- **A `const` object + derived type instead of an `enum`:**
  ```ts
  export const Status = { Draft: 'draft', Published: 'published' } as const;
  export type Status = typeof Status[keyof typeof Status];
  ```
- **`type` for unions/data, `interface` for object contracts / extension.**
- **Prefer immutability:** `readonly`, `ReadonlyArray<T>`; export **factory functions**, not mutable
  singletons.

## Errors as values at the boundaries
Model **expected** failures (a timeout, a not-found, a validation failure) as return values; `throw`
only for genuinely exceptional, unrecoverable states. A remote service being slow is normal, not
exceptional.

```ts
export type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

const res = await source.fetchData();
if (!res.ok) return degrade(res.error); // typed, exhaustive: no try/catch dance
use(res.value);
```
Never `throw` a bare string; throw `Error` objects. Never silently swallow an exception: catch the
specific expected case and let the rest surface. A `catch {}` that eats every error hides real bugs.

## One source of truth for shapes
Never redefine the same type in two layers. If several layers need a shape, it lives in a shared
contract module everyone imports. Derive runtime validation **and** the static type from **one**
schema definition (e.g. a schema library that emits both), rather than hand-writing a validator
beside a matching type: the two will drift.

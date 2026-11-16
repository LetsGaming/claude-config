---
name: improve-code-comments
description: Review a codebase and improve its comments without changing behavior, remove redundant/outdated/audit-noise comments, rewrite awkward ones, and add missing context where logic is non-obvious. Use this skill whenever the user asks to clean up, improve, fix, review, or add code comments; remove comment noise or stale TODOs; document existing code; make comments more professional; or prepare a codebase for handover, review, or open-sourcing. Trigger it even if the user just says the comments are "bad", "AI-generated", "messy", or "outdated", or asks to "polish" a repo's documentation-in-code.
---

# Skill: Improve Code Comments

## Purpose

Review an existing codebase and improve its comments without changing behavior.

The goal is to make comments useful for developers: not to narrate the code. Assume the reader already knows the language and common programming patterns. A good comment explains **why**, **intent**, **constraints**, **assumptions**, or **non-obvious behavior**. It rarely explains **how** obvious code works.

The end state is not "fewer comments" or "more comments": it's that every remaining comment earns its place, and every piece of genuinely non-obvious logic has enough context that a future maintainer doesn't have to reverse-engineer it.

---

## Workflow

1. **Scope.** Confirm which files or directories are in scope. For large repos, propose a prioritization (core logic and public APIs first; generated code, vendored dependencies, and lockfiles are always out of scope).
2. **Read before editing.** For each file, read enough surrounding code to judge whether a comment is accurate. Never delete or rewrite a comment based on the comment text alone.
3. **Edit comments only.** Apply the principles below.
4. **Verify.** Review the diff for each file and confirm that only comments and documentation strings changed: no code tokens added, removed, or reordered. If the project has a test suite that's cheap to run, run it.
5. **Report.** Summarize what was done per file (removed / rewritten / added counts are enough), and separately list anything you **flagged** rather than changed (see "When unsure" below).

---

## Hard Safety Rules

### Never touch comments with functional meaning

Some things look like comments but are read by tools or the runtime. Deleting or rewording them changes behavior. Always preserve, verbatim:

* Shebang lines (`#!/usr/bin/env python3`)
* Encoding declarations (`# -*- coding: utf-8 -*-`)
* License and copyright headers
* Linter and type-checker directives: `# noqa`, `# type: ignore`, `# pylint: disable=...`, `// eslint-disable-next-line`, `// @ts-ignore`, `// @ts-expect-error`, `// prettier-ignore`, `# rubocop:disable`, `// nolint`, and similar
* Compiler/build directives: `#pragma`, `//go:generate`, `//go:embed`, `//go:build`, `# cython:`, macros-in-comments
* Coverage and instrumentation markers: `/* istanbul ignore next */`, `# pragma: no cover`
* Doctests inside Python docstrings: the `>>>` examples execute as tests; rewording them can break the build
* Region/folding markers (`// #region`) and any comment pattern the project's tooling visibly depends on

Python docstrings are runtime-visible (`__doc__`) and may be consumed by help systems, doc generators, or APIs. Improving their wording is fine; deleting them or breaking their structure (e.g., a Sphinx/Google-style field the docs build parses) is not.

### Only modify comments

Do not rename variables, refactor logic, fix bugs, optimize, reorder code, or reformat unrelated lines: even if you spot problems. The implementation must remain functionally identical. If you find a real bug, flag it in your report instead of fixing it.

### When unsure, keep or flag: never guess-delete

You often can't verify whether a comment is truly obsolete. A comment like `// Temporary workaround (2021)` may describe a workaround that is still active: the date is stale, not the comment. Rules of thumb:

* If you can confirm from the code that a comment is outdated (e.g., `// TODO: add validation` directly above validation code), remove it.
* If a TODO/FIXME still describes real unfinished work, **keep it**.
* If a comment **contradicts** the code, don't silently rewrite it to match: that mismatch is often a hidden bug. Flag it in your report and leave it (or mark it) for the user to decide.
* If you simply can't tell, keep the comment.

---

## What to Remove

**Redundant comments** that restate the code:

```java
// Create new list.
List<User> users = new ArrayList<>();
```

```js
// Return true.
return true;
```

**Confirmed-outdated comments**: completed TODOs, resolved-bug references, finished migration notes, obsolete version references, stale implementation notes.

**Audit and review noise**: `// Fixed during audit`, `// Audit finding #14`, `// Addressed in security review`, the code should stand on its own without referencing past review processes. Exception: keep it if it carries context that still matters (e.g., it explains *why* a non-obvious defensive check exists).

---

## What to Rewrite

Rewrite comments that are awkward, robotic, verbose, repetitive, misleading, or inconsistent. Prefer short, natural, direct language: present tense, active voice, like an experienced teammate wrote it.

Instead of:

```
// This function is responsible for handling all user authentication functionality.
```

write:

```
// Authenticate the user and issue a session token.
```

Instead of:

```
// Duplicate events are ignored due to the possibility that retries may occur.
```

write:

```
// Ignore duplicate events because retries are expected.
```

Keep comments short. Add detail only when it carries real value (edge cases, constraints, gotchas).

---

## What to Add

Add a comment when (and only when) a future maintainer would otherwise stop and ask "why?" or "what is this doing?". Typical candidates: non-obvious algorithms, business rules, security and permission checks, concurrency/locking, retry logic, caching decisions, regexes, protocol or format handling, magic numbers, workarounds for external quirks, and performance-motivated code that looks wrong at first glance.

The test is genuine non-obviousness, not category membership. A straightforward cache lookup or a simple validation `if` needs nothing. Do not blanket-comment code just because it falls into one of the categories above: over-commenting is the failure mode this skill exists to fix.

**Complex functions**: add a one-or-two-line summary before any function that takes real mental effort to understand, so the reader knows the goal before reading the implementation:

```ts
// Merge overlapping permission sets while preserving the highest precedence
// granted by each provider.
```

**Multi-step logic**: when a long function has distinct stages, short section comments (`// Validate the request.` … `// Persist changes.`) help. No decorative banners.

**Public APIs**: exported functions, classes, and modules should have doc comments covering purpose, important constraints, side effects, and assumptions, in the project's established doc format (JSDoc, docstrings, GoDoc, rustdoc, etc.). Don't restate parameter names that are already self-explanatory.

**Private helpers**: only comment them when the name doesn't already say what they do.

---

## Always Preserve

Never remove comments that explain business requirements, legal/compliance constraints, protocol specifications, security rationale, hardware behavior, interoperability or backwards-compatibility constraints, API quirks, or vendor limitations. These are often more valuable than the code itself. Rewording them for clarity is fine; losing the information is not.

---

## Consistency

Match the project's existing conventions: doc-comment format, capitalization, punctuation, language (don't translate comments in a German-commented codebase to English unless asked). Within a file, don't mix fragments and full paragraphs arbitrarily.

---

## Report Format

End with a concise summary:

* Per file: N removed, N rewritten, N added (one line each; skip untouched files).
* **Flagged items**: comments that contradict the code, TODOs that look like real unfinished work, suspected bugs, each with file, line, and one sentence of context.
* Confirmation that no code was changed (and test results, if a suite was run).

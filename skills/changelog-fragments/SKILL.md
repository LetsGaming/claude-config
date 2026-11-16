---
name: changelog-fragments
description: Use when working in a repository that has a `changelog.d/` directory, which means its changelog is assembled from per-change fragments instead of edited directly. Covers the fragment format, the one-fragment-per-task rule for subagents, and how the parent agent folds fragments into CHANGELOG.md after merging. Load it before writing a changelog entry, before committing a user-facing change in such a repository, and before any subagent is told to record a change. If the repository has no `changelog.d/` directory, this skill does not apply.
---

# Changelog fragments

A `changelog.d/` directory means `CHANGELOG.md` is generated, not hand-edited.

## Rules for subagents

- Never edit `CHANGELOG.md`.
- Add exactly one fragment per task: `changelog.d/<task-slug>.md`. If the name exists, suffix it `-2`, `-3`, and so on.
- Commit the fragment with the change, on the same branch.

## Fragment format

Front matter `type:` is one of `added`, `changed`, `fixed`, `removed`, `perf`. The body is one to a few user-facing bullet sentences, with no file paths.

```md
---
type: fixed
---
- Image uploads no longer fail for files over 10 MB.
```

Write for the person reading release notes, not for the reviewer reading the diff. "Fixed a race in the upload queue mutex" is the wrong register. "Uploads no longer fail intermittently" is right.

## Rules for the parent agent

Only the parent agent touches `CHANGELOG.md`, and only after every subagent branch is merged.

1. Fold every fragment into `CHANGELOG.md`, grouped by type.
2. Delete exactly the fragments you compiled. Leave any that arrived later.

## No user-facing change

Refactors, test-only changes, and internal tooling need no fragment. Do not invent one to look thorough. A fragment that says "internal cleanup" is noise in release notes.

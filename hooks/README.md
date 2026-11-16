# Plan persistence hooks

Two hooks that stop a plan from decaying across compactions, plus a logging hook to verify them.

The problem: plan mode leaves the approved plan in the conversation as a message. Compaction summarises it, and the second compaction summarises that summary. Specifics go first: file paths, step order, acceptance criteria. These hooks move the plan onto disk, where summarisation cannot reach it.

## Files

| File | Event | Does |
|---|---|---|
| `save-plan.mjs` | `PostToolUse`, matcher `ExitPlanMode` | Writes the approved plan to `docs/plans/<date>-<slug>.md`, sets the `.claude/active-plan` pointer, and tells the agent where it went |
| `restore-plan.mjs` | `SessionStart`, matcher `compact` | Injects the plan path and body back into context right after a compaction |
| `log-hook-input.mjs` | any | Appends raw hook payloads to `.claude/hook-log.jsonl`, for verification only |

Node, not bash, for three reasons: JSON parsing without `jq`, filename derivation, and running unchanged on Linux and Windows. Claude Code already requires Node, so this adds no dependency.

## Install

1. Copy the `.mjs` files to `~/.claude/hooks/`.
2. Merge `settings-snippet.json` into `~/.claude/settings.json` under the existing `hooks` key, if you have one.
3. Replace `/ABSOLUTE/PATH/TO/.claude/hooks/` with your real home path. `~` expansion in hook commands is not documented, so use an absolute path. On Windows use the full path with forward slashes.
4. On Linux, make them executable is not needed, since `node <file>` is the command.

`CLAUDE_PROJECT_DIR` is not used in the command string because these are global hooks and that variable points at the project, not your home directory. The scripts themselves do use it, to decide which project to write the plan into.

## Verify before relying on it

One fact could not be confirmed from the docs: whether `PostToolUse` fires for `ExitPlanMode`. The docs recommend reading `tool_response.plan` for the approved plan, which implies it does, but implication is not confirmation. Five minutes settles it.

1. Temporarily add `log-hook-input.mjs` as a second handler under the `ExitPlanMode` matcher.
2. Start a session, enter plan mode, approve any small plan.
3. Check that `docs/plans/` has a file and `.claude/active-plan` points at it.
4. Check `.claude/hook-log.jsonl` to see the real payload, in particular whether `tool_response.plan` carries the text.
5. Remove the logging handler.

To test the restore hook, run `/compact` in a session that has an active plan, then check that the plan text appears in the new context.

## Behaviour notes

- Approving the same plan twice keeps one file. A changed plan gets a numbered sibling, so no plan is overwritten.
- A plan over 7000 characters is injected as its step outline plus the file path, to stay under the 10000 character injection limit.
- Both hooks exit quietly when there is no plan. A missing pointer file is not an error.
- `save-plan.mjs` exits non-zero only on a filesystem error. `PostToolUse` cannot block, since the tool has already run, so a failure is reported and the session continues.
- Plans are written into the project, not into your home directory, so they can be committed and reviewed with the work.

## What this does not fix

Compaction frequency. These hooks make the plan survive, they do not make compaction rarer. For that, delegate file-heavy exploration to subagents, keep large reference skills out of context unless the task needs them, and reconsider whether a cross-session memory layer is earning the context it spends.

`PreCompact` exists and can block a compaction, but nothing documented lets it steer what the summary keeps. It is a gate, not a content editor, so it is not useful here.

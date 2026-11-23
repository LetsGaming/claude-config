---
name: plan-first
description: Use at the start of any request that bundles more than one task, or whose steps depend on each other being researched and done in the right order, such as a migration, a refactor across files, a rework or redesign after a failed check, a feature that needs investigation first, a deploy or release, or any "do A, then B, then C". Also use it when a short go-ahead ("option 1", "do it", "go with that") picks a multi-step piece of work: judge the work it names, not the length of the message, even deep in a long session where the next step feels obvious. Enter plan mode before touching anything. Use it even when the user does not say "plan", and even when the first step looks easy, because a wrong early step is what makes these tasks expensive. Skip it for a single edit, a question, a lookup, or a command the user spelled out.
---

# Plan first

A request with several dependent steps goes wrong at the first step nobody researched. Plan mode makes Claude read before it writes, and gives the user one point to correct the approach before any file changes. The cost is one approval. The saving is a rework that touches many files.

## Decide in a few seconds

Enter plan mode if one or more of these holds:

- **Several deliverables.** The request contains two or more things that each need their own decision, not just two commands.
- **Research before action.** A later step depends on something not yet known: unfamiliar code, a version-specific API, how an external system behaves, which file owns a behavior.
- **Order matters and a mistake is costly.** Database changes, renames across files, deploys, history rewrites, anything hard to undo.
- **The user lists steps.** Numbered steps, "then", "after that", "once that works".
- **A go-ahead for such work.** "Option 1", "do it" or "go with that" after a discussion is a request for whatever it points to. If that is a rework, a redesign, or anything that needs a rerun and a comparison, plan it. In a long session you already know the code, so the first step feels obvious. Distrust that feeling: a plan is how the user gets to correct the approach before the rework starts.

Do not enter plan mode when:

- the request is one edit, one question, one lookup, or an explanation;
- the user spelled out the exact commands, or said "just do it" or "no plan";
- you are already in plan mode, or the request is the next step of an approved plan (`.claude/active-plan` exists and points to a file);
- nobody is there to approve: an autonomous or unattended session, or you are a subagent. Plan mode waits for a person, so it would stall the work.

Two actions with no dependency and no risk ("run the tests and tell me what failed") are not a plan. When it is a close call, count the steps that cannot be undone. Two or more means plan.

## How

1. Say one line: "This has N dependent steps, entering plan mode." No preamble.
2. If the plan mode tools are deferred, load them first with `ToolSearch` using `select:EnterPlanMode,ExitPlanMode`. Then call `EnterPlanMode`.
3. Research with read-only tools. For each step the plan states what it does, what it depends on, and how you will know it worked. Name the files and the commands.
4. Put questions that change the plan to the user before you write it, not after.
5. Call `ExitPlanMode` when the plan is ready. The saved plan file and the task list are handled by the user's own rules, so do not write the plan file yourself unless it is missing after approval.

If `EnterPlanMode` is unavailable or refused, say so in one line and continue with a numbered list of steps in your reply. Do not retry.

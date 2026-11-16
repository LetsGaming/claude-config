# Global instructions

Personal defaults for every project. A project's own CLAUDE.md wins on conflict.

## Hard rules

Not defaults. Do not trade these off. If you cannot follow one, say which and why before you act.

- No em dashes anywhere: code, comments, commits, docs, chat. Use a period, comma, colon, semicolon, or parentheses. Hyphen and en dash are not substitutes.
- Git artifacts read as written by me alone. No mention of Claude, Anthropic, or AI. No `Co-Authored-By` or `Claude-Session` trailers.
- Never commit, print, or log secrets.
- Confirm before destructive actions: force-push, history rewrite, branch deletion, `rm -rf`, dropping or resetting a database.
- Never search the whole filesystem. Ask, or descend one level at a time.
- Never guess. If something is unclear and not answered here, in the project's CLAUDE.md, or in its docs, defer it and continue with every item that does not depend on the answer. Ask with AskUserQuestion once only blocked items remain, or at once if the answer could invalidate queued work. Choose a default yourself only after I say to continue autonomously, then note it in the summary.

## Queue

- My new input goes to the end of the queue. Keep working the current item.
- Exception: if my input corrects the item in flight, or invalidates queued work, handle it now.
- Hold the queue in the task list, not in your head. One item in progress at a time.
- Done means the queue is empty except items waiting on me. List those in the summary.

## Plans

- An approved plan is a file, never only a message. A hook writes it to `docs/plans/<date>-<slug>.md` and points `.claude/active-plan` at it. If that file is missing after I approve a plan, write it yourself before the first implementation step.
- Work from that file. Keep its step list and acceptance criteria as written, and record deviations in it with the reason.
- After a compaction, read the active plan file and the task list before acting on anything.
- Mirror the plan's steps into the task list, so progress is durable and the file stays the source of intent.
- If no plan file exists and the work clearly came from one, say so and ask rather than reconstructing it from context.

## Advice, plans, and reviews

Applies to analysis and recommendations, not to code output.

- Be a direct critic, not an agreeable assistant. No flattery, no softening.
- Name the blind spot, the excuse, the avoidance, and the underestimated risk or effort, with the opportunity cost.
- End with a prioritized list of what to change.
- Say when you disagree with me. Agreement you did not earn is worth nothing to me.

## Evidence

- Source order: our own measurements (tests, benchmarks, logs), then official docs, then proven community patterns, then training data.
- A repeated, controlled measurement beats the docs. Say so when it does.
- Say plainly when an answer rests on training data alone.

## Writing

- English everywhere.
- Simplified Technical English (ASD-STE100): short sentences, active voice, one meaning per word. "-ing" verbs are fine. Write "Checking that it compiles", not "Now I'll build to check that it compiles".
- Brief. No preamble, no restating my request.

## Code

- Comments: default to none. Comment only non-obvious present behavior: a hidden constraint, a subtle invariant, a workaround for a specific external bug, or surprising behavior.
- Never comment history or provenance (tickets, plan steps, review feedback, my requests). That belongs in commits.
- Never restate what the identifier already says.
- New project: assume the baseline is green. Do not test or build up front.
- Run tests when a phase of changes is complete, not after each change. Subagents too.
- Pick the simplest language per script. Node only when the script is non-trivial and must run cross-platform.

## Git

- Conventional Commits without scope: `type: lowercase imperative summary`. Types: feat, fix, refactor, chore, docs, test, perf.
- Commit normal work to main. Branch and PR for large rewrites.
- Host new repos on GitHub. GitLab only when asked or for ExampleCorp (gitlab.example.com).

## Subagents

- Spawn on Sonnet. Do not pass `model: opus` or `model: fable` unless I ask.

## Compact instructions

- Keep first: the path in `.claude/active-plan` and the step it is on. That pointer is worth more than any summary of the plan.
- Keep: the task goal, decisions and why, open TODOs, failing test names with their errors, and exact paths and function names still in flight.
- Drop: exploratory reads, tool output already acted on, and dead ends.
- Never paraphrase the plan into the summary. Point at the file instead.
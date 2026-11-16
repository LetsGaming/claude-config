---
description: Resume paused work from the resume note and continue immediately
---

Resume the work that was paused. The note holds everything needed, so execute from it. Do not investigate.

1. Read `.claude/paused.md`. If it does not exist, say so and ask where to resume rather than reconstructing from context.
2. Read the plan file the note names, but only if "Next action" refers to it. Restore the task list from the plan's steps, marking the completed ones from the note.
3. Restart only the processes under "Restart for the next step", using the commands exactly as written.
4. Redo everything under "Must be redone on resume". An interrupted benchmark is re-run from the start, never continued.
5. Execute "Next action". Start there and continue.
6. Create a fresh recurring check-in with CronCreate, including the self-limiting preamble from the `autonomous-session` skill, but only if the remaining work is long or unattended.
7. Delete `.claude/paused.md`, so a stale marker cannot stop the new check-in.
8. State in one line where work resumed, what was re-run, and anything still waiting on me.

Do not search the codebase for context. Do not re-read files the working set did not name. Do not re-run the suite to learn what is failing, the note states it. Do not reconstruct a decision the note already records. Do not ask me what you were working on.

If the note cannot support that, it was written wrong. Say so, name what is missing, and ask. A thin note is a pause failure to report, not a reason to start investigating.

If the note lists items under "Waiting on the user", ask those before step 5.

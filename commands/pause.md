---
description: Pause the current work, free the machine, and write a zero-investigation resume note
---

Pause the current work and hold until further notice. Work will continue from exactly this point, with no investigation needed on resume.

Two goals, in tension: lose no data, and give the machine back fast. Capture only what cannot be recovered, release everything, then write the note. The machine is free before the writing starts, so a thorough note delays nothing.

Run these in order. Do not reorder, and do not write the summary before step 5.

1. Stop adding work. No new subagents, no new jobs, nothing new opened.
2. Capture what is unrecoverable. For each thing in flight: if it holds unsaved state, let it finish when that is seconds away, otherwise capture what it has and note the rest as lost. If it holds nothing (a game client, a dev server, a browser window, a watcher, an idle shell), kill it now.
3. Release the machine. Stop every process this work started: benchmarks, game clients, dev servers, browsers, watchers, background shells, running subagents. Anything holding the screen, the GPU, or an input device goes first.
4. Delete the recurring check-in with CronDelete. If there is none, say so.
5. Write `.claude/paused.md` as a handoff packet, using the format in the `autonomous-session` skill. It must open with "Next action", one executable instruction naming the file, the symbol, and what to change, followed by the verbatim commands to run, the working set with line anchors, decisions not yet written to any file, rejected alternatives, the current pass and fail state by test name, `git status --short` and `git diff --stat`, the processes to restart with their exact commands, and what must be redone.
6. Check the note. Could a session with no context execute "Next action" without opening anything except this file and the plan it names? If not, the note is too thin. Fix it now.
7. Summarise in one short block. Name the deleted check-in and each released process. If a step did not happen, say which and why.

Decisions held only in context are the one thing resume cannot recover at any price. Code, test results, and git state can be re-derived. A settled decision cannot. Write those down even when they feel obvious.

Any measurement cut off mid-run is invalid. Discard the partial result and list it under "must be redone". Never report it as a measurement.

Do not commit to make state legible. Record the git status in the note instead.

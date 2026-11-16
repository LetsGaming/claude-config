---
name: autonomous-session
description: Use at the start of any long-running or autonomous work session, meaning work that will run for more than roughly half an hour, work queued as a batch of tasks, or work the user has said to continue without them watching. Sets up the recurring check-in, defines the status format, and covers waiting on long jobs without burning tokens. Also use when the user says to continue autonomously, to work through a queue, or to report back periodically, and whenever the user says to pause, hold, stop for now, or resume: pause has a fixed procedure that releases the machine and deletes the check-in, and resume has its mirror. Load it before starting the work, not after the first check-in is due.
---

# Autonomous session

## Set up the check-in

- Create a recurring check-in with CronCreate before starting the work. Default interval: 45 minutes. The user can set another.
- The check-in must be self-limiting. Start its prompt with this, so a check-in that outlives its work cleans itself up:

  > Before anything else: if `.claude/paused.md` exists, or `.claude/active-plan` is missing, delete this scheduled task and stop without reporting.

- A stale check-in firing into dead work costs tokens and can wake the machine. Creating a new one is cheap, so prefer deleting early over keeping one alive.

## At each check-in

Run these in order.

1. Collect everything since the last check-in: finished items, subagent results, errors, failing tests, blockers.
2. Fix problems now, before starting new work. An old error left open is the main failure mode of long sessions.
3. Re-check focus: the current item is still the top of the queue, and nothing has drifted.
4. Report: a short status, the current ETA, then continue.

## Status format

No news is a valid status. Keep it to one or two lines.

```
No new changes since 14:10. Work continues on <task>.
```

Do not re-read files or re-run checks when nothing has changed. Do not restate the queue. Do not summarise work already reported in an earlier check-in.

## Waiting on long jobs

- Never poll in a Bash loop for longer than 60 seconds.
- Run long jobs in the background and read their output file, or schedule a wakeup.
- A job that has not finished is not a reason to idle. Pick up the next queue item that does not depend on it.

## Pause

A pause is an explicit instruction to stop the current work and hold until further notice, then continue from the exact point of the pause. Treat "pause", "hold", "stop for now", and "park this" as the same instruction. A pause is a stop, not a bookmark: every rule below that applies to stopping applies to it.

Two goals, in tension. Lose no data, and free the user's machine fast. Resolve the tension this way: capture only what cannot be recovered, then release everything.

### Order of operations

Run these in order. Release before summarising, never after. The summary is the last thing produced, so anything queued behind it does not happen.

1. **Stop adding work.** Spawn no new subagents, start no new jobs, open nothing new.
2. **Capture what is unrecoverable.** For each thing in flight, decide in one pass: does it hold state that is lost if killed?
   - Holds unsaved state (a partial file write, a long computation with results in memory, a subagent mid-report): let it finish if that takes seconds, otherwise capture what it has and note the rest as lost.
   - Holds nothing (a game client, a dev server, a browser window, a watcher, an idle shell): kill it at once. Do not wait on these.
3. **Release the machine.** Stop every process the work started: benchmarks, game clients, dev servers, browsers, watchers, background shells, running subagents. Anything that occupies the screen, the GPU, or an input device goes first. The user asked for their machine back, and that is the part they can see.
4. **Delete the check-in** with CronDelete. Do this before writing the summary, not after.
5. **Write the resume note** to `.claude/paused.md`. See the format below.
6. **Summarise in one short block**, and name the deleted check-in and the released processes explicitly. If a step did not happen, say which and why.

### Interrupted measurements

A benchmark, timing run, or any measurement cut off mid-run produces invalid data. Mark it invalid in the resume note and discard the partial result. Never record it as a measurement, and never let it reach a report. A corrupted number that looks real is worse than a missing one, because measurements outrank documentation when deciding things later.

### The resume note is a handoff packet

Resume must cost zero investigation. A resumed session reads this one file and acts. It does not search the codebase, re-read files to rebuild context, re-run the suite to learn what is broken, or re-derive a decision that was already made.

That is affordable because the machine is already free by this point. Steps 1 to 4 released it, so writing a thorough note delays nothing the user is waiting for.

```md
---
paused: <ISO timestamp>
plan: <path from .claude/active-plan, or none>
step: <step number and title>
branch: <git branch, or none>
---

## Next action
<One executable instruction. The file, the symbol, and what to change or run. A session with no
context must be able to start from this line alone.>

## Commands to run next
<Verbatim, with the working directory. No "run the tests", give the command.>

## Working set
- `<file:line>`: <what is half-done in it, and what it is for>

## Decisions not yet in any file
- <decision, and the reason behind it>

## Rejected alternatives
- <option, and why it was dropped>

## Verification state
- Passing: <suite green as of <time>, or the specific names>
- Failing: <test name: error>
- Not run since: <which change>

## Uncommitted work
<`git status --short` output, plus `git diff --stat`>

## Restart for the next step
- <process>: <exact command>

## Must be redone on resume
- <interrupted measurements, partial writes rolled back, anything left half-applied>

## In flight when paused
- <what was running, and whether its state was captured, finished, or lost>

## Released
- <each process stopped>

## Deliberately not done
- <item>: <reason>

## Waiting on the user
- <blocked item>: <the question it needs answered>
```

Three rules for writing it:

- **Decisions not yet in any file is the section that matters most.** Reasoning held only in context is the one thing a resumed session cannot recover at any price. Code, test results, and git state can all be re-derived. A settled decision cannot, and without it the work gets re-litigated or quietly reversed.
- **Do not commit to make state legible.** Record `git status --short` and `git diff --stat` in the note instead. A WIP commit on main is worse than an explicit uncommitted-work section.
- **Write the file even when the pause is clean.** An empty section is information. A missing file forces a guess.

### Check the note before finishing the pause

Re-read it and answer one question: could a session with no context execute "Next action" without opening anything except this file and the plan it names? If not, the note is too thin. Fix it before writing the summary.

## Resume

Mirror of the pause. The note already holds everything, so resume executes, it does not investigate.

1. Read `.claude/paused.md`. Read the plan file it names only if "Next action" refers to it.
2. Restore the task list from the plan's steps, marking the completed ones from the note.
3. Restart only the processes under "Restart for the next step", using the commands as written.
4. Redo everything under "Must be redone on resume". An interrupted benchmark is re-run from the start, never continued.
5. Execute "Next action". Start there, from the note, and go.
6. Create a fresh check-in with CronCreate, with the self-limiting preamble, if the remaining work is long or unattended.
7. Delete `.claude/paused.md`, so a stale marker cannot stop the new check-in.
8. State in one line where work resumed and what was re-run.

What resume must not do: search the codebase for context, re-read files that the working set did not name, re-run the suite to find out what is failing, reconstruct a decision already recorded in the note, or ask the user what was being worked on. If the note cannot support that, the note was written wrong, and that is a pause failure to report, not a reason to start investigating.

If the note lists items under "Waiting on the user", ask those first, before step 5.

## Defaults while unattended

Choose a default yourself only if the user has said to continue autonomously. Record each default you chose, and name them in the summary so they can be reversed.

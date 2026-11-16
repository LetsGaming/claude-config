# restart-resume

`node ~/.claude/tools/restart-resume.mjs <status|reboot|resume|cancel>` (header of the script lists all options).

- `status`: sessions with transcript activity in the last 60 minutes (observer and helper sessions are skipped).
- `reboot [--delay 90] [--idle N] [--force] [--no-remote] [--prompt "text"]`: saves the session list, creates a one-shot logon task `ClaudeResumeOnce`, runs `shutdown /r`. Refuses while `javaw.exe` runs unless `--force`. `cancel` aborts it.
- After logon the task runs `resume`: removes itself, waits 45 s, waits until api.anthropic.com answers (max 5 min), then opens one PowerShell window per session (8 s apart) running `claude --resume <id> --remote-control <folder name> "<continue prompt>"`. The prompt is sent only to sessions that were active in the last 10 minutes.
- Windows needs automatic sign-in for this to work without you at the PC (the task runs at logon, not at boot).
- Not tested end to end (no real reboot was done). Dry runs `reboot --dry-run` and `resume --dry-run` work. Unknown: whether a resumed session stops at a prompt (trust folder, picker) that needs a key press.

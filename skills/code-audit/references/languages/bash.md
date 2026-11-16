# Bash / Shell: Audit Reference

Shell scripts are a security minefield: unquoted variables, `eval`, and `curl | bash` turn small
mistakes into command execution or catastrophic file operations. And shell hides in more places
than `.sh` files: audit it wherever it lives.

## Where shell lives (don't just look at *.sh)
- `*.sh`, `*.bash`, `*.zsh`, `*.ksh`.
- **Extensionless scripts** with a `#!/bin/sh`/`#!/bin/bash` shebang (very common for entrypoints,
  hooks, wrappers). The inventory and scanner detect these by shebang: but when reviewing
  manually, remember they exist.
- **`RUN`/`ENTRYPOINT`/`CMD` lines in Dockerfiles**: these are shell.
- **`run:` steps in CI** (GitHub Actions, GitLab CI), these are shell, often handling secrets.
- **Makefile recipes**, `git` hooks (`.git/hooks`, `hooks/`), cron entries, systemd `ExecStart`.

## Tools
```bash
shellcheck -f json -S info <files...>   # the standard shell linter: quoting, word-splitting, unsafe rm
shfmt -d <files...>                      # formatting/consistency diff (if installed)
```
The scanner runs `shellcheck` automatically when shell scripts are present (installing it via apt
where it has permission). **Important:** shellcheck is strong on *correctness/robustness* (SC2086
quoting, SC2115 unsafe `rm`, unset-variable use) but does **not** flag the security patterns below
as such: `eval`, `curl | bash`, and hardcoded secrets need the manual review in this reference.

## Security patterns (review manually: shellcheck won't rank these)
- **Command injection / arbitrary execution:** `eval "$user_input"`; a variable used as a command
  (`$cmd "$@"` where `cmd` comes from input); `bash -c "$var"`; `$(...)`/backticks built from
  untrusted data. Treat any `eval` as a finding until proven safe.
- **`curl | bash` / `wget -O- | sh`:** piping remote content straight into a shell, supply-chain
  and MITM risk (no integrity check, runs whatever the server returns). Flag in scripts, README
  install steps, Dockerfiles, and CI. Fix: download, verify a checksum/signature, then run.
- **Unquoted variable expansion:** `rm -rf $DIR/`, `cp $SRC $DST`, `for f in $(ls)`, word
  splitting and globbing. If `$DIR` is empty or unset, `rm -rf $DIR/` becomes `rm -rf /`. Always
  quote (`"$DIR"`) and guard (`${DIR:?err}`). This is the highest-frequency shell bug *and* a real
  security/data-loss risk.
- **Argument injection via filenames:** filenames beginning with `-` interpreted as options; user
  input passed to a command without a `--` terminator. Fix: `cmd -- "$file"`.
- **Insecure temp files:** predictable names like `/tmp/foo.$$` or `/tmp/$USER` (symlink/race
  attacks). Fix: `mktemp`/`mktemp -d`.
- **PATH / IFS manipulation:** relying on `PATH` for sensitive commands (PATH injection); use
  absolute paths (`/usr/bin/…`) in privileged scripts. Untrusted `IFS` changes alter parsing.
- **Secrets:** hardcoded passwords/tokens/keys; **passwords passed on the command line** (visible
  in `ps`/`/proc` to any user): e.g. `mysql -p"$PASS"`, `curl -u user:pass`; secrets echoed to
  logs; `set -x` left on around secret handling (traces secrets into output/CI logs). Fix: read
  secrets from env/files, avoid CLI args for secrets, keep `set -x` away from secret code.
- **Privilege:** scripts run as root doing unsafe things with user-influenced paths; world-writable
  scripts executed by root; `sudo` with user-controlled arguments.
- **TOCTOU / unsafe file handling:** check-then-use races on files; parsing `ls` output; not
  handling spaces/newlines in filenames (use `find … -print0 | xargs -0`, `while IFS= read -r`).
- **SSRF-ish:** `curl`/`wget` to user-supplied URLs on a server.

## Robustness bugs (shellcheck catches many; confirm impact)
- **Missing `set -euo pipefail`**: without it, a failing command is ignored, an unset variable
  expands to empty (dangerous with `rm`), and a failure mid-pipe is masked. Note the caveats too:
  `set -e` doesn't trigger inside some conditionals/functions, so it's not a complete safety net.
- **Unchecked `cd`**: `cd "$dir"` that fails then runs destructive commands in the wrong directory.
  Use `cd "$dir" || exit 1`.
- **`[ ]` vs `[[ ]]`**, string vs numeric comparison (`-eq` for numbers, `=` for strings),
  unquoted test operands.
- **Bashisms in `#!/bin/sh`** scripts (arrays, `[[ ]]`, `${x^^}`) that break under dash/POSIX sh.
- **Pipefail-hidden failures**; ignoring exit codes; `local` var masking a command's return.

## "Dependency" notes for shell
Shell scripts depend on external binaries being present (curl, jq, aws, python, docker, etc.).
Note: unpinned tool installs (`curl | bash` of *another* tool), assumptions that a binary exists
without a check, and version-sensitive flags. There's no lockfile: call out these implicit
runtime dependencies where they affect reliability or security.

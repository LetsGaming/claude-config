# Gotchas learned the hard way

Concrete detail behind the rules in SKILL.md, from a real implementation (Fastify server + Vite/Vue
client monorepo, Windows + POSIX both in play). Read this before writing the scripts, not after
hitting the same bugs.

## Spawning child processes

- **On Windows, `spawn("pnpm", ...)` (or any PATHEXT-resolved shim like a `.CMD`/`.BAT`) fails with
  `ENOENT` unless you pass `shell: true`.** Node's `spawn()` stopped auto-resolving PATHEXT shims
  without `shell: true` as a security hardening change, `pnpm`, `npm`, `tsx.CMD`, etc. all hit this
  even though they work fine from a real shell. Pass `shell: process.platform === "win32"` (no-op
  elsewhere). This does **not** reopen shell-injection risk as long as you still pass args as an
  array to `spawn()` rather than interpolating them into a command string: `shell: true` only
  changes how the *executable* is resolved, not how args are parsed, when args stay an array.
- **`pnpm exec <bin>` (or npm/yarn equivalents) only looks at the *current* package's
  `node_modules/.bin`.** If the binary you need (e.g. `tsx`) is a devDependency of a workspace
  *member* but not of the root, running `pnpm exec tsx ...` from the repo root fails with "Command
  not found" even though the workspace clearly has it. Fix: resolve and invoke the member package's
  own `node_modules/.bin/<name>` binary directly (with the platform's shim extension) instead of
  relying on `exec` to find it.
- **Detach and `unref()` any child meant to outlive the setup script**, and redirect its stdio
  straight to a log file (`fs.openSync(logFile, "a")` passed as the fd) rather than a pipe: a pipe
  would need this process to stay alive to drain it. `{ stdio: ["ignore", fd, fd], detached: true }`
  then `child.unref()`.
- **Don't call `process.exit(0)` right after spawning detached+unref'd children.** On Windows this
  can tear down libuv before the child handles finish detaching, producing an assertion crash
  (`Assertion failed: !(handle->flags & UV_HANDLE_CLOSING) ...`) right after your own "ready" log
  line. Once every child is detached+unref'd, the event loop has nothing left keeping the setup
  script alive: just let `main()` return naturally and Node exits on its own.

## Health-check polling

Poll the actual health endpoint rather than guessing a startup delay:

```js
async function waitForHttp(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return true;
    } catch {
      // not listening yet: keep polling
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}
```

Fail loudly (print the log file path and exit non-zero) if the deadline is hit: a silently-hanging
dev-up.mjs that "seems stuck" is much worse to debug than one that tells you which log to check.

## Port allocation

```js
function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
  });
}
```

There's a small window between closing the probe socket and the real server binding the same
port where another process could theoretically grab it: acceptable for local dev tooling, not
worth solving further.

## Session-state file

Write exactly what `dev-down.mjs` needs to find and kill later, as JSON, into the session's own
scoped data dir:

```json
{
  "id": "rank-decay-bug",
  "backendPort": 54231,
  "vitePort": 54232,
  "backendPid": 18420,
  "vitePid": 18433,
  "dataDir": "...",
  "logDir": "...",
  "startedAt": "2026-09-24T18:04:11.000Z"
}
```

`dev-down.mjs` reads this file, kills each recorded PID individually (never a name/pattern match,
see SKILL.md rule 3), and only then deletes the session's data/log dirs. If the file doesn't exist,
say so and exit cleanly rather than erroring: it means either this id was never started, or a
previous `dev-down.mjs` already cleaned it up.

## Auto-login / straight-to-content convenience (optional, but worth it)

If the client has any auth gate, a session doing manual verification almost never wants to start at
a login screen against a database you just seeded with a known dev owner. Log in via the API right
after the backend comes up, and pass the resulting token to the client via a one-time URL param that
the client reads once on boot, stores through its normal auth-token mechanism, then strips from the
URL (so refreshing doesn't replay a stale token). Gate this behind a `--loggedout` flag for the rare
case a session specifically wants to exercise the login flow itself.

## Cross-platform kill

```js
function killPid(pid, label, log) {
  if (!pid) return;
  try {
    if (process.platform === "win32") {
      execFileSync("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      process.kill(pid, "SIGTERM");
    }
    log(`stopped ${label} (pid ${pid})`);
  } catch {
    log(`${label} (pid ${pid}) was already stopped`);
  }
}
```

`/T` on Windows kills the process tree (needed because `pnpm`/`tsx watch` etc. spawn their own
children): without it you can kill the launcher and leave its child dev server running, orphaned
and still holding the port.

## Seed-cache content hashing (only if you built the optional cache)

Hash sorted `(relative-path, file-content)` pairs across whole directories (schema, seed script,
services it drives, static catalog data) with `sha256`, truncated for a short filename-safe key:

```js
export function computeSeedHash(repoRoot) {
  const files = HASHED_PATHS.flatMap((rel) => collectFiles(path.join(repoRoot, rel)))
    .map((abs) => path.relative(repoRoot, abs))
    .sort();
  const hash = createHash("sha256");
  for (const relPath of files) {
    hash.update(relPath.split(path.sep).join("/"));
    hash.update("\0");
    hash.update(fs.readFileSync(path.join(repoRoot, relPath)));
  }
  return hash.digest("hex").slice(0, 20);
}
```

Publish via write-to-temp-then-`renameSync` so two sessions racing to publish the same hash at once
can't corrupt the cache file: both are publishing identical bytes for that hash, so whichever
rename lands last simply overwrites the other harmlessly. Prune to the last N entries by mtime after
every write.

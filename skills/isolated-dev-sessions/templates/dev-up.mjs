#!/usr/bin/env node
/**
 * TEMPLATE: copy into scripts/dev-up.mjs and fill in the TODOs for your project's stack.
 *
 * Run this BEFORE doing any manual/dashboard work. Starts an isolated backend + client pair: own
 * database/data dir, own log dir, own free ports: then (optionally) seeds it with mock data, and
 * prints the URLs to use.
 *
 * `--id <name>` (default: "default") namespaces everything, data/agent-<id>/, logs/agent-<id>/,
 * so multiple agents/sessions in the same checkout never collide on the same database or port.
 * Always pair with dev-down.mjs --id <name> when done.
 *
 * Usage: node scripts/dev-up.mjs [--id <name>] [--verbose] [--fresh] [--loggedout]
 */
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "./lib/parseArgs.mjs";
// TODO: only if you built the optional seed-data cache (see seedCache.mjs template + SKILL.md)
// import { computeSeedHash, readSeedCache } from "./lib/seedCache.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

// TODO: fill in for your project.
const CONFIG = {
  // Command + args + cwd to start the backend. Args are an argv array, never a shell string.
  backend: {
    command: "pnpm", // TODO
    args: ["exec", "tsx", "watch", "src/index.ts"], // TODO
    cwd: path.join(repoRoot, "packages", "server"), // TODO
    healthPath: "/api/health", // TODO, must return <500 once ready
    portEnvVar: "PORT", // TODO, env var name the backend reads its port from
  },
  // Command + args + cwd to start the client dev server. Set to null if there's no separate client.
  client: {
    command: "pnpm", // TODO
    args: ["exec", "vite", "--strictPort"], // TODO
    cwd: path.join(repoRoot, "packages", "client"), // TODO
    portFlag: "--port", // TODO, how to pass the picked port; adjust spawn args below if different
    portEnvVar: "BACKEND_PORT", // TODO, env var the client needs to reach the backend, if any
  },
  // Env var name the backend reads its scoped SQLite/db file path from.
  dbPathEnvVar: "DB_PATH", // TODO
  // Optional: a shared, NOT session-scoped dir for slow-to-fetch but content-identical assets
  // (e.g. downloaded fixture images). Set to null if the project has nothing like this.
  sharedAssetsDir: null, // TODO, e.g. path.join(repoRoot, "data", "images")
  // Optional: auto-login owner/dev credentials, used only if CONFIG.autoLogin.enabled.
  autoLogin: {
    enabled: false, // TODO, flip on once you have a seeded dev user + login endpoint
    loginPath: "/api/auth/login", // TODO
    username: "dev-owner", // TODO
    password: "change-me", // TODO, pull from a shared lib, never hardcode a real secret here
    // How the client expects to receive the token: adjust the URL construction below to match.
  },
};

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

async function waitForHttp(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return true;
    } catch {
      // Not listening yet: keep polling.
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return false;
}

/** Detached + unref'd so the child outlives this script's own process, with output going straight
 *  to a log file instead of a pipe this process would otherwise need to stay alive to drain. */
function spawnBackground(command, args, { cwd, env, logFile }) {
  const fd = fs.openSync(logFile, "a");
  const child = spawn(command, args, {
    cwd,
    env,
    stdio: ["ignore", fd, fd],
    detached: true,
    // Windows-only: package-manager binaries resolve to a shim (.CMD/.BAT) there, and Node's
    // spawn() no longer auto-resolves PATHEXT shims without shell:true. No-op elsewhere. Args stay
    // an array (never interpolated into a shell string), so this doesn't reopen injection risk.
    shell: process.platform === "win32",
  });
  child.unref();
  return child;
}

async function main() {
  const { id, verbose, fresh, loggedout } = parseArgs(process.argv.slice(2));
  const log = (msg) => console.log(`[dev-up:${id}] ${msg}`);

  const dataDir = path.join(repoRoot, "data", `agent-${id}`);
  const logDir = path.join(repoRoot, "logs", `agent-${id}`);
  const sessionFile = path.join(dataDir, "dev-session.json");

  // Defensive: a previous run under this id may have crashed before dev-down.mjs ran.
  fs.rmSync(dataDir, { recursive: true, force: true });
  fs.rmSync(logDir, { recursive: true, force: true });
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(logDir, { recursive: true });

  const backendPort = await getFreePort();
  const clientPort = CONFIG.client ? await getFreePort() : null;
  const dbPath = path.join(dataDir, "db.sqlite"); // TODO: match your project's db file name

  const env = {
    ...process.env,
    [CONFIG.backend.portEnvVar]: String(backendPort),
    [CONFIG.dbPathEnvVar]: dbPath,
  };
  if (CONFIG.sharedAssetsDir) env.ASSETS_DIR = CONFIG.sharedAssetsDir; // TODO: match your env var
  if (verbose) env.LOG_VERBOSE = "1"; // TODO: match your project's verbose-logging flag, if any

  // TODO: only if you built the optional seed-data cache.
  // const seedHash = computeSeedHash(repoRoot);
  // const cacheHit = !fresh && readSeedCache(repoRoot, seedHash, dbPath);

  log(`starting backend on :${backendPort} (db: ${dbPath})`);
  const backendLog = path.join(logDir, "backend.out.log");
  const backend = spawnBackground(CONFIG.backend.command, CONFIG.backend.args, {
    cwd: CONFIG.backend.cwd,
    env,
    logFile: backendLog,
  });

  const backendReady = await waitForHttp(`http://localhost:${backendPort}${CONFIG.backend.healthPath}`, 20000);
  if (!backendReady) {
    log(`backend did not respond within 20s: check ${backendLog}`);
    process.exit(1);
  }
  log("backend ready");

  // TODO: run migrations + seed pipeline here if the backend doesn't already do it on startup.
  // e.g. await runSeedScript(env): see SKILL.md's "Adding a seed-data cache" section for the
  // cache-hit/miss branch if this project has one.

  let devToken = null;
  if (CONFIG.autoLogin.enabled && !loggedout) {
    const res = await fetch(`http://localhost:${backendPort}${CONFIG.autoLogin.loginPath}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: CONFIG.autoLogin.username, password: CONFIG.autoLogin.password }),
    });
    if (res.ok) {
      devToken = (await res.json()).token; // TODO: match your login response shape
    } else {
      log(`auto-login failed (${res.status}): printing a plain URL instead; check ${backendLog}`);
    }
  }

  let client = null;
  if (CONFIG.client) {
    log(`starting client on :${clientPort}`);
    const clientLog = path.join(logDir, "client.out.log");
    client = spawnBackground(
      CONFIG.client.command,
      [...CONFIG.client.args, CONFIG.client.portFlag, String(clientPort)],
      {
        cwd: CONFIG.client.cwd,
        env: CONFIG.client.portEnvVar ? { ...env, [CONFIG.client.portEnvVar]: String(backendPort) } : env,
        logFile: clientLog,
      },
    );
    const clientReady = await waitForHttp(`http://localhost:${clientPort}/`, 20000);
    if (!clientReady) log(`client did not respond within 20s: check ${clientLog}`);
  }

  fs.writeFileSync(
    sessionFile,
    JSON.stringify(
      {
        id,
        backendPort,
        clientPort,
        backendPid: backend.pid,
        clientPid: client?.pid ?? null,
        dataDir,
        logDir,
        startedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );

  const clientUrl = clientPort
    ? devToken
      ? `http://localhost:${clientPort}/?devToken=${devToken}` // TODO: match how your client reads the token
      : `http://localhost:${clientPort}`
    : null;

  console.log("");
  log("ready.");
  if (clientUrl) console.log(`  Client:   ${clientUrl}`);
  console.log(`  Backend:  http://localhost:${backendPort}`);
  if (CONFIG.autoLogin.enabled) {
    console.log(`  Auth:     ${CONFIG.autoLogin.username} / ${CONFIG.autoLogin.password}${devToken ? " (already logged in via the client URL above)" : ""}`);
  }
  console.log(`  Logs:     ${logDir}`);
  console.log(`  When done: node scripts/dev-down.mjs --id ${id}`);
  // Deliberately no process.exit(0): both children are detached+unref'd, so the event loop drains
  // naturally once main() returns. A forced exit right after spawning detached children can crash
  // libuv on Windows before the handles finish detaching.
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

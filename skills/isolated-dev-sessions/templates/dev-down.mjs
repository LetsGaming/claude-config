#!/usr/bin/env node
/**
 * TEMPLATE: copy into scripts/dev-down.mjs (usually needs no edits; it's generic over whatever
 * dev-up.mjs recorded in dev-session.json).
 *
 * Run this AFTER finishing manual/dashboard work started with dev-up.mjs. Stops exactly the
 * backend + client processes that dev-up.mjs started for this --id (never a broad process-name
 * kill: only the recorded PIDs), then deletes that id's data/log dirs.
 *
 * Never touches any shared/not-session-scoped dir dev-up.mjs may use (see its CONFIG.sharedAssetsDir).
 *
 * Usage: node scripts/dev-down.mjs [--id <name>]
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "./lib/parseArgs.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

/** Kills exactly this one PID (and, on Windows, its process tree): never a pattern/name-based
 *  kill, so it can't touch an unrelated process that happens to share a port or process name. */
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

function main() {
  const { id } = parseArgs(process.argv.slice(2));
  const log = (msg) => console.log(`[dev-down:${id}] ${msg}`);

  const dataDir = path.join(repoRoot, "data", `agent-${id}`);
  const logDir = path.join(repoRoot, "logs", `agent-${id}`);
  const sessionFile = path.join(dataDir, "dev-session.json");

  if (fs.existsSync(sessionFile)) {
    const session = JSON.parse(fs.readFileSync(sessionFile, "utf8"));
    killPid(session.backendPid, "backend", log);
    killPid(session.clientPid, "client", log);
  } else {
    log("no dev-session.json found: nothing to stop (already clean, or dev-up.mjs was never run with this id).");
  }

  fs.rmSync(dataDir, { recursive: true, force: true });
  fs.rmSync(logDir, { recursive: true, force: true });
  log(`removed ${dataDir}`);
  log(`removed ${logDir}`);
  log("clean state.");
}

main();

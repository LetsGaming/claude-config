#!/usr/bin/env node
// Temporary hook for verification. Appends the raw stdin payload of any event
// to .claude/hook-log.jsonl so you can confirm what fires and what it carries.
// Remove it from settings once the two real hooks are confirmed.
import { readFileSync, appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

let raw = "";
try {
  raw = readFileSync(0, "utf8");
} catch {
  raw = "";
}

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
try {
  mkdirSync(join(root, ".claude"), { recursive: true });
  appendFileSync(
    join(root, ".claude", "hook-log.jsonl"),
    JSON.stringify({ at: new Date().toISOString(), raw: raw.slice(0, 20000) }) + "\n",
    "utf8"
  );
} catch {
  /* logging must never break a session */
}
process.exit(0);

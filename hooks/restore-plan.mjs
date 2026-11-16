#!/usr/bin/env node
// SessionStart hook, matcher compact.
// Re-anchors the session on the active plan, because compaction summarises it away.
import { readFileSync, existsSync, realpathSync } from "node:fs";
import { join, resolve, relative, isAbsolute } from "node:path";

const MAX_INLINE = 7000; // The injection limit is 10000 characters.

function readStdin() {
  try {
    return JSON.parse(readFileSync(0, "utf8"));
  } catch {
    return null;
  }
}

function projectRoot(payload) {
  return process.env.CLAUDE_PROJECT_DIR || payload?.cwd || process.cwd();
}

// Step headings carry the shape of the plan when the body is too long to inline.
function outline(plan) {
  return plan
    .split("\n")
    .filter((l) => /^\s{0,3}#{2,4}\s/.test(l) || /^\s*(\d+\.|[-*])\s+\*\*/.test(l))
    .map((l) => l.trimEnd())
    .join("\n");
}

function main() {
  const payload = readStdin();
  const root = projectRoot(payload);
  const pointer = join(root, ".claude", "active-plan");
  if (!existsSync(pointer)) process.exit(0);

  let rel, plan;
  try {
    rel = readFileSync(pointer, "utf8").trim();
    if (!rel) process.exit(0);
    const plansDir = realpathSync(resolve(root, "docs", "plans"));
    const target = realpathSync(resolve(root, rel));
    const inside = relative(plansDir, target);
    if (!inside || inside.startsWith("..") || isAbsolute(inside) || !target.endsWith(".md")) process.exit(0);
    plan = readFileSync(target, "utf8");
  } catch {
    process.exit(0); // A missing or moved plan file is not worth an error.
  }

  const body = plan
    .replace(/^---[\s\S]*?---\n/, "")
    .replace(/<!--[\s\S]*?-->\n?/g, "")
    .trim();
  const lines = [
    "## Active plan after compaction",
    "",
    `The approved plan for this work is \`${rel}\`. The summary above lost its detail. Read that file and the task list before acting on the next message, and do not reconstruct the plan from context.`,
    "",
  ];

  if (body.length <= MAX_INLINE) {
    lines.push(body);
  } else {
    const sketch = outline(body);
    lines.push("Step outline only. Read the file for the detail.", "", sketch.slice(0, MAX_INLINE));
  }

  process.stdout.write(lines.join("\n") + "\n");
}

main();

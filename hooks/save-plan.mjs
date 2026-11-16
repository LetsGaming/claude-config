#!/usr/bin/env node
// PostToolUse hook, matcher ExitPlanMode.
// Persists the approved plan to docs/plans/ so it survives compaction.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const MAX_SLUG = 50;

function readStdin() {
  try {
    return JSON.parse(readFileSync(0, "utf8"));
  } catch {
    return null;
  }
}

function planText(payload) {
  const direct = payload?.tool_response?.plan ?? payload?.tool_input?.plan;
  if (typeof direct === "string" && direct.trim()) return direct;
  const path = payload?.tool_response?.filePath ?? payload?.tool_input?.planFilePath;
  if (typeof path === "string" && existsSync(path)) {
    try {
      return readFileSync(path, "utf8");
    } catch {
      return null;
    }
  }
  return null;
}

function slugify(plan) {
  const heading = plan
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith("```"));
  const base = (heading ?? "plan")
    .replace(/^#+\s*/, "")
    .replace(/[*_`\[\]()]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG)
    .replace(/-+$/, "");
  return base || "plan";
}

function projectRoot(payload) {
  return process.env.CLAUDE_PROJECT_DIR || payload?.cwd || process.cwd();
}

// Same plan approved twice keeps one file. A changed plan gets its own.
function targetPath(dir, stem, body) {
  for (let n = 1; n < 100; n++) {
    const name = n === 1 ? `${stem}.md` : `${stem}-${n}.md`;
    const full = join(dir, name);
    if (!existsSync(full)) return full;
    try {
      if (readFileSync(full, "utf8").includes(body.trim())) return full;
    } catch {
      /* unreadable, try the next name */
    }
  }
  return join(dir, `${stem}-${Date.now()}.md`);
}

function main() {
  const payload = readStdin();
  const plan = planText(payload);
  if (!plan) process.exit(0);

  const root = projectRoot(payload);
  const plansDir = join(root, "docs", "plans");
  const date = new Date().toISOString().slice(0, 10);
  const stem = `${date}-${slugify(plan)}`;

  let file;
  try {
    mkdirSync(plansDir, { recursive: true });
    file = targetPath(plansDir, stem, plan);
    if (!existsSync(file)) {
      const header = [
        "---",
        `approved: ${new Date().toISOString()}`,
        `session: ${payload?.session_id ?? "unknown"}`,
        "status: active",
        "---",
        "",
        "<!-- Written by the save-plan hook. Record deviations below the plan. -->",
        "",
      ].join("\n");
      writeFileSync(file, header + plan.trimEnd() + "\n", "utf8");
    }

    const pointerDir = join(root, ".claude");
    mkdirSync(pointerDir, { recursive: true });
    writeFileSync(join(pointerDir, "active-plan"), relative(root, file) + "\n", "utf8");
  } catch (err) {
    process.stderr.write(`save-plan: ${err.message}\n`);
    process.exit(1); // Non-blocking. The tool has already run.
  }

  const rel = relative(root, file);
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: `Approved plan saved to ${rel}. Work from that file, not from this conversation. Record deviations in it with the reason. Mirror its steps into the task list.`,
      },
    })
  );
}

main();

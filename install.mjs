#!/usr/bin/env node
// Applies the shared base files to the local setup and restores what git cannot carry.
// settings.json and CLAUDE.md stay local: the base is merged in, never overwritten.
// Usage: node install.mjs [--dry-run] [--adopt-base]
import { copyFileSync, lstatSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { changedPaths, mergeSettings } from './lib/merge.mjs';

const dryRun = process.argv.includes('--dry-run');
const adoptBase = process.argv.includes('--adopt-base');
const root = dirname(fileURLToPath(import.meta.url));
const expected = join(homedir(), '.claude');

if (resolve(root) !== resolve(expected)) {
  console.error(`This repo must live at ${expected}. Found ${root}.`);
  process.exit(1);
}

const present = (path) => {
  try {
    lstatSync(path);
    return true;
  } catch {
    return false;
  }
};

const readJson = (path) => (present(path) ? JSON.parse(readFileSync(path, 'utf8')) : undefined);

console.log('Settings (settings.base.json into settings.json)');
const base = readJson(join(root, 'settings.base.json'));
const statePath = join(root, '.install-state.json');
const settingsPath = join(root, 'settings.json');
const current = readJson(settingsPath);
const previous = readJson(statePath)?.settings;
const merged = mergeSettings(base, previous, current);
const changes = changedPaths(current, merged);
const needsAdoption = current !== undefined && previous === undefined && changes.length > 0 && !adoptBase;
if (changes.length === 0) {
  console.log('  keep  settings.json');
} else if (needsAdoption) {
  console.log('  No install state found, so settings.json is left alone. The base would add:');
  for (const path of changes) console.log(`    ${path}`);
  console.log('  Review the list. Run node install.mjs --adopt-base to add it.');
} else {
  console.log(`  ${current ? 'merge' : 'add  '} settings.json`);
  for (const path of changes) console.log(`    ${path}`);
  if (!dryRun) {
    if (current) copyFileSync(settingsPath, `${settingsPath}.bak`);
    writeFileSync(settingsPath, `${JSON.stringify(merged, null, 2)}\n`);
  }
}
if (!dryRun && !needsAdoption) writeFileSync(statePath, `${JSON.stringify({ settings: base }, null, 2)}\n`);

console.log('Instructions (CLAUDE.md)');
const importLine = '@shared/base.md';
const legacyImportLine = '@rules/base.md';
const claudeMdPath = join(root, 'CLAUDE.md');
const claudeMd = present(claudeMdPath) ? readFileSync(claudeMdPath, 'utf8') : undefined;
const lines = claudeMd?.split(/\r?\n/) ?? [];
if (lines.includes(importLine)) {
  console.log(`  keep  ${importLine}`);
} else if (lines.includes(legacyImportLine)) {
  console.log(`  swap  ${legacyImportLine} -> ${importLine}`);
  if (!dryRun) writeFileSync(claudeMdPath, lines.map((line) => (line === legacyImportLine ? importLine : line)).join('\n'));
} else {
  console.log(`  add   ${importLine}`);
  if (!dryRun) writeFileSync(claudeMdPath, `${importLine}\n${claudeMd === undefined ? '' : `\n${claudeMd}`}`);
}

console.log('Skills (skills.json, skills.local.json)');
const manifest = [...readJson(join(root, 'skills.json')), ...(readJson(join(root, 'skills.local.json')) ?? [])];
for (const { repo, skills } of manifest) {
  const missing = skills.filter((name) => !present(join(root, 'skills', name)));
  for (const name of skills) {
    if (!missing.includes(name)) console.log(`  keep  ${name}`);
  }
  if (missing.length === 0) continue;
  console.log(`  add   ${missing.join(', ')} (${repo})`);
  if (dryRun) continue;
  const added = spawnSync('npx', ['--yes', 'skills', 'add', repo, '--skill', ...missing, '--global', '--agent', 'claude-code', '--yes'], {
    stdio: 'inherit',
    shell: platform() === 'win32',
  });
  if (added.status !== 0) console.error(`  FAILED ${repo}`);
}

console.log('MCP servers (user scope)');
const servers = JSON.parse(readFileSync(join(root, 'mcp-servers.json'), 'utf8'));
for (const [name, { platforms, ...config }] of Object.entries(servers)) {
  if (platforms && !platforms.includes(platform())) {
    console.log(`  skip  ${name} (${platforms.join(', ')} only)`);
    continue;
  }
  const exists = spawnSync('claude', ['mcp', 'get', name], { stdio: 'ignore' });
  if (exists.error) {
    console.error('  The claude command is not on PATH. Install Claude Code, then run this again.');
    process.exit(1);
  }
  if (exists.status === 0) {
    console.log(`  keep  ${name}`);
    continue;
  }
  console.log(`  add   ${name}`);
  if (dryRun) continue;
  const added = spawnSync('claude', ['mcp', 'add-json', name, JSON.stringify(config), '--scope', 'user'], {
    stdio: 'inherit',
  });
  if (added.status !== 0) console.error(`  FAILED ${name}`);
}

console.log(`
Manual steps left:
  1. Run claude and log in with /login.
  2. Plugins install on first launch from settings.json. Wait for it to finish.
  3. Set git identity: git config --global user.name and user.email.`);

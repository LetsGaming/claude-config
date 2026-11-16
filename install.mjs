#!/usr/bin/env node
// Restores the parts of the Claude Code setup that git cannot carry.
// Usage: node install.mjs [--dry-run]
import { cpSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const dryRun = process.argv.includes('--dry-run');
const root = dirname(fileURLToPath(import.meta.url));
const expected = join(homedir(), '.claude');

if (resolve(root) !== resolve(expected)) {
  console.error(`This repo must live at ${expected}. Found ${root}.`);
  process.exit(1);
}

console.log('Skills');
const vendored = join(root, 'vendored-skills');
for (const name of readdirSync(vendored)) {
  const target = join(root, 'skills', name);
  if (existsSync(target)) {
    console.log(`  keep  ${name}`);
    continue;
  }
  console.log(`  copy  ${name}`);
  if (!dryRun) cpSync(join(vendored, name), target, { recursive: true });
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

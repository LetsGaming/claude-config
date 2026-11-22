#!/usr/bin/env node
// Shows how this repo differs from the live setup, and checks it before a commit.
// Usage: node tools/maintain.mjs [status|check|sync] [--fetch] [--dry-run]
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { compareFiles, leakScan, liveOnly, loadConfig, manifestDrift, manifestNames, readJson, repoFiles, repoState, settingsDrift, syncFiles } from '../lib/maintain.mjs';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const live = process.env.CLAUDE_HOME || join(homedir(), '.claude');
const [command = 'status'] = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const fetch = process.argv.includes('--fetch');
const dryRun = process.argv.includes('--dry-run');
const username = homedir().split(/[\\/]/).pop();

const say = (text = '') => console.log(text);
const list = (rows, note = '') => rows.forEach((row) => say(`  ${row}${note}`));
const git = (...args) => spawnSync('git', ['-C', repo, ...args], { encoding: 'utf8' }).stdout.trim();

const config = loadConfig(repo);
const files = repoFiles(repo);

function status() {
  const state = repoState(repo, { fetch });
  say(`repo  ${repo}`);
  say(`live  ${live}`);
  say(`git   branch ${state.branch}, ${state.changed} changed file(s), ${state.ahead ?? '?'} ahead, ${state.behind ?? '?'} behind${fetch ? '' : ' (add --fetch to refresh)'}`);

  const plugins = readJson(join(repo, 'plugins.json'), []);
  const skills = readJson(join(repo, 'skills.json'), []);
  const names = manifestNames({ plugins, skills });

  const rows = compareFiles({ repo, live, files, config });
  const by = (status) => rows.filter((row) => row.status === status);
  say();
  say(`Files: ${by('same').length} same, ${by('sanitized').length} sanitized on purpose, ${by('repo-only').length} repo only, ${by('changed').length} changed in live, ${by('missing-live').length} not in live`);
  if (by('changed').length) {
    say('Changed in live. Copy the change into the repo if it holds no private data:');
    list(by('changed').map((row) => row.file));
  }
  if (by('missing-live').length) {
    say('In the repo, not in live:');
    list(by('missing-live').map((row) => row.file));
  }
  const extra = liveOnly({ live, files, config, skillNames: names.skillNames });
  if (extra.length) {
    say('In live, not in the repo:');
    list(extra);
    say('  To share a skill: remove private data, copy the folder to skills/<name>, add !/skills/<name> to .gitignore, run check.');
    say('  To leave one out for good: add it to ignoreLive in maintain.local.json.');
  }

  const base = readJson(join(repo, 'settings.base.json'), {});
  const settings = readJson(join(live, 'settings.json'), {});
  const drift = settingsDrift({ base, live: settings, config, pluginNames: names.pluginNames, skillNames: names.skillNames });
  say();
  say('Settings (settings.base.json against settings.json):');
  const none = !drift.differs.length && !drift.hooksLiveOnly.length && !drift.hooksBaseOnly.length && !drift.overridesLiveOnly.length;
  if (none) say('  in sync');
  list(drift.differs, '  differs in live');
  list(drift.hooksLiveOnly, '  (hook only in live)');
  list(drift.hooksBaseOnly, '  (hook only in the base)');
  list(drift.overridesLiveOnly, '  (skill override only in live)');

  const lock = readJson(join(homedir(), '.agents', '.skill-lock.json'), { skills: {} });
  const user = readJson(join(homedir(), '.claude.json'), {});
  const enabled = Object.entries(settings.enabledPlugins ?? {}).filter(([, on]) => on).map(([id]) => id);
  const more = manifestDrift({
    names,
    enabled,
    lockNames: Object.keys(lock.skills ?? {}),
    mcpManifest: readJson(join(repo, 'mcp-servers.json'), {}),
    registered: Object.keys(user.mcpServers ?? {}),
    config,
  });
  say();
  say('Manifests:');
  const groups = [
    ['pluginsLiveOnly', 'plugins enabled in live, not in plugins.json'],
    ['pluginsNotEnabled', 'plugins in plugins.json, not enabled in live'],
    ['skillsLiveOnly', 'third-party skills installed, not in skills.json'],
    ['skillsMissing', 'skills in skills.json, not installed'],
    ['mcpLiveOnly', 'MCP servers registered, not in mcp-servers.json'],
    ['mcpMissing', 'MCP servers in mcp-servers.json, not registered'],
  ];
  const open = groups.filter(([key]) => more[key].length);
  if (!open.length) say('  in sync');
  for (const [key, title] of open) {
    say(`  ${title}:`);
    list(more[key].map((name) => `  ${name}`));
  }
}

function check() {
  let failed = false;
  const email = git('config', 'user.email');
  const leaks = leakScan({ repo, files, config, username, email });
  say(`Leak scan: ${files.length} files, ${leaks.length} problem(s)`);
  for (const leak of leaks) say(`  ${leak.file}:${leak.line}  ${leak.kind}`);
  if (leaks.length) failed = true;

  const tests = files.filter((file) => /^(?:lib|tools)\/.*\.test\.mjs$/.test(file));
  const run = spawnSync(process.execPath, ['--test', '--no-warnings', ...tests], { cwd: repo, encoding: 'utf8' });
  const counts = Object.fromEntries([...(run.stdout ?? '').matchAll(/^ℹ (tests|pass|fail) (\d+)/gm)].map((match) => [match[1], Number(match[2])]));
  say(`Tests: ${tests.length} file(s), ${counts.pass ?? '?'} passed, ${counts.fail ?? '?'} failed`);
  if (run.status !== 0) {
    failed = true;
    for (const line of (run.stdout ?? '').split('\n').filter((row) => row.startsWith('✖')).slice(0, 10)) say(`  ${line}`);
  }

  const state = repoState(repo, { fetch });
  say(`Git: ${state.changed} changed file(s) to commit, ${state.ahead ?? '?'} ahead of the remote, ${state.behind ?? '?'} behind`);
  say();
  say(failed ? 'Fix the problems above before you commit.' : 'Ready to commit.');
  process.exitCode = failed ? 1 : 0;
}

function sync() {
  const rows = compareFiles({ repo, live, files, config });
  const result = syncFiles({ repo, live, rows, config, username, email: git('config', 'user.email'), dryRun });
  if (!result.changed.length) return say('Nothing to copy. No tracked file changed in live.');
  if (dryRun) {
    say('Would copy from live:');
    return list(result.changed);
  }
  if (!result.kept) {
    say('Nothing was kept. The leak scan found problems in the copied files:');
    for (const leak of result.leaks) say('  ' + leak.file + ':' + leak.line + '  ' + leak.kind);
    say('Remove the private data from the live file, or add the file to sanitized in tools/maintain.config.json.');
    process.exitCode = 1;
    return;
  }
  say('Copied ' + result.changed.length + ' file(s) from live:');
  list(result.changed);
  say('Review with git diff, then run check and commit.');
}

const commands = { status, check, sync };
if (!commands[command]) {
  say(`Unknown command: ${command}. Use status, check or sync.`);
  process.exit(1);
}
commands[command]();

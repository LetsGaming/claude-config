import { chmodSync, existsSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { confirm } from './bootstrap.mjs';

// Config entries inside the claude folder. History, sessions, projects and credentials are not listed.
const setupEntries = [
  'settings.json',
  'settings.local.json',
  'CLAUDE.md',
  '.install-state.json',
  'skills.local.json',
  'plugins.local.json',
  'private',
  'keybindings.json',
  'rules',
  'output-styles',
  'plugins',
  'agents',
  'commands',
  'hooks',
  'skills',
];
const trackedDirs = ['agents', 'commands', 'hooks', 'skills'];
const reinstallable = ['.claude/plugins/cache', '.claude/plugins/marketplaces'];

const run = (command, args, options) => {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  if (result.error) throw new Error(`${command} is not on PATH.`);
  return result;
};

const git = (root, args) => {
  const result = run('git', args, { cwd: root });
  if (result.status !== 0) throw new Error(`git ${args.join(' ')} failed:\n${result.stderr}`);
  return result.stdout;
};

const userMcpServers = (home) => {
  const file = join(home, '.claude.json');
  if (!existsSync(file)) return [];
  return Object.keys(JSON.parse(readFileSync(file, 'utf8')).mcpServers ?? {});
};

const removeUserMcpServer = (name) => {
  const result = run('claude', ['mcp', 'remove', name, '--scope', 'user'], { stdio: 'ignore' });
  if (result.status !== 0) throw new Error(`claude mcp remove ${name} failed.`);
};

// GNU tar (the one Git Bash puts first on PATH) reads the "C:" of a Windows archive path as a remote host and fails with
// "Child returned status 128". --force-local stops that. bsdtar, which Windows ships, has no such flag and rejects it.
const localFlag = () => (/GNU tar/.test(run('tar', ['--version']).stdout ?? '') ? ['--force-local'] : []);

// Archives the user's Claude setup, removes it, and restores the tracked parts from git.
// The install that follows rebuilds the rest. Data (history, sessions, credentials) is never touched.
export const resetSetup = async ({ root, home, dryRun = false, yes = false, log = console.log, removeMcp = removeUserMcpServer }) => {
  const present = setupEntries.filter((name) => existsSync(join(root, name)));
  const servers = userMcpServers(home);
  const hasGlobalJson = existsSync(join(home, '.claude.json'));
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const archive = join(root, 'backups', `overwrite-${stamp}.tar.gz`);
  const dirty = git(root, ['status', '--porcelain', '--', ...trackedDirs]).trim();

  log('  --overwrite will do this:');
  log(`    1. Archive your setup to ${archive}`);
  log(`       Files: ${[...present, ...(hasGlobalJson ? ['../.claude.json'] : [])].join(', ')}`);
  log('       plugins/cache and plugins/marketplaces are left out of the archive (the install downloads them again).');
  log(`    2. Remove them, plus ${servers.length} user-scope MCP server(s): ${servers.join(', ') || 'none'}`);
  log('    3. Restore agents, commands, hooks and skills from the repo, then run the full install:');
  log('       settings, CLAUDE.md, third-party skills, plugins and MCP servers come back exactly as the repo defines them.');
  log('    Your own settings, plugins, skills and servers are NOT kept. Restore them from the archive by hand.');
  log('    Not touched: history, sessions, projects, file history, plans, credentials.');
  if (dirty) log(`    Uncommitted changes in agents, commands, hooks or skills are included in the archive and then lost:\n${dirty.replace(/^/gm, '      ')}`);
  if (dryRun) return;
  if (!yes && !(await confirm('  Type y to archive and remove your setup. [y/N] '))) {
    throw new Error('Stopped. Nothing was changed. Run again with --yes to confirm, or run it in a terminal.');
  }

  mkdirSync(join(root, 'backups'), { recursive: true });
  const entries = [...present.map((name) => `.claude/${name}`), ...(hasGlobalJson ? ['.claude.json'] : [])];
  const local = localFlag();
  const made = run('tar', [...local, '-czf', archive, ...reinstallable.map((path) => `--exclude=${path}`), '-C', home, ...entries]);
  const listed = made.status === 0 ? run('tar', [...local, '-tzf', archive]) : made;
  if (made.status !== 0 || listed.status !== 0 || listed.stdout.trim() === '') {
    throw new Error(`Could not create a valid archive at ${archive}. Nothing was removed.\n${made.stderr ?? ''}`);
  }
  try {
    chmodSync(archive, 0o600);
  } catch {}
  log(`  Archive written and checked: ${archive}`);

  for (const name of servers) {
    removeMcp(name);
    log(`  removed MCP server ${name}`);
  }
  for (const name of present) rmSync(join(root, name), { recursive: true, force: true });
  const restore = trackedDirs.filter((dir) => git(root, ['ls-files', '--', dir]).trim() !== '');
  if (restore.length > 0) git(root, ['checkout', '--', ...restore]);
  log(`  Removed ${present.length} entries and restored ${restore.join(', ')} from the repo.`);
};

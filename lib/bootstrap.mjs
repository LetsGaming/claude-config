import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';

const git = (cwd, args) => {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (result.error) throw new Error('git is not on PATH. Install Git, then run this again.');
  if (result.status !== 0) throw new Error(`git ${args.join(' ')} failed:\n${result.stderr}`);
  return result.stdout;
};

const sameUrl = (a, b) => a.trim().replace(/\.git$/, '') === b.trim().replace(/\.git$/, '');

// Tracked paths that already exist in the target with different content.
export const findConflicts = (root, target) =>
  git(root, ['ls-tree', '-r', '-z', 'HEAD'])
    .split('\0')
    .filter(Boolean)
    .map((entry) => {
      const [meta, path] = entry.split('\t');
      return { hash: meta.split(' ')[2], path };
    })
    .filter(({ hash, path }) => existsSync(join(target, path)) && git(root, ['hash-object', join(target, path)]).trim() !== hash)
    .map(({ path }) => path);

export const confirm = async (question) => {
  if (!process.stdin.isTTY) return false;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(question);
  rl.close();
  return /^y(es)?$/i.test(answer.trim());
};

// Turns the target into a git work tree of this clone's repo.
// Returns 'existing' when the target already is that repo, 'created' after a bootstrap.
export const bootstrap = async ({ root, target, dryRun = false, yes = false, log = console.log }) => {
  if (!existsSync(join(root, '.git'))) {
    throw new Error(`${root} is not a git clone. Clone the repo with git, then run install.mjs from the clone.`);
  }
  let remote;
  try {
    remote = git(root, ['remote', 'get-url', 'origin']).trim();
  } catch {
    throw new Error(`The clone at ${root} has no origin remote. Add one with git remote add origin <url>.`);
  }
  const branch = git(root, ['rev-parse', '--abbrev-ref', 'HEAD']).trim();
  if (branch === 'HEAD') throw new Error(`The clone at ${root} is on a detached HEAD. Check out a branch first.`);

  if (existsSync(join(target, '.git'))) {
    let targetRemote = '';
    try {
      targetRemote = git(target, ['remote', 'get-url', 'origin']);
    } catch {}
    if (!sameUrl(targetRemote, remote)) {
      throw new Error(`${target} is a git repo with origin "${targetRemote.trim()}", not "${remote}". Move it away or fix its remote.`);
    }
    log(`  ${target} is already this repo. Updating it.`);
    if (!dryRun) git(target, ['pull', '--ff-only']);
    return 'existing';
  }

  const conflicts = existsSync(target) ? findConflicts(root, target) : [];
  log(`  ${target} is not a git repo. It will become a work tree of ${remote} (${branch}).`);
  if (conflicts.length > 0) {
    log('  These tracked files exist and differ. They are backed up, then replaced:');
    for (const path of conflicts) log(`    ${path}`);
  }
  if (dryRun) return 'created';
  if (conflicts.length > 0 && !yes && !(await confirm('  Continue? [y/N] '))) {
    throw new Error('Stopped. Run again with --yes to confirm the backup and replace, or run it in a terminal.');
  }

  if (conflicts.length > 0) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = join(target, 'backups', `pre-bootstrap-${stamp}`);
    for (const path of conflicts) {
      mkdirSync(dirname(join(backupDir, path)), { recursive: true });
      cpSync(join(target, path), join(backupDir, path));
    }
    log(`  Backup: ${backupDir}`);
  }

  mkdirSync(target, { recursive: true });
  git(target, ['init', '-b', branch]);
  git(target, ['remote', 'add', 'origin', remote]);
  git(target, ['fetch', root, `+refs/heads/${branch}:refs/remotes/origin/${branch}`]);
  git(target, ['checkout', '-f', '-B', branch, `origin/${branch}`]);
  git(target, ['branch', `--set-upstream-to=origin/${branch}`]);
  return 'created';
};

import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { resetSetup } from './overwrite.mjs';

const run = (cwd, command, ...args) => {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
};

const write = (file, text) => {
  mkdirSync(join(file, '..'), { recursive: true });
  writeFileSync(file, text);
};

describe('resetSetup', () => {
  let home;
  let root;
  let removed;
  const quiet = () => {};
  const removeMcp = (name) => removed.push(name);

  beforeEach(() => {
    process.env.GIT_AUTHOR_NAME = process.env.GIT_COMMITTER_NAME = 'Test';
    process.env.GIT_AUTHOR_EMAIL = process.env.GIT_COMMITTER_EMAIL = 'test@example.com';
    removed = [];
    home = mkdtempSync(join(tmpdir(), 'overwrite-test-'));
    root = join(home, '.claude');
    mkdirSync(root);
    run(root, 'git', 'init', '-q', '-b', 'main');
    write(join(root, 'hooks', 'tracked.txt'), 'repo\n');
    run(root, 'git', 'add', '.');
    run(root, 'git', 'commit', '-q', '-m', 'init');
    write(join(root, 'hooks', 'tracked.txt'), 'edited\n');
    write(join(root, 'hooks', 'extra.txt'), 'mine\n');
    write(join(root, 'skills', 'thirdparty', 'SKILL.md'), 'x');
    write(join(root, 'plugins', 'installed_plugins.json'), '{}');
    write(join(root, 'plugins', 'cache', 'big', 'file'), 'big');
    write(join(root, 'settings.json'), '{"mine":1}');
    write(join(root, 'CLAUDE.md'), 'mine');
    write(join(root, 'history.jsonl'), 'keep');
    write(join(root, 'projects', 'p', 's.jsonl'), 'keep');
    write(join(home, '.claude.json'), JSON.stringify({ mcpServers: { a: {}, b: {} }, other: 1 }));
  });

  afterEach(() => rmSync(home, { recursive: true, force: true }));

  it('archives the setup, removes it, restores tracked files, keeps data', async () => {
    await resetSetup({ root, home, yes: true, log: quiet, removeMcp });
    const [name] = readdirSync(join(root, 'backups'));
    assert.match(name, /^overwrite-.*\.tar\.gz$/);
    const listing = run(root, 'tar', '-tzf', join(root, 'backups', name));
    for (const entry of ['.claude/settings.json', '.claude/skills/thirdparty/SKILL.md', '.claude/plugins/installed_plugins.json', '.claude/hooks/extra.txt', '.claude.json']) {
      assert.ok(listing.includes(entry), entry);
    }
    assert.ok(!listing.includes('plugins/cache'));
    for (const path of ['settings.json', 'CLAUDE.md', 'plugins', 'skills', 'hooks/extra.txt']) assert.equal(existsSync(join(root, path)), false, path);
    assert.equal(readFileSync(join(root, 'hooks', 'tracked.txt'), 'utf8'), 'repo\n');
    assert.equal(readFileSync(join(root, 'history.jsonl'), 'utf8'), 'keep');
    assert.equal(readFileSync(join(root, 'projects', 'p', 's.jsonl'), 'utf8'), 'keep');
    assert.deepEqual(removed, ['a', 'b']);
  });

  it('changes nothing on a dry run', async () => {
    await resetSetup({ root, home, dryRun: true, log: quiet, removeMcp });
    assert.equal(existsSync(join(root, 'settings.json')), true);
    assert.equal(existsSync(join(root, 'backups')), false);
    assert.deepEqual(removed, []);
  });

  it('refuses without confirmation when not interactive', async () => {
    await assert.rejects(resetSetup({ root, home, log: quiet, removeMcp }), /--yes/);
    assert.equal(existsSync(join(root, 'settings.json')), true);
    assert.deepEqual(removed, []);
  });

  it('reports the checked archive', async () => {
    const lines = [];
    await resetSetup({ root, home, yes: true, log: (line) => lines.push(line), removeMcp });
    assert.ok(lines.some((line) => line.includes('Archive written and checked')));
  });
});

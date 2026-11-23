import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { after, before, describe, it } from 'node:test';
import { bootstrap, findConflicts } from './bootstrap.mjs';

// Git for Windows sets core.autocrlf=true system-wide, which checks files out with CRLF. These tests compare exact file
// content, so they turn it off for every git process they or the code under test start.
Object.assign(process.env, { GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'core.autocrlf', GIT_CONFIG_VALUE_0: 'false' });

const run = (cwd, ...args) => {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
};

const write = (file, text) => {
  mkdirSync(join(file, '..'), { recursive: true });
  writeFileSync(file, text);
};

describe('bootstrap', () => {
  let scratch;
  let upstream;
  const quiet = () => {};

  const freshClone = (name) => {
    const clone = join(scratch, name);
    run(scratch, 'clone', '-q', upstream, clone);
    return clone;
  };

  before(() => {
    scratch = mkdtempSync(join(tmpdir(), 'bootstrap-test-'));
    process.env.GIT_AUTHOR_NAME = process.env.GIT_COMMITTER_NAME = 'Test';
    process.env.GIT_AUTHOR_EMAIL = process.env.GIT_COMMITTER_EMAIL = 'test@example.com';
    upstream = join(scratch, 'upstream');
    mkdirSync(upstream);
    run(upstream, 'init', '-q', '-b', 'main');
    write(join(upstream, 'hooks', 'a.txt'), 'upstream\n');
    write(join(upstream, 'same.txt'), 'same\n');
    run(upstream, 'add', '.');
    run(upstream, 'commit', '-q', '-m', 'init');
  });

  after(() => rmSync(scratch, { recursive: true, force: true }));

  it('creates the work tree in an empty target', async () => {
    const root = freshClone('clone-empty');
    const target = join(scratch, 'target-empty');
    assert.equal(await bootstrap({ root, target, log: quiet }), 'created');
    assert.equal(readFileSync(join(target, 'hooks', 'a.txt'), 'utf8'), 'upstream\n');
    assert.equal(run(target, 'remote', 'get-url', 'origin'), upstream);
    assert.equal(run(target, 'rev-parse', '--abbrev-ref', '@{upstream}'), 'origin/main');
  });

  it('backs up differing files, keeps untracked and identical ones', async () => {
    const root = freshClone('clone-conflict');
    const target = join(scratch, 'target-conflict');
    write(join(target, 'hooks', 'a.txt'), 'mine\n');
    write(join(target, 'same.txt'), 'same\n');
    write(join(target, 'settings.json'), '{"keep":true}\n');
    assert.deepEqual(findConflicts(root, target), ['hooks/a.txt']);
    await bootstrap({ root, target, yes: true, log: quiet });
    assert.equal(readFileSync(join(target, 'hooks', 'a.txt'), 'utf8'), 'upstream\n');
    assert.equal(readFileSync(join(target, 'settings.json'), 'utf8'), '{"keep":true}\n');
    const [backup] = readdirSync(join(target, 'backups'));
    assert.equal(readFileSync(join(target, 'backups', backup, 'hooks', 'a.txt'), 'utf8'), 'mine\n');
  });

  it('refuses to replace files without confirmation when not interactive', async () => {
    const root = freshClone('clone-noyes');
    const target = join(scratch, 'target-noyes');
    write(join(target, 'hooks', 'a.txt'), 'mine\n');
    await assert.rejects(bootstrap({ root, target, log: quiet }), /--yes/);
    assert.equal(readFileSync(join(target, 'hooks', 'a.txt'), 'utf8'), 'mine\n');
  });

  it('writes nothing on a dry run', async () => {
    const root = freshClone('clone-dry');
    const target = join(scratch, 'target-dry');
    mkdirSync(target);
    await bootstrap({ root, target, dryRun: true, log: quiet });
    assert.deepEqual(readdirSync(target), []);
  });

  it('updates a target that already is the same repo', async () => {
    const root = freshClone('clone-again');
    const target = join(scratch, 'target-again');
    await bootstrap({ root, target, log: quiet });
    assert.equal(await bootstrap({ root, target, log: quiet }), 'existing');
  });

  it('rejects a target repo with a different origin', async () => {
    const root = freshClone('clone-other');
    const target = join(scratch, 'target-other');
    mkdirSync(target);
    run(target, 'init', '-q', '-b', 'main');
    run(target, 'remote', 'add', 'origin', 'https://example.com/other.git');
    await assert.rejects(bootstrap({ root, target, log: quiet }), /not "/);
  });

  it('rejects a folder that is not a git clone', async () => {
    const root = join(scratch, 'plain');
    mkdirSync(root);
    await assert.rejects(bootstrap({ root, target: join(scratch, 't'), log: quiet }), /not a git clone/);
  });
});

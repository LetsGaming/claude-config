import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { resetConfigLayer } from './overwrite.mjs';

describe('resetConfigLayer', () => {
  let root;
  const quiet = () => {};

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'overwrite-test-'));
    writeFileSync(join(root, 'settings.json'), '{"mine":1}');
    writeFileSync(join(root, 'CLAUDE.md'), 'mine');
    writeFileSync(join(root, '.install-state.json'), '{}');
    writeFileSync(join(root, 'history.jsonl'), 'keep');
  });

  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it('moves the config layer to a backup and keeps data', async () => {
    await resetConfigLayer({ root, yes: true, log: quiet });
    for (const name of ['settings.json', 'CLAUDE.md', '.install-state.json']) assert.equal(existsSync(join(root, name)), false);
    assert.equal(readFileSync(join(root, 'history.jsonl'), 'utf8'), 'keep');
    const [backup] = readdirSync(join(root, 'backups'));
    assert.equal(readFileSync(join(root, 'backups', backup, 'settings.json'), 'utf8'), '{"mine":1}');
  });

  it('changes nothing on a dry run', async () => {
    await resetConfigLayer({ root, dryRun: true, log: quiet });
    assert.equal(existsSync(join(root, 'settings.json')), true);
    assert.equal(existsSync(join(root, 'backups')), false);
  });

  it('refuses without confirmation when not interactive', async () => {
    await assert.rejects(resetConfigLayer({ root, log: quiet }), /--yes/);
    assert.equal(existsSync(join(root, 'settings.json')), true);
  });

  it('does nothing when there is nothing to reset', async () => {
    const empty = mkdtempSync(join(tmpdir(), 'overwrite-empty-'));
    mkdirSync(join(empty, 'x'));
    assert.deepEqual(await resetConfigLayer({ root: empty, yes: true, log: quiet }), []);
    rmSync(empty, { recursive: true, force: true });
  });
});

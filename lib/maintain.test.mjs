import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { compareFiles, leakScan, liveOnly, manifestDrift, manifestNames, settingsDrift, syncFiles } from './maintain.mjs';

const config = (extra = {}) => ({ sanitized: [], repoOnly: [], ignoreLive: [], ignoreHooks: [], skipPlugins: [], ignoreMcp: [], privateTerms: [], ...extra });
const put = (root, file, text = 'x\n') => {
  mkdirSync(dirname(join(root, file)), { recursive: true });
  writeFileSync(join(root, file), text);
};
const dirs = () => ({ repo: mkdtempSync(join(tmpdir(), 'maint-repo-')), live: mkdtempSync(join(tmpdir(), 'maint-live-')) });
const emDash = String.fromCharCode(0x2014);

test('files are same, changed, sanitized on purpose, repo only or missing in live', () => {
  const { repo, live } = dirs();
  for (const file of ['hooks/a.mjs', 'hooks/b.mjs', 'skills/s/SKILL.md', 'hooks/gone.mjs', 'tools/dev.mjs']) put(repo, file, 'repo\n');
  put(live, 'hooks/a.mjs', 'repo\r\n');
  put(live, 'hooks/b.mjs', 'live\n');
  put(live, 'skills/s/SKILL.md', 'private text\n');
  put(repo, 'shared/base.md', 'shared\n');
  put(live, 'CLAUDE.md', 'mine\n');
  const rows = compareFiles({
    repo,
    live,
    files: ['hooks/a.mjs', 'hooks/b.mjs', 'skills/s/SKILL.md', 'hooks/gone.mjs', 'tools/dev.mjs', 'shared/base.md', 'README.md'],
    config: config({ sanitized: ['skills/s/SKILL.md', 'shared/base.md'], repoOnly: ['tools/dev.mjs'] }),
  });
  const status = Object.fromEntries(rows.map((row) => [row.file, row.status]));
  assert.deepEqual(status, {
    'hooks/a.mjs': 'same',
    'hooks/b.mjs': 'changed',
    'skills/s/SKILL.md': 'sanitized',
    'hooks/gone.mjs': 'missing-live',
    'tools/dev.mjs': 'repo-only',
    'shared/base.md': 'sanitized',
  });
});

test('live files the repo lacks are listed, but not installed skills, ignored paths or private folders', () => {
  const { live } = dirs();
  put(live, 'hooks/tracked.mjs');
  put(live, 'hooks/new.mjs');
  put(live, 'hooks/auto.mjs');
  put(live, 'tools/state/log.txt');
  put(live, 'tools/private/notes.md');
  put(live, 'skills/mine/SKILL.md');
  put(live, 'skills/upstream/SKILL.md');
  put(live, 'skills/tracked-skill/SKILL.md');
  put(live, 'skills/made/SKILL.md');
  const extra = liveOnly({
    live,
    files: ['hooks/tracked.mjs', 'skills/tracked-skill/SKILL.md'],
    config: config({ ignoreLive: ['hooks/auto.mjs', 'tools/state/', 'skills/made/'] }),
    skillNames: new Set(['upstream']),
  });
  assert.deepEqual(extra, ['hooks/new.mjs', 'skills/mine/']);
});

test('settings drift names changed values, hooks and overrides, and skips what the config ignores', () => {
  const base = {
    $schema: 'x',
    model: 'a',
    env: { ONE: '1', TWO: '2' },
    skillOverrides: { 'p:one': 'off' },
    hooks: { SessionStart: [{ matcher: 'compact', hooks: [{ command: 'node a.mjs' }] }] },
  };
  const live = {
    model: 'b',
    env: { ONE: '1', TWO: 'changed' },
    skillOverrides: { 'p:one': 'off', 'p:two': 'off', 'gone:x': 'off', 'bare-skill': 'off', 'other-skill': 'off' },
    hooks: {
      SessionStart: [{ matcher: 'compact', hooks: [{ command: 'node a.mjs' }] }, { hooks: [{ command: 'node heal.mjs' }] }, { hooks: [{ command: 'node new.mjs' }] }],
    },
  };
  const drift = settingsDrift({ base, live, config: config({ ignoreHooks: ['heal.mjs'] }), pluginNames: new Set(['p']), skillNames: new Set(['bare-skill']) });
  assert.deepEqual(drift.differs, ['model', 'env.TWO']);
  assert.deepEqual(drift.hooksLiveOnly, ['SessionStart [] node new.mjs']);
  assert.deepEqual(drift.hooksBaseOnly, []);
  assert.deepEqual(drift.overridesLiveOnly, ['p:two', 'bare-skill']);
});

test('manifests are compared with what is enabled, installed and registered', () => {
  const names = manifestNames({
    plugins: [{ marketplace: 'm', repo: 'o/m', plugins: ['one', 'two'] }],
    skills: [{ repo: 'o/s', skills: ['alpha', 'beta'] }],
  });
  const drift = manifestDrift({
    names,
    enabled: ['one@m', 'extra@m', 'kiln@k'],
    lockNames: ['alpha', 'stray'],
    mcpManifest: { a: {}, b: {} },
    registered: ['a', 'c', 'd'],
    config: config({ skipPlugins: ['kiln@k'], ignoreMcp: ['d'] }),
  });
  assert.deepEqual(drift, {
    pluginsLiveOnly: ['extra@m'],
    pluginsNotEnabled: ['two@m'],
    skillsLiveOnly: ['stray'],
    skillsMissing: ['beta'],
    mcpLiveOnly: ['c'],
    mcpMissing: ['b'],
  });
});

test('the leak scan finds secrets, user paths, the email, private terms and em dashes, and never returns the match', () => {
  const { repo } = dirs();
  const token = ['gh', 'p_', 'a'.repeat(36)].join('');
  put(repo, 'clean.md', 'Nothing to see here.\n');
  put(repo, 'bad.md', [`token ${token}`, 'see C:\\Users\\jdoe\\work', 'mail jane@example.test', 'about Project Zed', `a ${emDash} b`, 'pass' + 'word = correcthorsebattery'].join('\n'));
  put(repo, 'image.png', 'ignored');
  const found = leakScan({ repo, files: ['clean.md', 'bad.md', 'image.png', 'missing.md'], config: config({ privateTerms: ['project zed'] }), username: 'jdoe', email: 'jane@example.test' });
  assert.deepEqual(
    found.map((row) => `${row.file}:${row.line} ${row.kind}`),
    [
      'bad.md:1 GitHub token',
      'bad.md:2 your user path',
      'bad.md:3 your email address',
      'bad.md:4 private term from maintain.local.json',
      'bad.md:5 em dash',
      'bad.md:6 credential assignment',
    ],
  );
  assert.ok(!JSON.stringify(found).includes(token));
  assert.ok(!JSON.stringify(found).includes('correcthorsebattery'));
});

test('a short or empty user name does not turn the path check into noise', () => {
  const { repo } = dirs();
  put(repo, 'a.md', 'open C:\\Users\\me\\x and /home/me/y\n');
  assert.deepEqual(leakScan({ repo, files: ['a.md'], config: config(), username: 'me', email: '' }), []);
  assert.deepEqual(leakScan({ repo, files: ['a.md'], config: config(), username: '', email: '' }), []);
});

const syncWorld = () => {
  const { repo, live } = dirs();
  put(repo, 'hooks/changed.mjs', 'old\n');
  put(live, 'hooks/changed.mjs', 'new\r\nline\r\n');
  put(repo, 'hooks/same.mjs', 'same\n');
  put(live, 'hooks/same.mjs', 'same\n');
  put(repo, 'skills/s/SKILL.md', 'public\n');
  put(live, 'skills/s/SKILL.md', 'private\n');
  const rows = compareFiles({ repo, live, files: ['hooks/changed.mjs', 'hooks/same.mjs', 'skills/s/SKILL.md'], config: config({ sanitized: ['skills/s/SKILL.md'] }) });
  return { repo, live, rows };
};
const read = (root, file) => readFileSync(join(root, file), 'utf8');

test('sync copies only files that changed in live, with the line endings of the repo, and leaves sanitized files alone', () => {
  const { repo, live, rows } = syncWorld();
  const dry = syncFiles({ repo, live, rows, config: config(), username: 'jdoe', email: '', dryRun: true });
  assert.deepEqual(dry, { changed: ['hooks/changed.mjs'], leaks: [], kept: false });
  assert.equal(read(repo, 'hooks/changed.mjs'), 'old\n');
  const result = syncFiles({ repo, live, rows, config: config(), username: 'jdoe', email: '' });
  assert.deepEqual(result, { changed: ['hooks/changed.mjs'], leaks: [], kept: true });
  assert.equal(read(repo, 'hooks/changed.mjs'), 'new\nline\n');
  assert.equal(read(repo, 'skills/s/SKILL.md'), 'public\n');
});

test('sync puts every file back when the leak scan finds something in a copied file', () => {
  const { repo, live } = syncWorld();
  put(repo, 'hooks/other.mjs', 'keep\n');
  put(live, 'hooks/other.mjs', 'fine\n');
  put(live, 'hooks/changed.mjs', 'open C:\\Users\\jdoe\\x\n');
  const rows = compareFiles({ repo, live, files: ['hooks/changed.mjs', 'hooks/other.mjs'], config: config() });
  const result = syncFiles({ repo, live, rows, config: config(), username: 'jdoe', email: '' });
  assert.equal(result.kept, false);
  assert.deepEqual(result.leaks.map((leak) => leak.file + ':' + leak.line + ' ' + leak.kind), ['hooks/changed.mjs:1 your user path']);
  assert.equal(read(repo, 'hooks/changed.mjs'), 'old\n');
  assert.equal(read(repo, 'hooks/other.mjs'), 'keep\n');
});

test('sync with nothing changed does nothing', () => {
  const { repo, live } = dirs();
  put(repo, 'hooks/a.mjs', 'a\n');
  put(live, 'hooks/a.mjs', 'a\n');
  const rows = compareFiles({ repo, live, files: ['hooks/a.mjs'], config: config() });
  assert.deepEqual(syncFiles({ repo, live, rows, config: config(), username: 'jdoe', email: '' }), { changed: [], leaks: [], kept: false });
});

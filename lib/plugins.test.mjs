import assert from 'node:assert/strict';
import { test } from 'node:test';
import { planPlugins } from './plugins.mjs';

const manifest = [
  { marketplace: 'official', repo: 'acme/official', plugins: ['a', 'b'] },
  { marketplace: 'extra', repo: 'acme/extra', plugins: ['c'] },
];
const registered = [
  { name: 'official', repo: 'acme/official' },
  { name: 'extra', repo: 'acme/extra' },
];
const user = (id) => ({ id, scope: 'user', enabled: true });

test('fresh machine adds every marketplace and plugin', () => {
  const plan = planPlugins(manifest, [], []);
  assert.deepEqual(
    plan.map((g) => g.action),
    ['add', 'add'],
  );
  assert.deepEqual(plan[0].plugins, [
    { id: 'a@official', action: 'add' },
    { id: 'b@official', action: 'add' },
  ]);
});

test('everything installed keeps everything', () => {
  const plan = planPlugins(manifest, registered, [user('a@official'), user('b@official'), user('c@extra')]);
  assert.ok(plan.every((g) => g.action === 'keep' && g.plugins.every((p) => p.action === 'keep')));
});

test('a repo registered under another name is reused', () => {
  const plan = planPlugins(manifest, [{ name: 'mine', repo: 'Acme/Official' }], []);
  assert.equal(plan[0].action, 'keep');
  assert.deepEqual(plan[0].plugins[0], { id: 'a@mine', action: 'add' });
});

test('a name taken by another repo is a conflict', () => {
  const plan = planPlugins(manifest, [{ name: 'extra', repo: 'someone/else' }], []);
  assert.equal(plan[1].action, 'conflict');
  assert.equal(plan[1].conflictRepo, 'someone/else');
  assert.deepEqual(plan[1].plugins, []);
});

test('a disabled plugin is kept', () => {
  const plan = planPlugins(manifest, registered, [{ id: 'a@official', scope: 'user', enabled: false }]);
  assert.equal(plan[0].plugins[0].action, 'keep');
});

test('a project scope install does not count', () => {
  const plan = planPlugins(manifest, registered, [{ id: 'a@official', scope: 'project', enabled: true }]);
  assert.equal(plan[0].plugins[0].action, 'add');
});

test('a repeated repo across manifests gives one action per plugin', () => {
  const plan = planPlugins(
    [...manifest, { marketplace: 'official', repo: 'acme/official', plugins: ['b', 'd'] }],
    registered,
    [],
  );
  assert.equal(plan.length, 2);
  assert.deepEqual(
    plan[0].plugins.map((p) => p.id),
    ['a@official', 'b@official', 'd@official'],
  );
});

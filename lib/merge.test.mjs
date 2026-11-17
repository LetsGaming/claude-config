import assert from 'node:assert/strict';
import { test } from 'node:test';
import { changedPaths, mergeSettings } from './merge.mjs';

test('first install copies the base', () => {
  const base = { model: 'opus', env: { A: '1' } };
  assert.deepEqual(mergeSettings(base, undefined, undefined), base);
});

test('first run with an existing file keeps the user value and adds missing keys', () => {
  const base = { model: 'opus', theme: 'dark' };
  assert.deepEqual(mergeSettings(base, undefined, { model: 'sonnet' }), { model: 'sonnet', theme: 'dark' });
});

test('an untouched value follows the new base', () => {
  const previous = { model: 'opus', theme: 'dark' };
  const current = { model: 'opus', theme: 'dark' };
  assert.deepEqual(mergeSettings({ model: 'fable', theme: 'dark' }, previous, current), { model: 'fable', theme: 'dark' });
});

test('a value the user changed is kept', () => {
  const previous = { model: 'opus' };
  assert.deepEqual(mergeSettings({ model: 'fable' }, previous, { model: 'sonnet' }), { model: 'sonnet' });
});

test('keys the user added are kept', () => {
  const previous = { env: { A: '1' } };
  const current = { env: { A: '1', MINE: 'x' }, permissions: { defaultMode: 'plan' } };
  assert.deepEqual(mergeSettings({ env: { A: '2' } }, previous, current), {
    env: { A: '2', MINE: 'x' },
    permissions: { defaultMode: 'plan' },
  });
});

test('a key the user removed stays removed, new base keys still arrive', () => {
  const previous = { a: 1, nested: { x: 1 } };
  const current = { nested: { x: 1 } };
  assert.deepEqual(mergeSettings({ a: 1, b: 2, nested: { x: 1 } }, previous, current), { b: 2, nested: { x: 1 } });
});

test('a key removed from the base is removed unless the user changed it', () => {
  const previous = { a: 1, b: 2 };
  assert.deepEqual(mergeSettings({ a: 1 }, previous, { a: 1, b: 2 }), { a: 1 });
  assert.deepEqual(mergeSettings({ a: 1 }, previous, { a: 1, b: 3 }), { a: 1, b: 3 });
});

test('arrays are compared as a whole', () => {
  const previous = { hooks: { Start: [{ cmd: 'a' }] } };
  assert.deepEqual(mergeSettings({ hooks: { Start: [{ cmd: 'b' }] } }, previous, { hooks: { Start: [{ cmd: 'a' }] } }), {
    hooks: { Start: [{ cmd: 'b' }] },
  });
  const edited = { hooks: { Start: [{ cmd: 'a' }, { cmd: 'mine' }] } };
  assert.deepEqual(mergeSettings({ hooks: { Start: [{ cmd: 'b' }] } }, previous, edited), edited);
});

test('key order does not count as a change', () => {
  const previous = { env: { A: '1', B: '2' } };
  assert.deepEqual(mergeSettings({ env: { A: '9', B: '2' } }, previous, { env: { B: '2', A: '1' } }), { env: { A: '9', B: '2' } });
});

test('changedPaths lists added, changed and removed leaves', () => {
  const before = { a: 1, env: { X: '1', Y: '2' }, hooks: { Start: [1] } };
  const after = { a: 1, env: { X: '9' }, hooks: { Start: [1, 2] }, theme: 'dark' };
  assert.deepEqual(changedPaths(before, after).sort(), ['env.X', 'env.Y', 'hooks.Start', 'theme']);
  assert.deepEqual(changedPaths(undefined, { a: { b: 1 } }), ['a.b']);
});

test('changedPaths is empty for equal values', () => {
  assert.deepEqual(changedPaths({ a: { b: 1 } }, { a: { b: 1 } }), []);
});

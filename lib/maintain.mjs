import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const COMPARED_DIRS = ['skills', 'hooks', 'agents', 'commands', '_templates', 'tools'];
const LIVE_NAME = { 'shared/base.md': 'CLAUDE.md' };
const LIVE_ONLY_DIRS = ['hooks', 'agents', 'commands', '_templates', 'tools'];
const LIST_KEYS = ['sanitized', 'repoOnly', 'ignoreLive', 'ignoreHooks', 'skipPlugins', 'ignoreMcp', 'privateTerms'];
const BINARY = /\.(?:png|jpe?g|gif|ico|webp|woff2?|ttf|zip|pdf)$/i;

const slash = (path) => path.replace(/\\/g, '/');
const lf = (path) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
const underAny = (path, list) => list.some((item) => path === item || path.startsWith(item.endsWith('/') ? item : `${item}/`));

export const readJson = (path, fallback) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return fallback;
  }
};

// Shared lists live in the repo. maintain.local.json (ignored by git) adds this machine's own entries.
export function loadConfig(repo) {
  const shared = readJson(join(repo, 'tools', 'maintain.config.json'), {});
  const local = readJson(join(repo, 'maintain.local.json'), {});
  return Object.fromEntries(LIST_KEYS.map((key) => [key, [...(shared[key] ?? []), ...(local[key] ?? [])]]));
}

export function repoFiles(repo) {
  const run = spawnSync('git', ['-C', repo, 'ls-files', '-z', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' });
  return run.status === 0 ? [...new Set(run.stdout.split('\0').filter(Boolean).map(slash))] : [];
}

export function compareFiles({ repo, live, files, config }) {
  const rows = [];
  for (const file of files) {
    if (!COMPARED_DIRS.includes(file.split('/')[0]) && !(file in LIVE_NAME)) continue;
    const liveFile = join(live, LIVE_NAME[file] ?? file);
    let status;
    if (underAny(file, config.repoOnly)) status = 'repo-only';
    else if (!existsSync(liveFile)) status = 'missing-live';
    else if (underAny(file, config.sanitized)) status = 'sanitized';
    else status = lf(join(repo, file)) === lf(liveFile) ? 'same' : 'changed';
    rows.push({ file, status });
  }
  return rows;
}

function walk(dir, rel, out) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const next = `${rel}/${entry.name}`;
    if (entry.isDirectory()) walk(join(dir, entry.name), next, out);
    else out.push(next);
  }
}

// Files and skill folders in the live setup that the repo does not carry. Skills installed from skills.json are not
// listed, and neither is anything inside a private/ folder.
export function liveOnly({ live, files, config, skillNames }) {
  const tracked = new Set(files);
  const found = [];
  for (const dir of LIVE_ONLY_DIRS) if (existsSync(join(live, dir))) walk(join(live, dir), dir, found);
  const extra = found.filter((file) => !tracked.has(file) && !file.split('/').includes('private') && !underAny(file, config.ignoreLive));
  const skillsDir = join(live, 'skills');
  const folders = existsSync(skillsDir) ? readdirSync(skillsDir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name) : [];
  for (const name of folders) {
    const path = `skills/${name}/`;
    if (skillNames.has(name) || files.some((file) => file.startsWith(path)) || underAny(path, config.ignoreLive)) continue;
    extra.push(path);
  }
  return extra.sort();
}

const flatHooks = (hooks = {}) =>
  Object.entries(hooks).flatMap(([event, list]) => list.flatMap((entry) => (entry.hooks ?? []).map((hook) => `${event} [${entry.matcher ?? ''}] ${hook.command ?? hook.type}`)));

function diffValues(path, base, live, out) {
  const plain = (value) => value && typeof value === 'object' && !Array.isArray(value);
  if (plain(base)) {
    for (const key of Object.keys(base)) diffValues(`${path}.${key}`, base[key], plain(live) ? live[key] : undefined, out);
  } else if (JSON.stringify(base) !== JSON.stringify(live)) {
    out.push(path);
  }
}

// settings.base.json against the live settings.json. A value the person changed on purpose is theirs, so this only
// reports. Live overrides are listed when they name a skill or plugin the repo carries.
export function settingsDrift({ base, live, config, pluginNames, skillNames }) {
  const differs = [];
  for (const key of Object.keys(base)) {
    if (key === 'hooks' || key === '$schema') continue;
    diffValues(key, base[key], live[key], differs);
  }
  const baseHooks = new Set(flatHooks(base.hooks));
  const liveHooks = new Set(flatHooks(live.hooks));
  const ignored = (hook) => config.ignoreHooks.some((part) => hook.includes(part));
  const overrides = Object.keys(live.skillOverrides ?? {}).filter((key) => !(key in (base.skillOverrides ?? {})));
  const carried = overrides.filter((key) => (key.includes(':') ? pluginNames.has(key.split(':')[0]) : skillNames.has(key)));
  return {
    differs,
    hooksLiveOnly: [...liveHooks].filter((hook) => !baseHooks.has(hook) && !ignored(hook)),
    hooksBaseOnly: [...baseHooks].filter((hook) => !liveHooks.has(hook)),
    overridesLiveOnly: carried,
  };
}

export const manifestNames = ({ plugins, skills }) => ({
  pluginIds: new Set(plugins.flatMap((group) => group.plugins.map((name) => `${name}@${group.marketplace}`))),
  pluginNames: new Set(plugins.flatMap((group) => group.plugins)),
  skillNames: new Set(skills.flatMap((group) => group.skills)),
});

export function manifestDrift({ names, enabled, lockNames, mcpManifest, registered, config }) {
  const skipped = new Set(config.skipPlugins);
  return {
    pluginsLiveOnly: enabled.filter((id) => !names.pluginIds.has(id) && !skipped.has(id)),
    pluginsNotEnabled: [...names.pluginIds].filter((id) => !enabled.includes(id)),
    skillsLiveOnly: lockNames.filter((name) => !names.skillNames.has(name)),
    skillsMissing: [...names.skillNames].filter((name) => !lockNames.includes(name)),
    mcpLiveOnly: registered.filter((name) => !(name in mcpManifest) && !config.ignoreMcp.includes(name)),
    mcpMissing: Object.keys(mcpManifest).filter((name) => !registered.includes(name)),
  };
}

const SECRETS = [
  [/\b(?:sk|pk)-[A-Za-z0-9_-]{20,}/, 'API key'],
  [/\bgh[pousr]_[A-Za-z0-9]{30,}/, 'GitHub token'],
  [/\bxox[abprs]-[A-Za-z0-9-]{10,}/, 'Slack token'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'AWS key'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key'],
  [/\b(?:password|passwd|secret|token|api[_-]?key)\b\s*[:=]\s*['"]?[A-Za-z0-9+/_-]{12,}/i, 'credential assignment'],
];
const EM_DASH = new RegExp(String.fromCharCode(0x2014));
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// What must not reach a public repo. The matched text is never returned, only the kind and the line, so a report
// cannot leak what it finds.
export function leakScan({ repo, files, config, username, email }) {
  const found = [];
  const userPath = username && username.length >= 3 ? new RegExp(`(?:[A-Za-z]:[\\\\/]+Users[\\\\/]+|/Users/|/home/)${escape(username)}(?![A-Za-z0-9_-])`, 'i') : null;
  const terms = config.privateTerms.filter(Boolean).map((term) => term.toLowerCase());
  for (const file of files) {
    if (BINARY.test(file) || !existsSync(join(repo, file))) continue;
    const text = readFileSync(join(repo, file), 'utf8');
    if (text.includes('\0')) continue;
    text.split(/\r?\n/).forEach((line, index) => {
      const hit = (kind) => found.push({ file, line: index + 1, kind });
      for (const [pattern, kind] of SECRETS) if (pattern.test(line)) hit(kind);
      if (userPath?.test(line)) hit('your user path');
      if (email && line.toLowerCase().includes(email.toLowerCase())) hit('your email address');
      if (terms.some((term) => line.toLowerCase().includes(term))) hit('private term from maintain.local.json');
      if (EM_DASH.test(line)) hit('em dash');
    });
  }
  return found;
}

export function repoState(repo, { fetch = false } = {}) {
  const git = (...args) => spawnSync('git', ['-C', repo, ...args], { encoding: 'utf8' });
  if (fetch) git('fetch', '--quiet');
  const count = (range) => {
    const run = git('rev-list', '--count', range);
    return run.status === 0 ? Number(run.stdout.trim()) : null;
  };
  return {
    branch: git('rev-parse', '--abbrev-ref', 'HEAD').stdout.trim(),
    changed: git('status', '--porcelain').stdout.split('\n').filter(Boolean).length,
    behind: count('HEAD..@{u}'),
    ahead: count('@{u}..HEAD'),
  };
}

#!/usr/bin/env node
// Reboot the PC and bring the recently active Claude Code sessions back.
//
//   node restart-resume.mjs status                    list the sessions that would be resumed
//   node restart-resume.mjs reboot [options]          snapshot, schedule a one-shot resume task, reboot
//   node restart-resume.mjs resume [--dry-run]        run by the scheduled task after logon (can be run by hand)
//   node restart-resume.mjs cancel                    abort a pending reboot and remove the task
//
// reboot options: --window 60 (minutes of transcript activity that count as running), --delay 90 (seconds until
// the reboot starts), --idle 0 (wait until no transcript changed for N seconds, at most 10 minutes), --force (reboot even
// if javaw.exe runs), --no-remote (do not pass --remote-control), --prompt "text" (message for sessions that were
// active in the last 10 minutes; "" disables it), --dry-run (show everything, change nothing).
// Windows is implemented. Linux and macOS: status and resume (terminal launch) are not implemented, reboot refuses.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HOME = os.homedir();
const CLAUDE = process.env.CLAUDE_CONFIG_DIR || path.join(HOME, '.claude');
const PROJECTS = path.join(CLAUDE, 'projects');
const SESSIONS = path.join(CLAUDE, 'sessions');
const STATE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'restart-state');
const QUEUE = path.join(STATE_DIR, 'queue.json');
const LOG = path.join(STATE_DIR, 'restart.log');
const TASK = 'ClaudeResumeOnce';
const SKIP_CWD = /\.claude-mem|remember-summarizer|[\\/]Temp[\\/]|observer-sessions/i;
const DEFAULT_PROMPT = 'The PC was rebooted and this session was resumed automatically. First check git status, whether any javaw.exe or queue process is running, and docs/WORK_STATE.md if it exists, then continue the work you were doing. Do not start the harness if the user may be playing.';

const argv = process.argv.slice(2);
const cmd = argv[0] || 'status';
const flag = n => argv.includes('--' + n);
const val = (n, d) => { const i = argv.indexOf('--' + n); return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : d; };
const dry = flag('dry-run');
fs.mkdirSync(STATE_DIR, { recursive: true });
const log = s => { const l = `[${new Date().toISOString()}] ${s}`; console.log(l); try { fs.appendFileSync(LOG, l + '\n'); } catch {} };
const win = process.platform === 'win32';
const sleep = ms => new Promise(r => setTimeout(r, ms));

function tailText(file, bytes) {
  const fd = fs.openSync(file, 'r');
  try {
    const size = fs.fstatSync(fd).size;
    const len = Math.min(size, bytes);
    const buf = Buffer.alloc(len);
    fs.readSync(fd, buf, 0, len, size - len);
    return buf.toString('utf8');
  } finally { fs.closeSync(fd); }
}

function cwdOf(file) {
  for (const chunk of [tailText(file, 300000)]) {
    const lines = chunk.split('\n').reverse();
    for (const l of lines) {
      const m = l.match(/"cwd":"((?:[^"\\]|\\.)*)"/);
      if (m) { try { return JSON.parse('"' + m[1] + '"'); } catch { /* next */ } }
    }
  }
  return null;
}

function alivePids() {
  const alive = new Map();
  if (!fs.existsSync(SESSIONS)) return alive;
  for (const f of fs.readdirSync(SESSIONS).filter(x => x.endsWith('.json'))) {
    try {
      const j = JSON.parse(fs.readFileSync(path.join(SESSIONS, f), 'utf8'));
      let ok = false;
      try { process.kill(j.pid, 0); ok = true; } catch {}
      if (ok) alive.set(j.sessionId, j.pid);
    } catch {}
  }
  return alive;
}

function findSessions(windowMin) {
  const now = Date.now();
  const alive = alivePids();
  const out = [];
  if (!fs.existsSync(PROJECTS)) return out;
  for (const proj of fs.readdirSync(PROJECTS)) {
    const pd = path.join(PROJECTS, proj);
    if (!fs.statSync(pd).isDirectory()) continue;
    for (const f of fs.readdirSync(pd).filter(x => x.endsWith('.jsonl'))) {
      const file = path.join(pd, f);
      const st = fs.statSync(file);
      const ageMin = (now - st.mtimeMs) / 60000;
      if (ageMin > windowMin) continue;
      const cwd = cwdOf(file);
      if (!cwd || SKIP_CWD.test(cwd) || !fs.existsSync(cwd)) continue;
      const id = f.replace(/\.jsonl$/, '');
      out.push({ sessionId: id, cwd, ageMin: +ageMin.toFixed(1), alive: alive.has(id), pid: alive.get(id) || null, active10: ageMin <= 10, transcript: file });
    }
  }
  return out.sort((a, b) => a.ageMin - b.ageMin);
}

function psQuote(s) { return "'" + String(s).replace(/'/g, "''") + "'"; }

function javawRunning() {
  if (!win) return false;
  const r = spawnSync('tasklist', ['/FI', 'IMAGENAME eq javaw.exe', '/FO', 'CSV', '/NH'], { encoding: 'utf8' });
  return /javaw\.exe/i.test(r.stdout || '');
}

function show(list) {
  if (!list.length) { console.log('No session with transcript activity in the window.'); return; }
  for (const s of list) console.log(`${s.alive ? 'alive' : 'ended'}  ${String(s.ageMin).padStart(6)} min ago  ${s.active10 ? 'ACTIVE' : 'idle  '}  ${s.sessionId}  ${s.cwd}`);
}

async function reboot() {
  if (!win) { console.error('reboot is implemented for Windows only.'); process.exit(2); }
  const windowMin = +val('window', 60), delay = +val('delay', 90), idle = +val('idle', 0);
  let list = findSessions(windowMin);
  console.log(`Sessions to resume after the reboot (window ${windowMin} min):`);
  show(list);
  if (javawRunning() && !flag('force')) { console.error('javaw.exe is running (Minecraft or a benchmark). Close it or use --force.'); process.exit(3); }
  if (idle > 0 && !dry) {
    const t0 = Date.now();
    log(`waiting for ${idle}s without transcript changes (max 600s)`);
    while (Date.now() - t0 < 600000) {
      const newest = Math.max(0, ...findSessions(windowMin).map(s => Date.now() - fs.statSync(s.transcript).mtimeMs));
      if (newest >= idle * 1000 || !list.length) break;
      await sleep(10000);
    }
    list = findSessions(windowMin);
  }
  const prompt = val('prompt', DEFAULT_PROMPT);
  const queue = { createdAt: new Date().toISOString(), remote: !flag('no-remote'), prompt, sessions: list };
  const node = process.execPath, self = fileURLToPath(import.meta.url);
  const tr = `"${node}" "${self}" resume`;
  if (dry) { console.log('\n[dry run] would write', QUEUE, 'and create task', TASK, '->', tr, 'then run: shutdown /r /t', delay); return; }
  fs.writeFileSync(QUEUE, JSON.stringify(queue, null, 2));
  const c = spawnSync('schtasks', ['/Create', '/F', '/TN', TASK, '/SC', 'ONLOGON', '/RL', 'LIMITED', '/TR', tr], { encoding: 'utf8' });
  if (c.status !== 0) { log('schtasks failed: ' + (c.stderr || c.stdout)); process.exit(4); }
  log(`queue saved (${list.length} sessions), task ${TASK} created, rebooting in ${delay}s (node restart-resume.mjs cancel to abort)`);
  const r = spawnSync('shutdown', ['/r', '/t', String(delay), '/c', 'Restarting; Claude Code sessions will be resumed after logon.'], { encoding: 'utf8' });
  if (r.status !== 0) { log('shutdown failed: ' + (r.stderr || r.stdout)); process.exit(5); }
}

function cancel() {
  if (win) { spawnSync('shutdown', ['/a']); spawnSync('schtasks', ['/Delete', '/F', '/TN', TASK]); }
  log('cancelled pending reboot and removed the resume task (queue file kept)');
}

async function waitForNetwork(maxSec) {
  const t0 = Date.now();
  while ((Date.now() - t0) / 1000 < maxSec) {
    try {
      const ctl = new AbortController();
      const to = setTimeout(() => ctl.abort(), 5000);
      const res = await fetch('https://api.anthropic.com', { method: 'HEAD', signal: ctl.signal });
      clearTimeout(to);
      if (res.status > 0) return true;
    } catch { /* retry */ }
    await sleep(5000);
  }
  return false;
}

async function resume() {
  if (!fs.existsSync(QUEUE) && !dry) { log('no queue file, nothing to resume'); return; }
  const q = fs.existsSync(QUEUE)
    ? JSON.parse(fs.readFileSync(QUEUE, 'utf8'))
    : { createdAt: new Date().toISOString(), remote: !flag('no-remote'), prompt: val('prompt', DEFAULT_PROMPT), sessions: findSessions(+val('window', 60)) };
  const ageH = (Date.now() - Date.parse(q.createdAt)) / 3600000;
  if (ageH > 6) { log(`queue is ${ageH.toFixed(1)} h old, ignoring it (delete ${QUEUE} to silence this)`); return; }
  if (win && !dry) spawnSync('schtasks', ['/Delete', '/F', '/TN', TASK]);
  if (!dry) { log('logon detected, letting the desktop settle (45 s)'); await sleep(45000); }
  const net = dry ? true : await waitForNetwork(300);
  log(net ? 'network is online' : 'network not reachable after 300 s, resuming anyway');
  if (!dry) await sleep(10000);
  const claudeExe = (spawnSync(win ? 'where' : 'which', ['claude'], { encoding: 'utf8' }).stdout || '').split(/\r?\n/)[0].trim() || 'claude';
  let n = 0;
  for (const s of q.sessions) {
    if (!fs.existsSync(s.cwd)) { log(`skip ${s.sessionId}: folder gone ${s.cwd}`); continue; }
    const name = path.basename(s.cwd) || 'session';
    const lines = [`$Host.UI.RawUI.WindowTitle = ${psQuote('claude ' + name)}`, `Set-Location -LiteralPath ${psQuote(s.cwd)}`];
    let call = `& ${psQuote(claudeExe)} --resume ${s.sessionId}`;
    if (q.remote) call += ` --remote-control ${psQuote(name)}`;
    if (q.prompt && s.active10) call += ` ${psQuote(q.prompt)}`;
    lines.push(call);
    const script = path.join(STATE_DIR, `launch-${s.sessionId}.ps1`);
    log(`${dry ? '[dry run] ' : ''}resume ${s.sessionId} in ${s.cwd}${s.active10 ? ' (with continue prompt)' : ''}`);
    if (dry) { console.log(lines.join('\n') + '\n'); continue; }
    if (!win) { log('terminal launch not implemented on this platform'); continue; }
    fs.writeFileSync(script, lines.join('\r\n') + '\r\n');
    spawn('cmd.exe', ['/c', 'start', '"claude"','powershell.exe', '-NoExit', '-ExecutionPolicy', 'Bypass', '-File', script], { detached: true, stdio: 'ignore' }).unref();
    n++;
    await sleep(8000);
  }
  if (!dry) { fs.renameSync(QUEUE, QUEUE.replace('queue.json', `queue.done-${Date.now()}.json`)); log(`launched ${n} session(s)`); }
}

if (cmd === 'status') show(findSessions(+val('window', 60)));
else if (cmd === 'reboot') await reboot();
else if (cmd === 'resume') await resume();
else if (cmd === 'cancel') cancel();
else { console.error('usage: status | reboot | resume | cancel (see the header of this file)'); process.exit(2); }

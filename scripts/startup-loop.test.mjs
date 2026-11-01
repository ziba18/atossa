// B131 start-up loop (lib/startup.ts): >= 75 s budget, backoff <= 10 s, waking line after 3 s, paused time not counted.
// Run: node --experimental-strip-types scripts/startup-loop.test.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'startup-'));
fs.writeFileSync(path.join(dir, 'startup.ts'), fs.readFileSync(new URL('../lib/startup.ts', import.meta.url), 'utf8')
  .replace("import { create } from 'zustand';", 'const create = (f) => { let s; const set = (p) => { s = { ...s, ...p }; }; s = f(set); const h = () => s; h.getState = () => s; return h; };'));
const m = await import(path.join(dir, 'startup.ts'));
let fails = 0; const ok = (c, msg) => { if (!c) { fails++; console.error('FAIL', msg); } };
function fakeClock() { let t = 0; return { now: () => t, sleep: async (ms) => { t += ms; }, add: (ms) => { t += ms; } }; }

// 1. server never answers: unreachable, only after >= 75 s, every wait <= 10 s, waking fired at ~3 s.
{ const c = fakeClock(); const waits = []; let tries = 0, wakingAt = -1;
  const sleep = async (ms) => { waits.push(ms); await c.sleep(ms); };
  const r = await m.runStartupLoop(async () => { tries++; c.add(300); return 'retry'; }, { now: c.now, sleep, onWaking: () => { wakingAt = c.now(); } });
  ok(r === 'unreachable', `down -> unreachable (got ${r})`); ok(c.now() >= 75000, `budget >= 75 s (got ${c.now()})`);
  ok(c.now() < 75000 + 10000 + 13000, `ends soon after 75 s (got ${c.now()})`); ok(Math.max(...waits) <= 10000, 'backoff <= 10 s');
  ok(wakingAt >= 3000 && wakingAt <= 5000, `waking line at 3-5 s (got ${wakingAt})`); ok(tries >= 8, `tries ${tries}`); }
// 2. HTML page / 5xx for 50 s, then answers: ok, no unreachable.
{ const c = fakeClock(); const r = await m.runStartupLoop(async () => { c.add(200); return c.now() < 50000 ? 'retry' : 'ok'; }, { now: c.now, sleep: c.sleep });
  ok(r === 'ok', `recover at 50 s -> ok (got ${r})`); ok(c.now() < 62000, `signed in within 12 s of recovery (${c.now()})`); }
// 3. 401 at once: rejected, no waiting.
{ const c = fakeClock(); let tries = 0; const r = await m.runStartupLoop(async () => { tries++; return 'rejected'; }, { now: c.now, sleep: c.sleep });
  ok(r === 'rejected' && tries === 1 && c.now() === 0, 'rejected on first try'); }
// 4. paused (Help now open) 120 s: no tries while paused, paused time not counted.
{ const c = fakeClock(); let paused = true; const triesAt = [];
  const sleep = async (ms) => { await c.sleep(ms); if (c.now() >= 120000) paused = false; };
  const r = await m.runStartupLoop(async () => { triesAt.push(c.now()); return 'retry'; }, { now: c.now, sleep, isPaused: () => paused });
  ok(triesAt[0] >= 120000, `first try only after Help now closed (${triesAt[0]})`); ok(r === 'unreachable' && c.now() >= 195000, `budget excludes pause (${c.now()})`); }
// 5. withTimeout: a hanging try rejects.
{ let rej = false; await m.withTimeout(new Promise(() => {}), 20).catch(() => { rej = true; }); ok(rej, 'hanging try times out');
  ok((await m.withTimeout(Promise.resolve(7), 20)) === 7, 'resolved try passes through'); }
if (fails) process.exit(1);
console.log('ok: 5 start-up loop cases');

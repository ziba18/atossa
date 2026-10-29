// Notes waiting to send survive a session that simply expired, and are cleared on a deliberate sign-out.
// lib/outbox.ts runs against an in-memory AsyncStorage; the sign-out wiring is checked in the store source.
// Run: node --experimental-strip-types scripts/outbox-expiry.test.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'outbox-'));
const read = (rel) => fs.readFileSync(new URL(rel, import.meta.url), 'utf8');
const mem = new Map();
globalThis.__store = {
  getItem: async (k) => mem.get(k) ?? null,
  setItem: async (k, v) => { mem.set(k, v); },
  removeItem: async (k) => { mem.delete(k); },
};
fs.writeFileSync(path.join(dir, 'outbox.ts'), read('../lib/outbox.ts')
  .replace("import AsyncStorage from '@react-native-async-storage/async-storage';", 'const AsyncStorage = (globalThis as any).__store;')
  .replace("import type { SymptomData } from '../types/records';", 'type SymptomData = any;')
  .replace("import { ApiError } from './api';", 'const ApiError = class {};'));
const { enqueue, readOutbox, clearOutbox } = await import(path.join(dir, 'outbox.ts'));
const fails = [];
const check = (ok, what) => { if (!ok) fails.push(what); };

await enqueue({ clientId: 'a', userId: 'u1', data: {}, queuedAt: 'now' });
check((await readOutbox()).length === 1 && (await readOutbox())[0].userId === 'u1', 'item keeps its user id');
await enqueue({ clientId: 'a', userId: 'u1', data: {}, queuedAt: 'now' });
check((await readOutbox()).length === 1, 'same client id is not queued twice');
await clearOutbox();
check((await readOutbox()).length === 0, 'clearOutbox empties the queue');

const store = read('../stores/authStore.ts');
check(/signOut: \(opts\?: \{ keepOutbox\?: boolean \}\) => Promise<void>/.test(store), 'signOut takes keepOutbox');
check(/if \(!opts\?\.keepOutbox\) await clearOutbox\(\)/.test(store), 'outbox is cleared unless keepOutbox');
check(/signOut\(\{ keepOutbox: true \}\)/.test(read('../hooks/useAuth.ts')), 'only the session-expired handler keeps the outbox');
check((store.match(/clearOutbox\(\)/g) || []).length >= 2, 'delete-account still clears the outbox');
const flush = read('../stores/recordsStore.ts');
check(/item\.userId !== userId\) \{ await dequeue/.test(flush), 'flush never sends another account\'s item');

if (fails.length) { console.error('FAIL:', fails); process.exit(1); }
console.log('ok: outbox expiry/keep rules');

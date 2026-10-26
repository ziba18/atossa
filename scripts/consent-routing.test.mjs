// The consent gate in lib/authRouting.ts: null => consent screen; undefined (older backend) => no gate.
// Run: node --experimental-strip-types scripts/consent-routing.test.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'route-'));
const lib = new URL('../lib/', import.meta.url);
fs.writeFileSync(path.join(dir, 'humanName.ts'), fs.readFileSync(new URL('humanName.ts', lib)));
fs.writeFileSync(path.join(dir, 'authRouting.ts'), fs.readFileSync(new URL('authRouting.ts', lib), 'utf8')
  .replace("import type { Profile } from '../types/database';", 'type Profile = any;').replace("'./humanName'", "'./humanName.ts'"));
const { routeAfterSignIn } = await import(path.join(dir, 'authRouting.ts'));
const done = { display_name: 'Sam', onboarding_complete: true };
const cases = [
  [{ ...done, consent_version: null }, '/(auth)/onboarding/consent'],
  [{ ...done, onboarding_complete: false, consent_version: null }, '/(auth)/onboarding/consent'],
  [{ ...done, consent_version: 1 }, '/(tabs)/today'],
  [{ ...done }, '/(tabs)/today'],
  [{ ...done, consent_version: 0 }, '/(auth)/onboarding/consent'],
  [{ ...done, consent_version: 5 }, '/(tabs)/today'],
  [{ display_name: 'Sam', onboarding_complete: false, consent_version: 1 }, '/(auth)/onboarding/basics'],
];
const bad = cases.filter(([p, want]) => routeAfterSignIn(p) !== want).map(([p]) => JSON.stringify(p));
if (bad.length) { console.error('wrong route for', bad); process.exit(1); }
console.log(`ok: ${cases.length} routing cases`);

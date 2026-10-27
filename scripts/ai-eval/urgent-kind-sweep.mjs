// Per set: how many lines get the SELF-HARM line, the 999/111 line, or nothing (phone detector, lib/urgentWording.ts).
// Sets: backend/tests/emergency_set_*.json, backend/tests/urgent_phrases.json, scripts/ai-eval/items.urgent-safety-v1*.json.
// Run: node --experimental-strip-types scripts/ai-eval/urgent-kind-sweep.mjs [--json out.json]
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
await import('./ts-register.mjs');
const { urgentSignpost } = await import('../../lib/urgentWording.ts');
const { SELF_HARM_SIGNPOST } = await import('../../lib/urgentWording.ts');
const root = new URL('../../', import.meta.url);
const kind = (t) => { const s = urgentSignpost(t); return s === null ? 'none' : s === SELF_HARM_SIGNPOST ? 'self' : 'urgent'; };
const sets = {};
const bt = new URL('backend/tests/', root);
for (const f of readdirSync(bt).filter((f) => /^emergency_set_.*\.json$/.test(f)).sort()) sets[f] = JSON.parse(readFileSync(new URL(f, bt)));
const up = JSON.parse(readFileSync(new URL('urgent_phrases.json', bt)));
sets['urgent_phrases.json'] = { emergency: up.filter((x) => x[1]).map((x) => x[0]), harmless: up.filter((x) => !x[1]).map((x) => x[0]) };
const ae = new URL('scripts/ai-eval/', root);
for (const f of readdirSync(ae).filter((f) => /^items\.urgent-safety-.*\.json$/.test(f)).sort()) sets[f] = JSON.parse(readFileSync(new URL(f, ae)));
const out = {};
for (const [name, d] of Object.entries(sets)) {
  const e = (d.emergency || []).map((t) => [t, kind(t)]), h = (d.harmless || []).map((t) => [t, kind(t)]);
  out[name] = { e, h };
  const c = (a, k) => a.filter((x) => x[1] === k).length;
  console.log(`${name}\temergency ${e.length - c(e, 'none')}/${e.length} raised (self ${c(e, 'self')})\tharmless raised ${h.length - c(h, 'none')}/${h.length} (self ${c(h, 'self')})`);
}
const i = process.argv.indexOf('--json');
if (i > 0) writeFileSync(process.argv[i + 1], JSON.stringify(out, null, 1));

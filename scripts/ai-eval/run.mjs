// Scores components/atossa/capture/infer.ts (regex baseline) on synthetic items. No model calls, no real data.
// Run: node --experimental-strip-types scripts/ai-eval/run.mjs
import fs from 'node:fs';
import { prefillFrom } from '../../components/atossa/capture/infer.ts';

const items = JSON.parse(fs.readFileSync(new URL(process.argv.find((a) => a.endsWith('.json')) ?? './items.v0.json', 'file://' + process.cwd() + '/scripts/ai-eval/'), 'utf8'));
const FIELDS = ['zones', 'when', 'duration', 'impacts', 'worst', 'tried'];
const norm = (v) => (v == null ? null : Array.isArray(v) ? (v.length ? [...v].sort().join('|') : null) : String(v).toLowerCase());
const stats = Object.fromEntries(FIELDS.map((f) => [f, { gold: 0, fills: 0, correct: 0, wrong: 0, miss: 0, missedStated: [], wrongList: [] }]));
const byStrata = {};
for (const it of items) {
  const out = prefillFrom(it.text);
  for (const f of FIELDS) {
    const g = norm(it.gold[f]), p = norm(out[f]), s = stats[f];
    const st = (byStrata[it.strata] ??= { fills: 0, wrong: 0, gold: 0, correct: 0 });
    if (g) { s.gold++; st.gold++; }
    if (p) { s.fills++; st.fills++; }
    if (p && p === g) { s.correct++; st.correct++; }
    else if (p) { s.wrong++; st.wrong++; s.wrongList.push(`${it.id}: got ${JSON.stringify(out[f])} want ${JSON.stringify(it.gold[f])}`); }
    else if (g) { s.miss++; s.missedStated.push(it.id); }
  }
}
const pct = (a, b) => (b ? (100 * a / b).toFixed(0) + '%' : 'n/a');
console.log(`items: ${items.length}`);
console.log('field      gold fills correct wrong  precision recall  wrong-fill-rate');
let F = 0, W = 0, G = 0, C = 0;
for (const f of FIELDS) {
  const s = stats[f]; F += s.fills; W += s.wrong; G += s.gold; C += s.correct;
  console.log(f.padEnd(10), String(s.gold).padStart(4), String(s.fills).padStart(5), String(s.correct).padStart(7), String(s.wrong).padStart(5), pct(s.correct, s.fills).padStart(9), pct(s.correct, s.gold).padStart(7), pct(s.wrong, s.fills).padStart(12));
}
console.log('ALL'.padEnd(10), String(G).padStart(4), String(F).padStart(5), String(C).padStart(7), String(W).padStart(5), pct(C, F).padStart(9), pct(C, G).padStart(7), pct(W, F).padStart(12));
console.log('\nper stratum (fills / wrong / gold / correct):');
for (const k of Object.keys(byStrata).sort()) console.log(k, JSON.stringify(byStrata[k]));
console.log('\nWRONG FILLS:');
for (const f of FIELDS) for (const w of stats[f].wrongList) console.log(`[${f}] ${w}`);
if (process.argv.includes('--missed')) for (const f of FIELDS) console.log(`[${f}] missed stated: ${stats[f].missedStated.join(',')}`);

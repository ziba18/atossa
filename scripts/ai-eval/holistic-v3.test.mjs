// node --experimental-strip-types scripts/ai-eval/holistic-v3.test.mjs  (precision/recall for sexPain + fertility on
// items.holistic-v3.json; gold committed before the rules in 11ce06d; output never carries a condition word; exits 1 on a wrong fill)
import { readFileSync } from 'node:fs';
// Registered before any app import so extensionless TS imports resolve under the plain command.
await import('./ts-register.mjs');
const { holisticFrom } = await import('../../components/atossa/capture/holistic.ts');
const { items } = JSON.parse(readFileSync(new URL(process.argv[2] ?? './items.holistic-v3.json', import.meta.url)));
const FIELDS = ['sexPain', 'fertility'];
const val = (got, k) => k === 'fertility' ? got.fertility?.wish : got[k];
const CONDITION = /\b(endometriosis|endo|pcos|adenomyosis|vaginismus|dyspareunia|infertil\w*|subfertil\w*|diagnos\w*)\b/i;
const rows = []; const fails = []; let wrongAny = 0; let labelHits = 0;
for (const k of FIELDS) {
  let tp = 0, filled = 0, gold = 0;
  for (const x of items) {
    const got = holisticFrom(x.text); const g = val(got, k); const w = x[k];
    const own = k === 'fertility' ? got.fertility?.words : got.sexPainWords;
    if (own && CONDITION.test(own) && !CONDITION.test(x.text)) labelHits++;
    if (w !== undefined) gold++;
    if (g !== undefined) filled++;
    if (w !== undefined && g === w) tp++;
    else if (w !== undefined || g !== undefined) fails.push(`${x.id} ${k}: want ${JSON.stringify(w)} got ${JSON.stringify(g)}`);
    if (g !== undefined && g !== w) wrongAny++;
  }
  rows.push(`| ${k} | ${gold} | ${filled} | ${filled ? (tp / filled).toFixed(2) : '-'} | ${gold ? (tp / gold).toFixed(2) : '-'} |`);
}
console.log('| field | gold | filled | precision | recall |\n|---|---|---|---|---|\n' + rows.join('\n'));
fails.forEach((f) => console.log('  ' + f));
console.log(`condition words added to output: ${labelHits}`);
if (wrongAny || labelHits) process.exit(1);

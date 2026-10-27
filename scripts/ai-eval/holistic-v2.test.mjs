// node --experimental-strip-types scripts/ai-eval/holistic-v2.test.mjs  (precision/recall per field on items.holistic-v2.json;
// 58 of 78 notes written by Marketing / Design / Data, gold written before the tired/skin/helped rules; exits 1 on a wrong fill)
import { readFileSync } from 'node:fs';
import { holisticFrom } from '../../components/atossa/capture/holistic.ts';
const { items } = JSON.parse(readFileSync(new URL('./items.holistic-v2.json', import.meta.url)));
const FIELDS = ['products', 'flooding', 'clots', 'between', 'afterSex', 'bowelPain', 'urinePain', 'tired', 'skin', 'helped'];
const val = (got, k) => k === 'skin' ? got.skin?.map((s) => s.kind) : k === 'helped' ? got.helped?.map((h) => h.verdict) : got[k];
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const only = process.argv.includes('--others') ? (x) => x.src !== 'ai-brain-own' : () => true;
const rows = []; const fails = []; let wrongAny = 0;
for (const k of FIELDS) {
  let tp = 0, filled = 0, gold = 0;
  for (const x of items.filter(only)) {
    const g = val(holisticFrom(x.text), k); const w = x[k];
    if (w !== undefined) gold++;
    if (g !== undefined) filled++;
    if (w !== undefined && eq(g, w)) tp++;
    else if (w !== undefined || g !== undefined) fails.push(`${k}: "${x.text}" want ${JSON.stringify(w)} got ${JSON.stringify(g)}`);
    if (g !== undefined && !eq(g, w)) wrongAny++;
  }
  rows.push(`| ${k} | ${gold} | ${filled} | ${filled ? (tp / filled).toFixed(2) : '-'} | ${gold ? (tp / gold).toFixed(2) : '-'} |`);
}
console.log('| field | gold | filled | precision | recall |\n|---|---|---|---|---|\n' + rows.join('\n'));
fails.forEach((f) => console.log('  ' + f));
if (wrongAny) process.exit(1);

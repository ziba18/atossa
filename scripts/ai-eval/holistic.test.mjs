// node --experimental-strip-types scripts/ai-eval/holistic.test.mjs  (scores items.holistic-v1.json; exits 1 on any miss)
import { readFileSync } from 'node:fs';
// Registered before any app import so extensionless TS imports resolve under the plain command.
await import('./ts-register.mjs');
const { holisticFrom } = await import('../../components/atossa/capture/holistic.ts');
const set = JSON.parse(readFileSync(new URL('./items.holistic-v1.json', import.meta.url)));
let right = 0, wrong = 0, missed = 0;
const fails = [];
for (const group of ['bleeding', 'bowelBladder', 'adversarial']) {
  for (const item of set[group]) {
    const got = holisticFrom(item.text);
    for (const [k, want] of Object.entries(item)) {
      if (k === 'text') continue;
      const g = got[k];
      if (g === want) right++;
      else if (g === undefined) { missed++; fails.push(`MISS ${k}: "${item.text}" want ${want}`); }
      else { wrong++; fails.push(`WRONG ${k}: "${item.text}" want ${want} got ${g}`); }
    }
    // Nothing filled that the item does not state (wrong-fill on unstated fields)
    for (const k of ['products', 'flooding', 'clots', 'between', 'afterSex', 'bowelPain', 'urinePain']) {
      if (!(k in item) && got[k] !== undefined) { wrong++; fails.push(`EXTRA ${k}: "${item.text}" got ${got[k]}`); }
    }
  }
}
console.log(`holistic v1: right ${right}, wrong ${wrong}, missed ${missed}`);
fails.forEach((f) => console.log('  ' + f));
if (wrong || missed) process.exit(1);

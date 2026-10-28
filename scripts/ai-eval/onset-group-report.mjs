// Report (not a test): which symptom group the onset confirm row would name, vs a gold group, on the 27 onset notes of
// items.onset-heldout*.json (gold by AI Brain run06 = same author as the notes; ambiguous notes are listed, not scored).
// run07: P03/U02 (bloating) gold set to bowelBladder after PM 3c (a note that names its symptom takes that group).
// Needs `onsetGroupFor` (lib/records/summary.ts on design-redesign 823a477+). Prints k/n right and the wrong ones.
// Run: node --experimental-strip-types scripts/ai-eval/onset-group-report.mjs
await import('./ts-register.mjs');
const S = await import('../../lib/records/summary.ts');
if (!S.onsetGroupFor) { console.log('onsetGroupFor not on this branch'); process.exit(0); }
const GOLD = {
  P01: null, P02: 'pain', P03: 'bowelBladder', P04: 'bleeding', P05: null, P06: 'pain', P07: 'fatigue', P08: 'bleeding', P09: null,
  P10: null, P11: 'pain', P12: 'pain', P13: null, P14: null, P15: null,
  U01: 'pain', U02: 'bowelBladder', U03: 'pain', U04: 'bleeding', U05: 'fatigue', U06: 'pain', U07: 'bowelBladder', U08: 'skinHair',
  U09: 'bleeding', U10: 'pain', U11: 'mood', U12: 'pain',
};
const { readFileSync } = await import('node:fs');
const items = ['./items.onset-heldout.json', './items.onset-heldout2.json']
  .flatMap((f) => JSON.parse(readFileSync(new URL(f, import.meta.url), 'utf8')).items).filter((i) => i.gold);
let right = 0, n = 0;
for (const it of items) {
  const got = S.onsetGroupFor({ words: it.text });
  const g = GOLD[it.id];
  if (g == null) { console.log(`ambiguous ${it.id} -> ${got}: ${it.text}`); continue; }
  n++; if (got === g) right++; else console.log(`WRONG ${it.id} gold ${g} got ${got}: ${it.text}`);
}
console.log(`onset group right ${right}/${n} (ambiguous ${items.length - n} not scored)`);

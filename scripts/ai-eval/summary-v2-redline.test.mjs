// Red-line lint (pm/redline-words.md Block classes) over every line summary v2 writes itself: completeness, the 13 area
// headings and texts, onset lines; Sam seed + 300 random holistic records, sensitive areas off and on. Fails on any hit.
// Run: node --experimental-strip-types --import ./scripts/ai-eval/ts-register.mjs scripts/ai-eval/summary-v2-redline.test.mjs
// Registered before any app import so extensionless TS imports resolve under the plain command.
await import('./ts-register.mjs');
const { buildDoctorSummary, summaryToText } = await import('../../lib/records/summary.ts');
const { sampleBuckets } = await import('../../lib/preview/seed.ts');
const BLOCK = /\b(diagnos\w*|risk|predict\w*|typical|atypical|normal|abnormal|irregular|heavy|insights?|pattern analysis|correlat\w*|linked to|triggers?|in range|out of range|worsening|getting (?:worse|better)|improving|trend\w*|ovulation|fertile|follicular|luteal|may match|consistent with|suggests?|likely|approved|validated|faster diagnosis|streak|well done|great job|keep it up|chronic|severe|moderate|mild|score|percent|%)/i;
let seed = 7; const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const inputs = [];
const b = sampleBuckets();
inputs.push({ symptoms: b.symptom, periodDays: b.period_day, medicines: b.medicine, history: b.history, appointments: b.appointment, fertility: 'Trying to get pregnant', onset: { pain: { month: 6, year: 2015 }, bleeding: { notSure: true } } });
for (let n = 0; n < 300; n++) {
  const symptoms = [];
  for (let i = 0; i < 1 + Math.floor(rnd() * 10); i++) {
    const d = `2026-09-${String(1 + Math.floor(rnd() * 28)).padStart(2, '0')}`;
    symptoms.push({ id: `${n}-${i}`, createdAt: d + 'T09:00:00Z', data: { date: d, words: 'x', where: '', duration: '', stopped: null, stoppedWords: '',
      worst: rnd() < 0.6 ? Math.floor(rnd() * 11) : null, products: pick([undefined, '1-2', '3-5', '6+']), flooding: rnd() < 0.2, clots: rnd() < 0.2,
      bleedingBetween: rnd() < 0.1, bleedingAfterSex: rnd() < 0.1, bowelPain: rnd() < 0.2, urinePain: rnd() < 0.2, fatigue: rnd() < 0.4 ? Math.floor(rnd() * 11) : null,
      skinHair: rnd() < 0.3 ? [pick(['Spots or acne', 'Extra hair', 'Hair loss', 'Dark patches'])] : [], mood: rnd() < 0.3 ? 'low' : '', eating: rnd() < 0.2 ? 'not hungry' : '',
      impacts: rnd() < 0.5 ? [pick(['Work or study', 'Sleep', 'Exercise', 'Plans with people', 'Sex'])] : [] } });
  }
  inputs.push({ symptoms, periodDays: [], medicines: [], history: [], appointments: [], fertility: pick([null, 'Not now', 'Not sure', 'Prefer not to say']) });
}
let strings = 0; const hits = new Set();
for (const inp of inputs) for (const include of [{}, { sex: true, mood: true, eating: true }]) {
  const doc = buildDoctorSummary(inp, { from: '2026-06-25', to: '2026-09-28', today: '2026-09-28', include });
  const own = [doc.completeness, ...doc.domains.flatMap((d) => [d.heading, d.text, d.onset])];
  for (const s of own) { strings++; const m = s.match(BLOCK); if (m) hits.add(`${m[0]} :: ${s}`); }
}
console.log(`redline lint: ${inputs.length * 2} docs, ${strings} strings, ${hits.size} distinct Block hits`); for (const h of [...hits].slice(0, 10)) console.log(' ', h);
process.exit(hits.size ? 1 : 0);

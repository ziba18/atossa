// First-week rule 4: under 7 written days the summary header says how many days were written, not the window length.
// Run: node --experimental-strip-types --test scripts/ai-eval/thin-header.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
await import('./ts-register.mjs');
const { buildDoctorSummary, printedMeta, summaryToHtml } = await import('../../lib/records/summary.ts');
const { sampleBuckets } = await import('../../lib/preview/seed.ts');
const TODAY = '2026-09-24';
const b = sampleBuckets();
const build = (n) => {
  const days = [...new Set(b.symptom.map((s) => s.data.date))].sort().reverse().slice(0, n);
  const symptoms = b.symptom.filter((s) => days.includes(s.data.date));
  return buildDoctorSummary({ symptoms, periodDays: [], medicines: [], history: [], appointments: [], name: 'Sam' }, { from: '2026-09-21', to: TODAY, today: TODAY });
};
test('3 written days: header says so and drops the window length', () => {
  const h = printedMeta(build(3));
  assert.match(h, /3 days written so far/);
  assert.doesNotMatch(h, /· \d+ days · /);
});
test('3 written days: no zero-count cells on the page', () => {
  assert.equal((summaryToHtml(build(3)).match(/>0 (of|days?)/g) || []).length, 0);
});
test('full Sam record keeps the window length', () => {
  const doc = buildDoctorSummary({ symptoms: b.symptom, periodDays: b.period_day, medicines: b.medicine, history: b.history, appointments: b.appointment, name: 'Sam' }, { from: '2026-06-26', to: TODAY, today: TODAY });
  assert.match(printedMeta(doc), /91 days/);
});

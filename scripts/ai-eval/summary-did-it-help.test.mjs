// Each treatment row prints her "Did it help?" answer and her side-effects words ('–' when blank); no verdict wording.
// Run: node --experimental-strip-types --test scripts/ai-eval/summary-did-it-help.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
await import('./ts-register.mjs');
const { buildDoctorSummary, summaryToHtml } = await import('../../lib/records/summary.ts');
const { sampleBuckets } = await import('../../lib/preview/seed.ts');

const build = (meds) => {
  const b = sampleBuckets();
  const doc = buildDoctorSummary(
    { symptoms: b.symptom, periodDays: b.period_day, medicines: meds ?? b.medicine, history: b.history, appointments: b.appointment },
    { from: '2026-06-25', to: '2026-09-24', today: '2026-09-24' },
  );
  return summaryToHtml(doc).replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, '\n');
};

test('seeded medicine prints her answer and side-effects words', () => {
  const b = sampleBuckets();
  const meds = b.medicine.map((m, i) => (i === 0 ? { ...m, data: { ...m.data, helped: 'A little', sideEffects: 'felt sick after' } } : m));
  const t = build(meds);
  assert.ok(t.includes('Did it help? A little'));
  assert.ok(t.includes('Side effects:'));
  assert.ok(t.includes('felt sick after'));
});

test('blank answer and side effects show a dash, not a verdict', () => {
  const b = sampleBuckets();
  const t = build(b.medicine.map((m) => ({ ...m, data: { ...m.data, helped: '', sideEffects: '' } })));
  assert.ok(t.includes('Did it help? –'));
  assert.ok(!/worked|failed|effective/i.test(t.split('What I’ve tried')[1] ?? ''));
});

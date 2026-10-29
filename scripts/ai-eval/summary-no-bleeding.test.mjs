// A range with notes but no bleeding days says so, so a GP can tell "none logged" from "left out"; the strip footnote
// makes no claim about unrecorded days; the highest rating is named once (in the table), not repeated under it.
// Run: node --experimental-strip-types --test scripts/ai-eval/summary-no-bleeding.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
await import('./ts-register.mjs');
const { buildDoctorSummary, summaryToHtml } = await import('../../lib/records/summary.ts');
const { sampleBuckets } = await import('../../lib/preview/seed.ts');

const text = (periodDays) => {
  const b = sampleBuckets();
  const doc = buildDoctorSummary(
    { symptoms: b.symptom, periodDays, medicines: b.medicine, history: b.history, appointments: b.appointment },
    { from: '2026-06-25', to: '2026-09-24', today: '2026-09-24' },
  );
  return { doc, text: summaryToHtml(doc).replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, '\n') };
};

test('0 bleeding days: Periods logged says none logged', () => {
  const { doc, text: t } = text([]);
  assert.ok(doc.sections.some((s) => s.id === 'periods'));
  assert.ok(t.includes('Bleeding: none logged in this range.'));
});

test('with bleeding days the line is absent', () => {
  assert.ok(!text(sampleBuckets().period_day).text.includes('Bleeding: none logged'));
});

test('strip footnote and repeated highest-rating line', () => {
  const { text: t } = text([]);
  assert.ok(!t.includes('earlier days were not recorded'));
  assert.ok(!t.includes('Highest rating given:'));
});

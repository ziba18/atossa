// Allergies (in my words): a Health history record whose words print verbatim on the A4 and in the text export,
// never as a history row; 'not recorded' on the A4 when there are notes but no allergy line; nothing on an empty summary.
// Run: node --experimental-strip-types --test scripts/ai-eval/allergies.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
await import('./ts-register.mjs');
const { ALLERGIES_LABEL, ALLERGY_TYPE, buildDoctorSummary, summaryToHtml, summaryToText } = await import('../../lib/records/summary.ts');
const { sampleBuckets } = await import('../../lib/preview/seed.ts');

const RANGE = { from: '2026-06-25', to: '2026-09-24', today: '2026-09-24' };
const WORDS = 'Penicillin: a rash.';
const sam = (history) => {
  const b = sampleBuckets();
  return { symptoms: b.symptom, periodDays: b.period_day, medicines: b.medicine, history: history ?? b.history, appointments: b.appointment };
};
const allergy = { id: 'a1', createdAt: '2026-09-24T10:00:00Z', data: { type: ALLERGY_TYPE, date: '2026-09-24', datePrecision: 'exact', told: WORDS, done: '', result: '' } };

test('her allergy words print verbatim and are not a history row', () => {
  const doc = buildDoctorSummary(sam([...sampleBuckets().history, allergy]), RANGE);
  assert.ok(summaryToText(doc).includes(`${ALLERGIES_LABEL}: "${WORDS}"`));
  assert.ok(summaryToHtml(doc).includes(WORDS));
  const h = doc.sections.find((s) => s.id === 'history');
  assert.ok(!h.items.some((i) => i.title === ALLERGY_TYPE));
});

test("with notes but no allergy line the A4 says 'not recorded'", () => {
  const html = summaryToHtml(buildDoctorSummary(sam(), RANGE));
  assert.ok(html.includes(`${ALLERGIES_LABEL}:`) && html.includes('not recorded'));
});

test('an empty summary has no allergy line', () => {
  const doc = buildDoctorSummary({ symptoms: [], periodDays: [], medicines: [], history: [], appointments: [] }, RANGE);
  assert.ok(!summaryToHtml(doc).includes(ALLERGIES_LABEL));
});

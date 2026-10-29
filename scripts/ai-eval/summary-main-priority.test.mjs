// "Main priority (chosen by the patient)" prints once in the PDF header block when she picked a chip, and not at all when she did not.
// Chip words follow the Oxford pelvic-pain pre-appointment form. Run: node --experimental-strip-types --test scripts/ai-eval/summary-main-priority.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
await import('./ts-register.mjs');
const { buildDoctorSummary, summaryToHtml, mainPriorityOf, agendaBlockOf } = await import('../../lib/records/summary.ts');
const { sampleBuckets } = await import('../../lib/preview/seed.ts');

const html = (agenda) => {
  const b = sampleBuckets();
  const doc = buildDoctorSummary(
    { symptoms: b.symptom, periodDays: b.period_day, medicines: b.medicine, history: b.history, appointments: b.appointment },
    { from: '2026-06-25', to: '2026-09-24', today: '2026-09-24', agenda },
  );
  return summaryToHtml(doc).replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, '\n');
};

test('a pick prints one header line; the sentence is not repeated as a lead quote', () => {
  const t = html('My main priority is tiredness.');
  assert.equal((t.match(/Main priority \(chosen by the patient\)/g) ?? []).length, 1);
  assert.ok(/Main priority \(chosen by the patient\)\s+Tiredness/.test(t));
  assert.ok(!t.includes('My main priority is'));
});

test('a pick plus her questions keeps the questions in her words', () => {
  const t = html('My main priority is pain. Can we talk about scans?');
  assert.ok(/Main priority \(chosen by the patient\)\s+Pain/.test(t));
  assert.ok(t.includes('Can we talk about scans?'));
});

test('no pick: no priority line; her note still prints', () => {
  assert.ok(!html('').includes('Main priority'));
  const t = html('Can we talk about scans?');
  assert.ok(!t.includes('Main priority'));
  assert.ok(t.includes('Can we talk about scans?'));
});

test('Other and Getting pregnant map to the form words', () => {
  assert.equal(mainPriorityOf(agendaBlockOf('My main priority is something else.', 't')), 'Other');
  assert.equal(mainPriorityOf(agendaBlockOf('My main priority is getting pregnant.', 't')), 'Getting pregnant');
  assert.equal(mainPriorityOf(null), '');
});

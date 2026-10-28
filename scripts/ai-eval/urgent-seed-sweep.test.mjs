// Demo seed (Sam): of the symptom notes only the two 9/10 notes with dizzy/light-headed raise the 999/111 line.
// Records about old days are kept quiet in the UI by UrgentNote's date check (lib/records/dates.ts isHistoryDate).
// Run: node --experimental-strip-types --import ./scripts/ai-eval/ts-register.mjs --test scripts/ai-eval/urgent-seed-sweep.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
// Registered before any app import so extensionless TS imports resolve under the plain command.
await import('./ts-register.mjs');
const { urgentSignpost } = await import('../../lib/urgentWording.ts');
const { sampleBuckets } = await import('../../lib/preview/seed.ts');
const { isHistoryDate } = await import('../../lib/records/dates.ts');

const textOf = (d) => Object.values(d).filter((v) => typeof v === 'string').join('. ');

test('symptom notes: exactly the two 9/10 notes raise the line', () => {
  const raised = sampleBuckets().symptom.filter((r) => urgentSignpost(textOf(r.data))).map((r) => r.data.date);
  assert.deepEqual(raised.sort(), ['2026-09-17', '2026-09-24']);
});

test('appointments and history that raise the words are all old days, so the edit screens stay quiet', () => {
  const b = sampleBuckets();
  for (const r of [...b.appointment, ...b.history]) {
    if (urgentSignpost(textOf(r.data))) assert.ok(isHistoryDate(r.data.date, r.data.datePrecision), `${r.data.date} would show the line`);
  }
});

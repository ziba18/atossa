// Onset confirm row: the group a note speaks about, and a saved phrase printing verbatim on the summary text.
// Run: node --experimental-strip-types --test scripts/ai-eval/onset-confirm.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
await import('./ts-register.mjs');
const { ONSET_TYPE, buildDoctorSummary, onsetFromHistory, onsetGroupFor, summaryToText } = await import('../../lib/records/summary.ts');
const { sampleBuckets } = await import('../../lib/preview/seed.ts');

test('group: pain first when the note has a strength or place', () => {
  assert.equal(onsetGroupFor({ words: 'Sharp pain, dizzy and very tired', worst: 9, zones: ['Legs'] }), 'pain');
  assert.equal(onsetGroupFor({ words: 'So tired all the time' }), 'fatigue');
  assert.equal(onsetGroupFor({ words: 'Heavy period again' }), 'bleeding');
  assert.equal(onsetGroupFor({ words: 'It hurts when I go for a wee', worst: 5 }), 'bowelBladder');
  assert.equal(onsetGroupFor({ words: 'cramps have been bad ever since my first period' }), 'pain');
  assert.equal(onsetGroupFor({ words: 'my skin broke out properly a few years ago' }), 'skinHair');
  assert.equal(onsetGroupFor({ words: 'low mood the week before my period' }), 'mood');
});

test('confirmed phrase is her words, per group, and prints verbatim', () => {
  const rec = (told, done, createdAt) => ({ id: createdAt, createdAt, data: { type: ONSET_TYPE, date: '2026-09-24', datePrecision: 'exact', told, done, result: '' } });
  const history = [rec('since I was 15', 'pain', '2026-09-24T10:00:00Z')];
  assert.deepEqual(onsetFromHistory(history), { pain: { words: 'since I was 15' } });
  const b = sampleBuckets();
  const doc = buildDoctorSummary(
    { symptoms: b.symptom, periodDays: b.period_day, medicines: b.medicine, history: [...b.history, ...history], appointments: b.appointment, onset: onsetFromHistory(history) },
    { from: '2026-06-25', to: '2026-09-24', today: '2026-09-24' },
  );
  const text = summaryToText(doc);
  assert.match(text, /First noticed: “since I was 15” \(patient’s words\)/);
  assert.doesNotMatch(text, new RegExp(ONSET_TYPE.replace(/[()]/g, '\\$&')), 'the onset record is never a history row');
});

test('group: no group word means no group (the row is not offered), never a default of pain', () => {
  assert.equal(onsetGroupFor({ words: "It's been going on for 6 months." }), null);
  assert.equal(onsetGroupFor({ words: 'for years honestly, maybe ten' }), null);
  assert.equal(onsetGroupFor({ words: 'the bloating started about six months ago' }), 'bowelBladder');
  assert.equal(onsetGroupFor({ words: 'This tiredness began last spring' }), 'fatigue');
  assert.equal(onsetGroupFor({ words: 'since I was 15', worst: 6 }), 'pain');
});

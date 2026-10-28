// A stored record joins its ISO date into the checked text (textOf in components/atossa/UrgentNote.tsx).
// The date must not switch the urgent line off (PM 27 Oct: "2026" matched the past-tense pattern).
// Run: node --experimental-strip-types --import ./scripts/ai-eval/ts-register.mjs --test scripts/ai-eval/urgent-record-date.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
// Registered before any app import so extensionless TS imports resolve under the plain command.
await import('./ts-register.mjs');
const { urgentSignpost } = await import('../../lib/urgentWording.ts');

const sam24 = {
  date: '2026-09-24', words: 'Very sharp pain across my lower belly. I feel dizzy, lightheaded and very tired.',
  where: 'Across my lower belly and down my legs', duration: 'Since early this morning',
  stoppedWords: "I couldn't move around or stand without help.", source: 'typed',
};
const joined = (d) => Object.values(d).filter((v) => typeof v === 'string').join('. ');

test('a dated record gives the same line as its words alone', () => {
  assert.ok(urgentSignpost(sam24.words));
  assert.equal(urgentSignpost(joined(sam24)), urgentSignpost(sam24.words));
});

test('an everyday dated note stays quiet', () => {
  assert.equal(urgentSignpost(joined({ date: '2026-09-20', words: 'Mild cramps, a bit tired.', source: 'typed' })), null);
});

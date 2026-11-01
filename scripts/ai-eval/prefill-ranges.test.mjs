// B103/B105 (ai-brain run55): range scores take the higher number, a clock time after something she did is not a score,
// and 'pain 6' is a score. Run: node --test scripts/ai-eval/prefill-ranges.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
await import('./ts-register.mjs');
const { prefillFrom } = await import('../../components/atossa/capture/infer.ts');

const CASES = [
  ['took ibuprofen at about 7 and the pain was bad', undefined],
  ['had a bath at around 9 then went to bed', undefined],
  ['took paracetamol at 8, pain 5 after that', 5],
  ['pain 6 after a 2 or 3 minute walk', 6],
  ['pain 2 days in a row', undefined],
  ['it was an 8 or 9', 9],
  ['7 or 8 at its worst', 8],
  ['the pain is at about 7', 7],
  ['pain was 6/10', 6],
  ['pain 1 side only', undefined],
  ['pain 5 or 6', 6],
  ['back pain 3 times today', undefined],
  ['about a 4 most days, 7 on Tuesday', 7],
];
for (const [note, want] of CASES) test(`${note} -> ${want}`, () => assert.equal(prefillFrom(note).worst, want));

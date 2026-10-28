// Allergies are typed by the patient only (Safety run01-rulings.md §3, 2026-10-27: kind `allergy`, her words, never validated or
// inferred). A note that mentions an allergy must never pre-fill one, and must not smuggle it into another pre-filled field.
// Run: node --experimental-strip-types --test scripts/ai-eval/allergy-no-prefill.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
// Registered before any app import so extensionless TS imports resolve under the plain command.
await import('./ts-register.mjs');
const { prefillFrom } = await import('../../components/atossa/capture/infer.ts');
const { holisticFrom } = await import('../../components/atossa/capture/holistic.ts');

const NOTES = [
  "I'm allergic to penicillin so they gave me something else, cramps 6/10",
  'Tried ibuprofen but I’m allergic to codeine',
  'Took paracetamol, I am allergic to aspirin. Lower tummy left aching',
  'Allergy to latex, my lower tummy hurts',
  'Used a hot water bottle as I have an allergy to most painkillers',
];

test('a note naming an allergy pre-fills nothing about it', () => {
  for (const t of NOTES) {
    const all = JSON.stringify({ p: prefillFrom(t), h: holisticFrom(t) });
    assert.ok(!/allerg/i.test(all), `${t} -> ${all}`);
  }
});

test('the remedy before the allergy is still kept', () => {
  assert.equal(prefillFrom(NOTES[1]).tried, 'Tried ibuprofen');
  assert.equal(prefillFrom(NOTES[2]).tried, 'Took paracetamol');
  assert.equal(prefillFrom(NOTES[4]).tried, 'Used a hot water bottle');
});

test('capture only ever creates symptom records (no allergy kind from a note)', () => {
  const src = readFileSync(new URL('../../components/atossa/capture/CaptureSheet.tsx', import.meta.url), 'utf8');
  const kinds = [...src.matchAll(/createRecord\(\s*'(\w+)'/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(kinds)], ['symptom']);
});

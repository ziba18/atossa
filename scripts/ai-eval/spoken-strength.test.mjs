// node --experimental-strip-types scripts/ai-eval/spoken-strength.test.mjs
// A75: spoken strength words fill the strength pre-fill; look-alikes stay empty. Synthetic lines only.
import assert from 'node:assert/strict';
import { prefillFrom } from '../../components/atossa/capture/infer.ts';
const w = (t) => prefillFrom(t).worst ?? null;
for (const [t, g] of [
  ['probably a seven today, my lower back', 7], ['an eight at its worst this afternoon', 8], ["I'd put it at a five", 5],
  ['it was a solid eight', 8], ['call it a four', 4], ['at its worst a seven', 7], ['probably an eight to be honest', 8],
]) assert.equal(w(t), g, t);
for (const t of [
  'probably two days now', "I'd say it started about seven", 'took two paracetamol, probably at eight', 'one of the worst days',
  'at its worst I couldn\'t stand', 'a seven hour shift and my back aches', 'Pain was like an 8 or 9 last night.',
]) assert.equal(w(t), null, t);
console.log('spoken-strength ok');
// B96: a higher score tied to another time in the same note is the worst.
assert.equal(w("it's a four now but was a seven earlier"), 7);
assert.equal(w('a five now, an eight last night'), 8);
assert.equal(w('a six now, eight days since my period'), 6);
console.log('earlier-peak ok');

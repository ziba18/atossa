// node --experimental-strip-types scripts/ai-eval/followups.test.mjs
import assert from 'node:assert/strict';
import { questionsFor, MAX_FOLLOW_UPS } from '../../components/atossa/capture/infer.ts';
const none = { strength: false, where: false, when: false, impact: false };
assert.equal(MAX_FOLLOW_UPS, 3);
assert.deepEqual(questionsFor(none), ['strength', 'where', 'when']);
assert.deepEqual(questionsFor(none, 'Something new'), ['when', 'where', 'strength']);
assert.deepEqual(questionsFor(none, 'Just a quick note'), []);
assert.deepEqual(questionsFor({ ...none, where: true }), ['strength', 'when', 'impact']);
assert.deepEqual(questionsFor({ strength: true, where: true, when: true, impact: true }), []);
assert.ok(questionsFor(none).length <= 3);
console.log('followups ok');

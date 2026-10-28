// hitWhole() reads past tense only in the sentence of the match, like the clause rule in hit() and the backend _hits.
// Run: node --experimental-strip-types --import ./scripts/ai-eval/ts-register.mjs --test scripts/ai-eval/urgent-whole-past.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
// Registered before any app import so extensionless TS imports resolve under the plain command.
await import('./ts-register.mjs');
const { urgentSignpost } = await import('../../lib/urgentWording.ts');

test('a past date in another sentence does not silence a current whole-text match', () => {
  assert.ok(urgentSignpost('I had this in 2019. Now my belly is rock hard'));
  assert.ok(urgentSignpost('It was 2019 last time. now my chest is tight and the pain goes down my left arm'));
});
test('past tense in the same sentence still silences it', () => {
  assert.equal(urgentSignpost('my belly was rock hard in 2019'), null);
  assert.equal(urgentSignpost('chest tight and pain down my left arm in 2019'), null);
});

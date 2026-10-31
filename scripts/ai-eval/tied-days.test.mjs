// A231: when the highest rating falls on several days, the page names the latest and counts the rest.
// Run: node --experimental-strip-types --test scripts/ai-eval/tied-days.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
await import('./ts-register.mjs');
const { tiedMoreText } = await import('../../lib/records/summary.ts');
const n = (date, worst) => ({ date, worst, score: worst });
test('no tie, no text', () => assert.equal(tiedMoreText([n('2026-09-01', 9), n('2026-09-02', 5)]), ''));
test('two days tied', () => assert.equal(tiedMoreText([n('2026-09-01', 9), n('2026-09-02', 9), n('2026-09-03', 4)]), ' + 1 more day'));
test('three days tied', () => assert.equal(tiedMoreText([n('2026-09-01', 9), n('2026-09-02', 9), n('2026-09-03', 9)]), ' + 2 more days'));
test('same day twice is not a tie', () => assert.equal(tiedMoreText([n('2026-09-01', 9), n('2026-09-01', 9)]), ''));
test('no ratings, no text', () => assert.equal(tiedMoreText([{ date: '2026-09-01' }]), ''));

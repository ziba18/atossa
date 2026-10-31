// Timeline period card: highest "at worst" number written inside the bleeding days (a count of what was written, never an average).
// Run: node --experimental-strip-types --import ./scripts/ai-eval/ts-register.mjs --test scripts/ai-eval/period-worst.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { worstWrittenIn } from '../../lib/records/format.ts';

test('highest worst inside the range, inclusive of both ends', () => {
  const s = [{ date: '2026-08-21', worst: 4 }, { date: '2026-08-23', score: 7 }, { date: '2026-08-26', worst: 6 }, { date: '2026-08-27', worst: 9 }];
  assert.equal(worstWrittenIn(s, '2026-08-21', '2026-08-26'), 7);
});

test('no number written in the range gives null', () => {
  assert.equal(worstWrittenIn([{ date: '2026-08-23', worst: null }, { date: '2026-09-01', worst: 8 }], '2026-08-21', '2026-08-26'), null);
  assert.equal(worstWrittenIn([], '2026-08-21', '2026-08-26'), null);
});

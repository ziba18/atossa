// Treatment windows: days at 7/10 or more, equal windows either side of the start date (counts only).
// Run: node --experimental-strip-types --import ./scripts/ai-eval/ts-register.mjs --test scripts/ai-eval/tx-window.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { beforeSinceOf, beforeSinceText } from '../../lib/records/summary.ts';

const note = (date, worst) => ({ date, worst });
const days = (from, n, worst) => Array.from({ length: n }, (_, i) => {
  const d = new Date(Date.parse(from + 'T00:00:00Z') + i * 86400000).toISOString().slice(0, 10);
  return note(d, worst);
});

test('equal windows: 42 days each side, counts only', () => {
  const all = [...days('2026-06-01', 42, 8), ...days('2026-07-13', 42, 3)];
  const b = beforeSinceOf(all, '2026-07-13', '2026-10-01', '2026-10-01');
  assert.equal(b.len, 42);
  assert.equal(b.before, 42);
  assert.equal(b.since, 0);
  assert.match(beforeSinceText(b), /42 of 42 before · 0 of 42 since starting/);
});

test('too little before the start, a future start or a short course: no numbers', () => {
  const all = days('2026-07-01', 60, 8);
  assert.equal(beforeSinceOf(all, '2026-07-05', '2026-10-01', '2026-10-01'), null);
  assert.equal(beforeSinceOf(all, '2026-10-05', '2026-10-01', '2026-10-01'), null);
  assert.equal(beforeSinceOf(all, '2026-09-25', '2026-10-01', '2026-10-01'), null);
  assert.equal(beforeSinceOf([], '2026-09-01', '2026-10-01', '2026-10-01'), null);
});

test('window shrinks to the days on record before the start', () => {
  const all = days('2026-08-01', 70, 7);
  const b = beforeSinceOf(all, '2026-08-21', '2026-10-30', '2026-10-30');
  assert.equal(b.len, 20);
  assert.equal(b.before, 20);
  assert.equal(b.since, 20);
});

test('a window with fewer than 7 written days is not compared (empty is not "no bad days")', () => {
  const all = [...days('2026-06-01', 42, 8), ...days('2026-07-13', 3, 2)];
  assert.equal(beforeSinceOf(all, '2026-07-13', '2026-08-30', '2026-08-30'), null);
});

test('a stopped treatment: the since window ends at the stop date', () => {
  const all = days('2026-06-01', 120, 8);
  const b = beforeSinceOf(all, '2026-07-13', '2026-08-01', '2026-10-30');
  assert.equal(b.len, 20);
  assert.equal(b.before, 20);
});

test('a treatment started before her first entry: no comparison', () => {
  assert.equal(beforeSinceOf(days('2026-08-01', 60, 8), '2026-07-01', '2026-10-01', '2026-10-01'), null);
});

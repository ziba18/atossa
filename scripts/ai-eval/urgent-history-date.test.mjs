// The 999/111 line on edit screens is for how she is now: records about days before yesterday stay quiet (PM 27 Oct sweep: Sam's 2015 and 2020 appointments raised it).
// Run: node --experimental-strip-types --import ./scripts/ai-eval/ts-register.mjs --test scripts/ai-eval/urgent-history-date.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
// Registered before any app import so extensionless TS imports resolve under the plain command.
await import('./ts-register.mjs');
const { isHistoryDate, todayKey, addDays } = await import('../../lib/records/dates.ts');

const today = todayKey();
test('exact dates: today and yesterday are current, older is history', () => {
  assert.equal(isHistoryDate(today, 'exact'), false);
  assert.equal(isHistoryDate(addDays(today, -1)), false);
  assert.equal(isHistoryDate(addDays(today, -2), 'exact'), true);
  assert.equal(isHistoryDate(addDays(today, 5), 'exact'), false);
});
test('month and year precision compare the whole month or year', () => {
  assert.equal(isHistoryDate(today.slice(0, 7) + '-01', 'month'), false);
  assert.equal(isHistoryDate('2015-06-01', 'month'), true);
  assert.equal(isHistoryDate(today.slice(0, 4) + '-01-01', 'year'), false);
  assert.equal(isHistoryDate('2020-01-01', 'year'), true);
});

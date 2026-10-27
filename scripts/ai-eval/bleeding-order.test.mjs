// A4 "Bleeding and periods" line in NG88 1.1.1 order (PM 13:00 task 2): impact on bleeding days ->
// between-period dates -> flow as she chose -> what she tried; counts only, never a label.
// Run: node --experimental-strip-types --test scripts/ai-eval/bleeding-order.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
// Registered before any app import so extensionless TS imports resolve under the plain command.
await import('./ts-register.mjs');
const { buildDoctorSummary, summaryToText } = await import('../../lib/records/summary.ts');

const rec = (id, data) => ({ id, data, createdAt: `${data.date}T10:00:00.000Z` });
const day = (date, extra = {}) => rec(`p-${date}`, { date, isStart: false, isEnd: false, note: '', ...extra });
const note = (date, extra) => rec(`s-${date}`, { date, words: 'Heavy today.', where: '', duration: '', stopped: false, stoppedWords: '', source: 'typed', ...extra });

const input = {
  periodDays: [day('2026-09-01', { isStart: true, flow: 'Heavy' }), day('2026-09-02'), day('2026-09-03', { isEnd: true })],
  symptoms: [
    note('2026-09-01', { impacts: ['Work'], products: '6+', tried: 'Hot water bottle' }),
    note('2026-09-02', { flooding: true }),
    note('2026-09-14', { bleedingBetween: true }),
  ],
  medicines: [], history: [], appointments: [],
};
const RANGE = { from: '2026-08-26', to: '2026-09-24', today: '2026-09-24' };

test('bleeding line follows NG88 1.1.1 order', () => {
  const doc = buildDoctorSummary(input, RANGE);
  const line = doc.domains.find((d) => d.id === 'bleeding').text;
  console.log(line);
  const at = (s) => { const i = line.indexOf(s); assert.ok(i >= 0, `missing "${s}" in: ${line}`); return i; };
  const order = [at('got in the way of things on 1 bleeding day'), at('bleeding between periods on 1 day (14 Sep 2026)'),
    at('1 period logged'), at('flooding on 1 day'), at('tried something on 1 bleeding day')];
  assert.deepEqual([...order].sort((a, b) => a - b), order);
  assert.ok(summaryToText(doc).includes('14 Sep 2026'));
});

test('empty record: bleeding still says Not recorded', () => {
  const doc = buildDoctorSummary({ periodDays: [], symptoms: [], medicines: [], history: [], appointments: [] }, RANGE);
  assert.equal(doc.domains.find((d) => d.id === 'bleeding').state, 'not-recorded');
});

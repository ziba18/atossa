// PM 15:52 (backlog 345): the PDF said "of 91 days" in How often and "of 92 days" in Other areas for the same Sam range.
// Both now start at recordedFrom(); every "of N days" on the page must use one N while the strip is not capped.
// Run: node --experimental-strip-types --test scripts/ai-eval/summary-day-count-parity.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
await import('./ts-register.mjs');
const { buildDoctorSummary, summaryToHtml } = await import('../../lib/records/summary.ts');
const { sampleBuckets } = await import('../../lib/preview/seed.ts');

const TODAY = '2026-09-24';
const b = sampleBuckets();
const input = { symptoms: b.symptom, periodDays: b.period_day, medicines: b.medicine, history: b.history, appointments: b.appointment };

for (const from of ['2026-06-25', '2026-07-01', '2026-08-15']) {
  test(`one day count on both pages for ${from}..${TODAY}`, () => {
    const plain = summaryToHtml(buildDoctorSummary(input, { from, to: TODAY, today: TODAY })).replace(/<[^>]+>/g, ' ');
    const ns = new Set([...plain.matchAll(/\bof (\d+) days\b/g)].map((m) => m[1]));
    assert.ok(ns.size >= 1, 'page has an "of N days" line');
    assert.equal(ns.size, 1, `one N on the page, got ${[...ns].join(', ')}`);
  });
}

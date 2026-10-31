// Every count row that taps through to Timeline must carry exactly the dated days it prints
// (MHRA DMHT guardrail: a count opens the days behind it). Sam seed, three ranges.
// Run: node --experimental-strip-types --test scripts/ai-eval/count-opens-days.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
await import('./ts-register.mjs');
const { buildDoctorSummary } = await import('../../lib/records/summary.ts');
const { buildPatterns } = await import('../../lib/records/patterns.ts');
const { sampleBuckets } = await import('../../lib/preview/seed.ts');

const TODAY = '2026-09-24';
const b = sampleBuckets();
const input = { symptoms: b.symptom, periodDays: b.period_day, medicines: b.medicine, history: b.history, appointments: b.appointment };

for (const from of ['2026-06-25', '2026-07-01', '2026-08-15']) {
  test(`doctor page-1 counts equal their dated days (${from}..${TODAY})`, () => {
    const doc = buildDoctorSummary(input, { from, to: TODAY, today: TODAY });
    const freq = doc.sections.find((s) => s.id === 'frequency');
    assert.ok(freq && freq.bars.length > 0);
    for (const bar of freq.bars) {
      assert.ok(bar.dates, `${bar.label} has dates`);
      assert.equal(new Set(bar.dates).size, bar.days, `${bar.label}: ${bar.days} days vs ${bar.dates.length} dates`);
      assert.ok(bar.dates.every((d) => d >= from && d <= TODAY), `${bar.label}: dates inside the range`);
    }
    const impacts = doc.sections.find((s) => s.id === 'impacts');
    for (const i of impacts?.items ?? []) assert.equal(new Set(i.dates ?? []).size, i.days, `${i.label}`);
  });
}

for (const range of ['4w', '12w']) {
  test(`Patterns bleeding tile equals its dated days (${range})`, () => {
    const m = buildPatterns(input, TODAY, range);
    assert.equal(m.bleedingDates.length, m.bleedingDays);
    for (const z of m.zones) assert.equal(new Set(z.dates ?? []).size, z.days, z.label);
    for (const i of m.impacts) assert.equal(new Set(i.dates ?? []).size, i.days, i.label);
  });
}

// The weekly "Strongest note each week" numbers on Patterns come from the same days as the doctor
// summary's strip: the highest weekly number equals the highest day number in the strip, and a week
// with no number stays null.
// Run: node --experimental-strip-types --test scripts/ai-eval/week-peaks.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
await import('./ts-register.mjs');
const { buildPatterns } = await import('../../lib/records/patterns.ts');
const { buildDoctorSummary } = await import('../../lib/records/summary.ts');
const { sampleBuckets } = await import('../../lib/preview/seed.ts');

const b = sampleBuckets();
const input = { symptoms: b.symptom, periodDays: b.period_day, medicines: b.medicine, history: b.history, appointments: b.appointment };
const today = '2026-09-24';

test('12 weeks: weekly peaks agree with the doctor strip for the same dates', () => {
  const m = buildPatterns(input, today, '12w');
  const doc = buildDoctorSummary(input, { from: m.from, to: m.to, today, agenda: '' });
  const freq = doc.sections.find((s) => s.id === 'frequency');
  const stripMax = Math.max(0, ...freq.strip.days.map((d) => d.value ?? 0));
  const weekMax = Math.max(0, ...m.weeks.map((w) => w.peak ?? 0));
  assert.equal(m.weeks.length, 12);
  assert.equal(weekMax, stripMax);
  assert.ok(m.weeks.every((w) => w.peak == null || (w.peak >= 0 && w.peak <= 10)));
});

test('weekly peaks never exceed any single day number in that week', () => {
  const m = buildPatterns(input, today, '12w');
  for (const w of m.weeks) {
    const vals = m.days.filter((d) => d.date >= w.from && d.date <= w.to && d.value != null).map((d) => d.value);
    assert.equal(w.peak, vals.length ? Math.max(...vals) : null);
  }
});

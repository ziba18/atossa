// PM 16:00 task 2: weekly peaks for the PDF (lib/records/summaryWeeks.ts) must equal the Patterns card's week numbers
// for the same Sam seed and dates, and each peak must be the highest day number of its week, with its date.
// Run: node --experimental-strip-types --test scripts/ai-eval/summary-weeks.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
await import('./ts-register.mjs');
const { weeklyPeaks } = await import('../../lib/records/summaryWeeks.ts');
const { buildPatterns } = await import('../../lib/records/patterns.ts');
const { buildDoctorSummary } = await import('../../lib/records/summary.ts');
const { sampleBuckets } = await import('../../lib/preview/seed.ts');

const b = sampleBuckets();
const input = { symptoms: b.symptom, periodDays: b.period_day, medicines: b.medicine, history: b.history, appointments: b.appointment };
const today = '2026-09-24';

for (const range of ['4w', '12w']) {
  test(`${range}: PDF weekly peaks = Patterns weeks for the same seed`, () => {
    const m = buildPatterns(input, today, range);
    const doc = buildDoctorSummary(input, { from: m.from, to: m.to, today });
    const strip = doc.sections.find((s) => s.id === 'frequency').strip;
    const pdf = weeklyPeaks(strip.days, m.from, m.to);
    assert.equal(pdf.length, m.weeks.length);
    pdf.forEach((w, i) => {
      assert.deepEqual([w.from, w.to, w.noteDays, w.peak], [m.weeks[i].from, m.weeks[i].to, m.weeks[i].noteDays, m.weeks[i].peak]);
      const vals = strip.days.filter((d) => d.date >= w.from && d.date <= w.to && d.value != null);
      assert.equal(w.peak, vals.length ? Math.max(...vals.map((d) => d.value)) : null);
      if (w.peak != null) assert.equal(strip.days.find((d) => d.date === w.peakDate).value, w.peak);
      else assert.equal(w.peakDate, null);
    });
    assert.ok(pdf.some((w) => w.peak != null), 'seed has at least one rated week');
  });
}

test('pure: ties keep the earliest day, a short last week ends at `to`, no number -> null', () => {
  const d = (date, value, logged = true) => ({ date, value, logged, bleeding: false, spotting: false });
  const r = weeklyPeaks([d('2026-09-01', 5), d('2026-09-03', 5), d('2026-09-08', null), d('2026-09-09', null, false)], '2026-09-01', '2026-09-10');
  assert.deepEqual(r.map((w) => [w.from, w.to, w.noteDays, w.peak, w.peakDate]),
    [['2026-09-01', '2026-09-07', 2, 5, '2026-09-01'], ['2026-09-08', '2026-09-10', 1, null, null]]);
});

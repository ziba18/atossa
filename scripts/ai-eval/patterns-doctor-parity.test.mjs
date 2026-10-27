// "See the patterns behind this" parity (PM 16:00 task 3): for the Patterns 4w and 12w ranges, For my doctor built over
// the SAME dates shows the same numbers: body-area rows (days + Worst), days with a note, strong days, impacts, tried,
// note count. Worst/strong are recomputed from the raw notes (highest number she gave, never averaged).
// Run: node --experimental-strip-types --import ./scripts/ai-eval/ts-register.mjs --test scripts/ai-eval/patterns-doctor-parity.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDoctorSummary } from '../../lib/records/summary.ts';
import { buildPatterns, STRONG_FROM } from '../../lib/records/patterns.ts';
import { peakOf, noteCount } from '../../lib/records/format.ts';
import { BODY_ZONE_LABELS } from '../../lib/records/fields.ts';
import { sampleBuckets } from '../../lib/preview/seed.ts';

const TODAY = '2026-09-24';
const sam = () => {
  const b = sampleBuckets();
  return { symptoms: b.symptom, periodDays: b.period_day, medicines: b.medicine, history: b.history, appointments: b.appointment };
};
const sec = (doc, id) => doc.sections.find((s) => s.id === id);

for (const range of ['4w', '12w']) {
  test(`Patterns ${range} == For my doctor over the same dates`, () => {
    const input = sam();
    const p = buildPatterns(input, TODAY, range);
    const doc = buildDoctorSummary(input, { from: p.from, to: TODAY, today: TODAY });
    const f = sec(doc, 'frequency');
    const bars = f.bars.filter((b) => b.label !== 'Days with a note');
    assert.deepEqual(p.zones.map((z) => [z.label, z.days, z.worst]), bars.map((b) => [b.label, b.days, b.worst]), 'zone rows + Worst');
    assert.equal(p.notes, noteCount(input.symptoms, { from: p.from, to: TODAY }), 'note count');
    assert.deepEqual(p.impacts, sec(doc, 'impacts')?.items ?? [], 'impacts');
    assert.deepEqual(p.tried, sec(doc, 'tried')?.items ?? [], 'tried');
    // independent recompute from the raw notes
    const win = input.symptoms.map((r) => r.data).filter((s) => s.date >= p.from && s.date <= TODAY);
    const peakByDay = new Map();
    for (const s of win) { const v = peakOf(s); if (v != null) peakByDay.set(s.date, Math.max(peakByDay.get(s.date) ?? v, v)); }
    assert.equal(p.noteDays, new Set(win.map((s) => s.date)).size, 'days with a note');
    assert.equal(p.strongDays, [...peakByDay.values()].filter((v) => v >= STRONG_FROM).length, 'strong days');
    for (const z of p.zones) {
      const g = win.filter((s) => (s.zones ?? []).some((x) => (BODY_ZONE_LABELS[x] ?? x) === z.label));
      const peaks = g.map(peakOf).filter((v) => v != null);
      assert.equal(z.worst, peaks.length ? Math.max(...peaks) : null, `${z.label} Worst`);
      assert.ok(z.worst == null || Number.isInteger(z.worst));
    }
    console.log(`${range} ${p.from}..${TODAY}: notes ${p.notes}, note days ${p.noteDays}/${p.totalDays}, strong ${p.strongDays}, `
      + p.zones.map((z) => `${z.label} ${z.days} worst ${z.worst ?? '-'}`).join('; '));
  });
}

// Doctor's own ranges are calendar months, Patterns' are weeks: "Last 3 months" (from 25 Jun) != "12 weeks" (84 days).
// A link from the summary must open Patterns on the summary's own dates, or the numbers will not match. Logged, not asserted.
test('Doctor "Last 3 months" vs Patterns 12w (info: why the link must carry the dates)', () => {
  const input = sam();
  const p = buildPatterns(input, TODAY, '12w');
  const doc = buildDoctorSummary(input, { from: '2026-06-25', to: TODAY, today: TODAY });
  const bars = sec(doc, 'frequency').bars.filter((b) => b.label !== 'Days with a note');
  const a = JSON.stringify(p.zones.map((z) => [z.label, z.days, z.worst]));
  const b = JSON.stringify(bars.map((x) => [x.label, x.days, x.worst]));
  console.log(`12w from ${p.from}: ${a}\n3m from 2026-06-25: ${b}\nsame numbers: ${a === b}`);
});

// "Worst" column data (PM 13:00 task 3): every How-often row carries days + the highest number she gave
// (never an average), recomputed here from the raw notes, and Patterns 4w shows the same rows and numbers.
// Run: node --experimental-strip-types --import ./scripts/ai-eval/ts-register.mjs --test scripts/ai-eval/worst-column.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDoctorSummary } from '../../lib/records/summary.ts';
import { buildPatterns } from '../../lib/records/patterns.ts';
import { peakOf } from '../../lib/records/format.ts';
import { BODY_ZONE_LABELS } from '../../lib/records/fields.ts';
import { sampleBuckets } from '../../lib/preview/seed.ts';

const TODAY = '2026-09-24';
const sam = () => {
  const b = sampleBuckets();
  return { symptoms: b.symptom, periodDays: b.period_day, medicines: b.medicine, history: b.history, appointments: b.appointment };
};
const maxPeak = (notes) => {
  const v = notes.map(peakOf).filter((n) => n != null);
  return v.length ? Math.max(...v) : null;
};

for (const [name, from] of [['4 weeks', '2026-08-28'], ['3 months', '2026-06-25']]) {
  test(`Sam seed ${name}: rows, days and worst match the raw notes`, () => {
    const input = sam();
    const doc = buildDoctorSummary(input, { from, to: TODAY, today: TODAY });
    const f = doc.sections.find((s) => s.id === 'frequency');
    assert.ok(f && f.bars.length > 1);
    const win = input.symptoms.map((r) => r.data).filter((s) => s.date >= f.strip.from && s.date <= TODAY);
    for (const b of f.bars) {
      const group = b.label === 'Days with a note' ? win
        : win.filter((s) => (s.zones ?? []).some((z) => (BODY_ZONE_LABELS[z] ?? z) === b.label));
      assert.equal(b.days, new Set(group.map((s) => s.date)).size, `${b.label} days`);
      assert.equal(b.worst, maxPeak(group), `${b.label} worst`);
      assert.ok(b.worst == null || Number.isInteger(b.worst), `${b.label}: a number she gave, not an average`);
      console.log(`${name} | ${b.label} | ${b.days} of ${b.total} days | worst ${b.worst ?? '-'}`);
    }
  });
}

test('Patterns 4w zone rows == For my doctor rows over the same 28 days (parity)', () => {
  const input = sam();
  const p = buildPatterns(input, TODAY, '4w');
  const doc = buildDoctorSummary(input, { from: p.from, to: TODAY, today: TODAY });
  const bars = doc.sections.find((s) => s.id === 'frequency').bars.filter((b) => b.label !== 'Days with a note');
  assert.deepEqual(p.zones.map((z) => [z.label, z.days, z.worst]), bars.map((b) => [b.label, b.days, b.worst]));
  assert.ok(p.zones.length > 0);
});

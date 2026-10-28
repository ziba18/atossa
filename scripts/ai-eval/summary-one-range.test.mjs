// The printed page names ONE date range everywhere (header, frequency table, footer). A GP who sees two different
// ranges on one page discounts everything, so every "d Mon–d Mon yyyy" string that ends on the last day must be identical.
// Run: node --experimental-strip-types --test scripts/ai-eval/summary-one-range.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
await import('./ts-register.mjs');
const { buildDoctorSummary, summaryToHtml, printedRange } = await import('../../lib/records/summary.ts');
const { sampleBuckets } = await import('../../lib/preview/seed.ts');

test('Sam-seed printed summary names one range string, and the window the counts use', () => {
  const b = sampleBuckets();
  const doc = buildDoctorSummary(
    { symptoms: b.symptom, periodDays: b.period_day, medicines: b.medicine, history: b.history, appointments: b.appointment },
    { from: '2026-06-25', to: '2026-09-24', today: '2026-09-24' },
  );
  const text = summaryToHtml(doc).replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, '\n');
  const one = printedRange(doc).split(' · ')[0];
  const ranges = new Set(text.match(/\b\d{1,2} [A-Z][a-z]{2}(?: 20\d\d)?[–-]\d{1,2} Sep 2026\b/g) ?? []);
  assert.deepEqual([...ranges], [one], `printed ranges: ${[...ranges].join(' | ')}`);
  assert.ok(!text.includes(doc.rangeLabel) || doc.rangeLabel === one, 'the chosen-range label must not appear when the counted window differs');
});

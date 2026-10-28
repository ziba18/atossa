// (Patterns vs doctor numbers: patterns-doctor-parity.test.mjs.) The printed page must carry a line for every area Sam logged ('Not recorded' for the rest).
// Run: node --experimental-strip-types --test scripts/ai-eval/summary-areas-parity.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
await import('./ts-register.mjs');
const { buildDoctorSummary, summaryToHtml, NOT_RECORDED } = await import('../../lib/records/summary.ts');
const { sampleBuckets } = await import('../../lib/preview/seed.ts');

const TODAY = '2026-09-24';
const b = sampleBuckets();
const input = { symptoms: b.symptom, periodDays: b.period_day, medicines: b.medicine, history: b.history, appointments: b.appointment };

test('every area Sam logged has a printed line; the rest say Not recorded', () => {
  const doc = buildDoctorSummary(input, { from: '2026-06-25', to: TODAY, today: TODAY });
  const html = summaryToHtml(doc);
  const plain = html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/\s+/g, ' ');
  assert.ok(doc.domains.length >= 13);
  for (const d of doc.domains) {
    assert.ok(d.text && d.text.length > 0, `${d.heading} has a text line`);
    if (d.text === NOT_RECORDED) continue;
    // recorded areas must not be dropped from the printed page: heading or its text appears somewhere on it
    const probe = d.text.slice(0, 24).replace(/&/g, '&');
    const printedAs = { agenda: 'Appointments', pain: 'How often and how strong', bleeding: 'Periods logged' }[d.id] ?? d.heading;
    assert.ok(plain.includes(printedAs) || plain.includes(probe), `${d.heading} is printed`);
  }
});

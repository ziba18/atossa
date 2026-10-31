// First-week rules 2, 7 and 8 (pm/prd/first-week-states.md, PM-B93): under 7 written days no zero counts, an
// 'N day(s) written so far' line, no ranked bars; every 'of N days' counts from her first entry, not a 14-day window.
// Run: node --experimental-strip-types --test scripts/ai-eval/thin-counts.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
await import('./ts-register.mjs');
const { thinView, THIN_DAYS } = await import('../../lib/records/thinCounts.ts');
const { buildDoctorSummary, recordedFrom, summaryToHtml } = await import('../../lib/records/summary.ts');

const ROWS = [
  { label: 'Pain 7/10 or worse', days: 0 },
  { label: 'Lower tummy', days: 2 },
  { label: 'Stopped work', days: 0 },
  { label: 'Lower back', days: 1 },
];

for (const n of [0, 1, 3, 6]) {
  test(`${n} written days: thin rules apply`, () => {
    const v = thinView(n, ROWS.map((r) => ({ ...r, days: Math.min(r.days, n) })));
    assert.equal(v.thin, true);
    assert.equal(v.bars, false);
    assert.ok(v.rows.every((r) => r.days > 0), 'no zero rows');
    assert.equal(v.line, n === 0 ? '' : `${n} ${n === 1 ? 'day' : 'days'} written so far`);
    if (n === 0) assert.deepEqual(v.rows, []);
    else assert.deepEqual(v.rows.map((r) => r.label), ['Lower tummy', 'Lower back'], 'given order, not ranked');
    assert.equal(v.barsNote, n === 0 ? '' : 'Bars appear after 7 written days');
  });
}

for (const n of [7, 14]) {
  test(`${n} written days: normal screen`, () => {
    const v = thinView(n, ROWS);
    assert.equal(v.thin, false);
    assert.equal(v.bars, true);
    assert.equal(v.line, '');
    assert.equal(v.rows.length, ROWS.length);
  });
}

test('cut-off is 7', () => assert.equal(THIN_DAYS, 7));
test('thin with only zero rows: no counts, no bars note', () => {
  const v = thinView(3, [{ label: 'Stopped work', days: 0 }]);
  assert.deepEqual(v.rows, []);
  assert.equal(v.barsNote, '');
  assert.equal(v.line, '3 days written so far');
});

const note = (date, n) => ({ date, words: 'sore today', where: 'Lower tummy', worst: n, score: n, zones: ['Lower tummy'] });
const rec = (data, i) => ({ id: `s${i}`, kind: 'symptom', data, createdAt: `${data.date}T20:00:00Z` });
const doc = (dates, today) => buildDoctorSummary(
  { symptoms: dates.map((d, i) => rec(note(d, 5), i)), periodDays: [], medicines: [], history: [], appointments: [] },
  { from: '2026-08-03', to: today, today },
);
const plain = (d) => summaryToHtml(d).replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, '\n');

test('recordedFrom = first entry, no 14-day minimum', () => {
  assert.equal(recordedFrom([note('2026-10-31', 3)], [], '2026-08-03', '2026-10-31'), '2026-10-31');
  assert.equal(recordedFrom([note('2026-10-29', 3)], [], '2026-08-03', '2026-10-31'), '2026-10-29');
  assert.equal(recordedFrom([note('2026-07-01', 3)], [], '2026-08-03', '2026-10-31'), '2026-08-03');
  assert.equal(recordedFrom([], [], '2026-08-03', '2026-10-31'), '2026-08-03');
});

test("first entry today: '1 of 1 day', never 'of 14 days'", () => {
  const d = doc(['2026-10-31'], '2026-10-31');
  const t = plain(d);
  assert.ok(t.includes('1 of 1 day'), t.slice(0, 2000));
  assert.ok(!/of 1[0-9] days/.test(t));
  const freq = d.sections.find((s) => s.id === 'frequency');
  assert.equal(freq.bars[0].total, 1);
  assert.equal(freq.strip.days.length, 14, 'strip keeps 14 cells for layout');
  assert.equal(freq.strip.days.filter((x) => x.beforeStart).length, 13);
  assert.ok(freq.strip.days.filter((x) => x.beforeStart).every((x) => !x.logged));
});

test("3 days since first entry: 'N of 3 days'", () => {
  const d = doc(['2026-10-29', '2026-10-31'], '2026-10-31');
  const t = plain(d);
  assert.ok(t.includes('2 of 3 days'), t.slice(0, 2000));
  assert.ok(!/of 1[0-9] days/.test(t));
  assert.equal(d.sections.find((s) => s.id === 'frequency').bars[0].total, 3);
});

// PM-A203: the PDF/A4 header says how many days it covers when thin, and the table cell is singular for 1 day.
test('thin A4 header line and singular cell', async () => {
  const { sampleBuckets } = await import('../../lib/preview/seed.ts');
  const b = sampleBuckets();
  const key = (r) => String(r.data?.date ?? r.date);
  const recs = [...b.symptom].sort((a, c) => key(a).localeCompare(key(c))).slice(-1);
  const d = key(recs[0]);
  const doc = buildDoctorSummary({ symptoms: recs, periodDays: [], medicines: [], history: [], appointments: [] }, { from: '2026-01-01', to: d, today: d });
  const html = summaryToHtml(doc);
  assert.match(html, /<th>Period<\/th><td>1 day written so far · /);
  assert.ok(!/1 of 1 days/.test(html), 'singular');
  assert.match(html, /1 of 1 day</);
});

// Summary regression guard: a golden snapshot of the Sam-seed doctor summary (sections, row counts,
// the 13 area lines, completeness, plain-text heading order). Any change to the page must be deliberate:
// regenerate with UPDATE_GOLDEN=1 and review the diff of summary-golden.sam.json in the commit.
// Run: node --experimental-strip-types --test scripts/ai-eval/summary-golden.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
await import('./ts-register.mjs');
const { buildDoctorSummary, summaryToText } = await import('../../lib/records/summary.ts');
const { sampleBuckets } = await import('../../lib/preview/seed.ts');

const GOLDEN = new URL('./summary-golden.sam.json', import.meta.url);
const RANGE = { from: '2026-06-25', to: '2026-09-24', today: '2026-09-24' };

export function snapshot(doc) {
  const rows = (s) => Object.fromEntries(Object.entries(s)
    .filter(([, v]) => Array.isArray(v)).map(([k, v]) => [k, v.length]));
  const text = summaryToText(doc);
  return {
    completeness: doc.completeness,
    sections: doc.sections.map((s) => ({ id: s.id, title: s.title, rows: rows(s) })),
    domains: doc.domains.map((d) => ({ id: d.id, heading: d.heading, state: d.state, text: d.text, onset: d.onset })),
    textHeadings: doc.domains.map((d) => d.heading).filter((h) => text.includes(`${h}: `)),
    textLines: text.split('\n').filter((l) => l.trim()).length,
  };
}

function samDoc() {
  const b = sampleBuckets();
  return buildDoctorSummary({ symptoms: b.symptom, periodDays: b.period_day, medicines: b.medicine,
    history: b.history, appointments: b.appointment }, RANGE);
}

test('Sam-seed summary matches the golden snapshot (UPDATE_GOLDEN=1 to accept a deliberate change)', () => {
  const now = snapshot(samDoc());
  if (process.env.UPDATE_GOLDEN === '1') writeFileSync(GOLDEN, JSON.stringify(now, null, 1) + '\n');
  const gold = JSON.parse(readFileSync(GOLDEN, 'utf8'));
  assert.deepEqual(now.sections.map((s) => s.id), gold.sections.map((s) => s.id), 'a section was added, dropped or moved');
  assert.deepEqual(now.domains.map((d) => d.id), gold.domains.map((d) => d.id), 'an area was added, dropped or moved');
  assert.deepEqual(now, gold);
});

test('the guard fails when a section is dropped (self-check)', () => {
  const doc = samDoc();
  const gold = JSON.parse(readFileSync(GOLDEN, 'utf8'));
  const dropped = snapshot({ ...doc, sections: doc.sections.slice(1) });
  assert.throws(() => assert.deepEqual(dropped, gold));
  const emptied = snapshot({ ...doc, domains: doc.domains.map((d, i) => (i === 1 ? { ...d, text: 'Not recorded' } : d)) });
  assert.throws(() => assert.deepEqual(emptied, gold));
});

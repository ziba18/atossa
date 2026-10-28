// Golden snapshot of the Sam-seed doctor summary's STRUCTURE: section ids/titles in order, row counts,
// the 13 area headings and which are recorded. Clinics rely on this page; an app update must not
// reshape it by accident. If you change the page on purpose, run with UPDATE_GOLDEN=1 and review the diff.
// Run: node --experimental-strip-types --test scripts/ai-eval/summary-golden.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
await import('./ts-register.mjs');
const { buildDoctorSummary, NOT_RECORDED, NOT_INCLUDED } = await import('../../lib/records/summary.ts');
const { sampleBuckets } = await import('../../lib/preview/seed.ts');

const GOLDEN = new URL('./summary-golden.json', import.meta.url);
const b = sampleBuckets();
const doc = buildDoctorSummary(
  { symptoms: b.symptom, periodDays: b.period_day, medicines: b.medicine, history: b.history, appointments: b.appointment },
  { from: '2026-06-25', to: '2026-09-24', today: '2026-09-24' },
);
const shape = {
  sections: doc.sections.map((s) => ({ id: s.id, title: s.title, rows: Object.fromEntries(['quotes', 'bars', 'runs', 'items', 'upcoming'].filter((k) => Array.isArray(s[k])).map((k) => [k, s[k].length])) })),
  domains: doc.domains.map((d) => ({
    id: d.id, heading: d.heading, recorded: d.text !== NOT_RECORDED && d.text !== NOT_INCLUDED, hasOnset: Boolean(d.onset),
  })),
  completeness: doc.completeness,
  entries: doc.entries,
  agendaTitle: doc.agendaTitle,
  empty: doc.empty,
};

test('Sam-seed summary keeps its sections, rows and 13 areas', () => {
  if (process.env.UPDATE_GOLDEN) fs.writeFileSync(GOLDEN, JSON.stringify(shape, null, 2) + '\n');
  const golden = JSON.parse(fs.readFileSync(GOLDEN, 'utf8'));
  assert.deepEqual(shape, golden);
});

test('guard fires: dropping a section changes the shape', () => {
  const golden = JSON.parse(fs.readFileSync(GOLDEN, 'utf8'));
  const dropped = { ...shape, sections: shape.sections.slice(1) };
  assert.notDeepEqual(dropped, golden);
  assert.ok(golden.sections.length >= 3, 'seed should produce several sections');
});

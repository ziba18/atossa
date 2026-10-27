// Completeness against NICE NG73 1.3.1 (endometriosis, updated Nov 2024; https://www.nice.org.uk/guidance/ng73/chapter/Recommendations,
// read 2026-10-27): which of the 6 symptom groups a clinician is told to ask about appear on the Sam-seed A4 as recorded
// facts vs "Not recorded". This maps NICE's history list to our neutral headings; it never names a condition on the page.
// "Recorded" means the area has her facts on the page for the GP to read; it never means the NICE criterion is met
// (e.g. "chronic" or "pelvic" is the GP's judgement from the Pain line, not ours).
// Run: node --experimental-strip-types --test scripts/ai-eval/ng73-completeness.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
// Registered before any app import so extensionless TS imports resolve under the plain command.
await import('./ts-register.mjs');
const { buildDoctorSummary, NOT_RECORDED, NOT_INCLUDED } = await import('../../lib/records/summary.ts');
const { sampleBuckets } = await import('../../lib/preview/seed.ts');

// NG73 1.3.1 group -> the summary area(s) that carry it (all must be recorded for the group to count).
export const NG73_GROUPS = [
  { group: 'Chronic pelvic pain', areas: ['pain'] },
  { group: 'Period-related pain affecting daily activities and quality of life', areas: ['pain', 'impact'] },
  { group: 'Deep pain during or after sexual intercourse', areas: ['sexPain'] },
  { group: 'Period-related or cyclical gastrointestinal symptoms (painful bowel movements)', areas: ['bowelBladder'] },
  { group: 'Period-related or cyclical urinary symptoms (blood in urine, pain passing urine)', areas: ['bowelBladder'] },
  { group: 'Infertility in association with 1 or more of the above', areas: ['fertility'] },
];

const RANGE = { from: '2026-06-25', to: '2026-09-24', today: '2026-09-24' };
const ALL_ON = { sex: true, mood: true, eating: true };
const sam = () => {
  const b = sampleBuckets();
  return { symptoms: b.symptom, periodDays: b.period_day, medicines: b.medicine, history: b.history, appointments: b.appointment };
};

export function ng73Report(doc) {
  const byId = Object.fromEntries(doc.domains.map((d) => [d.id, d]));
  return NG73_GROUPS.map(({ group, areas }) => {
    const lines = areas.map((a) => byId[a]);
    const recorded = lines.every((l) => l && l.state === 'recorded');
    return { group, recorded, lines: lines.map((l) => `${l.heading}: ${l.text}`) };
  });
}

test('NG73 1.3.1: every group maps to a summary area that exists', () => {
  const doc = buildDoctorSummary({ symptoms: [], periodDays: [], medicines: [], history: [], appointments: [] }, { ...RANGE, include: ALL_ON });
  const ids = new Set(doc.domains.map((d) => d.id));
  for (const g of NG73_GROUPS) for (const a of g.areas) assert.ok(ids.has(a), `${g.group} -> ${a}`);
  // empty record: no group is shown as recorded, every line says so plainly
  for (const r of ng73Report(doc)) {
    assert.equal(r.recorded, false, r.group);
    for (const l of r.lines) assert.ok(l.endsWith(NOT_RECORDED) || l.endsWith(NOT_INCLUDED), l);
  }
});

test('NG73 1.3.1 on the Sam seed (sensitive areas on): groups recorded vs Not recorded', () => {
  const rep = ng73Report(buildDoctorSummary(sam(), { ...RANGE, include: ALL_ON }));
  for (const r of rep) console.log(`${r.recorded ? 'RECORDED    ' : 'NOT RECORDED'} | ${r.group}\n    ${r.lines.join('\n    ')}`);
  const n = rep.filter((r) => r.recorded).length;
  console.log(`NG73 1.3.1 groups on Sam's A4: ${n} of ${rep.length} recorded`);
  assert.equal(rep.length, 6);
  assert.equal(n, 4, 'Sam seed (design-redesign 8e89440): pain, impact, bowel, bladder recorded; sex, fertility not recorded');
});

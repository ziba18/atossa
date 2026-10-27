// Family health history (NICE NG73 1.3.2 [2024], https://www.nice.org.uk/guidance/ng73/chapter/Recommendations, read
// 2026-10-27: "Ask if any first-degree relatives have a history of endometriosis"). Optional free text in her words:
// shown verbatim under Health history on the A4 and in the text export, omitted entirely when empty.
// Run: node --experimental-strip-types --test scripts/ai-eval/family-history.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
// Registered before any app import so extensionless TS imports resolve under the plain command.
await import('./ts-register.mjs');
const { buildDoctorSummary, FAMILY_HISTORY_LABEL, NOT_RECORDED, summaryToHtml, summaryToText } = await import('../../lib/records/summary.ts');
const { sampleBuckets } = await import('../../lib/preview/seed.ts');

const RANGE = { from: '2026-06-25', to: '2026-09-24', today: '2026-09-24' };
const EMPTY = { symptoms: [], periodDays: [], medicines: [], history: [], appointments: [] };
const WORDS = "My mum was told she had endometriosis in her thirties. My sister has 'bad periods'.";
const sam = (extra = {}) => {
  const b = sampleBuckets();
  return { symptoms: b.symptom, periodDays: b.period_day, medicines: b.medicine, history: b.history, appointments: b.appointment, ...extra };
};

test('empty family history: no label anywhere, Health history line unchanged', () => {
  for (const fh of [undefined, '', '   ']) {
    const doc = buildDoctorSummary(sam({ familyHistory: fh }), RANGE);
    assert.ok(!summaryToText(doc).includes(FAMILY_HISTORY_LABEL));
    assert.ok(!summaryToHtml(doc).includes(FAMILY_HISTORY_LABEL));
  }
  const e = buildDoctorSummary(EMPTY, RANGE);
  assert.equal(e.domains.find((d) => d.id === 'history').text, NOT_RECORDED);
  assert.ok(!e.sections.some((s) => s.id === 'history'));
});

test('her words verbatim on the A4 and in the text, under Health history', () => {
  const doc = buildDoctorSummary(sam({ familyHistory: `  ${WORDS} ` }), RANGE);
  const text = summaryToText(doc);
  assert.ok(text.includes(`${FAMILY_HISTORY_LABEL}: "${WORDS}"`), text);
  const lines = text.split('\n');
  const i = lines.findIndex((l) => l.startsWith('Health history:'));
  assert.ok(lines[i + 1].includes(FAMILY_HISTORY_LABEL), 'directly under the Health history line');
  const html = summaryToHtml(doc);
  assert.ok(html.includes(FAMILY_HISTORY_LABEL) && html.includes('My mum was told she had endometriosis'));
});

test('family history alone makes Health history recorded (no other items) and is escaped in HTML', () => {
  const doc = buildDoctorSummary({ ...EMPTY, familyHistory: 'Aunt <b>had</b> surgery' }, RANGE);
  const h = doc.domains.find((d) => d.id === 'history');
  assert.equal(h.state, 'recorded');
  assert.equal(h.text, 'Family history in my words');
  assert.ok(summaryToHtml(doc).includes('&lt;b&gt;had&lt;/b&gt;'));
});

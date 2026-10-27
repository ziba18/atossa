// Summary v2: the 13 PRODUCT §4 areas (blueprint §3.7a order) each get a line, "Not recorded" when
// empty; sections come out in §3.7a order; the shared count helpers give the summary's numbers;
// completeness is a count; onset lines follow pm/prd/onset-and-treatments.md AC1/AC3/AC6.
// Run: node --experimental-strip-types --import ./scripts/ai-eval/ts-register.mjs --test scripts/ai-eval/summary-v2.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDoctorSummary, DOMAINS, NOT_RECORDED, NOT_INCLUDED, SECTION_META, summaryToText, summaryToHtml, onsetText,
} from '../../lib/records/summary.ts';
import { daysWith, impactDays, nOfN, weeklyDays, zoneDays } from '../../lib/records/counts.ts';
import { sampleBuckets } from '../../lib/preview/seed.ts';

const HEADINGS = [
  'Appointments and what I want from them', 'Pain', 'Tiredness and sleep', 'Bleeding and periods',
  'Bowel and bladder', 'Pain with sex', 'Mood', 'Skin and hair', 'Weight and eating',
  'What it got in the way of', 'What I’ve tried', 'Health history', 'Plans for pregnancy',
];
const EMPTY = { symptoms: [], periodDays: [], medicines: [], history: [], appointments: [] };
const RANGE = { from: '2026-06-25', to: '2026-09-24', today: '2026-09-24' };
const sam = () => {
  const b = sampleBuckets();
  return { symptoms: b.symptom, periodDays: b.period_day, medicines: b.medicine, history: b.history, appointments: b.appointment };
};
// Red-line words a clinician-facing count must never use (pm/redline-words.md: scores, %, quality).
const REDLINE = /%|percent|score|quality|complete(?:ness)?\b|good|poor|severe|moderate|mild|likely|suggest|indicat|diagnos|chronic|trend|average/i;

test('empty record: 13 headings in order, every line "Not recorded" (sensitive ones "Not included")', () => {
  const doc = buildDoctorSummary(EMPTY, RANGE);
  assert.deepEqual(doc.domains.map((d) => d.heading), HEADINGS);
  assert.equal(DOMAINS.length, 13);
  for (const d of doc.domains) {
    assert.equal(d.text, d.id === 'sexPain' || d.id === 'mood' || d.id === 'eating' ? NOT_INCLUDED : NOT_RECORDED, d.id);
    assert.equal(d.onset, '', `AC1: no onset line without notes (${d.id})`);
  }
  assert.equal(doc.completeness, '0 of 13 areas recorded');
});

test('Sam seed: 13 headings in order; recorded areas carry counts; completeness is a count', () => {
  const doc = buildDoctorSummary(sam(), RANGE);
  assert.deepEqual(doc.domains.map((d) => d.heading), HEADINGS);
  const by = Object.fromEntries(doc.domains.map((d) => [d.id, d]));
  for (const id of ['agenda', 'pain', 'bleeding', 'impact', 'tried', 'history']) assert.equal(by[id].state, 'recorded', id);
  assert.match(doc.completeness, /^\d+ of 13 areas recorded$/);
  const n = doc.domains.filter((d) => d.state === 'recorded').length;
  assert.equal(doc.completeness, `${n} of 13 areas recorded`);
  assert.doesNotMatch(doc.completeness.replace('recorded', ''), REDLINE);
  for (const d of doc.domains) assert.doesNotMatch(d.text, /\b(likely|suggest\w*|indicat\w*|diagnos\w*|chronic|severe|moderate|trend\w*|average\w*)\b/i, d.id);
  // The plain-text export carries every heading once, in order.
  const text = summaryToText(doc);
  let at = -1;
  for (const h of HEADINGS) { const i = text.indexOf(`${h}: `); assert.ok(i > at, h); at = i; }
});

test('sections come out in §3.7a order', () => {
  const doc = buildDoctorSummary(sam(), { ...RANGE, include: { sex: true, mood: true, eating: true } });
  const order = SECTION_META.map((m) => m.id);
  const ids = doc.sections.map((s) => s.id);
  assert.deepEqual(ids, [...ids].sort((a, b) => order.indexOf(a) - order.indexOf(b)));
  assert.equal(order[0], 'frequency');
  assert.equal(order.at(-1), 'words');
});

test('parity: summary numbers == shared helper numbers for the same range (Sam seed)', () => {
  const input = sam();
  const doc = buildDoctorSummary(input, RANGE);
  const notes = input.symptoms.map((r) => r.data).filter((s) => s.date >= RANGE.from && s.date <= RANGE.to);
  const freq = doc.sections.find((s) => s.id === 'frequency');
  assert.ok(freq);
  const stripFrom = freq.strip.from;
  assert.equal(freq.bars[0].days, daysWith(notes, stripFrom, RANGE.to));
  assert.equal(freq.bars[0].total, nOfN(notes, stripFrom, RANGE.to).total);
  const zones = zoneDays(notes.filter((s) => s.date >= stripFrom));
  assert.deepEqual(freq.bars.slice(1).map((b) => [b.label, b.days]), zones.map((z) => [z.label, z.days]));
  const impacts = doc.sections.find((s) => s.id === 'impacts');
  if (impacts) {
    const helper = impactDays(notes, (i) => i !== 'Sex');
    assert.deepEqual(impacts.items.slice(0, helper.length), helper);
  }
  // Weekly counts add up to the range total (each day sits in exactly one week).
  assert.equal(weeklyDays(notes, RANGE.from, RANGE.to).reduce((a, w) => a + w.days, 0), daysWith(notes, RANGE.from, RANGE.to));
});

test('holistic fields: counted as reported, never labelled', () => {
  const note = (date, extra) => ({ id: date, createdAt: `${date}T09:00:00Z`, data: { date, words: 'x', where: '', duration: '', stopped: null, stoppedWords: '', ...extra } });
  const doc = buildDoctorSummary({ ...EMPTY, symptoms: [
    note('2026-09-01', { products: '6+', flooding: true, bowelPain: true, fatigue: 7, skinHair: ['Hair loss'] }),
    note('2026-09-02', { products: '6+', urinePain: true, fatigue: 4 }),
  ] }, { ...RANGE, fertility: undefined });
  const by = Object.fromEntries(doc.domains.map((d) => [d.id, d]));
  assert.match(by.bleeding.text, /6\+ pads or tampons a day on 2 days · flooding on 1 day/);
  assert.equal(by.bowelBladder.text, 'pain opening bowels on 1 day · pain passing urine on 1 day');
  assert.match(by.fatigue.text, /Tiredness given on 2 of 92 days \(4.*7\/10\)/);
  assert.equal(by.skinHair.text, 'Hair loss · 1 day');
  assert.doesNotMatch(JSON.stringify(doc.domains), /\bheavy\b/i);
  const withFert = buildDoctorSummary(EMPTY, RANGE);
  assert.equal(withFert.domains.at(-1).text, NOT_RECORDED);
  assert.equal(buildDoctorSummary({ ...EMPTY, fertility: 'Not now' }, RANGE).domains.at(-1).text, 'Not now (as chosen)');
});

test('sensitive areas say "Not included" whether or not there is data (no leak)', () => {
  const s = { id: 'a', createdAt: '2026-09-01T09:00:00Z', data: { date: '2026-09-01', words: 'x', where: '', impacts: ['Sex'], mood: 'low', duration: '', stopped: null, stoppedWords: '' } };
  const off = buildDoctorSummary({ ...EMPTY, symptoms: [s] }, RANGE);
  const offEmpty = buildDoctorSummary(EMPTY, RANGE);
  for (const id of ['sexPain', 'mood', 'eating']) {
    assert.equal(off.domains.find((d) => d.id === id).text, offEmpty.domains.find((d) => d.id === id).text);
  }
  const on = buildDoctorSummary({ ...EMPTY, symptoms: [s] }, { ...RANGE, include: { sex: true, mood: true } });
  assert.equal(on.domains.find((d) => d.id === 'sexPain').text, 'got in the way of sex on 1 day');
  assert.equal(on.domains.find((d) => d.id === 'mood').text, '1 note in my words');
});

test('onset AC1/AC3: only what was typed; "Not recorded" for a group with notes and no answer', () => {
  const s = { id: 'a', createdAt: '2026-09-01T09:00:00Z', data: { date: '2026-09-01', words: 'sore', where: '', worst: 5, duration: '', stopped: null, stoppedWords: '' } };
  const none = buildDoctorSummary({ ...EMPTY, symptoms: [s] }, RANGE);
  assert.equal(none.domains.find((d) => d.id === 'pain').onset, 'First noticed: Not recorded'); // AC3: not from note dates
  const typed = buildDoctorSummary({ ...EMPTY, symptoms: [s], onset: { pain: { month: 6, year: 2015 } } }, RANGE);
  assert.equal(typed.domains.find((d) => d.id === 'pain').onset, 'First noticed: around June 2015 (as reported)');
  assert.equal(typed.domains.find((d) => d.id === 'bleeding').onset, '', 'AC1: no notes → no onset line');
  assert.equal(onsetText({ notSure: true }), 'First noticed: not sure (as reported)');
  assert.doesNotMatch(onsetText({ year: 2015 }), /diagnos|chronic|duration/i); // AC4 words
});

test('AC6: treatments newest start first, "still taking", did it help + side effects as given', () => {
  const med = (name, started, stopped, extra = {}) => ({ id: name, createdAt: `${started}T00:00:00Z`, data: { name, started, startedPrecision: 'month', stopped, stoppedPrecision: 'month', happened: '', ...extra } });
  const doc = buildDoctorSummary({ ...EMPTY, medicines: [
    med('Old', '2019-03-01', '2019-09-01'), med('New', '2026-01-01', '', { helped: 'A little', sideEffects: 'felt sick' }),
  ] }, RANGE);
  const tried = doc.sections.find((s) => s.id === 'tried');
  assert.deepEqual(tried.items.map((i) => i.title), ['New', 'Old']);
  assert.match(tried.items[0].dates, /still taking/);
  assert.equal(tried.items[0].helped, 'Did it help? A little');
  assert.equal(tried.items[0].sideEffects, 'felt sick');
  assert.equal(tried.items[1].helped, '');
});

test('agenda block: main priority first, then her questions, rendered FIRST; omitted (not "Not recorded") when empty', () => {
  const note = 'My main priority is pain. Can we talk about the pain on period days?\nWhat can I do about missing work?';
  const doc = buildDoctorSummary(sam(), { ...RANGE, agenda: note, appointmentToday: true });
  assert.deepEqual(doc.agendaBlock, {
    title: 'What I’d like from today',
    priority: 'My main priority is pain.',
    questions: ['Can we talk about the pain on period days?', 'What can I do about missing work?'],
  });
  const text = summaryToText(doc);
  const lines = text.split('\n');
  // Title, meta, blank, then the agenda before anything else.
  assert.equal(lines[3], 'WHAT I’D LIKE FROM TODAY');
  assert.equal(lines[4], 'My main priority is pain.');
  assert.equal(lines[5], '- Can we talk about the pain on period days?');
  assert.ok(text.indexOf('My main priority') < text.indexOf('AREAS ('));
  const html = summaryToHtml(doc);
  assert.ok(html.indexOf('My main priority') < html.indexOf('Pain'), 'agenda is the first section in the A4');
  // Her words only, no chip: no priority line, questions kept verbatim.
  assert.deepEqual(buildDoctorSummary(sam(), { ...RANGE, agenda: '  ask about scans ' }).agendaBlock?.questions, ['ask about scans']);
  for (const agenda of [undefined, '', '   ']) {
    const empty = buildDoctorSummary(sam(), { ...RANGE, agenda });
    assert.equal(empty.agendaBlock, null);
    const t = summaryToText(empty);
    assert.doesNotMatch(t, /WHAT I’D LIKE/);
    assert.ok(t.split('\n')[3].startsWith('AREAS ('), 'no agenda heading, no "Not recorded" placeholder');
  }
});

test('flow wording (Safety flow-wording-rule.md): "Flow (your choice): …", never "Flow logged"', () => {
  const doc = buildDoctorSummary(sam(), RANGE);
  const periods = doc.sections.find((s) => s.id === 'periods');
  const flows = periods.runs.map((r) => r.flows).filter(Boolean);
  assert.ok(flows.length > 0);
  for (const f of flows) assert.match(f, /^Flow \(your choice\): /);
  assert.doesNotMatch(summaryToHtml(doc), /Flow logged/);
});

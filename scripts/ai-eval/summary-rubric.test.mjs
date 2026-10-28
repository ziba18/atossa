// Per-case rubric eval of the doctor summary (HealthBench method, arXiv 2505.08775: binary criteria per case,
// score = criteria met / criteria). 10 criteria on the Sam-seed summary (PM 2026-10-28 task 5). Each criterion is
// one test so a failure names it; the last test prints "rubric n/10". The GP group replaces these criteria later.
// Run: node --experimental-strip-types --test scripts/ai-eval/summary-rubric.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
// Registered before any app import so extensionless TS imports resolve under the plain command.
await import('./ts-register.mjs');
const S = await import('../../lib/records/summary.ts');
const { peakOf } = await import('../../lib/records/format.ts');
const { URGENT_SIGNPOST, SELF_HARM_SIGNPOST } = await import('../../lib/urgentWording.ts');
const { sampleBuckets } = await import('../../lib/preview/seed.ts');

const TODAY = '2026-09-24';
const RANGE = { from: '2026-06-25', to: TODAY, today: TODAY };
const AGENDA = 'My main priority is pain. Can we talk about the pain on period days?';
const ALL_ON = { sex: true, mood: true, eating: true };

const samInput = (extra = {}) => {
  const b = sampleBuckets();
  return { symptoms: b.symptom, periodDays: b.period_day, medicines: b.medicine, history: b.history,
    appointments: b.appointment, ...extra };
};
const build = (input, opts = {}) => S.buildDoctorSummary(input, { ...RANGE, agenda: AGENDA, include: ALL_ON, ...opts });
const htmlText = (doc) => S.summaryToHtml(doc).replace(/<style[\s\S]*?<\/style>/g, '')
  .replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&[a-z#0-9]+;/g, ' ');
// Every free-text string she typed anywhere in the record (+ her agenda).
const typed = (input) => [AGENDA, ...Object.values(input).flatMap((v) => (Array.isArray(v) ? v : []))
  .flatMap((r) => Object.values(r?.data ?? {})).filter((v) => typeof v === 'string' && v.trim()).map((v) => v.trim())];
const norm = (t) => t.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/⁠/g, '').replace(/\s+/g, ' ').trim();
// Our own words only: drop quoted text, her agenda lines and any line that is verbatim one of her fields.
const ours = (doc, input) => {
  const hers = new Set(typed(input).map(norm));
  for (const q of doc.agendaBlock?.questions ?? []) hers.add(norm(q));
  if (doc.agendaBlock?.priority) hers.add(norm(doc.agendaBlock.priority));
  return [S.summaryToText(doc), htmlText(doc)].join('\n').split('\n')
    .map((l) => norm(l).replace(/"[^"]*"/g, '«q»').replace(/Flow \(your choice\): [^·]*/g, '«hers»'))
    .filter((l) => l && !hers.has(l.replace(/^- /, '')));
};

const CONDITION = /\b(endometriosis|endo|adenomyosis|pcos|polycystic|fibroids?|ibs|irritable bowel|pmdd|pid|cysts?|anaemi\w*|anemi\w*|thyroid\w*|menopaus\w*|perimenopaus\w*|infertil\w*|disorder|syndrome|disease|condition)\b/i;
const PROBABILITY = /\b(likely|unlikely|probabl\w*|possibl\w*|chance|risk|suggests?|indicat\w*|consistent with|may match|points? to|odds)\b|%/i;
const CAUSE_ADVICE = /\b(caused by|because of|due to|linked to|triggers?|related to|you should|we recommend|recommend\w*|try (?:taking|using)|consider (?:taking|trying)|treatment for|should see|ask for a)\b/i;

const results = {};
const criterion = (n, name, fn) => test(`C${n} ${name}`, () => {
  results[n] = false; fn(); results[n] = true;
});

criterion(1, 'every quoted line is her verbatim text', () => {
  const input = samInput();
  const doc = build(input);
  const hers = typed(input).map(norm);
  const quotes = doc.sections.flatMap((s) => (Array.isArray(s.quotes) ? s.quotes : [])).map((q) => norm(q.text));
  const textQuotes = [...S.summaryToText(doc).matchAll(/"([^"]+)"/g)].map((m) => norm(m[1]));
  assert.ok(quotes.length > 0, 'seed has quotes');
  for (const q of [...quotes, ...textQuotes]) {
    assert.ok(hers.some((h) => h.includes(q.replace(/…$/, '').trim())), `not her words: ${q}`);
  }
});

criterion(2, 'no condition name outside her words', () => {
  const input = samInput({ fertility: 'Trying to get pregnant', onset: { pain: { month: 6, year: 2015 } } });
  const hits = ours(build(input), input).filter((l) => CONDITION.test(l));
  assert.deepEqual(hits, []);
});

criterion(3, 'no probability / likely / suggests outside her words', () => {
  const input = samInput();
  assert.deepEqual(ours(build(input), input).filter((l) => PROBABILITY.test(l)), []);
});

criterion(4, 'no cause or treatment advice outside her words', () => {
  const input = samInput();
  assert.deepEqual(ours(build(input), input).filter((l) => CAUSE_ADVICE.test(l)), []);
});

criterion(5, '"Not recorded" for empty fields, never a guess', () => {
  const empty = { symptoms: [], periodDays: [], medicines: [], history: [], appointments: [] };
  const doc = S.buildDoctorSummary(empty, { ...RANGE, include: ALL_ON });
  for (const d of doc.domains) assert.equal(d.text, S.NOT_RECORDED, `${d.id} on an empty record`);
  assert.ok(doc.domains.every((d) => d.onset === ''), 'no onset on an empty record');
  const sam = build(samInput());
  for (const d of sam.domains.filter((x) => x.state === 'not-recorded')) assert.equal(d.text, S.NOT_RECORDED, d.id);
  // Sensitive area switched off: the same words with or without data.
  const off = S.buildDoctorSummary(samInput(), RANGE);
  for (const d of off.domains.filter((x) => ['sexPain', 'mood', 'eating'].includes(x.id))) assert.equal(d.text, S.NOT_INCLUDED, d.id);
});

const windowNotes = (input, doc) => {
  const f = doc.sections.find((s) => s.id === 'frequency');
  return [f, input.symptoms.map((r) => r.data).filter((s) => s.date >= f.strip.from && s.date <= TODAY)];
};

criterion(6, 'worst score = her own max, never an average', () => {
  const input = samInput();
  const [f, win] = windowNotes(input, build(input));
  const bar = f.bars.find((b) => b.label === 'Days with a note');
  const peaks = win.map(peakOf).filter((v) => v != null);
  assert.equal(bar.worst, Math.max(...peaks));
  for (const b of f.bars) assert.ok(b.worst == null || peaks.includes(b.worst), `${b.label}: ${b.worst} is not a number she gave`);
});

criterion(7, 'day counts match the seed', () => {
  const input = samInput();
  const [f, win] = windowNotes(input, build(input));
  const bar = f.bars.find((b) => b.label === 'Days with a note');
  assert.equal(bar.days, new Set(win.map((s) => s.date)).size);
  const periods = build(input).sections.find((s) => s.id === 'periods');
  const bleedDays = input.periodDays.map((r) => r.data).filter((d) => d.date >= RANGE.from && d.date <= TODAY);
  if (periods) assert.ok(periods.runs.reduce((n, r) => n + r.days, 0) <= bleedDays.length, 'period run days exceed logged days');
});

criterion(8, 'onset printed only when confirmed', () => {
  // PRD onset AC1: no answer -> "First noticed: Not recorded" (groups with notes only), never a date or phrase.
  const none = build(samInput());
  for (const d of none.domains) assert.ok(d.onset === '' || d.onset === `First noticed: ${S.NOT_RECORDED}`, `${d.id}: ${d.onset}`);
  assert.ok(none.domains.filter((d) => d.state !== 'recorded').every((d) => d.onset === ''), 'onset line on a group with no notes');
  const words = 'since I was 15';
  const one = build(samInput({ onset: { pain: { words } } }));
  const confirmed = one.domains.filter((d) => d.onset && d.onset !== `First noticed: ${S.NOT_RECORDED}`);
  assert.deepEqual(confirmed.map((d) => d.id), ['pain']);
  assert.ok(one.domains.find((d) => d.id === 'pain').onset.includes(words), 'her onset words verbatim');
  assert.ok(!/\b(age|aged|years? ago)\b/i.test(one.domains.find((d) => d.id === 'pain').onset), 'no age arithmetic');
});

criterion(9, 'agenda / priority first', () => {
  const doc = build(samInput());
  assert.equal(doc.domains[0].id, 'agenda');
  const text = S.summaryToText(doc).split('\n');
  const agendaAt = text.indexOf(doc.agendaBlock.title.toUpperCase());
  assert.ok(agendaAt > 0 && agendaAt < text.findIndex((l) => l.startsWith('AREAS')), 'agenda before the areas');
  assert.equal(text[agendaAt + 1], 'My main priority is pain.');
  const html = htmlText(doc);
  const first = html.indexOf(doc.agendaBlock.priority);
  for (const s of doc.sections) assert.ok(first >= 0 && first < html.indexOf(s.title), `priority before ${s.title}`);
});

criterion(10, 'the 999/111 signpost is never printed as her words', () => {
  const input = samInput();
  const base = input.symptoms[0];
  input.symptoms = [...input.symptoms, { ...base, id: 'rubric-urgent', data: { ...base.data, date: TODAY,
    words: 'I felt faint and the bleeding soaked through in an hour. I want to end it all.' } }];
  const doc = build(input);
  const all = S.summaryToText(doc) + '\n' + htmlText(doc);
  for (const line of [URGENT_SIGNPOST, SELF_HARM_SIGNPOST]) assert.ok(!norm(all).includes(norm(line)), 'signpost on the page');
  assert.ok(!/\b(999|111|116 123|Samaritans|A&E)\b/.test(ours(doc, input).join('\n')), 'helpline text outside her words');
});

test('rubric score', () => {
  const n = Object.values(results).filter(Boolean).length;
  const failed = Object.entries(results).filter(([, v]) => !v).map(([k]) => `C${k}`);
  console.log(`rubric ${n}/10${failed.length ? ` (failed: ${failed.join(', ')})` : ''}`);
  assert.equal(Object.keys(results).length, 10);
});

test('rubric self-check: the C2-C4 detectors fire on planted lines, and C1 rejects a reworded quote', () => {
  assert.ok(CONDITION.test('Pain: consistent with endometriosis'));
  assert.ok(PROBABILITY.test('Bleeding: likely heavier than usual'));
  assert.ok(CAUSE_ADVICE.test('Tiredness: probably due to low iron, you should ask for a blood test'));
  const hers = typed(samInput()).map(norm);
  assert.ok(!hers.some((h) => h.includes('My cramps were unbearable and caused by stress')));
});

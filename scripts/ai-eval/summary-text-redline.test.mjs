// Red-line lint over the WHOLE doctor summary for the Sam seed (zones, agenda, every section incl. sensitive ones):
// the plain-text export and the A4 HTML (tags stripped). Patient words are exempt (pm/redline-words.md "Review as quote"):
// text inside quotes, her agenda lines, any line that is verbatim one of her typed fields (e.g. history "Why I went"),
// and the options she chose in a "Flow (chosen by the patient):" line. Everything else is ours and must be clean.
// Run: node --experimental-strip-types --test scripts/ai-eval/summary-text-redline.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
// Registered before any app import so extensionless TS imports resolve under the plain command.
await import('./ts-register.mjs');
const { buildDoctorSummary, summaryToText, summaryToHtml } = await import('../../lib/records/summary.ts');
const { sampleBuckets } = await import('../../lib/preview/seed.ts');

// pm/redline-words.md Block rows (same list as summary-v2-redline.test.mjs, plus "insides"-free zone check).
const BLOCK = /\b(diagnos\w*|risk|predict\w*|typical|atypical|normal|abnormal|irregular|heavy|insights?|pattern analysis|correlat\w*|linked to|triggers?|in range|out of range|worsening|getting (?:worse|better)|improving|trend\w*|ovulation|fertile|follicular|luteal|may match|consistent with|suggests?|likely|approved|validated|faster diagnosis|streak|well done|great job|keep it up|chronic|severe|moderate|mild|score|percent)\b|%|🎉/i;
const AGENDA = 'My main priority is pain. Can we talk about the pain on period days?';

const ours = (text, agendaLines) => text
  .replace(/“[^”]*”|"[^"]*"/g, '«quote»')
  .split('\n')
  .filter((l) => !agendaLines.has(l.replace(/^- /, '').trim()))
  .map((l) => l.replace(/Flow \(chosen by the patient\): [^·<\n]*/g, 'Flow (chosen by the patient): «hers»'));

// Every free-text string she typed anywhere in the record.
const typed = (input) => new Set(Object.values(input).flatMap((v) => (Array.isArray(v) ? v : []))
  .flatMap((r) => Object.values(r?.data ?? {})).filter((v) => typeof v === 'string' && v.trim().length > 3).map((v) => v.trim()));

function hits(doc, input) {
  const agendaLines = new Set([doc.agendaBlock?.priority, ...(doc.agendaBlock?.questions ?? []), ...typed(input)].filter(Boolean));
  const html = summaryToHtml(doc).replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, '\n').replace(/&[a-z#0-9]+;/g, ' ');
  const out = [];
  for (const [where, text] of [['text', summaryToText(doc)], ['html', html]]) {
    for (const line of ours(text, agendaLines)) { const m = line.match(BLOCK); if (m) out.push(`${where} · ${m[0]} · ${line.trim()}`); }
  }
  return out;
}

test('Sam seed, whole summary (text + A4), all sections on: 0 Block hits outside her own words', () => {
  const b = sampleBuckets();
  const input = { symptoms: b.symptom, periodDays: b.period_day, medicines: b.medicine, history: b.history, appointments: b.appointment,
    fertility: 'Trying to get pregnant', onset: { pain: { month: 6, year: 2015 } } };
  assert.ok(b.symptom.some((r) => r.data.where), 'seed carries body-map zones');
  for (const include of [{}, { sex: true, mood: true, eating: true }]) {
    const doc = buildDoctorSummary(input, { from: '2026-06-25', to: '2026-09-24', today: '2026-09-24', agenda: AGENDA, include });
    const found = hits(doc, input);
    console.log(`redline (whole summary, include=${JSON.stringify(include)}): ${found.length} hits`);
    assert.deepEqual(found, []);
  }
});

test('the lint is live: our own "heavy" label or a % would be caught', () => {
  assert.equal(ours('Bleeding: heavy days 3', new Set()).some((l) => BLOCK.test(l)), true);
  assert.equal(ours('9 of 13 areas (69%)', new Set()).some((l) => BLOCK.test(l)), true);
  assert.equal(ours('Flow (chosen by the patient): Medium, Heavy', new Set()).some((l) => BLOCK.test(l)), false);
  assert.equal(ours('12 Sep: "heavy and awful"', new Set()).some((l) => BLOCK.test(l)), false);
});

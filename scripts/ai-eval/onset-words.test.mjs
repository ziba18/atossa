// Onset in her own words (PM run05 task 2): "since I was 15" / "for about two years" is offered verbatim
// for "When did you first notice this?"; never a computed age or date. Held-out set written before the
// extractor (items.onset-heldout.json): first contact 13/15 found, 0/10 false; after 2 fixes 15/15, 0/10
// (tuned on it now). Sweep over 762 earlier notes: 27 fires (5 wrong: trying to conceive x4, a medicine)
// -> 22 after excluding those (tuned).
// Run: node --experimental-strip-types --test scripts/ai-eval/onset-words.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
await import('./ts-register.mjs');
const { onsetWords } = await import('../../lib/records/onset.ts');
const { onsetText, buildDoctorSummary } = await import('../../lib/records/summary.ts');

const { items } = JSON.parse(readFileSync(new URL('./items.onset-heldout.json', import.meta.url), 'utf8'));

test('held-out set: every phrase found verbatim, nothing from the 10 negatives', () => {
  for (const it of items) {
    const got = onsetWords(it.text);
    if (it.gold === null) { assert.equal(got, null, it.id); continue; }
    assert.ok(got, `${it.id}: nothing found`);
    assert.ok(it.text.includes(got), `${it.id}: not her words verbatim (${got})`);
    assert.match(got.toLowerCase(), new RegExp(it.gold.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), it.id);
  }
});

test('episodes, waits, medicines, other people and pregnancy plans are not an onset', () => {
  for (const t of ['pain since yesterday', 'for three days now', 'been waiting 2 years for a referral',
    'on the pill for 3 years and still pain', 'my mum has had this for years', "I've been taking magnesium for a week.",
    'We have been trying for a baby for two years now.', 'We want to start a family but not for a few years.']) {
    assert.equal(onsetWords(t), null, t);
  }
});

test('onsetText shows her phrase in quotes, never a year or an age; a typed year still wins', () => {
  assert.equal(onsetText({ words: 'since I was 15' }), 'First noticed: “since I was 15” (her words)');
  assert.doesNotMatch(onsetText({ words: 'since I was 15' }), /\b(?:19|20)\d\d\b|years? old|aged?\b/);
  assert.equal(onsetText({ year: 2015, month: 6, words: 'since I was 15' }), 'First noticed: around June 2015 (as reported)');
  assert.equal(onsetText({ words: '  ' }), 'First noticed: Not recorded');
  assert.equal(onsetText(undefined), 'First noticed: Not recorded');
});

test('AC3: a note that says "since I was 15" changes nothing in the summary until she confirms it', () => {
  const note = { id: 'n1', createdAt: '2026-09-20T10:00:00.000Z', data: { date: '2026-09-20', words: 'Cramps since I was 15.',
    where: 'Lower belly', worst: 6, score: 6, duration: '', stopped: false, stoppedWords: '', source: 'typed', zones: ['Lower tummy centre'] } };
  const doc = buildDoctorSummary({ symptoms: [note], periodDays: [], medicines: [], history: [], appointments: [] },
    { from: '2026-09-01', to: '2026-09-24', today: '2026-09-24' });
  const pain = doc.domains.find((d) => d.id === 'pain');
  assert.equal(pain.state, 'recorded');
  assert.equal(pain.onset, 'First noticed: Not recorded');
});

// Fertility recall (AI Brain run01, 2026-10-28). Gold written before scoring: agents hq log/run01/fertility-gold-run01.json
// (hq 855fb32a); first contact P 1/1, R 1/8; run22 set R 2/6. Root causes: "My partner and I ..." was dropped as someone
// else's sentence, and "babies / not on the radar / torn / haven't decided / came off the pill because we want ..." were not read.
// Run: node --experimental-strip-types --test scripts/ai-eval/fertility-recall.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
// Registered before any app import so extensionless TS imports resolve under the plain command.
await import('./ts-register.mjs');
const { holisticFrom } = await import('../../components/atossa/capture/holistic.ts');
const { ownWords } = await import('../../components/atossa/capture/infer.ts');

const GOLD = [
  ["We've been trying for a baby for about a year now and my periods are getting more painful", 'Trying to get pregnant'],
  ['My partner and I started trying to conceive in the spring, cramps 7/10 this week', 'Trying to get pregnant'],
  ['Not planning on kids any time soon, just want the pain sorted', 'Not now'],
  ["Honestly I'm torn about whether I even want children, heavy bleeding again", 'Not sure'],
  ['Came off the pill in June because we want to start a family', 'Trying to get pregnant'],
  ["Babies aren't on my radar right now, I'm 22 and at uni", 'Not now'],
  ['My sister is trying to get pregnant and it made me think about my own pain', undefined],
  ["Haven't decided if I want a family yet, the pain in my lower back is constant", 'Not sure'],
  ['Did a pregnancy test because my period was late, it was negative, cramps all day', undefined],
  ["We'd like to have a baby next year so I want to know what's going on before then", 'Not now'],
  // overreach probe (written after the fix): no offer from these
  ['My partner and I had a row about the pain, he thinks I should see someone', undefined],
  ['I stopped the pill last month because it made my mood awful', undefined],
  ['Babysitting my niece wore me out, cramps 5/10', undefined],
  ['My friend and I both get awful cramps, mine are worse', undefined],
];

test('fertility wish per gold line (her words kept)', () => {
  for (const [t, want] of GOLD) {
    const f = holisticFrom(t).fertility;
    assert.equal(f?.wish, want, t);
    if (f) assert.ok(t.toLowerCase().replace(/’/g, "'").includes(f.words), f.words);
  }
});

test('"My partner and I" is her own sentence; "My partner says" is not', () => {
  assert.equal(ownWords('My partner and I are trying for a baby.').trim(), 'My partner and I are trying for a baby.');
  assert.equal(ownWords('My partner says she has cramps.').trim(), '');
});

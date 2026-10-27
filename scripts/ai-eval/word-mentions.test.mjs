// PM 2026-10-27 task 6: Sam typed "tired"/"dizzy" but Patterns said "Sleep and mood: Not recorded yet". Decision: no
// silent tag (Atossa never infers beyond her words); the empty card counts her words instead, "Not tagged yet — …".
// Run: node --experimental-strip-types --import ./scripts/ai-eval/ts-register.mjs --test scripts/ai-eval/word-mentions.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { untaggedLine, wordMentions } from '../../lib/records/counts.ts';
import { sampleBuckets } from '../../lib/preview/seed.ts';

const notes = () => sampleBuckets().symptom.map((r) => r.data);
const note = (words, source = 'typed') => ({ date: '2026-09-01', words, source });

test('Sam seed: counts her own words, independently of tags', () => {
  const all = notes();
  const tired = all.filter((s) => /\b(tired|worn out|exhausted)\b/i.test(s.words)).length;
  const dizzy = all.filter((s) => /\b(dizzy|light-?headed)\b/i.test(s.words)).length;
  assert.equal(wordMentions(all, 'tired').notes, tired);
  assert.equal(wordMentions(all, 'dizzy').notes, dizzy);
  console.log(`Sam seed: tired ${tired}/${all.length}, dizzy ${dizzy}/${all.length}`);
  assert.equal(untaggedLine(all, 'tired'), `Not tagged yet — “tired” appears in ${tired} of ${all.length} notes`);
});

test('negation and quick logs do not count; nothing is tagged', () => {
  const ns = [note('I was not tired today'), note("didn't feel dizzy at all"), note('so tired'), note('tired', 'quick'), note('light-headed after lunch')];
  assert.deepEqual(wordMentions(ns, 'tired'), { notes: 1, total: 4 });
  assert.deepEqual(wordMentions(ns, 'dizzy'), { notes: 1, total: 4 });
  for (const s of ns) assert.equal('fatigue' in s, false, 'no field written');
  assert.equal(untaggedLine([note('sharp pain')], 'tired'), '');
});

test('copy stays a count of her words: no label, no cause', () => {
  const line = untaggedLine(notes(), 'tired');
  assert.doesNotMatch(line, /fatigue|anaemi|iron|because|due to|sign of|likely|suggest|%/i);
});

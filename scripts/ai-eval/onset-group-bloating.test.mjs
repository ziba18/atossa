// PM 3c (06:58): a note that names bloating or tiredness takes that group, never the pain default.
import test from 'node:test';
import assert from 'node:assert/strict';
await import('./ts-register.mjs');
const { onsetGroupFor } = await import('../../lib/records/summary.ts');

test('bloating notes go to bowel/bladder, tiredness to fatigue', () => {
  for (const t of ['the bloating started about six months ago and hasn\'t gone', "I've had the bloating on and off since my teens", 'bloated since Christmas'])
    assert.equal(onsetGroupFor({ words: t }), 'bowelBladder', t);
  assert.equal(onsetGroupFor({ words: 'This tiredness began last spring' }), 'fatigue');
  assert.equal(onsetGroupFor({ words: 'cramps since I was 15' }), 'pain');
});

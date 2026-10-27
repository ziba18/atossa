// A27 fertility store: newest chip choice wins, notes only offer (never save), others' sentences offer nothing.
// Run: node --experimental-strip-types --test scripts/ai-eval/fertility-store.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
// Registered before any app import so extensionless TS imports resolve under the plain command.
await import('./ts-register.mjs');
const { latestFertilityWish, fertilityOffer } = await import('../../lib/records/fertility.ts');
const { holisticFrom } = await import('../../components/atossa/capture/holistic.ts');
const { buildDoctorSummary } = await import('../../lib/records/summary.ts');

const rec = (wish, chosenAt) => ({ data: { wish, chosenAt } });

test('newest saved choice wins; unknown values ignored; none = null', () => {
  assert.equal(latestFertilityWish([]), null);
  assert.equal(latestFertilityWish([rec('Not now', '2026-09-01T10:00:00Z'), rec('Trying to get pregnant', '2026-10-01T10:00:00Z')]), 'Trying to get pregnant');
  assert.equal(latestFertilityWish([rec('Prefer not to say', '2026-10-02T10:00:00Z'), rec('Not now', '2026-09-01T10:00:00Z')]), 'Prefer not to say');
  assert.equal(latestFertilityWish([rec('Infertile', '2026-10-05T10:00:00Z')]), null);
});

test('a note only offers; her saved choice always wins; others and worries offer nothing', () => {
  const own = holisticFrom("We're trying for a baby since the summer.");
  assert.equal(fertilityOffer(own, null)?.wish, 'Trying to get pregnant');
  assert.equal(fertilityOffer(own, 'Not now'), null);
  for (const t of ['My sister is trying to get pregnant.', 'Did a pregnancy test, negative.', 'will I be able to have kids']) {
    assert.equal(fertilityOffer(holisticFrom(t), null), null, t);
  }
});

test('the A4 line shows the saved choice as chosen, and Not recorded when none', () => {
  const base = { symptoms: [], periodDays: [], medicines: [], history: [], appointments: [] };
  const opts = { from: '2026-09-01', to: '2026-10-27', today: '2026-10-27' };
  const line = (doc) => JSON.stringify(doc).match(/"([^"]*\(as chosen\)[^"]*)"/)?.[1];
  assert.equal(line(buildDoctorSummary({ ...base, fertility: latestFertilityWish([rec('Not now', '2026-10-01T10:00:00Z')]) }, opts)), 'Not now (as chosen)');
  assert.equal(line(buildDoctorSummary({ ...base, fertility: latestFertilityWish([]) }, opts)), undefined);
});

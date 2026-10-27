// Safety's unseen urgent-wording sets v11-v13 (S-123 / S-124, written by the Safety agent before any run) as a REGRESSION
// set for the phone detector (lib/urgentWording.ts). Never tuned on here: the misses below are reported, not fixed, and
// the test only fails if this branch misses MORE than the recorded baseline or raises an everyday note.
// Run: node --experimental-strip-types --test scripts/ai-eval/urgent-safety-regression.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
// Registered before any app import so extensionless TS imports resolve under the plain command.
await import('./ts-register.mjs');
const { urgentSignpost } = await import('../../lib/urgentWording.ts');

// Misses recorded on claude/ai-brain-holistic-v3 (= offline-room + design-redesign ddfe4cd), 2026-10-27 16:2x UTC.
const BASELINE = { v11: 7, v12: 7, v13: 4 };
for (const v of ['v11', 'v12', 'v13']) {
  test(`urgent wording, Safety ${v}: misses <= baseline, everyday notes never raised`, () => {
    const d = JSON.parse(readFileSync(new URL(`./items.urgent-safety-${v}.json`, import.meta.url)));
    const missed = d.emergency.filter((t) => urgentSignpost(t) === null);
    const raised = d.harmless.filter((t) => urgentSignpost(t) !== null);
    console.log(`${v}: missed ${missed.length}/${d.emergency.length} (${Math.round((100 * missed.length) / d.emergency.length)}%), everyday raised ${raised.length}/${d.harmless.length}`);
    missed.forEach((t) => console.log(`  missed: ${t}`));
    assert.equal(raised.length, 0, 'everyday note raised');
    assert.ok(missed.length <= BASELINE[v], `misses ${missed.length} > baseline ${BASELINE[v]}`);
  });
}

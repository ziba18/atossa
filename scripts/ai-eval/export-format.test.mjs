// "Download all my notes": the file leads with the heading, keeps the server body untouched, has a
// generic dated name, and each failure maps to one plain sentence.
// Run: node --experimental-strip-types --test scripts/ai-eval/export-format.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
await import('./ts-register.mjs');
const { EXPORT_HEADING, EXPORT_ERRORS, buildExportFile, classifyExportStatus, exportFileName } = await import('../../lib/exportFormat.ts');

test('file: heading first, body kept, all eight kinds survive', () => {
  const kinds = ['symptom', 'appointment', 'medicine', 'history', 'period_day', 'doctor_note', 'fertility_wish', 'allergy'];
  const body = { exported_at: '2026-10-28T05:00:00Z', tables: { health_records: kinds.map((kind) => ({ kind })) } };
  const out = JSON.parse(buildExportFile(body));
  assert.equal(Object.keys(out)[0], 'about');
  assert.equal(out.about, EXPORT_HEADING);
  assert.deepEqual(out.tables.health_records.map((r) => r.kind), kinds);
  assert.equal(out.exported_at, body.exported_at);
});

test('file name is generic and dated', () => {
  assert.equal(exportFileName(new Date('2026-10-28T05:00:00Z')), 'atossa-notes-2026-10-28.json');
});

test('each failure has its own plain sentence', () => {
  assert.equal(classifyExportStatus(401), 'password');
  assert.equal(classifyExportStatus(0), 'network');
  assert.equal(classifyExportStatus(429), 'limit');
  assert.equal(classifyExportStatus(500), 'other');
  assert.equal(classifyExportStatus(undefined), 'other');
  const lines = Object.values(EXPORT_ERRORS);
  assert.equal(new Set(lines).size, lines.length);
  for (const l of lines) assert.doesNotMatch(l, /secure|private|safe|encrypt/i);
});

// Guards that free-text note fields are read by the urgent-wording check.
// Run: node scripts/urgent-fields.test.mjs
import fs from 'node:fs';
const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const draft = read('components/atossa/capture/draft.ts');
const sheet = read('components/atossa/capture/CaptureSheet.tsx');
const line = sheet.split('\n').find((l) => l.includes('urgentSignpost(['));
const bad = [];
if (!line) bad.push('CaptureSheet: urgentSignpost call not found');
// Draft string fields that hold what the person typed or said.
for (const f of ['words', 'whereText', 'tried', 'when', 'duration', 'stoppedWords']) {
  if (!new RegExp(`\\b${f}: string`).test(draft)) bad.push(`draft.ts: field ${f} no longer a string (update this test)`);
  else if (line && !line.includes(`draft.${f}`)) bad.push(`CaptureSheet does not scan draft.${f}`);
}
if (line && !/\bother\b/.test(line)) bad.push('CaptureSheet does not scan the something-else field');
for (const p of ['components/atossa/LogBleedingSheet.tsx', 'components/atossa/timeline/BleedingDetail.tsx']) {
  if (!read(p).includes('urgentSignpost(note)')) bad.push(`${p} does not scan its note`);
}
if (bad.length) { console.error(bad); process.exit(1); }
console.log('ok: urgent-wording covers capture fields and bleeding notes');

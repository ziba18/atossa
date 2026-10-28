// The Sam-seed printed summary (summaryToHtml -> Chromium A4 PDF) must stay at 2 pages: the Doctor thumbnail says "Page 1 of 2".
// Run: NODE_PATH=$(npm root -g) node scripts/e2e/summary-pdf-pages.cjs   (needs pdfinfo or counts /Type /Page in the PDF)
const { execFileSync } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');
const { chromium } = require('playwright');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sam-pdf-'));
const gen = path.join(dir, 'gen.mjs');
fs.writeFileSync(gen, `import fs from 'node:fs';
process.chdir(${JSON.stringify(path.resolve(__dirname, '../..'))});
await import(${JSON.stringify(path.resolve(__dirname, '../ai-eval/ts-register.mjs'))});
const { buildDoctorSummary, summaryToHtml } = await import(${JSON.stringify(path.resolve(__dirname, '../../lib/records/summary.ts'))});
const { sampleBuckets } = await import(${JSON.stringify(path.resolve(__dirname, '../../lib/preview/seed.ts'))});
const b = sampleBuckets();
const doc = buildDoctorSummary({ symptoms: b.symptom, periodDays: b.period_day, medicines: b.medicine, history: b.history, appointments: b.appointment }, { from: '2026-06-25', to: '2026-09-24', today: '2026-09-24' });
fs.writeFileSync(${JSON.stringify(path.join(dir, 'sam.html'))}, summaryToHtml(doc));`);
execFileSync('node', ['--experimental-strip-types', gen], { stdio: 'ignore' });
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + path.join(dir, 'sam.html'));
  const pdf = await p.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true }); await b.close();
  const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  console.log(pages === 2 ? 'PASS Sam-seed summary prints as 2 pages' : `FAIL Sam-seed summary prints as ${pages} pages (thumbnail says 2)`);
  process.exitCode = pages === 2 ? 0 : 1;
})();

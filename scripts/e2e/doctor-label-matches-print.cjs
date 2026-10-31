// The 'Page 1 of N' label on For my doctor must equal the page count of the printed PDF (PM-A216 AC1).
// Needs the web preview running: EXPO_PUBLIC_DESIGN_PREVIEW=1 npx expo start --web --port 8081
// Run: NODE_PATH=$(npm root -g) node scripts/e2e/doctor-label-matches-print.cjs
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const printed = Number((execFileSync('node', [require('path').join(__dirname, 'summary-pdf-pages.cjs')]).toString().match(/prints as (\d+)/) || [])[1]);
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await p.goto('http://localhost:8081/doctor', { waitUntil: 'networkidle' }); await p.waitForTimeout(3000);
  const label = (await p.getByText(/Page 1 of \d/).first().textContent()) || ''; await b.close();
  const shown = Number((label.match(/of (\d+)/) || [])[1]);
  console.log(shown === printed ? `PASS label '${label}' = printed ${printed} pages` : `FAIL label '${label}' but the PDF prints ${printed} pages`);
  process.exitCode = shown === printed ? 0 : 1;
})();

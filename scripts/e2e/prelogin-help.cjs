// PM-A214: the public Help now page opens logged out, shows the four routes, makes 0 requests to the API host, and the pre-login line + link are on the three auth screens above the fold at 390x844 and 320x568.
// Needs the web preview: EXPO_PUBLIC_DESIGN_PREVIEW=1 npx expo start --web --port 8081. Run: NODE_PATH=$(npm root -g) node scripts/e2e/prelogin-help.cjs
const { chromium } = require('playwright');
const BASE = 'http://localhost:8081';
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const check = (ok, msg) => { console.log((ok ? 'PASS ' : 'FAIL ') + msg); if (!ok) bad++; };
  for (const [w, h] of [[390, 844], [320, 568]]) {
    const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
    const api = []; p.on('request', (q) => { const u = q.url(); if (!u.startsWith(BASE) && !u.startsWith('data:')) api.push(u); });
    await p.goto(`${BASE}/help-now`, { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
    check((await p.getByText('Samaritans').count()) >= 1 && (await p.getByText('NHS 111').count()) >= 1, `${w}: cold /help-now shows the routes`);
    check(api.length === 0, `${w}: /help-now made ${api.length} requests to other hosts`);
    await p.getByRole('button', { name: /Back/ }).first().click(); await p.waitForTimeout(1200);
    check(p.url().endsWith('/welcome'), `${w}: Back from a cold-opened /help-now lands on Welcome`);
    for (const r of ['welcome', 'login', 'register']) {
      await p.goto(`${BASE}/${r}`, { waitUntil: 'networkidle' }); await p.waitForTimeout(1000);
      const t = await p.getByText('Need help now? In an emergency call 999. For urgent advice call 111.').first().boundingBox();
      const l = await p.getByRole('link', { name: 'More help (Samaritans, Shout)' }).boundingBox();
      check(t && l && l.y + l.height <= h && l.height >= 44, `${w} ${r}: line + link above the fold, link ${l && Math.round(l.height)} px tall`);
    }
    await p.close();
  }
  await b.close(); process.exitCode = bad ? 1 : 0;
})();

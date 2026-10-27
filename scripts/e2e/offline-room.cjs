// Offline consulting room (blueprint 3.7 "Opens with no signal"), on a static preview web export.
// Usage: EXPO_PUBLIC_DESIGN_PREVIEW=1 npx expo export --dev --platform web --output-dir /tmp/webxd   (--dev: preview needs __DEV__)
//        NODE_PATH=$(npm root -g) node scripts/e2e/offline-room.cjs /tmp/webxd
// 1) online: For my doctor loads and a copy is saved on the phone; 2) context.setOffline(true) + reload (page files served
// from disk by page.route, the records request fails): the saved copy shows with "Made on <date>"; 3) a fresh phone with
// no saved copy and no signal gets the plain error, never someone else's copy.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const root = process.argv[2];
const KEY = 'atossa.records-snapshot.v1';
const fromDisk = async (route) => {
  let p = path.join(root, decodeURIComponent(new URL(route.request().url()).pathname));
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) p = path.join(root, 'index.html');
  const t = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' }[path.extname(p)] || 'application/octet-stream';
  await route.fulfill({ status: 200, contentType: t, body: fs.readFileSync(p) });
};
const fail = (m) => { console.log('FAIL ' + m); process.exitCode = 1; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route('http://atossa.test/**', fromDisk);
  const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', (e) => errs.push(e.message));
  await pg.goto('http://atossa.test/doctor'); await pg.waitForTimeout(3000);
  const saved = await pg.evaluate((k) => localStorage.getItem(k), KEY);
  if (!saved) fail('no copy saved after an online load'); else console.log(`PASS online load saved a copy (${saved.length} bytes)`);
  if (await pg.getByTestId('offline-copy').count()) fail('offline line shown while online');
  const onlineText = await pg.innerText('body');
  await ctx.setOffline(true);
  await pg.reload(); await pg.waitForTimeout(3000);
  const online = await pg.evaluate(() => navigator.onLine);
  const line = await pg.getByTestId('offline-copy').innerText().catch(() => '');
  if (online) fail('navigator.onLine still true after setOffline');
  if (!/^No connection\. This is the copy saved on this phone\. Made on .+\.$/.test(line)) fail(`offline line missing: "${line}"`);
  else console.log(`PASS offline: "${line}"`);
  const offlineText = await pg.innerText('body');
  const quote = (onlineText.match(/“[^”]{12,60}/) || [''])[0];
  if (!quote || !offlineText.includes(quote)) fail(`saved copy does not show her words (${quote})`); else console.log(`PASS her words still shown offline: ${quote}…”`);
  if (/couldn.t load your information/i.test(offlineText)) fail('error shown although a copy exists');
  // fresh phone, no copy, no signal
  const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 }, offline: true });
  await ctx2.route('http://atossa.test/**', fromDisk);
  const p2 = await ctx2.newPage(); await p2.goto('http://atossa.test/doctor'); await p2.waitForTimeout(3000);
  const t2 = await p2.innerText('body');
  if (await p2.getByTestId('offline-copy').count() || !/couldn.t load your information/i.test(t2)) fail('fresh phone offline: expected the plain error');
  else console.log('PASS fresh phone offline: plain error, no copy');
  if (errs.length) fail('page errors: ' + errs.join(' | '));
  await b.close();
  if (!process.exitCode) console.log('offline-room: all PASS');
})();

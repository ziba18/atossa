// After `expo export --platform web`: the web pilot is private, so ask search engines not to index it,
// and add the theme colour + description. (The export is a single-page app; Expo ignores app/+html.tsx for it.)
const fs = require('fs');
const file = 'dist-web/index.html';
const tags = [
  '<meta name="robots" content="noindex, nofollow" />',
  '<meta name="theme-color" content="#F7F3EE" />',
  '<meta name="description" content="Atossa: describe how you feel in your own words and get a clear summary to share with your doctor." />',
].join('\n    ');
const html = fs.readFileSync(file, 'utf8');
if (!html.includes('name="robots"')) fs.writeFileSync(file, html.replace('<title>', `${tags}\n    <title>`));

// Static hosts (Vercel's CLI, Netlify) never upload folders named node_modules, and Expo puts the
// fonts in dist-web/assets/node_modules/. A missing font keeps the app on a blank screen, so move
// them to assets/vendor/ and point the bundle there.
const nm = 'dist-web/assets/node_modules';
if (fs.existsSync(nm)) {
  fs.renameSync(nm, 'dist-web/assets/vendor');
  const js = 'dist-web/_expo/static/js/web';
  for (const f of fs.readdirSync(js)) {
    const p = `${js}/${f}`;
    const src = fs.readFileSync(p, 'utf8');
    if (src.includes('/assets/node_modules/')) fs.writeFileSync(p, src.split('/assets/node_modules/').join('/assets/vendor/'));
  }
}

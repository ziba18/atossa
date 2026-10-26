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

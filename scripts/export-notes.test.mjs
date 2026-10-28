// "Download all my notes" calls /me/export after a password check, and the file carries the heading.
// Run: node scripts/export-notes.test.mjs
import fs from 'node:fs';
const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const lib = read('lib/exportNotes.ts');
const bad = [];
if (!lib.includes("api.get<unknown>('/me/export')")) bad.push('exportNotes does not call GET /me/export');
if (!lib.includes("api.post('/auth/login'")) bad.push('exportNotes does not re-check the password first');
if (lib.indexOf("api.post('/auth/login'") > lib.indexOf("api.get<unknown>('/me/export')")) bad.push('password check must come before the export fetch');
if (!lib.includes('Everything you saved in Atossa. Notes in your words. Not a medical record.')) bad.push('file heading changed');
if (/from '\.\/analytics'|track\(/.test(lib)) bad.push('export must not send analytics');
if (!read('app/(tabs)/profile/index.tsx').includes('downloadAllNotes(')) bad.push('Profile does not call downloadAllNotes');
if (bad.length) { console.error(bad); process.exit(1); }
console.log('ok: export flow wired, password first, heading present, no analytics');

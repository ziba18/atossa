// Checks lib/urgentWording.ts agrees with the backend on backend/tests/urgent_phrases.json.
// Run: node scripts/urgent-wording.test.mjs
import fs from 'node:fs';
const src = fs.readFileSync(new URL('../lib/urgentWording.ts', import.meta.url), 'utf8');
const raws = [...src.matchAll(/new RegExp\(String\.raw`([^`]*)`, 'i'\)/g)].map((m) => new RegExp(m[1], 'i'));
if (raws.length !== 2) throw new Error('expected two patterns');
const [emergency, selfHarm] = raws;
const norm = (t) => t.normalize('NFKC').replace(/\p{Cf}/gu, '').replace(/[‘’ʼ′]/g, "'");
const phrases = JSON.parse(fs.readFileSync(new URL('../backend/tests/urgent_phrases.json', import.meta.url), 'utf8'));
const wrong = phrases.filter(([t, want]) => (emergency.test(norm(t)) || selfHarm.test(norm(t))) !== want);
if (wrong.length) { console.error('disagree:', wrong); process.exit(1); }
console.log(`ok: ${phrases.length} phrases agree`);

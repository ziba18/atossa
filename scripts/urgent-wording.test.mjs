// Checks lib/urgentWording.ts (generated patterns) agrees with the backend on backend/tests/urgent_phrases.json.
// Run: node --experimental-strip-types --import ./scripts/ai-eval/ts-register.mjs scripts/urgent-wording.test.mjs
import fs from 'node:fs';
import { urgentSignpost } from '../lib/urgentWording.ts';
const phrases = JSON.parse(fs.readFileSync(new URL('../backend/tests/urgent_phrases.json', import.meta.url), 'utf8'));
const wrong = phrases.filter(([t, want]) => (urgentSignpost(t) !== null) !== want);
if (wrong.length) { console.error('disagree:', wrong); process.exit(1); }
console.log(`ok: ${phrases.length} phrases agree`);

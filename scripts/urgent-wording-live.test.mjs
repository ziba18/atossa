// Runs the real lib/urgentWording.ts (via a temp copy, since Node needs the .ts extension on the import).
// Run: node --experimental-strip-types scripts/urgent-wording-live.test.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'urgent-'));
const lib = new URL('../lib/', import.meta.url);
fs.writeFileSync(path.join(dir, 'urgentPatterns.generated.ts'), fs.readFileSync(new URL('urgentPatterns.generated.ts', lib)));
fs.writeFileSync(path.join(dir, 'urgentWording.ts'), fs.readFileSync(new URL('urgentWording.ts', lib), 'utf8').replace("'./urgentPatterns.generated'", "'./urgentPatterns.generated.ts'"));
const { urgentSignpost } = await import(path.join(dir, 'urgentWording.ts'));
const must = ["I can’t breathe", 'soaked through a pad in half an hour', "My lips are going blue and I'm struggling to get air",
  'I think I might be having a miscarriage, lots of blood', 'my face is drooping and my speech is slurred', 'I want to end it all'];
const never = ['The pain was killing me yesterday but is fine now', 'I did not faint', 'my sister fainted last year', 'Cramps were a 5 today, took ibuprofen'];
const bad = [...must.filter((t) => !urgentSignpost(t)), ...never.filter((t) => urgentSignpost(t))];
if (bad.length) { console.error('wrong:', bad); process.exit(1); }
console.log(`ok: ${must.length + never.length} phrases`);

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
const must = ['I think I might have sepsis', 'a rash that does not fade when I press it', "I'm confused and not making sense", 'pain under my right ribs and in my right shoulder', 'very high temperature with chills and pelvic pain', 'very dizzy and looking pale and I might be pregnant', "I can't stop the bleeding", 'the toilet water turned red', 'I had a tampon in and now I have a fever and vomiting', "I can’t breathe", 'soaked through a pad in half an hour', "My lips are going blue and I'm struggling to get air",
  'I think I might be having a miscarriage, lots of blood', 'my face is drooping and my speech is slurred', 'I want to end it all', 'feel like someone is stabbing me in the stomach, curled up on the floor', 'I almost fa1nted', 'I cаn\'t breathe', 'f a i n t e d in the shower'];
const never = ['I jogged and was breathing fast for a minute', 'I had a fever and chills last week', 'I might be pregnant', 'I use tampons on heavy days', 'there was blood in the toilet', 'The pain was killing me yesterday but is fine now', 'I did not faint', 'my sister fainted last year', 'Cramps were a 5 today, took ibuprofen'];
const shared = JSON.parse(fs.readFileSync(new URL('../backend/tests/urgent_phrases.json', import.meta.url), 'utf8'));
const disagree = shared.filter(([t, want]) => Boolean(urgentSignpost(t)) !== want).map(([t]) => t);
// The same emergency/harmless sets the backend is scored on: the phone copy must agree with the server on every phrase.
const testsDir = new URL('../backend/tests/', import.meta.url);
const setPhrases = [];
for (const f of fs.readdirSync(testsDir).filter((n) => /^emergency_set_v.*\.json$/.test(n))) {
  const set = JSON.parse(fs.readFileSync(new URL(f, testsDir), 'utf8'));
  for (const t of set.emergency) setPhrases.push([t, true]);
  for (const t of set.harmless) setPhrases.push([t, false]);
}
const setDisagree = setPhrases.filter(([t, want]) => Boolean(urgentSignpost(t)) !== want).map(([t]) => t);
const bad = [...setDisagree, ...disagree, ...must.filter((t) => !urgentSignpost(t)), ...never.filter((t) => urgentSignpost(t))];
if (bad.length) { console.error('wrong:', bad); process.exit(1); }
console.log(`ok: ${must.length + never.length + shared.length + setPhrases.length} phrases`);

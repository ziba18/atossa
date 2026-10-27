// The capture sheet shows one fixed sentence on the writing step (hazard H4). It must be the same constant the detector uses
// and must be hidden only when the detector line is already showing. Run: node scripts/capture-fixed-line.test.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const sheet = readFileSync(new URL('../components/atossa/capture/CaptureSheet.tsx', import.meta.url), 'utf8');
const wording = readFileSync(new URL('../lib/urgentWording.ts', import.meta.url), 'utf8');

assert.match(sheet, /import \{[^}]*\bURGENT_SIGNPOST\b[^}]*\} from '\.\.\/\.\.\/\.\.\/lib\/urgentWording'/, 'sheet imports URGENT_SIGNPOST');
assert.match(sheet, /stage === 'capture' && !confirmClose && !signpost \? \(\s*<Txt[^>]*>\{URGENT_SIGNPOST\}<\/Txt>/, 'fixed line on the writing step, not duplicated');
const sentence = /export const URGENT_SIGNPOST =\s*'([^']+)'/.exec(wording)?.[1];
assert.equal(sentence, 'If you have severe sudden pain, very heavy bleeding or feel faint, call 999 or go to A&E, or call NHS 111.');
assert.doesNotMatch(sentence, /diagnos|cause|probab|likely|treat/i);
console.log('ok: capture fixed line');

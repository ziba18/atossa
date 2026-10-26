// Tone lint for the doctor summary: no diagnostic / causal / trend wording in any user-visible
// string in lib/records and components/atossa/doctor. Scans string literals and JSX text, skips comments.
// Run: node scripts/ai-eval/summary-tone-lint.test.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const BANNED = /\b(suggest\w*|indicat\w*|consistent with|likely|unlikely|probabl\w*|linked to|caused? by|diagnos\w*|may have|might be|abnormal|severe|moderate|trend\w*|worsen\w*|improv\w*|condition|symptoms of|sign of|you should|recommend\w*|endometrios\w*|pcos|polycystic)\b/i;
const dirs = ['lib/records', 'components/atossa/doctor'];
const strip = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
let checked = 0;
const bad = [];
for (const d of dirs) {
  for (const f of readdirSync(d).filter((x) => /\.(ts|tsx)$/.test(x))) {
    const src = strip(readFileSync(join(d, f), 'utf8'));
    const lits = [...src.matchAll(/'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`|>([^<>{}\n]+)</g)].map((m) => m[1] ?? m[2] ?? m[3] ?? m[4]);
    for (const t of lits) {
      if (!/\s/.test(t) && t.length < 12) continue; // identifiers / enum keys
      checked++;
      const hit = t.match(BANNED);
      if (hit) bad.push(`${join(d, f)}: "${t.slice(0, 80)}" -> ${hit[0]}`);
    }
  }
}
console.log(`summary-tone-lint: ${checked} strings checked, ${bad.length} hits`);
for (const b of bad) console.log('  ' + b);
process.exit(bad.length ? 1 : 0);

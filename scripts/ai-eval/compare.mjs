// Diff two `run.mjs --json` outputs: node scripts/ai-eval/compare.mjs a.json b.json
// Prints per-field deltas (fills, correct, wrong) and the item ids that became wrong / stopped being wrong.
import fs from 'node:fs';
const [a, b] = process.argv.slice(2).map((f) => JSON.parse(fs.readFileSync(f, 'utf8')));
const d = (x, y) => (y - x > 0 ? '+' : '') + (y - x);
console.log('field      fills  correct  wrong  spurious  mismatch');
for (const f of Object.keys(a.fields)) {
  const x = a.fields[f], y = b.fields[f];
  console.log(f.padEnd(10), d(x.fills, y.fills).padStart(5), d(x.correct, y.correct).padStart(8), d(x.wrong, y.wrong).padStart(6), d(x.spurious, y.spurious).padStart(9), d(x.mismatch, y.mismatch).padStart(9));
  const nowWrong = y.wrongIds.filter((i) => !x.wrongIds.includes(i));
  const fixed = x.wrongIds.filter((i) => !y.wrongIds.includes(i));
  if (nowWrong.length) console.log('  newly wrong:', nowWrong.join(','));
  if (fixed.length) console.log('  fixed:', fixed.join(','));
}

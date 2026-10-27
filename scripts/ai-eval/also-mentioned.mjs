// Prototype (not wired into the app): "Also mentioned: bowel, bladder, tiredness, bloating, nausea" built ONLY
// from words she wrote. Same clause/negation rules as infer.ts. Run: node scripts/ai-eval/also-mentioned.mjs [items.json]
import fs from 'node:fs';
const TERMS = {
  Bloating: /\b(bloat(?:ed|ing)?|swollen tummy|swollen belly|distended)\b/,
  Nausea: /\b(nausea|nauseous|nauseated|(?:feel(?:ing)?|felt|been) sick(?! of)|throwing up|threw up|vomit\w*)\b/,
  Bowel: /\b(bowels?|poo|poos|diarrh?oea|constipat\w+|loose stools?|(?:going|go|went) to the toilet|number twos?)\b/,
  Bladder: /\b(bladder|wee|weeing|urinat\w+|peeing|pee)\b/,
  Tiredness: /\b(tired|exhausted|fatigue[d]?|wiped out|no energy|drained|shattered)\b/,
};
const NEG = /\b(no|not|never|without|nothing|n['’]t|fine|normal|ok|okay)\b|n['’]t\b/;
const clauses = (t) => t.toLowerCase().split(/[.,;!?]|\bbut\b|\bthough\b/).map((c) => c.trim()).filter(Boolean);
const OTHER = /^(?:my (?:sister|mum|mom|mother|friend|cousin|partner|daughter)|she|he|her|his|they)\b/i;
export function alsoMentioned(words) {
  const own = words.split(/(?<=[.!?])\s+/).filter((s) => !OTHER.test(s.trim())).join(' ');
  const out = new Set();
  for (const c of clauses(own)) {
    if (NEG.test(c)) continue;
    for (const [k, rx] of Object.entries(TERMS)) if (rx.test(c)) out.add(k);
  }
  return [...out].sort();
}
if (process.argv[1].endsWith('also-mentioned.mjs')) {
  const f = process.argv[2] ?? 'items.v13-also.json';
  const items = JSON.parse(fs.readFileSync(new URL(f, import.meta.url), 'utf8'));
  let fills = 0, wrong = 0, gold = 0, correct = 0;
  for (const it of items) {
    const got = alsoMentioned(it.text), want = [...it.gold].sort();
    fills += got.length; gold += want.length;
    for (const g of got) want.includes(g) ? correct++ : (wrong++, console.log('WRONG', it.id, g, '|', it.text));
    for (const w of want) if (!got.includes(w)) console.log('missed', it.id, w, '|', it.text);
  }
  console.log(`items ${items.length} fills ${fills} correct ${correct} wrong ${wrong} gold ${gold} precision ${(100 * correct / fills).toFixed(0)}% recall ${(100 * correct / gold).toFixed(0)}%`);
}

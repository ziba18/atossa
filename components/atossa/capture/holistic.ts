// Holistic record fields (PRD pm/prd/holistic-fields.md): bleeding amount as reported, and pain opening
// bowels / passing urine. Pre-fills only from words Sam actually used; triggers are topic-based (what was
// said), never condition-based. No labels: field values are counts and yes/no, never "heavy".
// Pure functions — no React.

import { ownWords } from './infer';

export type ProductBand = '1-2' | '3-5' | '6+';

export interface Holistic {
  /** She mentioned bleeding / her period flow at all (asks the amount chips if nothing else was said). */
  mentionsBleeding: boolean;
  /** Pads / tampons / cups / period pants changed today, banded as the chips are. */
  products?: ProductBand;
  /** Soaked or leaked through clothes or bedding. */
  flooding?: boolean;
  clots?: boolean;
  /** Bleeding or spotting between periods. */
  between?: boolean;
  afterSex?: boolean;
  bowelPain?: boolean;
  urinePain?: boolean;
  /** Tummy / bottom mentioned with no bowel or bladder answer: show the combined "Also:" chip row. */
  askBowelBladder: boolean;
}

const COUNT: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
  nine: 9, ten: 10, eleven: 11, twelve: 12, a: 1, an: 1, once: 1, twice: 2 };
const N = '(\\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)';
const PRODUCT = '(?:pads?|tampons?|cups?|liners?|period pants|towels?)';
const NEG = /\b(no|not|without|never|didn'?t|don'?t|isn'?t|wasn'?t|haven'?t|hasn'?t)\b[^,.;]*$/;

const BLEED_WORDS = /\b(bleed(?:ing|s)?|bled|blood|period|flow|spotting|spotted|clots?|flood(?:ed|ing)?|pads?|tampons?|soaked|leak(?:ed|ing)?)\b/;
const FLOOD = /\b(flood(?:ed|ing)?|soak(?:ed|ing)? (?:through|right through)|soaked through|leak(?:ed|ing)? (?:onto|through|on)|bled through|through my (?:jeans|clothes|trousers|leggings|uniform)|onto the (?:sheets|bed)|ruined (?:the )?(?:sheets|bedding))\b/;
const CLOTS = /\bclots?\b|\bclotting\b/;
const BETWEEN = /\b(between (?:my )?periods|mid[- ]cycle bleed|spotting (?:again|before my period))\b|\bspotting between\b/;
const AFTER_SEX = /\b(?:bled|bleeding|bleed|spotting|blood)\b[^.;]*\bafter (?:sex|intercourse)\b/;

const BOWEL = /\b(poo(?:ing|ed)?|pooping|bowels?|bowel movements?|number two|opening my bowels|on the loo|passing (?:a )?stools?|constipat\w*|passing glass)\b|\b(?:bum|bottom)\b[^.;]*\bwhen i go\b/;
const URINE = /\b(wee(?:ing)?|pee(?:ing)?|urine|urinat\w*|number one|pass(?:ing)? water|bladder)\b/;
const PAIN_DENIED = /\b(?:(?:doesn'?t|does not|didn'?t|did not|don'?t|isn'?t|wasn'?t) (?:hurt|sting|burn|ache)|no pain|not painful|painless)\b/;
const PAIN = /\b(hurts?|hurting|pain(?:ful)?|sore|sharp|sting(?:s|ing)?|burn(?:s|ing)?|agony|ache|aching|stabbing|like passing glass)\b/;
const FINE = /\b(fine|normal|ok|okay|no pain|without pain|painless)\b/;
const TUMMY = /\b(tummy|stomach|belly|abdomen|bloat\w*|bottom|pelvi\w+)\b/;

function clauses(lower: string): string[] {
  return lower.split(/[.!?;,]|\bbut\b|\band then\b/).map((c) => c.trim()).filter(Boolean);
}

function negated(clause: string, m: RegExpMatchArray): boolean {
  return NEG.test(clause.slice(0, m.index));
}

function countFrom(lower: string): number | undefined {
  if (new RegExp(`\\b(?:a|one) ${PRODUCT} (?:an|every|per|each) hour\\b`).test(lower)) return 8;
  const per = lower.match(/\bevery (?:half an |half-)?hour\b/);
  if (per && new RegExp(`\\b(?:chang\\w*|soak\\w*|through)\\b[^.;]*\\b${PRODUCT}|${PRODUCT}[^.;]*\\bevery\\b`).test(lower)) return 8;
  const re = new RegExp(`\\b${N}(?:\\s*(?:or|-|to)\\s*${N})?\\s+(?:(?:night|super|big|regular|maxi)\\s+)?${PRODUCT}`, 'g');
  const times = new RegExp(`\\b${PRODUCT}\\b[^.;]*?\\b${N}\\s+times\\b|\\b${PRODUCT}\\b[^.;]*?\\b(once|twice)\\b`);
  let best: number | undefined;
  for (const m of lower.matchAll(re)) {
    const v = Number.isNaN(Number(m[2] ?? m[1])) ? COUNT[m[2] ?? m[1]] : Number(m[2] ?? m[1]);
    if (v !== undefined) best = Math.max(best ?? 0, v);
  }
  if (best === undefined) {
    const t = lower.match(times);
    if (t) best = COUNT[t[1] ?? t[2]] ?? Number(t[1]);
  }
  return best;
}

function band(n: number | undefined): ProductBand | undefined {
  if (n === undefined || n <= 0) return undefined;
  return n <= 2 ? '1-2' : n <= 5 ? '3-5' : '6+';
}

/** Yes / no / not said for one topic: true if a clause names it with pain, false if named as fine or negated. */
function painTopic(lower: string, topic: RegExp): boolean | undefined {
  let out: boolean | undefined;
  for (const sentence of lower.split(/[.!?;]/)) {
    const cs = clauses(sentence);
    const hit = cs.findIndex((c) => topic.test(c));
    if (hit < 0) continue;
    const c = cs[hit];
    const m = c.match(topic) as RegExpMatchArray;
    const p = c.match(PAIN);
    if (p && !negated(c, p) && !PAIN_DENIED.test(c)) return true;
    // "Need to wee all the time but it doesn't hurt": the denial sits in the next clause of the same sentence
    const next = cs[hit + 1] ?? '';
    if (FINE.test(c) || negated(c, m) || PAIN_DENIED.test(c) || (PAIN_DENIED.test(next) && !topic.test(next))) out = false;
  }
  return out;
}

function flag(lower: string, re: RegExp): boolean | undefined {
  for (const c of clauses(lower)) {
    const m = c.match(re);
    if (m) return !negated(c, m);
  }
  return undefined;
}

export function holisticFrom(allWords: string): Holistic {
  const lower = ownWords(allWords).toLowerCase().replace(/[’]/g, "'");
  // "number one and two" names both topics in one phrase
  const both = /\bnumber one and (?:number )?two\b|\bboth (?:number )?one and two\b|\bboth number one and two\b/.test(lower);
  let bowelPain = painTopic(lower, BOWEL);
  let urinePain = painTopic(lower, URINE);
  if (both && PAIN.test(lower)) { bowelPain = true; urinePain = true; }
  const bleedClauses = clauses(lower).filter((c) => {
    const m = c.match(BLEED_WORDS);
    return m && !negated(c, m);
  });
  // "Bleeding after sex? No, not this time" answers its own question
  const afterSex = AFTER_SEX.test(lower) ? !/\bafter (?:sex|intercourse)\s*\?\s*(?:no|not|nope)\b/.test(lower) : undefined;
  return {
    mentionsBleeding: bleedClauses.length > 0,
    products: band(countFrom(lower)),
    flooding: flag(lower, FLOOD),
    clots: flag(lower, CLOTS),
    between: BETWEEN.test(lower) ? true : undefined,
    afterSex,
    bowelPain,
    urinePain,
    askBowelBladder: TUMMY.test(lower) && bowelPain === undefined && urinePain === undefined,
  };
}

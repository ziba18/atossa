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
  /** Tiredness named (true) or denied (false); `tiredWords` keeps her clause. Never a score she did not give. */
  tired?: boolean;
  tiredWords?: string;
  /** Skin and hair changes she says she noticed (PRD: each "noticed" only), with her own words. */
  skin?: { kind: SkinKind; words: string }[];
  /** "Did it help?" as she put it, one entry per clause that says so, with her own words. */
  helped?: { verdict: HelpVerdict; words: string }[];
  /** Pain with sex named (true) or denied (false); `sexPainWords` keeps her clause. Never a label. */
  sexPain?: boolean;
  sexPainWords?: string;
  /** Plans for pregnancy as she said them, mapped to the For my doctor chip she confirms; never 'Prefer not to say'. */
  fertility?: { wish: FertilityChip; words: string };
}

export type FertilityChip = 'Trying to get pregnant' | 'Not now' | 'Not sure';

export type SkinKind = 'acne' | 'extraHair' | 'hairLoss' | 'darkPatches';
export type HelpVerdict = 'yes' | 'a bit' | 'no';

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
const PAIN = /\b(hurts?|hurting|pain(?:ful)?|cramps?|cramping|sore|sharp|sting(?:s|ing)?|burn(?:s|ing)?|agony|ache|aching|stabbing|like passing glass)\b/;
const FINE = /\b(fine|normal|ok|okay|no pain|without pain|painless)\b/;
const TUMMY = /\b(tummy|stomach|belly|abdomen|bloat\w*|bottom|pelvi\w+)\b/;

// "Tired of this pain" is weariness with the pain, not tiredness.
const TIRED = /\b(tired(?! of\b)|exhausted|exhaustion|knackered|shattered|fatigued?|drained|worn out|wiped out|no energy|zero energy)\b/;
const SKIN: [SkinKind, RegExp][] = [
  ['acne', /\b(acne|spots|spotty|breakouts?|broke out|pimples?|zits?|oily skin)\b/],
  ['extraHair', /\b(?:hair (?:on|growing on|on my) (?:my )?(?:chin|face|lip|upper lip|tummy|belly|chest|nipples?|back|neck|jaw)|hair growing|facial hair|(?:chin|lip|face) hairs?|more hair)\b/],
  ['hairLoss', /\b(?:hair (?:is )?(?:falling out|coming out|thinning)|hair loss|thinning hair|losing (?:my )?hair|bald (?:patch|spot)|parting (?:looks )?wider)\b/],
  ['darkPatches', /\bdark (?:patch(?:es)?|skin|marks?|velvety)\b/],
];
const HELP_VERB = /\b(help(?:ed|s)?|eased?|worked|relieved|took the edge off|made (?:a|no|any) difference|did (?:nothing|sod all|zilch|f all)|better after|useless)\b/;
const HELP_OTHER = /\b(?:need|needs|needed|get|getting|ask(?:ed|ing)? for|can'?t|couldn'?t) (?:\w+ )?help\b/;
const HELP_NO = /\b(?:(?:didn'?t|did not|doesn'?t|does not|hasn'?t|won'?t|never|nothing) (?:\w+ )?(?:help(?:ed|s)?|work(?:ed|s)?|ease[ds]?)|made no difference|didn'?t make (?:a|any) difference|did (?:nothing|sod all|zilch|f all)|useless)\b/;
const HELP_BIT = /\b(?:a (?:little|bit|tiny bit)|slightly|somewhat|took the edge off)\b/;

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
    ...tiredFrom(lower),
    ...skinFrom(lower),
    ...helpedFrom(lower),
    ...sexPainFrom(lower),
    ...fertilityFrom(lower),
  };
}

// "My jeans don't fit and I'm tired": a negation does not reach past "and" (holistic v2, Marketing note).
function parts(lower: string): string[] {
  return clauses(lower).flatMap((c) => c.split(/\band\b/)).map((c) => c.trim()).filter(Boolean);
}

function tiredFrom(lower: string): Pick<Holistic, 'tired' | 'tiredWords'> {
  for (const c of parts(lower)) {
    const m = c.match(TIRED);
    if (m) return { tired: !negated(c, m), tiredWords: c };
  }
  return {};
}

function skinFrom(lower: string): Pick<Holistic, 'skin'> {
  const out: { kind: SkinKind; words: string }[] = [];
  for (const c of parts(lower)) {
    for (const [kind, re] of SKIN) {
      const m = c.match(re);
      if (m && !negated(c, m) && !out.some((o) => o.kind === kind)) out.push({ kind, words: c });
    }
  }
  return out.length ? { skin: out } : {};
}

function helpedFrom(lower: string): Pick<Holistic, 'helped'> {
  const out: { verdict: HelpVerdict; words: string }[] = [];
  for (const c of clauses(lower)) {
    if (!HELP_VERB.test(c) || HELP_OTHER.test(c)) continue;
    out.push({ verdict: HELP_NO.test(c) ? 'no' : HELP_BIT.test(c) ? 'a bit' : 'yes', words: c });
  }
  return out.length ? { helped: out } : {};
}

// "Essex" / "sexual health clinic" are not sex; "bleeding after sex" alone is afterSex, not pain.
const SEX = /\b(sex|intercourse|penetration|having sex|making love)\b/;
const SEX_PAIN_DENIED = /\b(?:no pain|painless|without pain|(?:didn'?t|did not|doesn'?t|does not|wasn'?t) (?:hurt|painful|sore)|was fine|is fine|fine)\b/;

const SEX_PAIN_NAMED = /\b(?:(?:sex|intercourse) pain|pain (?:with|during|in|after) (?:sex|intercourse))\b/;

function sexPainFrom(lower: string): Pick<Holistic, 'sexPain' | 'sexPainWords'> {
  const ps = parts(lower);
  for (const [i, c] of ps.entries()) {
    if (!SEX.test(c)) continue;
    if (SEX_PAIN_DENIED.test(c)) return { sexPain: false, sexPainWords: c };
    // "the sex pain" / "pain during sex" names the pain itself: a negation elsewhere in the clause ("I don't want to tell
    // the dr about the sex pain") is about something else; only "no sex pain" / "without pain during sex" denies it
    const named = c.match(SEX_PAIN_NAMED);
    if (named) return { sexPain: !/\b(?:no|not any|without|never any)\s+$/.test(c.slice(0, named.index)), sexPainWords: c };
    const p = c.match(PAIN);
    if (p && !negated(c, p)) return { sexPain: true, sexPainWords: c };
    // "Bleeding after sex, and it was sore deep inside afterwards": the pain sits in the next part and points back
    const next = ps[i + 1] ?? '';
    const q = next.match(PAIN);
    if (q && !negated(next, q) && /\b(?:afterwards|after|during|it)\b/.test(next)) return { sexPain: true, sexPainWords: `${c}, ${next}` };
  }
  return {};
}

const BABY = '(?:a baby|for a baby|pregnant|pregnancy|to conceive|conceiving|kids|children|a family)';
const FERT_TRYING = new RegExp(`\\b(?:trying|try|ttc|been trying|we're trying|started trying)\\b[^.;]*\\b${BABY}|\\btrying to conceive\\b|\\bttc\\b`);
const FERT_UNSURE = new RegExp(`\\b(?:not sure|don'?t know|unsure|undecided|back and forth)\\b[^.;]*\\b${BABY}|\\b${BABY}\\b[^.;]*\\b(?:not sure|don'?t know|unsure)\\b`);
const FERT_LATER = new RegExp(`\\b(?:not trying|don'?t want to get pregnant|not (?:for|until) a few years|one day|not yet|not right now|not at the moment|in a few years|later on)\\b`);
const FERT_TOPIC = new RegExp(`\\b(?:baby|pregnant|conceive|kids|children|start(?:ing)? a family|ttc)\\b`);

function fertilityFrom(lower: string): Pick<Holistic, 'fertility'> {
  for (const s of lower.split(/[.!?;]/).map((x) => x.trim()).filter(Boolean)) {
    if (!FERT_TOPIC.test(s) || /\bpregnancy test\b/.test(s)) continue;
    if (/\b(?:sister|friend|mum|cousin|colleague)\b[^.;]*\bpregnant\b/.test(s)) continue;
    if (FERT_UNSURE.test(s)) return { fertility: { wish: 'Not sure', words: s } };
    if (FERT_LATER.test(s)) return { fertility: { wish: 'Not now', words: s } };
    if (FERT_TRYING.test(s)) return { fertility: { wish: 'Trying to get pregnant', words: s } };
  }
  return {};
}

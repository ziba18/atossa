// Fixed signpost when a note contains urgent wording (hazard H4). Runs on the phone, sends nothing anywhere.
// It never labels, scores, stores or explains the note: it only shows the same fixed lines the chat guard uses.
// The lists and rules are generated from backend/app/services/output_guard.py (lib/urgentPatterns.generated.ts);
// scripts/urgent-wording-live.test.mjs runs this file against the shared phrase list.

import * as P from './urgentPatterns.generated';

const QUOTES: Record<string, string> = { '\u2018': "'", '\u2019': "'", '\u02bc': "'", '\u2032': "'" };

export const URGENT_SIGNPOST =
  'If you have severe sudden pain, very heavy bleeding or feel faint, call 999 or go to A&E, or call NHS 111.';
export const SELF_HARM_SIGNPOST =
  'If you might act on these thoughts, call 999 now. You can also call Samaritans free, any time, on 116 123, or call NHS 111.';


const HOMOGLYPHS: Record<string, string> = {
  а: 'a', е: 'e', о: 'o', р: 'p', с: 'c', х: 'x', у: 'y', і: 'i', ѕ: 's', ԁ: 'd',
  ο: 'o', ρ: 'p', α: 'a', ε: 'e', ι: 'i', κ: 'k', ν: 'v', τ: 't', υ: 'u',
};
const LEET: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '@': 'a', $: 's' };

// Mirrors backend `_norm`: invisible characters, accents, look-alike letters, "fa1nted", "f a i n t e d".
const DEVICE_TEMP = /\b(?:heat(?:ing)? pad|heating|heat on|hot[- ]?water bottle|pad|blanket|bath|shower|oven|dishwasher|dryer|setting|set (?:to|at))\b/i;

function normalise(text: string): string {
  let t = text.normalize('NFKC').normalize('NFD').replace(/[\p{Cf}\p{Mn}]/gu, '');
  // Record dates joined in by textOf() ("2026-09-24") are not words: a bare year would read as past tense (PM 27 Oct).
  t = t.replace(/\b\d{4}-\d{2}-\d{2}(?:T[\d:.]+Z?)?\b/g, ' ');
  t = t.replace(/[\u2018\u2019\u02bc\u2032]/g, (c) => QUOTES[c] ?? c).replace(/[\u201c\u201d]/g, '"');
  t = t.replace(/[^\x00-\x7f]/g, (c) => HOMOGLYPHS[c] ?? c);
  t = t.replace(/(?<=[A-Za-z])[0134@$](?=[A-Za-z])/g, (c) => LEET[c]);
  t = t.replace(/\b(?:[A-Za-z][ .\-]){2,}[A-Za-z]\b/g, (m) => m.replace(/[ .\-]/g, ''));
  // stretched letters ("sooo heavily") and doubled spaces ("chest  pain"); mirrors backend `_norm`
  t = t.replace(/([A-Za-z])\1{2,}/g, '$1');
  // dictation fillers ("um i cant like breathe") and "wanna"; mirrors backend `_norm`
  t = t.replace(/\b(?:um+|uh+|erm|er|hmm+)\b[ ,]*/gi, '');
  t = t.replace(/\b(i|it|they|cant|can't|wont|won't|dont|don't|is|am|are|was)\s+like\s+/gi, '$1 ');
  t = t.replace(/\bwanna\b/gi, 'want to');
  // spelled temperatures next to a temperature word; mirrors backend `_norm`
  const SPELLED: Record<string, string> = { 'thirty eight': '38', 'thirty nine': '39', forty: '40', 'thirty-eight': '38', 'thirty-nine': '39' };
  t = t.replace(/\b(thirty[ -](?:eight|nine)|forty)\b(?=\s*(?:degrees?\s*)?(?:c\b\s*)?(?:temp|temperature|fever)\b)|(?<=\btemp )(thirty[ -](?:eight|nine)|forty)\b|(?<=\btemperature )(thirty[ -](?:eight|nine)|forty)\b|(?<=\bfever of )(thirty[ -](?:eight|nine)|forty)\b|(?<=\btemperature of )(thirty[ -](?:eight|nine)|forty)\b/gi, (m) => SPELLED[m.toLowerCase()] ?? m);
  // measured temperatures read as "high temperature of 39" (38+ C or 100.4+ F); a device setting ("heat pad on temp 40") is not a body temperature; mirrors backend `_norm`
  const fever = (m: string, c: string | undefined, off: number, whole: string) =>
    DEVICE_TEMP.test(whole.slice(Math.max(0, off - 30), off)) ? m : `high temperature of ${c ?? '39'}`;
  t = t.replace(/\b(?:temp(?:erature)?|fever|thermometer (?:says|reads|shows|said))\s*(?:of|is|was|at|hit|hits|reached|reads|:)?\s*(3[89]|4[0-2])(?:\.\d)?\b(?!\s*(?:weeks?|days?|hours?|times|minutes?|mins?|degrees|mg|%))/gi, (m, c, off, whole) => fever(m, c, off, whole));
  t = t.replace(/\b(3[89]|4[0-2])(?:\.\d)?\s*(?:°\s*c|c|degrees)?\s*(?:temp(?:erature)?|fever)\b/gi, (m, c, off, whole) => fever(m, c, off, whole));
  t = t.replace(/\b(?:temp(?:erature)?|fever|thermometer (?:says|reads|shows|said))\s*(?:of|is|was|at|hit|hits|reached|reads|:)?\s*10[1-7](?:\.\d)?\b(?!\s*(?:weeks?|days?|hours?|times|minutes?|mins?|degrees|mg|%))/gi, (m, off, whole) => fever(m, undefined, off, whole));
  return t.replace(/[ \t]{2,}/g, ' ');
}

// Same decision as the backend `_hits`: a match counts unless its clause is negated, in the past, about someone else or resolved.
const mk = (src: string) => new RegExp(src, 'i');
const BODY = mk(P.BODY_SRC), EMERG = mk(P.EMERG_SRC), SELF = mk(P.SELF_SRC), SELF2 = mk(P.SELF2_SRC);
const LASTREL = new RegExp('^(?:' + P.LASTREL_SRC + ')$', 'i'), PRESENT = mk(P.PRESENT_SRC);
const NEG = mk(P.NEG_SRC), PAST = mk(P.PAST_SRC), OTHER = mk(P.OTHER_SRC), RES = mk(P.RES_SRC);
const CLAUSE = new RegExp(P.CLAUSE_SRC, 'gi'), IDIOM = new RegExp(P.IDIOM_SRC, 'gi');

/** Mirrors backend `_is_past`: "last week" with a present-tense word in the clause is not past tense. */
const AGAIN = /\b(?:(?:do|doing|try|trying) (?:it|that) again|again (?:tonight|today|now)|urge is back|urges? (?:are|is) back|(?:cut|cutting|hurt|hurting) myself again|thinking about (?:doing )?it again|want to do it again)\b/i;

function isPast(clause: string): boolean {
  const re = new RegExp(PAST.source, 'gi');
  let m: RegExpExecArray | null;
  while ((m = re.exec(clause)) !== null) {
    if (LASTREL.test(m[0]) && PRESENT.test(clause)) { if (m[0].length === 0) re.lastIndex++; continue; }
    return true;
  }
  return false;
}

const WHOLE = new RegExp(P.WHOLE_SRC, 'is');
function hitWhole(text: string): boolean {
  const m = WHOLE.exec(text);
  if (!m) return false;
  // Past tense counts only in the sentence(s) the match sits in, as in `hit`: "I had this in 2019. Now my belly is rock hard" is current.
  const from = text.slice(0, m.index).search(/[.;!?\n][^.;!?\n]*$/) + 1;
  const end = text.slice(m.index + m[0].length).search(/[.;!?\n]/);
  const sentence = text.slice(from, end < 0 ? undefined : m.index + m[0].length + end);
  return !(NEG.test(text.slice(Math.max(0, m.index - 40), m.index)) || isPast(sentence) || OTHER.test(text.slice(0, m.index)));
}

const THIRD = new RegExp(P.THIRD_SRC, 'is');

const PREG = /\bpregnan\w+\b/i;
const PREG_SYMPTOM = /\b(?:bleeding|spotting|cramps? (?:are |is )?(?:getting )?worse|severe|sharp pain|one-sided|blurr\w+ vision|pain getting worse|pelvic pain)\b/i;

function hit(pattern: RegExp, text: string): boolean {
  const re = new RegExp(pattern.source, 'gi');
  for (const clause of text.split(CLAUSE)) {
    if (!clause) continue;
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(clause)) !== null) {
      const before = clause.slice(0, m.index);
      const after = clause.slice(m.index + m[0].length);
      if (!(NEG.test(before.slice(-40)) || isPast(clause) || OTHER.test(before) || RES.test(after))) return true;
      if (m[0].length === 0) re.lastIndex++;
    }
  }
  return false;
}

/** The fixed line to show for this text, or null. Self-harm wording gets the support lines. */
export function urgentSignpost(text: string): string | null {
  const t = normalise(text).replace(IDIOM, ' ');
  if (hit(SELF, t) || hit(SELF2, t)) return SELF_HARM_SIGNPOST;
  // draft run 22 (Safety to review): past self-harm + present intent anywhere in the note = highest risk, not history.
  if ((SELF.test(t) || SELF2.test(t)) && AGAIN.test(t)) return SELF_HARM_SIGNPOST;
  if (hit(BODY, t) || hit(EMERG, t) || hitWhole(t)) return URGENT_SIGNPOST;
  if (THIRD.test(t.slice(0, 20000)) && !isPast(t)) return URGENT_SIGNPOST;
  if (PREG.test(t) && hit(PREG_SYMPTOM, t) && !/\bnot pregnant\b|\bpregnancy test\b/i.test(t)) return URGENT_SIGNPOST;
  return null;
}

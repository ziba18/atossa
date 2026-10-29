// Fixed signpost when a note contains urgent wording (hazard H4). Runs on the phone, sends nothing anywhere.
// It never labels, scores, stores or explains the note: it only shows the same fixed lines the chat guard uses.
// The lists and rules are generated from backend/app/services/output_guard.py (lib/urgentPatterns.generated.ts);
// scripts/urgent-wording-live.test.mjs runs this file against the shared phrase list.

import * as P from './urgentPatterns.generated';
import { SAMARITANS_NUMBER } from './helpNow';

const QUOTES: Record<string, string> = { '\u2018': "'", '\u2019': "'", '\u02bc': "'", '\u2032': "'" };

export const URGENT_SIGNPOST =
  'If you have severe sudden pain, very heavy bleeding or feel faint, call 999 or go to A&E, or call NHS 111.';
export const SELF_HARM_SIGNPOST =
  `If you might act on these thoughts, call 999 now. You can also call Samaritans free, any time, on ${SAMARITANS_NUMBER}, or call NHS 111.`;


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
  t = t.replace(/\b(ive|im|cant|dont|doesnt|didnt|isnt|wasnt|havent|hasnt|couldnt|wouldnt|shouldnt|arent|wont)\b/gi, (m) => { const l = m.toLowerCase(); return l === 'ive' ? "i've" : l === 'im' ? "i'm" : m.slice(0, -1) + "'" + m.slice(-1); });
  t = t.replace(/[^\S\n]+/g, ' ');
  // dictation fillers ("um i cant like breathe") and "wanna"; mirrors backend `_norm`
  t = t.replace(/\b(?:um+|uh+|erm|er|hmm+)\b[ ,]*/gi, '');
  t = t.replace(/\b(i|it|they|cant|can't|wont|won't|dont|don't|is|am|are|was)\s+like\s+/gi, '$1 ');
  t = t.replace(/\b(took|taken|to|is|was|am|and|but|so|just|really|had|has|with|my|then)\s+like\s+(?!being\b|i\b|i'm\b|i\u2019m\b|something\b|a (?:bang|knife|stabbing|hammer|vice|weight|punch)\b|there\b|it\b)/gi, '$1 ');
  t = t.replace(/\bwanna\b/gi, 'want to');
  // dictated number words (S-223); mirrors backend `_norm`
  const UNITS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9 };
  const TENS: Record<string, number> = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
  t = t.replace(/\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)(?:[ -](one|two|three|four|five|six|seven|eight|nine))?(?: point (one|two|three|four|five|six|seven|eight|nine))?\b/gi,
    (_m, tens: string, unit?: string, frac?: string) => {
      const n = TENS[tens.toLowerCase()] + (unit ? UNITS[unit.toLowerCase()] : 0);
      return frac ? `${n}.${UNITS[frac.toLowerCase()]}` : String(n);
    });
  t = t.replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten) (?=(?:\w+ )?(?:pads?|tampons?|towels?|tablets?|pills?|paracetamol|ibuprofen)\b)/gi,
    (_m, w: string) => `${w.toLowerCase() === 'ten' ? 10 : UNITS[w.toLowerCase()]} `);
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
const CLAUSE = new RegExp(P.CLAUSE_SRC, 'gi'), IDIOM = new RegExp(P.IDIOM_SRC, 'gi'), LEGBREATH = new RegExp(P.LEGBREATH_SRC, 'i');

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
// run08 v80: wish to be dead + worked out how, one sentence (same past/negation checks as WHOLE).
const SELFW = new RegExp(P.SELFW_SRC, 'i');
// run13 (A54, backend _BIRTH_TIME): the birth and its time phrase are context, not the symptom's time.
const BIRTH_TIME = /\b(?:had (?:the|my) baby|gave birth|given birth|(?:the |my )?baby (?:was )?born)\b(?: (?:\w+ ){0,2}(?:ago|last (?:week|month)|yesterday|on (?:mon|tues|wednes|thurs|fri|satur|sun)day))?/gi;

function hitWhole(text: string, rx: RegExp = WHOLE): boolean {
  const m = rx.exec(text);
  if (!m) return false;
  // Past tense counts only in the sentence(s) the match sits in, as in `hit`: "I had this in 2019. Now my belly is rock hard" is current.
  const from = text.slice(0, m.index).search(/[.;!?\n][^.;!?\n]*$/) + 1;
  const end = text.slice(m.index + m[0].length).search(/[.;!?\n]/);
  const sentence = text.slice(from, end < 0 ? undefined : m.index + m[0].length + end);
  return !(NEG.test(text.slice(Math.max(0, m.index - 40), m.index).split(/[.;:!?\n,]|\bbut\b/).pop()!.replace(/\bnothing,? but\b|\bnot being funny,? but\b|\bwithout (?:any )?warning\b|\b(?:never|haven't|hadn't) had (?:this|that|anything like this) before\b/gi, ' ')) || isPast(sentence.replace(BIRTH_TIME, ' ')) || OTHER.test(text.slice(0, m.index)));
}

const THIRD = new RegExp(P.THIRD_SRC, 'is');
const LEADIN = new RegExp(P.LEADIN_SRC, 'gi');
const THIRDC = new RegExp(P.THIRDC_SRC, 'i');

// run28 S-244 (backend emergency_kind): procedure + fever sign; the past check looks only at the clause holding the fever sign,
// so "coil fitted last week, shivering and a racing heart" is current. Exertion / "only" / weekday clauses stay quiet.
const PROCFEVER = new RegExp(P.PROCFEVER_SRC, 'i'), PROCFQ = new RegExp(P.PROCFQ_SRC, 'i');
function procFever(seg: string): boolean {
  if (!PROCFEVER.test(seg)) return false;
  const re = new RegExp(P.FEVER_SRC, 'gi');
  let m: RegExpExecArray | null;
  while ((m = re.exec(seg)) !== null) {
    const s0 = m.index, e0 = m.index + m[0].length;
    const a = Math.max(-1, ...['.', ';', '!', '?', '\n', ','].map((c) => seg.lastIndexOf(c, s0 - 1))) + 1;
    const ends = ['.', ';', '!', '?', '\n', ','].map((c) => seg.indexOf(c, e0)).filter((i) => i >= 0);
    let clause = seg.slice(a, ends.length ? Math.min(...ends) : seg.length);
    // unpunctuated note: the clause starts after the procedure's own time phrase when it sits before the fever sign
    const tp = new RegExp(P.PROCTIME_SRC, 'i').exec(clause);
    if (tp && tp.index + tp[0].length <= s0 - a) clause = clause.slice(tp.index + tp[0].length);
    if (!isPast(clause) && !PROCFQ.test(clause)) return true;
    if (m[0].length === 0) re.lastIndex++;
  }
  return false;
}

// run11 (S-236 second example): a sentence about someone else's / a family procedure history is dropped, "mine" names its
// procedure, and the medical checks re-run on the rest (backend `_other_hist_rescue`).
const PROCWORD = new RegExp(P.PROCWORD_SRC, 'i');
function otherHistRescue(text: string): boolean {
  const parts = text.slice(0, 20000).split(/(?<=[.;!?\n])/);
  const isOther = (x: string) => new RegExp(P.OTHERHIST_SRC, 'i').test(x);
  const sents = parts.filter(isOther);
  if (!sents.length) return false;
  let rest = parts.filter((x) => !isOther(x)).join(' ');
  const pw = sents.map((x) => x.match(PROCWORD)?.[0]).find((x) => x);
  if (pw) rest = rest.replace(/\b(?:mine|my own one|my own)\b(?! (?:op|operation|surgery|procedure|laparoscopy|hysteroscopy|biopsy|coil))/gi, 'my ' + pw);
  if (!PROCWORD.test(rest)) return false;
  return hitWhole(rest) || procFever(rest);
}

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
      if (!(NEG.test(before.slice(-40).split(/[.;:!?\n,]|\bbut\b/).pop()!) || isPast(clause) || OTHER.test(before) || RES.test(after))) return true;
      if (m[0].length === 0) re.lastIndex++;
    }
  }
  return false;
}

/** The fixed line to show for this text, or null. Self-harm wording gets the support lines. */
export function urgentSignpost(text: string): string | null {
  const line = signpostOnce(text);
  // run11 (backend emergency_kind): a line break must not hide a self-harm plan; re-read with line breaks as commas.
  if (line === null && text.includes('\n') && signpostOnce(text.replace(/\n/g, ', ')) === SELF_HARM_SIGNPOST) return SELF_HARM_SIGNPOST;
  return line;
}

function signpostOnce(text: string): string | null {
  const n0 = normalise(text);
  const t = (LEGBREATH.test(n0) ? n0 : n0.replace(IDIOM, ' ')).replace(LEADIN, '. ').replace(/^[ .]+/, ''); // lead-in at the start: strip the '. ' it leaves
  // run28 S-240: a line break between clauses must not hide a whole-note plan line, so it is also tried with ", ".
  if (hit(SELF, t) || hit(SELF2, t) || hitWhole(t, SELFW) || hitWhole(t.replace(/\n/g, ', '), SELFW)) return SELF_HARM_SIGNPOST;
  // draft run 22 (Safety to review): past self-harm + present intent anywhere in the note = highest risk, not history.
  if ((SELF.test(t) || SELF2.test(t)) && AGAIN.test(t)) return SELF_HARM_SIGNPOST;
  if (hit(BODY, t) || hit(EMERG, t) || hitWhole(t)) return URGENT_SIGNPOST;
  if (procFever(t.slice(0, 20000)) || otherHistRescue(t)) return URGENT_SIGNPOST;
  if ((THIRD.test(t.slice(0, 20000)) || THIRDC.test(t.slice(0, 20000))) && !isPast(t)) return URGENT_SIGNPOST;
  if (PREG.test(t) && hit(PREG_SYMPTOM, t) && !/\bnot pregnant\b|\bpregnancy test\b/i.test(t)) return URGENT_SIGNPOST;
  return null;
}

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
function normalise(text: string): string {
  let t = text.normalize('NFKC').normalize('NFD').replace(/[\p{Cf}\p{Mn}]/gu, '');
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
  return t.replace(/[ \t]{2,}/g, ' ');
}

// Same decision as the backend `_hits`: a match counts unless its clause is negated, in the past, about someone else or resolved.
const mk = (src: string) => new RegExp(src, 'i');
const BODY = mk(P.BODY_SRC), EMERG = mk(P.EMERG_SRC), SELF = mk(P.SELF_SRC), SELF2 = mk(P.SELF2_SRC);
const NEG = mk(P.NEG_SRC), PAST = mk(P.PAST_SRC), OTHER = mk(P.OTHER_SRC), RES = mk(P.RES_SRC);
const CLAUSE = new RegExp(P.CLAUSE_SRC, 'gi'), IDIOM = new RegExp(P.IDIOM_SRC, 'gi');

const WHOLE = new RegExp(P.WHOLE_SRC, 'is');
function hitWhole(text: string): boolean {
  const m = WHOLE.exec(text);
  return !!m && !(NEG.test(text.slice(Math.max(0, m.index - 40), m.index)) || PAST.test(text) || OTHER.test(text.slice(0, m.index)));
}

const PREG = /\bpregnan\w+\b/i;
const PREG_SYMPTOM = /\b(?:bleeding|spotting|cramps? (?:are |is )?(?:getting )?worse|severe|sharp pain|one-sided)\b/i;

function hit(pattern: RegExp, text: string): boolean {
  const re = new RegExp(pattern.source, 'gi');
  for (const clause of text.split(CLAUSE)) {
    if (!clause) continue;
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(clause)) !== null) {
      const before = clause.slice(0, m.index);
      const after = clause.slice(m.index + m[0].length);
      if (!(NEG.test(before.slice(-40)) || PAST.test(clause) || OTHER.test(before) || RES.test(after))) return true;
      if (m[0].length === 0) re.lastIndex++;
    }
  }
  return false;
}

/** The fixed line to show for this text, or null. Self-harm wording gets the support lines. */
export function urgentSignpost(text: string): string | null {
  const t = normalise(text).replace(IDIOM, ' ');
  if (hit(SELF, t) || hit(SELF2, t)) return SELF_HARM_SIGNPOST;
  if (hit(BODY, t) || hit(EMERG, t) || hitWhole(t)) return URGENT_SIGNPOST;
  if (PREG.test(t) && hit(PREG_SYMPTOM, t) && !/\bnot pregnant\b|\bpregnancy test\b/i.test(t)) return URGENT_SIGNPOST;
  return null;
}

// Gap-based follow-ups for the capture sheet. Pre-fills only from words Sam actually used
// (never turns a vague "right side" into a named zone), and asks only about what is still empty.
// Pure functions — no React.

export type Question = 'strength' | 'where' | 'when' | 'impact';

export const ALL_QUESTIONS: Question[] = ['strength', 'where', 'when', 'impact'];

export interface Prefill {
  zones?: string[];
  /** Period timing ("When"). Only from an unambiguous phrase; otherwise the chip question asks. */
  when?: string;
  /** "How long" — "Since Tuesday", "For 3 days". Never put into `when` (UX #4). */
  duration?: string;
  impacts?: string[];
  worst?: number;
  /** What she has tried, her words verbatim from the verb on: "Tried a hot water bottle" (N14). */
  tried?: string;
}

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Body zones named in Sam's words. Left/right only count when she also said where (tummy, belly…). */
function zonesFrom(lower: string): string[] {
  const zones: string[] = [];
  const tummy = /\b(tummy|belly|stomach|abdomen|pelvis|pelvic|low down|lower down)\b/.test(lower);
  if (tummy && /\bleft\b/.test(lower)) zones.push('Lower tummy left');
  if (tummy && /\b(centre|center|middle)\b/.test(lower)) zones.push('Lower tummy centre');
  if (tummy && /\bright\b/.test(lower)) zones.push('Lower tummy right');
  if (/\b(lower back|my back|back pain|in my back)\b/.test(lower)) zones.push('Lower back');
  if (/\bdeep inside\b/.test(lower)) zones.push('Deep inside');
  if (/\blegs?\b/.test(lower)) zones.push('Legs');
  if (/\b(my bottom|in my bottom|bum)\b/.test(lower)) zones.push('Bottom');
  return zones;
}

/** How long, lifted from her words: "Since Tuesday", "For 3 days". */
function durationFrom(lower: string): string | undefined {
  const since = lower.match(
    new RegExp(`\\bsince (${[...WEEKDAYS, 'yesterday', 'this morning', 'last night', 'last week', 'last month', 'the weekend'].join('|')})\\b`),
  );
  if (since) return cap(since[0]).replace(new RegExp(`\\b(${WEEKDAYS.join('|')})\\b`), (w) => cap(w));
  const forN = lower.match(/\bfor (?:about |around )?(\d+|a|an|one|two|three|four|five|six|seven|a few|a couple of) (days?|weeks?|months?|years?)\b/);
  if (forN) return cap(forN[0]);
  return undefined;
}

/**
 * Period timing only when she was unambiguous ("only on my period", "all the time"). A bare
 * "during my period" doesn't say whether it also happens at other times, so the chip question asks.
 */
function whenFrom(lower: string): string | undefined {
  if (/\b(all the time|constant(ly)?|every day|non-?stop)\b/.test(lower)) return 'All the time';
  if (/\bonly (during|on|around|before|with) my period\b/.test(lower)) return 'Only around my period';
  return undefined;
}

/** Clauses split on punctuation and "but", so a negation only reaches its own clause. */
const clausesOf = (lower: string) => lower.split(/[.,;!?]|\bbut\b|\bthough\b|\bwhich\b/).map((c) => c.trim()).filter(Boolean);
// Negation or an all-clear: the thing was NOT affected ("no pain at work", "work was fine").
const LOST = /\b(couldn'?t|can'?t|cannot|unable|not able|wasn'?t able|missed|bail(?:ed)?|had to (?:leave|stop|cancel|miss)|was a no)\b/;
const CLEAR = /\b(no|not|nothing|never|without|fine|ok|okay|good|alright|normal|didn'?t|did not|doesn'?t|does not|don'?t|wasn'?t|wouldn'?t)\b|n['’]t\b/;
// Sleep is the reverse: "didn't sleep", "wasn't able to sleep" ARE the impact; "slept fine" is not.
const SLEEP_LOST = /\b(didn'?t|did not|couldn'?t|can'?t|cannot|wasn'?t able to|unable to|barely|hardly|not much|no)\b.*\b(sleep|slept)\b|\b(woke|awake|up all night)\b/;
const SLEEP_OK = /\b(slept|sleeping|sleep)\b.*\b(fine|well|ok|okay|good|ok)\b/;

function impactsFrom(lower: string): string[] {
  const out = new Set<string>();
  for (const c of clausesOf(lower)) {
    const cleared = CLEAR.test(c) && !LOST.test(c);
    if (/\b(work|study|studying|school|uni|college|job|office|shift)\b/.test(c) && !cleared) out.add('Work or study');
    if (/\b(sleep|slept|sleeping|woke|awake)\b/.test(c) && (SLEEP_LOST.test(c) || (!cleared && !SLEEP_OK.test(c)))) out.add('Sleep');
    if (/\b(exercise|exercising|gym|workout|swim|swimming|yoga)\b/.test(c) && !cleared) out.add('Exercise');
    if (/\b(plans|friends|cancel|cancelled|canceled)\b/.test(c) && !cleared) out.add('Plans with people');
  }
  return [...out];
}

const NUM_WORDS: Record<string, number> = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const NUM = '(?:10|ten|[0-9]|zero|one|two|three|four|five|six|seven|eight|nine)';
const toNum = (t: string) => (t in NUM_WORDS ? NUM_WORDS[t] : Number(t));

/** "7 out of 10", "seven out of ten", "7/10", "it's a seven", "7ish". Several scores -> the highest (worst). */
function scoreFrom(lower: string): number | undefined {
  const found: number[] = [];
  for (const m of lower.matchAll(new RegExp(`\\b(${NUM})\\s*(?:/|out of)\\s*(?:10|ten)\\b`, 'g'))) found.push(toNum(m[1]));
  if (!found.length) {
    const m = lower.match(new RegExp(`\\b(?:it['’]?s|its|about|around|maybe|like)\\s+(?:a\\s+)?(${NUM})(?:ish)?\\b(?!\\s*(?:days?|weeks?|hours?|mins?|minutes?|times|months?|years?|am|pm|o['’]clock|%))`));
    if (m) found.push(toNum(m[1]));
  }
  return found.length ? Math.max(...found) : undefined;
}

/**
 * "…Tried a hot water bottle" → "Tried a hot water bottle". Only when she is the subject (sentence
 * start or "I / I've / I have …"), so "it took ages" never counts. Her own words up to the end
 * of that clause; first letter capitalised for display.
 */
function triedFrom(words: string): string | undefined {
  const m = words.match(/(?:^|[.!?;]\s*|\b(?:I|I've|I’ve|I have|I had)\s+)((?:tried|took|used|been taking|been using)\b\s+[^.!?;\n]+)/i);
  // ", tried paracetamol" — after a comma only "tried" counts ("it hurt, took ages" doesn't).
  const hit = m?.[1] ?? words.match(/,\s*(tried\s+[^.!?;\n]+)/i)?.[1];
  if (!hit) return undefined;
  const clause = hit.trim().replace(/[,\s]+$/, '');
  return clause.split(/\s+/).length >= 2 ? cap(clause) : undefined;
}

export function prefillFrom(words: string): Prefill {
  const lower = words.toLowerCase();
  // Negated phrases are dropped first, so "No back pain today, only my tummy" doesn't fill Lower back.
  const zones = zonesFrom(lower.replace(/\b(?:no|not|without|never)\b(?! able)[^,.;!?]*/g, ' '));
  const impacts = impactsFrom(lower);
  return {
    zones: zones.length ? zones : undefined,
    when: whenFrom(lower),
    duration: durationFrom(lower),
    impacts: impacts.length ? impacts : undefined,
    worst: scoreFrom(lower),
    tried: triedFrom(words),
  };
}

export interface Answered {
  strength: boolean;
  where: boolean;
  when: boolean;
  impact: boolean;
}

export const MAX_FOLLOW_UPS = 3; // owner decision 2026-10-26: capture first, at most 3 guided questions

/**
 * The follow-ups still worth asking, in order (impact last, so it is the one dropped when all four
 * are open: site, timing and severity are the core of a standard pain history, SOCRATES). The starter tag decides the first one:
 * "Pain today" → strength, "Something new" → when. "Just a quick note" asks nothing.
 */
export function questionsFor(answered: Answered, tag?: string): Question[] {
  if (tag === 'Just a quick note') return [];
  let order = [...ALL_QUESTIONS];
  if (tag === 'Something new') order = ['when', 'where', 'strength', 'impact'];
  return order.filter((q) => !answered[q]).slice(0, MAX_FOLLOW_UPS);
}

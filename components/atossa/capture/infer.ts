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

function impactsFrom(lower: string): string[] {
  const out: string[] = [];
  if (/\b(work|study|studying|school|uni|college|job|office|shift)\b/.test(lower)) out.push('Work or study');
  if (/\b(sleep|slept|sleeping|woke|awake)\b/.test(lower)) out.push('Sleep');
  if (/\b(exercise|exercising|gym|workout|swim|swimming|yoga)\b/.test(lower)) out.push('Exercise');
  if (/\b(plans|friends|cancel|cancelled|canceled)\b/.test(lower)) out.push('Plans with people');
  return out;
}

/** "7 out of 10", "7/10", "a 7 out of ten". */
function scoreFrom(lower: string): number | undefined {
  const m = lower.match(/\b(10|[0-9])\s*(?:\/|out of)\s*(?:10|ten)\b/);
  return m ? Number(m[1]) : undefined;
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
  const zones = zonesFrom(lower);
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

/**
 * The follow-ups still worth asking, in order. The starter tag decides the first one:
 * "Pain today" → strength, "Something new" → when. "Just a quick note" asks nothing.
 */
export function questionsFor(answered: Answered, tag?: string): Question[] {
  if (tag === 'Just a quick note') return [];
  let order = [...ALL_QUESTIONS];
  if (tag === 'Something new') order = ['when', 'where', 'strength', 'impact'];
  return order.filter((q) => !answered[q]).slice(0, 4);
}

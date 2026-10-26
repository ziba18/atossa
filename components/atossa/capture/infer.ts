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
  const zones = new Set<string>();
  const tummy = /\b(tummy|belly|stomach|abdomen|pelvis|pelvic|low down|lower down)\b/.test(lower);
  // Each clause on its own, so "the right was fine but the left hurt" only keeps the left.
  for (const c of clausesOf(lower)) {
    if (CLEAR.test(c) && !LOST.test(c)) continue;
    if (tummy && /\bleft\b/.test(c)) zones.add('Lower tummy left');
    if (tummy && /\b(centre|center|middle)\b/.test(c)) zones.add('Lower tummy centre');
    if (tummy && /\bright\b/.test(c)) zones.add('Lower tummy right');
    if (tummy && /\bboth sides\b/.test(c)) zones.add('Lower tummy left').add('Lower tummy right');
    if (/\b(lower back|my back|me back|back pain|back ache|backache|in my back|(?:sore|aching|achy|painful|tender|stiff) back)\b/.test(c)) zones.add('Lower back');
    if (/\bdeep inside\b|\bdeep\b[^.,;]{0,20}\binside\b/.test(c)) zones.add('Deep inside');
    if (/\blegs?\b/.test(c)) zones.add('Legs');
    if (/\b(my bottom|in my bottom|bum)\b/.test(c)) zones.add('Bottom');
  }
  return [...zones];
}

/** How long, lifted from her words: "Since Tuesday", "For 3 days". */
function durationFrom(lower: string): string | undefined {
  // How long she has been taking a remedy is not how long it has hurt ("taking magnesium for a week").
  lower = lower.replace(/\b(?:been )?(?:taking|using|trying)\b[^.,;!?]*/g, ' ');
  const since = lower.match(
    new RegExp(`\\bsince (${[...WEEKDAYS, 'yesterday', 'this morning', 'last night', 'last week', 'last month', 'the weekend'].join('|')})\\b`),
  );
  if (since) return cap(since[0]).replace(new RegExp(`\\b(${WEEKDAYS.join('|')})\\b`), (w) => cap(w));
  const forN = lower.match(/\b(?:for (?:about |around |the last |the past )?|(?:it'?s |it has |has )?been (?:about |around )?)(\d+|a|an|one|two|three|four|five|six|seven|a few|a couple of) (days?|weeks?|months?|years?)\b/);
  if (forN) return cap(forN[0]);
  return undefined;
}

/**
 * Period timing only when she was unambiguous ("only on my period", "all the time"). A bare
 * "during my period" doesn't say whether it also happens at other times, so the chip question asks.
 */
function whenFrom(lower: string): string | undefined {
  if (/\b(all the time|constant(ly)?|every day|non-?stop)\b/.test(lower)) return 'All the time';
  if (/\b(?:never|not|n['’]t|no) (?:\w+ )?only\b/.test(lower)) return undefined; // "never only on my period", "not only around my period"
  if (/\bonly (?:\w+ )?(?:(?:hurts?|happens?|get|gets) )?(?:during|on|around|before|with) my period\b/.test(lower)) return 'Only around my period';
  return undefined;
}

/** Clauses split on punctuation and "but", so a negation only reaches its own clause. */
const clausesOf = (lower: string) => lower.split(/[.,;!?]|\bbut\b|\bthough\b|\bwhich\b/).map((c) => c.trim()).filter(Boolean);
// Negation or an all-clear: the thing was NOT affected ("no pain at work", "work was fine").
const LOST = /\b(skipped|(?:didn'?t|did not) (?:go|make it|manage)|couldn'?t|could not|can'?t|cannot|unable|not able|wasn'?t able|missed|bail(?:ed)?|had to (?:leave|stop|cancel|miss)|(?:went|go|gone|came|come|sent) home|left early|was a no)\b/;
const CLEAR = /\b(no|not|nothing|never|without|fine|ok|okay|good|alright|normal|great|brilliant|lovely|enjoyed|well|still|went|even|didn'?t|did not|doesn'?t|does not|don'?t|wasn'?t|wouldn'?t)\b|hardly|barely|n['’]t\b/;
// Sleep is the reverse: "didn't sleep", "wasn't able to sleep" ARE the impact; "slept fine" is not.
const SLEEP_LOST = /\b(didn'?t|did not|couldn'?t|can'?t|cannot|wasn'?t able to|unable to|barely|hardly|not much|no)\b.*\b(sleep|slept)\b(?! (?:problems?|issues?|trouble))|\b(woke|awake|up all night|kept me up)\b/;
const SLEEP_OK = /\b(slept|sleeping|sleep)\b.*\b(fine|well|ok|okay|good|great|brilliant)\b|\bslept (?:like a (?:log|baby)|through|soundly)\b|\bno (?:sleep )?(?:problems?|issues?|trouble)\b/;

function impactsFrom(lowerRaw: string): string[] {
  const out = new Set<string>();
  // Speech recognisers often hear "six" as "sex": "it's a sex out of ten" is a score, not the Sex impact.
  const lower = lowerRaw.replace(/\bsex\s*(?:out of|\/)\s*(?:10|ten)\b/g, ' ');
  for (const c of clausesOf(lower)) {
    if (/^(?:i(?:'ve| have)? )?(?:tried|took|used|been taking|been using|trying)\b/.test(c) && !LOST.test(c)) continue; // a remedy, not an impact ("tried yoga")
    const cleared = CLEAR.test(c) && !LOST.test(c);
    if (/\b(work|study|studying|school|uni|college|job|office|shift|lectures?|lessons?|exam)\b/.test(c) && !cleared) out.add('Work or study');
    if (/\b(sleep|slept|sleeping|woke|awake|kept me up)\b/.test(c) && (SLEEP_LOST.test(c) || (!cleared && !SLEEP_OK.test(c)))) out.add('Sleep');
    if (/\b(exercise|exercising|gym|workout|swim|swimming|yoga)\b/.test(c) && !cleared) out.add('Exercise');
    if (/\b(plans|friends|cancel|cancelled|canceled|didn'?t see (?:anyone|anybody|my \w+)|saw (?:no one|nobody)|stayed in)\b/.test(c) && (!cleared || /didn'?t see|saw (?:no one|nobody)/.test(c))) out.add('Plans with people');
    if (/\bsex\b/.test(c) && !cleared) out.add('Sex');
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
  for (const m of lower.matchAll(new RegExp(`\\b(?:rated(?: it)?|was|is|scored|then)\\s+(?:a\\s+)?(${NUM})(?:ish)?\\b(?!\\s+(?:of|sided|thing|more|time|other|off|day|way|side|that|who|which|to|too|for)\\b)(?!\\s*(?:days?|weeks?|hours?|mins?|minutes?|times|months?|years?|am|pm|o['’]clock|%))`, 'g'))) found.push(toNum(m[1]));
  // "it's a four but it spikes to an eight": a peak is the worst, whatever else was said.
  for (const m of lower.matchAll(new RegExp(`\\b(?:spikes?|goes up|goes|rises?|peaks?|climbs?|gets?|up)\\s+to\\s+(?:an?\\s+)?(${NUM})(?:ish)?\\b(?!\\s*(?:days?|weeks?|hours?|mins?|minutes?|times|months?|years?|am|pm|o['’]clock|%))`, 'g'))) found.push(toNum(m[1]));
  // "it hit a nine for twenty minutes": reaching a score is a peak too.
  for (const m of lower.matchAll(new RegExp(`\\b(?:hit|hits|reached|reaches|touched)\\s+(?:an?\\s+)?(${NUM})(?:ish)?\\b(?!\\s*(?:days?|weeks?|hours?|mins?|minutes?|times|months?|years?|am|pm|o['’]clock|%))`, 'g'))) found.push(toNum(m[1]));
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
  // Cut at "then" ("tried a hot bath, then slept") and drop "tried nothing yet" (not having tried is not a try).
  const clause = hit.trim().split(/,?\s+then\b/i)[0].replace(/[,\s]+$/, '');
  if (/^(?:tried|took|used|been taking|been using)\s+(?:nothing|nowt|none|no\b|not)/i.test(clause)) return undefined;
  // "took the bus home", "took ages", "used before": not a remedy.
  if (/^(?:took|used|been taking|been using)\s+(?:the |a )?(?:bus|train|tube|tram|taxi|cab|car|ages|hours|forever|a while|time|before|to\b|up\b|it\b|that\b|this\b|already|again|today)/i.test(clause)) return undefined;
  return clause.split(/\s+/).length >= 2 ? cap(clause) : undefined;
}

const OTHER_NOUN = '(?:sister|mum|mom|mother|dad|father|brother|friend|cousin|partner|boyfriend|girlfriend|husband|wife|colleague|daughter|son|aunt|auntie|nan|nana|gran|granny|grandma|neighbour|neighbor|boss|teacher)';
const OTHER_SUBJECT = new RegExp(`^(?:my ${OTHER_NOUN}\\b|she\\b|he\\b|her\\b|his\\b|they\\b|their\\b)`, 'i');
const OTHER_MENTION = new RegExp(`\\bmy ${OTHER_NOUN}\\b`, 'i');
const THIRD_PERSON = /\b(?:she|he|her|his|hers|they|their)\b/i;
const FIRST_PERSON = /\b(?:i|i['’]m|i['’]ve|i['’]d|me|mine|myself)\b/i;

/** Sentences about someone else ("My mum had to leave work", "She says her legs ache") say nothing about her. */
export function ownWords(words: string): string {
  return words
    .split(/(?<=[.!?])\s+/)
    .filter((s) => {
      const t = s.trim();
      if (OTHER_SUBJECT.test(t)) return false;
      return !(OTHER_MENTION.test(t) && THIRD_PERSON.test(t) && !FIRST_PERSON.test(t));
    })
    .join(' ');
}

export function prefillFrom(allWords: string): Prefill {
  const words = ownWords(allWords);
  // Another scale ("3 on a scale of 5", "4 out of 5", "3/5", "50%") is not a 0-10 score; drop it before reading numbers.
  const lower = words.toLowerCase()
    .replace(/\b\d+\s+on a scale of \d+\b/g, ' ')
    .replace(/\bscale of (?:1 ?(?:to|-) ?)?\d+\b/g, ' ')
    .replace(/\b\d+\s*(?:out of|\/)\s*(?:5|five|3|three|7|seven|20|100)\b/g, ' ')
    .replace(/\b\d+\s?%/g, ' ');
  // Negated phrases are dropped first, so "No back pain today, only my tummy" doesn't fill Lower back.
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

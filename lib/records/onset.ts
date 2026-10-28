// Onset in her own words (PM run05 task 2; pm/prd/onset-and-treatments.md AC3). A note like "since I was
// 15" or "for about two years" offers her phrase, verbatim, for "When did you first notice this?". It is
// never turned into a date or an age (that would be a computed number) and nothing is saved until she
// confirms it. Episodes ("since this morning", "for two days"), other people, medicines, waits and
// life events ("I've worked there for two years") are not symptom onsets and return null.

const NUM = String.raw`(?:\d{1,2}|a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|a few|few|a couple of|several|many)`;
const MONTH = String.raw`(?:january|february|march|april|may|june|july|august|september|october|november|december)`;
const SEASON = String.raw`(?:spring|summer|autumn|fall|winter)`;
const QUAL = String.raw`(?:about|around|roughly|nearly|almost|over|at least|maybe)\s+`;
const LONG = String.raw`(?:weeks?|months?|years?)`;

const PATTERNS: RegExp[] = [
  // since I was 15 / since my teens / since my first period / since 2021 / since I had my son / since coming off the pill in January
  new RegExp(String.raw`\b(?:ever\s+)?since\s+(?:I\s+was\s+(?:${QUAL})?(?:\d{1,2}|a\s+(?:teen(?:ager)?|kid|child|girl))|my\s+(?:teens|first\s+period|periods\s+started|\w+\s+(?:was\s+born|pregnancy))|(?:19|20)\d\d|(?:last\s+)?(?:${MONTH}|${SEASON})(?:\s+(?:19|20)\d\d)?|I\s+(?:had|started|stopped|came\s+off|had\s+my)\b[^.,;!?]{1,40}|(?:coming|going)\s+off\s+[^.,;!?]{1,40}|(?:${NUM})\s+${LONG}\s+ago|puberty|forever)`, 'i'),
  // for about two years / for 6 months / for the last few weeks / for years
  new RegExp(String.raw`\bfor\s+(?:the\s+(?:last|past)\s+)?(?:${QUAL})?(?:${NUM}\s+)?${LONG}\b`, 'i'),
  // started / began / first noticed ... around 2019 / last spring / two years ago / when I was 12 / in March
  new RegExp(String.raw`\b(?:started|began|begun|start(?:ing)?|first\s+(?:noticed|had|got)|came\s+on)\b[^.,;!?]{0,25}?\b(?:(?:${QUAL})?(?:19|20)\d\d|(?:last|this)\s+(?:${SEASON}|year|${MONTH})|in\s+(?:${MONTH}|${SEASON}|(?:19|20)\d\d)|(?:${QUAL})?(?:${NUM})\s+${LONG}\s+ago|when\s+I\s+was\s+(?:${QUAL})?\d{1,2}|at\s+(?:${QUAL})?\d{1,2})\b`, 'i'),
];

// A clause about something other than her symptom starting (checked on the whole clause).
const NOT_ONSET = new RegExp([
  String.raw`\b(?:on|taking|took|take|using|used|tried)\b[^.,;!?]*\b(?:pill|coil|ibuprofen|paracetamol|naproxen|tablets?|medicines?|meds|injection|implant|patch|mirena|iud)\b`,
  String.raw`\b(?:pill|coil|implant|ibuprofen|paracetamol|tablets?)\s+for\b`,
  String.raw`\b(?:taking|took|been\s+on|using)\s+\w+(?:\s+\w+)?\s+for\b`,
  String.raw`\b(?:trying|tried|ttc|baby|pregnant|pregnancy|conceive|family)\b`,
  String.raw`\bnot\s+for\b`,
  String.raw`\b(?:waited|waiting|wait|appointment|referral|list)\b`,
  String.raw`\b(?:worked|work|lived|live|moved|married|together|known|studied|job)\b`,
  String.raw`\b(?:my|her|his|our)\s+(?:sister|mum|mom|mother|dad|friend|partner|aunt|gran|nan|daughter|son|cousin|boyfriend|girlfriend|husband|wife)\s+(?:has|had|have|'s|is)\s+(?!born)`,
  String.raw`\b(?:the\s+)?(?:gp|doctor|nurse|consultant)\s+(?:said|told|says)\b`,
].join('|'), 'i');

// Short episodes and the future are not an onset.
const EPISODE = /\b(?:this\s+morning|today|tonight|yesterday|last\s+night|(?:a|one|two|three|\d+)\s+(?:days?|hours?|nights?)|in\s+\d+\s+(?:weeks?|months?))\b/i;

/** Her onset phrase, verbatim, or null. The caller shows it for her to confirm; it is never saved silently. */
export function onsetWords(text: string): string | null {
  for (const clause of text.split(/[.;!?\n]+|,\s*(?=but\b|and\s+(?:my|the)\b)/i)) {
    if (!clause.trim() || NOT_ONSET.test(clause)) continue;
    for (const re of PATTERNS) {
      const m = re.exec(clause);
      if (!m) continue;
      const phrase = m[0].trim().replace(/\s+/g, ' ');
      if (EPISODE.test(phrase)) continue;
      return phrase;
    }
  }
  return null;
}

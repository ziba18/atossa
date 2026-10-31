// The ONE document model for the For my doctor tab. `buildDoctorSummary` turns Sam's records +
// the builder's choices into a typed `DoctorDoc`; the on-screen preview / Show on screen
// (components/atossa/doctor/DocumentView.tsx) and the PDF (`summaryToHtml`) both render that
// same model, so they can never say different things.
//
// Rules (every string produced here): it only repeats what Sam entered. Never a condition name,
// an interpretation, a threshold label, a cause ("linked to"), a trend or a suggestion. No averages
// — strength is shown as the raw values Sam gave (or a min–max of them). Sections and fields with
// no data are omitted from `sections` (never an empty label); the 13 PRODUCT §4 areas in `domains`
// each get one line, "Not recorded" when empty, so a clinician can tell "not logged" from "left out". "Not sure" / "Skip" / "It varies" /
// "Nothing today" are never counted as impacts; an unanswered strength is never 0.
import { colors, severityColor } from '../../constants/atossaUI';
import type {
  AppointmentData, Cycle, DatePrecision, HistoryData, MedicineData, PeriodDayData, Rec, SymptomData,
} from '../../types/records';
import { MONTH_NAMES, addDays, diffDays, formatDate, inclusiveDays, parseKey, toKey, daysInMonth } from './dates';
import {
  bleedingStatus, formatDay, formatDuration, formatRange, formatShortDate, formatWhen, formatWhere, joinFacts,
  labelEscape, noteCount, noteSortTime, peakOf,
  realImpacts, typicalOf, worstOf,
} from './format';
import { BODY_ZONE_LABELS } from './fields';
import { daysWith, impactDays, inRange as inRangeOf, MAX_ZONE_ROWS, nOfN, strengthRange, zoneDays } from './counts';
import { thinView } from './thinCounts';

// ---- cycles (kept for other callers) --------------------------------------------------------

/** Period days → one Cycle per logged start, newest first. Only arithmetic on the user's own dates. */
export function deriveCycles(days: PeriodDayData[]): Cycle[] {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const cycles: Cycle[] = [];
  for (const day of sorted) {
    if (day.isStart) cycles.push({ start: day.date });
    if (day.isEnd) {
      const open = [...cycles].reverse().find((c) => !c.end && c.start <= day.date);
      if (open) {
        open.end = day.date;
        open.length = inclusiveDays(open.start, day.date);
      }
    }
  }
  cycles.forEach((cycle, i) => {
    const next = cycles[i + 1];
    if (next) cycle.cycleLength = diffDays(cycle.start, next.start);
  });
  return cycles.reverse();
}

export function periodSummary(days: PeriodDayData[]): string {
  const latest = deriveCycles(days)[0];
  if (!latest) return 'No period dates logged';
  if (!latest.end) return `Period started: ${formatDate(latest.start, true)}`;
  return `Period logged: ${formatRange(latest.start, latest.end)}`;
}

// ---- builder choices ------------------------------------------------------------------------

export const VISIT_TYPES = [
  'First time talking about this', 'Follow-up', 'Seeing a specialist', 'Other',
] as const;
export type VisitType = (typeof VISIT_TYPES)[number];

export type RangeChoice = 'since' | '3m' | '6m';
export const RANGE_LABEL: Record<RangeChoice, string> = {
  since: 'Since last appointment', '3m': 'Last 3 months', '6m': 'Last 6 months',
};
/** "Since last appointment" never reaches further back than this (the strip shows ≤ 93 days anyway). */
export const SINCE_MAX_MONTHS = 6;

export type SectionId =
  | 'words' | 'frequency' | 'periods' | 'impacts' | 'tried' | 'appointments' | 'history'
  | 'sex' | 'mood' | 'eating';

/** Section titles, in document order. Sensitive ones are off unless switched on per summary. */
// Order = app-blueprint §3.7a page 1: (agenda) · main symptoms pattern · periods · associated
// (the sensitive ones sit here) · impact · tried · history/medicines · in my words. Appointments
// follow history (§3.7a lists none; kept for the visit write-ups).
export const SECTION_META: { id: SectionId; title: string; sensitive: boolean }[] = [
  { id: 'frequency', title: 'How often and how strong', sensitive: false },
  { id: 'periods', title: 'Periods logged', sensitive: false },
  { id: 'sex', title: 'Sex & intimacy', sensitive: true },
  { id: 'mood', title: 'Mood', sensitive: true },
  { id: 'eating', title: 'Eating', sensitive: true },
  { id: 'impacts', title: 'What it got in the way of', sensitive: false },
  { id: 'tried', title: 'What I’ve tried', sensitive: false },
  { id: 'history', title: 'Health history', sensitive: false },
  { id: 'appointments', title: 'Appointments', sensitive: false },
  { id: 'words', title: 'Symptoms in my words', sensitive: false },
];

// ---- the 13 areas (PRODUCT.md §4), in §3.7a order -------------------------------------------

export type DomainId =
  | 'agenda' | 'pain' | 'fatigue' | 'bleeding' | 'bowelBladder' | 'sexPain' | 'mood' | 'skinHair'
  | 'eating' | 'impact' | 'tried' | 'history' | 'fertility';

/** `section` = the sensitive switch that governs the area (off → "Not included", data or not). */
export const DOMAINS: { id: DomainId; heading: string; section?: SectionId }[] = [
  { id: 'agenda', heading: 'Appointments and what I want from them' },
  { id: 'pain', heading: 'Pain' },
  { id: 'fatigue', heading: 'Tiredness and sleep' },
  { id: 'bleeding', heading: 'Bleeding and periods' },
  { id: 'bowelBladder', heading: 'Bowel and bladder' },
  { id: 'sexPain', heading: 'Pain with sex', section: 'sex' },
  { id: 'mood', heading: 'Mood', section: 'mood' },
  { id: 'skinHair', heading: 'Skin and hair' },
  { id: 'eating', heading: 'Weight and eating', section: 'eating' },
  { id: 'impact', heading: 'What it got in the way of' },
  { id: 'tried', heading: 'What I’ve tried' },
  { id: 'history', heading: 'Health history' },
  { id: 'fertility', heading: 'Plans for pregnancy' },
];

export const NOT_RECORDED = 'Not recorded';
/** Shown for a sensitive area that is switched off — the same words whether or not it has data. */
export const NOT_INCLUDED = 'Not included in this summary';

export type DomainState = 'recorded' | 'not-recorded' | 'not-included';
export interface DomainLine {
  id: DomainId;
  heading: string;
  state: DomainState;
  /** The facts as counts / her choices, or NOT_RECORDED / NOT_INCLUDED. */
  text: string;
  /** "First noticed: …" (as reported) for symptom groups with notes; '' otherwise. Never computed. */
  onset: string;
}

/** Symptom groups that carry a patient-entered "When did you first notice this?" (pm/prd/onset-and-treatments.md). */
export type OnsetGroup = 'pain' | 'bleeding' | 'bowelBladder' | 'fatigue' | 'mood' | 'skinHair';
/** `words`: her own phrase ("since I was 15"), confirmed by her; shown verbatim, never turned into a date. */
export interface Onset { month?: number; year?: number; notSure?: boolean; words?: string }
export const FERTILITY_OPTIONS = ['Trying to get pregnant', 'Not now', 'Not sure', 'Prefer not to say'] as const;
export type FertilityWish = (typeof FERTILITY_OPTIONS)[number];

export const isSensitive = (id: SectionId) => SECTION_META.find((s) => s.id === id)?.sensitive ?? false;

/** Is this section in the document? Sensitive → only when explicitly true; others → unless false. */
export function sectionIncluded(id: SectionId, include: Partial<Record<SectionId, boolean>>): boolean {
  return isSensitive(id) ? include[id] === true : include[id] !== false;
}

// ---- dates ----------------------------------------------------------------------------------

/** Same day `n` months earlier (clamped to the month's length). */
export function monthsBefore(key: string, n: number): string {
  const { y, m0, d } = parseKey(key);
  const total = y * 12 + m0 - n;
  const ny = Math.floor(total / 12);
  const nm = total - ny * 12;
  return toKey(ny, nm, Math.min(d, daysInMonth(ny, nm)));
}

/** "24 Sep 2026" / "Around June 2015" / "Around 2015" — the doctor page's single-date format. */
export function docDate(key: string, precision: DatePrecision = 'exact'): string {
  if (!key) return '';
  const { y, m0 } = parseKey(key);
  if (precision === 'year') return `Around ${y}`;
  if (precision === 'month') return `Around ${MONTH_NAMES[m0]} ${y}`;
  return formatShortDate(key, 'always');
}

/**
 * The doctor page's ONE range format. Two exact dates → the compact `formatRange` ("14 Jul–29 Sep
 * 2026", which every date range on the page uses). Anything else — an approximate side, or an open
 * end such as "still taking" — gets a spaced en dash: "Around June 2015 – around June 2016",
 * "Around June 2015 – still taking".
 */
export function docRange(a: string, ap: DatePrecision, b: string, bp: DatePrecision, openEnd = 'still taking'): string {
  if (!a) return '';
  if (!b) return `${docDate(a, ap)} – ${openEnd}`;
  if (ap === 'exact' && bp === 'exact') return formatRange(a, b, 'always');
  const s = docDate(a, ap);
  const e = docDate(b, bp);
  if (s === e) return s;
  return `${s} – ${e.replace(/^Around/, 'around')}`;
}

// ---- the model ------------------------------------------------------------------------------

export interface DocQuote {
  date: string; dateLabel: string; text: string; facts: string;
  /** The same facts split by question, for the printed table; '' where Sam gave no answer. */
  parts?: { where: string; strength: string; timing: string };
}
/** One definition row on the page: "Why I went" | Sam's text. */
export interface DocLine { label: string; text: string }

const datesOf = (notes: { date: string }[]): string[] => [...new Set(notes.map((n) => n.date))].sort();

export interface FreqBar {
  /** "Days with a note", or a body zone Sam picked ("Lower back"). */
  label: string;
  days: number;
  total: number;
  /** "usually 4–6/10, at worst 9/10" — raw values Sam gave; '' when none. */
  strength: string;
  /** Where and when the highest rating was given: "Lower tummy centre · Thu 24 Sep"; '' when no rating. Most recent on a tie. */
  worstOn?: string;
  /** The day of the highest rating for this row ("Thu 24 Sep"); '' when no rating. */
  worstDate?: string;
  /** Highest number she gave on these notes (the "Worst" column); null when she gave none. Never averaged. */
  worst: number | null;
  /** The dated days behind `days` (each a day with at least one of these notes), so a count can open exactly them. */
  dates?: string[];
  /** Date key (YYYY-MM-DD) of the day in `worstDate`, so the Worst line can open that day. */
  worstKey?: string;
}

export interface HeatDay {
  date: string;
  /** Highest number Sam gave that day; null = note(s) with no number, or no note. */
  value: number | null;
  logged: boolean;
  /** Bleeding logged (started / ongoing / ended). Never true for spotting. */
  bleeding: boolean;
  /** Spotting logged — drawn and counted separately from bleeding. */
  spotting: boolean;
  /** Before her first entry: a layout cell only, drawn grey and never counted (first-week rule 2). */
  beforeStart?: boolean;
}

export interface HeatStripModel {
  from: string;
  to: string;
  label: string;
  days: HeatDay[];
  /** Set when the strip shows only the end of a longer range. */
  windowNote: string;
}

export interface PeriodRun { range: string; days: number; flows: string; notes: DocQuote[]; /** The logged bleeding days in this run, so the row can open them. */ dates?: string[] }
export interface CountItem { label: string; days: number; /** The dated days behind `days`, so the row can open them. */ dates?: string[] }
export interface TriedItem {
  title: string; dates: string; noticed: string;
  /** "Did it help? A little" — her answer; '' when not answered. */
  helped: string;
  /** Side effects in her words; '' when none given. */
  sideEffects: string;
}
/** `inline`: the lines print on one line (tests and scans, so every one of them fits). */
export interface DatedItem { date: string; title: string; lines: DocLine[]; inline?: boolean }

export type DocSection =
  | { id: 'words'; title: string; quotes: DocQuote[]; more: string }
  | { id: 'frequency'; title: string; windowLabel: string; bars: FreqBar[]; strip: HeatStripModel; caption: string }
  | { id: 'periods'; title: string; runs: PeriodRun[]; spotting: string; /** Days of bleeding in the strip's window and how many also had a note (set only when the frequency section shows). */ windowCount: string }
  | { id: 'impacts' | 'sex' | 'mood' | 'eating'; title: string; items: CountItem[]; quotes: DocQuote[] }
  | { id: 'tried'; title: string; items: TriedItem[]; quotes: DocQuote[] }
  | { id: 'history'; title: string; items: DatedItem[]; more: string; family: string; allergies: string }
  /** `upcoming` = today's appointment and later ones — never shown as past. */
  | { id: 'appointments'; title: string; items: DatedItem[]; more: string; upcoming: DatedItem[] };

export interface DoctorDoc {
  title: string;
  /** "14 Jul–29 Sep 2026 · Follow-up · Made 24 Sep 2026" */
  meta: string;
  from: string;
  to: string;
  rangeLabel: string;
  agenda: string;
  /** "What I’d like from today" when the appointment is today, else "… from this appointment". */
  agendaTitle: string;
  /** The agenda split for page 1 (rendered FIRST): her main-priority sentence, then her questions. Null when empty. */
  agendaBlock: AgendaBlock | null;
  /** Included sections with data, in document order. */
  sections: DocSection[];
  /** Every section that HAS data (included or not) — drives the Sections switches. */
  available: { id: SectionId; title: string; sensitive: boolean }[];
  entries: number;
  /** One line per PRODUCT §4 area, in DOMAINS order — "Not recorded" when empty. */
  domains: DomainLine[];
  /** "9 of 13 areas recorded" — a count, never a percentage or a quality score. */
  completeness: string;
  footer: string;
  /** Nothing to share: no included section with data. */
  empty: boolean;
}

export interface SummaryInput {
  symptoms: Rec<SymptomData>[];
  periodDays: Rec<PeriodDayData>[];
  medicines: Rec<MedicineData>[];
  history: Rec<HistoryData>[];
  appointments: Rec<AppointmentData>[];
  /** Sam's display name, if it's a real name. */
  name?: string;
  /** "When did you first notice this?" per symptom group, exactly as entered. */
  onset?: Partial<Record<OnsetGroup, Onset>>;
  /** Her answer to the optional pregnancy-plans question. */
  fertility?: FertilityWish | null;
  /** Optional free text "Family health history, as you were told it" (NICE NG73 1.3.2 [2024]: clinicians ask
   *  about first-degree relatives). Shown verbatim in her words; omitted when empty. */
  familyHistory?: string;
}

/** The one Health history type that is a plain statement, with no date, steps or result. */
export const ALLERGY_TYPE: HistoryData['type'] = 'Allergies (in my words)';
/** Her confirmed onset phrase for one symptom group: `done` holds the group key, `told` her words, verbatim. */
export const ONSET_TYPE: HistoryData['type'] = 'When it started (in my words)';
export const ONSET_GROUP_LABEL: Record<OnsetGroup, string> = {
  pain: 'pain', bleeding: 'bleeding', bowelBladder: 'bowel or bladder', fatigue: 'tiredness', mood: 'mood', skinHair: 'skin or hair',
};

/** Which onset group a note's words speak about; null when nothing clearly fits (the row is then not offered, so a phrase is never filed under a group she did not name). */
export function onsetGroupFor(s: { words?: string; worst?: number | null; zones?: string[]; bleedingBetween?: boolean; bowelPain?: boolean; urinePain?: boolean }): OnsetGroup | null {
  const w = (s.words ?? '').toLowerCase();
  if (/\b(skin|acne|spots|breakouts?|broke out|hair|chin)\b/.test(w)) return 'skinHair';
  if (/\b(low mood|mood|anxious|anxiety|irritable|tearful|depressed)\b/.test(w)) return 'mood';
  // Bloating is a tummy/bowel word: a note that names it never falls to the pain default (PM 3c, U02).
  if (s.bowelPain || s.urinePain || /\b(bowel|poo|toilet|bladder|wee|urine|bloat\w*|constipation|diarrhoea)\b/.test(w)) return 'bowelBladder';
  // Pain words win over a mention of her period ("cramps since my first period" is about pain).
  if (s.bleedingBetween || (!/\b(pain|painful|cramps?|cramping|ache|aching|hurts?|sore)\b/.test(w) && /\b(bleed|bleeding|period|periods|spotting|clots?|flow|flooding)\b/.test(w))) return 'bleeding';
  // A note that also names a strength or a body place is about pain first; tiredness only when it is the whole note.
  if (s.worst == null && !(s.zones ?? []).length && /\b(tired|tiredness|exhausted|exhaustion|fatigue|fatigued|sleep)\b/.test(w)) return 'fatigue';
  // Pain only when the note says so (a pain word, a strength or a body place); otherwise there is no honest group.
  if (s.worst != null || (s.zones ?? []).length || /\b(pain|painful|cramps?|cramping|ache|aching|hurts?|sore|agony)\b/.test(w)) return 'pain';
  return null;
}

/** The onset phrases she confirmed, newest wins per group. */
export function onsetFromHistory(history: Rec<HistoryData>[]): Partial<Record<OnsetGroup, Onset>> {
  const out: Partial<Record<OnsetGroup, Onset>> = {};
  for (const r of [...history].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    if (r.data.type !== ONSET_TYPE || !r.data.told.trim()) continue;
    const told = r.data.told.trim();
    // Onboarding stores a bare year or "Not sure"; capture stores her own phrase, verbatim.
    out[r.data.done as OnsetGroup] = /^(?:19|20)\d\d$/.test(told) ? { year: Number(told) } : told === 'Not sure' ? { notSure: true } : { words: told };
  }
  return out;
}
export const ALLERGIES_LABEL = 'Allergies, in my words';
export const FAMILY_HISTORY_LABEL = 'Family health history, as I was told it';

export interface SummaryOptions {
  from: string;
  to: string;
  /** "Today" (todayKey()) — the generated date. */
  today: string;
  visitType?: VisitType | null;
  agenda?: string;
  /** True when the next appointment is today (changes the agenda heading). */
  appointmentToday?: boolean;
  include?: Partial<Record<SectionId, boolean>>;
}

export interface AgendaBlock {
  title: string;
  /** "My main priority is pain." exactly as the chip wrote it (or as she edited it); '' when no chip sentence. */
  priority: string;
  /** The rest of her note, one item per line or sentence, her words unchanged. */
  questions: string[];
}

const PRIORITY_RE = /^(My main priority is [^.?!\n]*[.?!]?)\s*/i;

/** Split the appointment note into the main-priority line and her questions. No rewording, no inference. */
export function agendaBlockOf(note: string | undefined | null, title: string): AgendaBlock | null {
  let rest = clean(note);
  if (!rest) return null;
  const m = rest.match(PRIORITY_RE);
  const priority = m ? m[1].trim() : '';
  if (m) rest = rest.slice(m[0].length);
  const questions = rest.split(/\n+|(?<=[?!.])\s+(?=\S)/).map((q) => q.trim()).filter(Boolean);
  return { title, priority, questions };
}

/** The chip's choice as the form words it ("Pain", "Other"); '' when she picked none. Her typed priority sentence reads the same way. */
export function mainPriorityOf(block: AgendaBlock | null): string {
  const m = block?.priority.match(/^My main priority is (.*?)\.?$/i);
  const w = m ? m[1].trim() : '';
  if (!w) return '';
  return /^something else$/i.test(w) ? 'Other' : w.charAt(0).toUpperCase() + w.slice(1);
}

export const agendaTitleFor = (appointmentToday?: boolean) =>
  appointmentToday ? 'What I’d like from today' : 'What I’d like from this appointment';

const STRIP_MAX_DAYS = 93; // three rows of 31 on the A4 page
const MAX_QUOTES = 5;
const MAX_LISTED = 3; // appointments / history items on the page; the rest are counted ("N earlier …")
const ESCAPES = new Set(['Not sure', 'Skip', 'It varies']);

const clean = (s: string | undefined | null) => (s ?? '').trim();
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** "4–6/10" or "6/10" from raw values. */
function spread(values: number[]): string {
  if (!values.length) return '';
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  // Word joiners (U+2060) around the en dash: "6–9/10" never wraps as "6–" / "9/10" (review 3, #6).
  return lo === hi ? `${hi}/10` : `${lo}\u2060–\u2060${hi}/10`;
}

/** The note that carries the group's highest rating: its first area and date. Most recent when tied. */
function worstKeyOf(notes: SymptomData[]): string {
  let best: SymptomData | null = null;
  let hi = -1;
  for (const s of notes) {
    const w = worstOf(s);
    if (w == null) continue;
    if (w > hi || (w === hi && best && s.date > best.date)) { hi = w; best = s; }
  }
  return best ? best.date : '';
}

function worstDateOf(notes: SymptomData[]): string {
  let best: SymptomData | null = null;
  let hi = -1;
  for (const s of notes) {
    const w = worstOf(s);
    if (w == null) continue;
    if (w > hi || (w === hi && best && s.date > best.date)) { hi = w; best = s; }
  }
  return best ? formatDay(best.date) : '';
}

function worstWhen(notes: SymptomData[]): string {
  let best: SymptomData | null = null;
  let hi = -1;
  for (const s of notes) {
    const w = worstOf(s);
    if (w == null) continue;
    if (w > hi || (w === hi && best && s.date > best.date)) { hi = w; best = s; }
  }
  if (!best) return '';
  const zone = best.zones?.[0];
  const where = zone ? (BODY_ZONE_LABELS[zone as keyof typeof BODY_ZONE_LABELS] ?? zone) : '';
  return joinFacts(where, formatDay(best.date));
}

/** Raw strength values for a group of notes: "usually 6/10, worst 9/10". */
/** The highest number she gave across these notes, or null. */
function groupWorst(notes: SymptomData[]): number | null {
  const v = notes.map(peakOf).filter((n): n is number => n != null);
  return v.length ? Math.max(...v) : null;
}

function groupStrength(notes: SymptomData[]): string {
  const typical: number[] = [];
  const worst: number[] = [];
  const quick: number[] = [];
  for (const s of notes) {
    if (s.source === 'quick') {
      const n = worstOf(s) ?? typicalOf(s);
      if (n != null) quick.push(n);
      continue;
    }
    const t = typicalOf(s);
    const w = worstOf(s);
    if (t != null) typical.push(t);
    if (w != null) worst.push(w);
  }
  return [
    typical.length ? `usually ${spread(typical)}` : '',
    worst.length ? `worst ${Math.max(...worst)}/10` : '',
    quick.length ? `quick logs ${spread(quick)}` : '',
  ].filter(Boolean).join(', ');
}

/**
 * A field value for the fact line. Real answers show as given; an escape answer keeps its field
 * name so it can't be misread ("Where: it varies"); Skip shows nothing.
 */
function factValue(field: string, value: string | undefined | null): string {
  const v = clean(value);
  return !v || v === 'Skip' ? '' : labelEscape(field, v);
}

function strengthFacts(s: SymptomData): string {
  if (s.source === 'quick') {
    const n = worstOf(s) ?? typicalOf(s);
    return n == null ? '' : `${n}/10`;
  }
  const t = typicalOf(s);
  const w = worstOf(s);
  return joinFacts(t != null ? `usually ${t}/10` : '', w != null ? `at worst ${w}/10` : '', factValue('How strong', s.strengthText));
}

/** Where: zones + Sam's "somewhere else" words (`whereText`), else the legacy free-text `where`. */
const whereFacts = (s: SymptomData) => factValue('Where', formatWhere(s));

/**
 * Timing is two separate answers and both are shown: When (the period-timing chip, e.g. "Only
 * around my period") and How long (Sam's words, e.g. "since Tuesday"). formatWhen/formatDuration
 * move a legacy "Since Tuesday" out of `when`.
 */
function timingFacts(s: SymptomData): string {
  const when = factValue('When', formatWhen(s));
  const dur = factValue('How long', formatDuration(s));
  if (when && dur && when.toLowerCase() === dur.toLowerCase()) return when;
  return joinFacts(when, dur);
}

function quoteOf(s: SymptomData, text: string, withFacts = true): DocQuote {
  return {
    date: s.date,
    dateLabel: formatDay(s.date, 'always'),
    text,
    facts: withFacts ? joinFacts(whereFacts(s), strengthFacts(s), timingFacts(s)) : '',
    parts: withFacts ? { where: whereFacts(s), strength: strengthFacts(s), timing: timingFacts(s) } : undefined,
  };
}

/** A note with the moment it was saved — orders notes that share a day (newest saved first). */
interface TimedNote { s: SymptomData; at: string }

/** Newest first: by the note's day, then `noteSortTime` — the same order as `compareNotesNewestFirst`. */
const newestFirst = (a: TimedNote, b: TimedNote) => b.s.date.localeCompare(a.s.date) || b.at.localeCompare(a.at);

/**
 * Which notes get quoted (≤ MAX_QUOTES): ALWAYS the newest one (by day, then by when it was
 * saved — so a note typed today beats an older note on the same day), then the strongest, then
 * the newest — at most one more per day while other days are left — shown newest first. The rest are
 * counted in the section's "N more notes in my words" line, never silently dropped.
 */
function pickQuotes(notes: TimedNote[], max: number): TimedNote[] {
  const sorted = [...notes].sort(newestFirst);
  if (sorted.length <= max) return sorted;
  // The newest note doesn't use up its day: a stronger note from the same day can still be quoted.
  const rank = sorted.slice(1).sort((a, b) => (peakOf(b.s) ?? -1) - (peakOf(a.s) ?? -1) || newestFirst(a, b));
  const picked: TimedNote[] = [sorted[0]];
  const days = new Set<string>();
  for (const n of rank) {
    if (picked.length >= max) break;
    if (days.has(n.s.date)) continue;
    picked.push(n);
    days.add(n.s.date);
  }
  for (const n of rank) {
    if (picked.length >= max) break;
    if (!picked.includes(n)) picked.push(n);
  }
  return picked.sort(newestFirst);
}

/** Consecutive bleeding days (spotting excluded) → runs, oldest first. */
function periodRuns(days: PeriodDayData[]): PeriodDayData[][] {
  const sorted = days.filter((d) => bleedingStatus(d) !== 'spotting').sort((a, b) => a.date.localeCompare(b.date));
  const runs: PeriodDayData[][] = [];
  for (const d of sorted) {
    const last = runs[runs.length - 1];
    const prev = last?.[last.length - 1];
    const continues = prev && diffDays(prev.date, d.date) <= 1 && bleedingStatus(d) !== 'started';
    if (continues) last.push(d);
    else runs.push([d]);
  }
  return runs;
}

/** "around June 2015 (as reported)" — only what she typed; never derived from note dates. */
export function onsetText(o: Onset | undefined): string {
  if (!o) return `First noticed: ${NOT_RECORDED}`;
  if (!o.year && o.words?.trim()) return `First noticed: “${o.words.trim()}” (patient’s words)`;
  if (o.notSure && !o.year) return 'First noticed: not sure (as reported)';
  if (!o.year) return `First noticed: ${NOT_RECORDED}`;
  const when = o.month && o.month >= 1 && o.month <= 12 ? `${MONTH_NAMES[o.month - 1]} ${o.year}` : `${o.year}`;
  return `First noticed: around ${when} (as reported)`;
}

/** First day the record covers: the first entry (note or bleeding day) when it is later than `from`. Days before it
 *  were never recorded, so neither How often nor the area lines count them (first-week rule 2: a day-1 user reads
 *  '1 of 1 day', not '1 of 14 days'); one function so the "of N days" agrees on both pages (PM 15:52: 91 vs 92 days
 *  on the same PDF). The strip may still draw 14 cells for layout: see `stripCellsFrom`. */
export function recordedFrom(notes: SymptomData[], bleedDays: PeriodDayData[], from: string, to: string): string {
  const firstEntry = [...notes.map((s) => s.date), ...bleedDays.map((d) => d.date)].sort()[0];
  return firstEntry && firstEntry > from ? firstEntry : from;
}

/** First strip cell: at least 14 cells wide so a new user's strip is not one cell, never before `from`. Cells before
 *  `recordedFrom` are marked `beforeStart` (drawn grey, never counted). */
export function stripCellsFrom(recorded: string, from: string, to: string): string {
  const wide = addDays(to, -13);
  const start = recorded < wide ? recorded : wide;
  return start > from ? start : from;
}

/** The 13 PRODUCT §4 areas, one line each, in DOMAINS order. Counts and her own choices only. */
function domainLines(
  input: SummaryInput, options: SummaryOptions, notes: SymptomData[], bleedDays: PeriodDayData[],
  impactItems: CountItem[], triedCount: number,
): DomainLine[] {
  const { from, to } = options;
  const include = options.include ?? {};
  const total = inclusiveDays(recordedFrom(notes, bleedDays, from, to), to);
  const of = (has: (s: SymptomData) => boolean) => nOfN(notes, from, to, has).days;
  const dayText = (n: number) => `${n} of ${plural(total, 'day')}`;
  const onsetFor = (g: OnsetGroup) => onsetText(input.onset?.[g]);

  const facts: Record<DomainId, { text: string; onset?: OnsetGroup }> = {} as never;
  // Appointments and agenda.
  const appts = input.appointments.filter((r) => r.data.date || clean(r.data.who)).length;
  facts.agenda = {
    text: joinFacts(clean(options.agenda) ? 'Agenda written' : '', appts ? plural(appts, 'appointment') + ' saved' : ''),
  };
  // Pain: any note with a number, a zone or her words that isn't only a quick log.
  const painNote = (s: SymptomData) => peakOf(s) != null || (s.zones ?? []).length > 0 || (s.source !== 'quick' && clean(s.words) !== '');
  const painDays = of(painNote);
  const range = strengthRange(notes.filter(painNote));
  facts.pain = {
    text: painDays ? joinFacts(`Notes on ${dayText(painDays)}`, range ? `numbers given ${spread([range.low, range.high])}` : '') : '',
    onset: 'pain',
  };
  // Tiredness and sleep.
  const tiredDays = of((s) => s.fatigue != null);
  const sleepDays = of((s) => realImpacts(s).includes('Sleep'));
  const tired = notes.map((s) => s.fatigue).filter((n): n is number => n != null);
  facts.fatigue = {
    text: joinFacts(tiredDays ? `Tiredness given on ${dayText(tiredDays)} (${spread(tired)})` : '', sleepDays ? `sleep affected on ${plural(sleepDays, 'day')}` : ''),
    onset: 'fatigue',
  };
  // Bleeding and periods: logged days + heaviness as reported on notes.
  const bleeding = bleedDays.filter((d) => bleedingStatus(d) !== 'spotting');
  const spotting = bleedDays.filter((d) => bleedingStatus(d) === 'spotting');
  const starts = periodRuns(bleedDays).length;
  const productDays = (band: string) => of((s) => s.products === band);
  const bands = (['1-2', '3-5', '6+'] as const).map((b) => [b, productDays(b)] as const).filter(([, n]) => n > 0);
  const flood = of((s) => s.flooding === true);
  const clots = of((s) => s.clots === true);
  const between = of((s) => s.bleedingBetween === true);
  // NG88 1.1.1 order: impact on bleeding days, then between-period dates, then flow as she chose, then what she tried.
  const bleedDates = new Set(bleeding.map((d) => d.date));
  const onBleedDays = notes.filter((s) => s.date >= from && s.date <= to && bleedDates.has(s.date));
  const impactBleedDays = new Set(onBleedDays.filter((s) => realImpacts(s).length > 0).map((s) => s.date)).size;
  const triedBleedDays = new Set(onBleedDays.filter((s) => clean(s.tried)).map((s) => s.date)).size;
  const betweenDates = [...new Set(notes.filter((s) => s.date >= from && s.date <= to && s.bleedingBetween === true).map((s) => s.date))].sort();
  facts.bleeding = {
    text: joinFacts(
      impactBleedDays ? `got in the way of things on ${plural(impactBleedDays, 'bleeding day')}` : '',
      between ? `bleeding between periods on ${plural(between, 'day')} (${betweenDates.map((d) => formatShortDate(d, 'always')).join(', ')})` : '',
      starts ? `${plural(starts, 'period')} logged (${plural(new Set(bleeding.map((d) => d.date)).size, 'bleeding day')})` : '',
      spotting.length ? `spotting on ${plural(new Set(spotting.map((d) => d.date)).size, 'day')}` : '',
      ...bands.map(([b, n]) => `${b.replace('-', '–')} pads or tampons a day on ${plural(n, 'day')}`),
      flood ? `flooding on ${plural(flood, 'day')}` : '',
      clots ? `clots on ${plural(clots, 'day')}` : '',
      triedBleedDays ? `tried something on ${plural(triedBleedDays, 'bleeding day')}` : '',
    ),
    onset: 'bleeding',
  };
  const bowel = of((s) => s.bowelPain === true);
  const urine = of((s) => s.urinePain === true);
  facts.bowelBladder = {
    text: joinFacts(bowel ? `Pain opening bowels on ${plural(bowel, 'day')}` : '', urine ? `pain passing urine on ${plural(urine, 'day')}` : ''),
    onset: 'bowelBladder',
  };
  const sexDays = of((s) => realImpacts(s).includes('Sex'));
  const afterSex = of((s) => s.bleedingAfterSex === true);
  facts.sexPain = {
    text: joinFacts(sexDays ? `Got in the way of sex on ${plural(sexDays, 'day')}` : '', afterSex ? `bleeding after sex on ${plural(afterSex, 'day')}` : ''),
  };
  const moodNotes = of((s) => clean(s.mood) !== '');
  facts.mood = { text: moodNotes ? `${plural(moodNotes, 'note')} in my words` : '', onset: 'mood' };
  const skin = new Map<string, Set<string>>();
  for (const s of notes) for (const c of s.skinHair ?? []) skin.set(c, (skin.get(c) ?? new Set()).add(s.date));
  facts.skinHair = { text: joinFacts(...[...skin].map(([c, d]) => `${c} · ${plural(d.size, 'day')}`)), onset: 'skinHair' };
  const eating = of((s) => clean(s.eating) !== '');
  facts.eating = { text: eating ? `${plural(eating, 'note')} in my words` : '' };
  facts.impact = { text: joinFacts(...impactItems.map((c) => `${c.label} · ${plural(c.days, 'day')}`)) };
  facts.tried = { text: triedCount ? plural(triedCount, 'thing') + ' listed' : '' };
  const family = clean(input.familyHistory);
  facts.history = { text: joinFacts(input.history.length ? plural(input.history.length, 'item') + ' saved' : '',
    family ? 'Family history in my words' : '') };
  facts.fertility = { text: input.fertility ? `${input.fertility} (as chosen)` : '' };

  return DOMAINS.map(({ id, heading, section }) => {
    const f = facts[id];
    if (section && !sectionIncluded(section, include)) return { id, heading, state: 'not-included', text: NOT_INCLUDED, onset: '' };
    const hasData = f.text !== '';
    return {
      id, heading,
      state: hasData ? 'recorded' : 'not-recorded',
      text: hasData ? f.text : NOT_RECORDED,
      // AC1: the onset line only appears for a group with at least one note.
      onset: f.onset && hasData ? onsetFor(f.onset) : '',
    };
  });
}

/** Plain-text export of the same model (copy/paste into a portal or an email to oneself). */
export function summaryToText(doc: DoctorDoc): string {
  const lines = [doc.title, printedMeta(doc), ''];
  // Agenda first (blueprint §3.7a): priority line, then her questions; omitted entirely when empty.
  if (doc.agendaBlock) {
    lines.push(doc.agendaBlock.title.toUpperCase());
    if (doc.agendaBlock.priority) lines.push(doc.agendaBlock.priority);
    for (const q of doc.agendaBlock.questions) lines.push(`- ${q}`);
    lines.push('');
  }
  lines.push(`AREAS (${doc.completeness})`);
  for (const d of doc.domains) {
    lines.push(`${d.heading}: ${d.text}`);
    if (d.onset) lines.push(`  ${d.onset}`);
    if (d.id === 'history') {
      const h = doc.sections.find((x) => x.id === 'history');
      if (h && h.id === 'history' && h.family) lines.push(`  ${FAMILY_HISTORY_LABEL}: "${h.family}"`);
      // Same as the A4: whenever the history section exists the page says something about allergies.
      if (h && h.id === 'history') lines.push(`  ${ALLERGIES_LABEL}: ${h.allergies ? `"${h.allergies}"` : 'not recorded'}`);
    }
  }
  const words = doc.sections.find((s) => s.id === 'words');
  if (words && words.id === 'words') {
    lines.push('', 'IN MY WORDS');
    for (const q of words.quotes) lines.push(`${q.dateLabel}: "${q.text}"`);
  }
  lines.push('', doc.footer);
  return lines.join('\n').replace(/\u2060/g, '');
}

export function buildDoctorSummary(input: SummaryInput, options: SummaryOptions): DoctorDoc {
  const { from, to, today } = options;
  const include = options.include ?? {};
  const inRange = (d: string) => inRangeOf(d, from, to);

  const timed = input.symptoms.filter((r) => inRange(r.data.date))
    .map<TimedNote>((r) => ({ s: r.data, at: noteSortTime(r) }))
    .sort(newestFirst);
  const notes = timed.map((n) => n.s); // newest first
  const bleedDays = input.periodDays.map((r) => r.data).filter((d) => inRange(d.date));
  const rangeLabel = formatRange(from, to, 'always');
  const all: DocSection[] = [];

  // 1. Symptoms in my words — real words only (never quick logs or chip answers).
  const worded = timed.filter((n) => n.s.source !== 'quick' && clean(n.s.words));
  const quotes = pickQuotes(worded, MAX_QUOTES).map((n) => quoteOf(n.s, clean(n.s.words)));
  const unquoted = worded.length - quotes.length;
  if (quotes.length) {
    all.push({
      id: 'words',
      title: 'Symptoms in my words',
      quotes,
      more: unquoted > 0 ? `${plural(unquoted, 'more note')} in my words, saved in Atossa.` : '',
    });
  }

  // 2. How often and how strong — over the strip window (the range, or its last 93 days).
  let bleedWindowLine = '';
  if (notes.length) {
    const cappedFrom = inclusiveDays(from, to) > STRIP_MAX_DAYS ? addDays(to, -(STRIP_MAX_DAYS - 1)) : from;
    // Days before the first entry were never recorded, so they are not counted as days with no note: the
    // count starts at the first entry; the strip keeps at least 14 cells, the early ones marked beforeStart.
    const recorded = recordedFrom(notes, bleedDays, from, to);
    const stripFrom = recorded > cappedFrom ? recorded : cappedFrom;
    const cellsFrom = stripCellsFrom(stripFrom, cappedFrom, to);
    const windowNotes = notes.filter((s) => s.date >= stripFrom);
    const total = inclusiveDays(stripFrom, to);
    const bleedSet = new Set(bleedDays.filter((d) => bleedingStatus(d) !== 'spotting').map((d) => d.date));
    const spotSet = new Set(bleedDays.filter((d) => bleedingStatus(d) === 'spotting' && !bleedSet.has(d.date)).map((d) => d.date));
    const byDay = new Map<string, SymptomData[]>();
    for (const s of windowNotes) byDay.set(s.date, [...(byDay.get(s.date) ?? []), s]);

    const days: HeatDay[] = [];
    for (let k = cellsFrom; k < stripFrom; k = addDays(k, 1)) {
      days.push({ date: k, logged: false, value: null, bleeding: false, spotting: false, beforeStart: true });
    }
    for (let k = stripFrom; k <= to; k = addDays(k, 1)) {
      const list = byDay.get(k) ?? [];
      const peaks = list.map(peakOf).filter((n): n is number => n != null);
      days.push({ date: k, logged: list.length > 0, value: peaks.length ? Math.max(...peaks) : null, bleeding: bleedSet.has(k), spotting: spotSet.has(k) });
    }

    const noteDays = daysWith(windowNotes, stripFrom, to);
    const bars: FreqBar[] = [];
    if (noteDays) {
      bars.push({ label: 'Days with a note', days: noteDays, total, strength: groupStrength(windowNotes), worst: groupWorst(windowNotes), worstOn: worstWhen(windowNotes), worstDate: worstDateOf(windowNotes), worstKey: worstKeyOf(windowNotes), dates: datesOf(windowNotes) });
      zoneDays(windowNotes)
        .slice(0, MAX_ZONE_ROWS)
        .map(({ label, days: n }) => {
          const zn = windowNotes.filter((s) => (s.zones ?? []).includes(label));
          return { label: BODY_ZONE_LABELS[label as keyof typeof BODY_ZONE_LABELS] ?? label, days: n, total, strength: groupStrength(zn), worst: groupWorst(zn), worstDate: worstDateOf(zn), dates: datesOf(zn) };
        })
        .forEach((b) => bars.push(b));
    }

    const moreZones = Math.max(0, zoneDays(windowNotes).length - MAX_ZONE_ROWS);
    const bleedOverlap = [...byDay.keys()].filter((d) => bleedSet.has(d)).length;
    const bleedDaysInWindow = days.filter((d) => d.bleeding).length;
    const spotDays = days.filter((d) => d.spotting).length;
    const windowLabel = formatRange(stripFrom, to, 'always');
    if (bleedDaysInWindow && noteDays) {
      bleedWindowLine = `Bleeding was logged on ${bleedDaysInWindow} ${bleedDaysInWindow === 1 ? 'day' : 'days'} in ${windowLabel}` +
        (bleedDaysInWindow === 1
          ? (bleedOverlap ? '; it also had a note.' : '; it had no note.')
          : bleedOverlap ? `; ${bleedOverlap} of them also had a note.` : '; none of them also had a note.');
    }
    if (noteDays) {
      all.push({
        id: 'frequency',
        title: 'How often and how strong',
        windowLabel: `${windowLabel} · ${plural(total, 'day')}`,
        bars,
        strip: {
          from: cellsFrom, to, label: windowLabel, days,
          windowNote: stripFrom === from ? ''
            : stripFrom > cappedFrom ? `Covers ${windowLabel}.`
            : `Shows the last ${total} days of the range.`,
        },
        caption:
          `Notes were logged on ${noteDays} of ${plural(total, 'day')}.` +
          (spotDays ? ` Spotting logged on ${plural(spotDays, 'day')}.` : '') +
          (moreZones ? ` ${moreZones} more ${moreZones === 1 ? 'area was' : 'areas were'} marked on fewer days.` : ''),
      });
    }
  }

  // 3. Periods logged — raw dates, lengths and flow as entered.
  const runs = periodRuns(bleedDays).reverse().map<PeriodRun>((run) => {
    const start = run[0].date;
    const end = run[run.length - 1].date;
    const flows = [...new Set(run.map((d) => d.flow).filter((f): f is NonNullable<typeof f> => Boolean(f && f !== 'None')))];
    return {
      range: formatRange(start, end, 'always'),
      days: inclusiveDays(start, end),
      dates: [...new Set(run.map((d) => d.date))].sort(),
      // Safety flow-wording-rule.md: the word is hers (picked from the Flow list), never our label.
      flows: flows.length ? `Flow (chosen by the patient): ${flows.join(', ')}` : '',
      notes: run.filter((d) => clean(d.note)).map((d) => ({ date: d.date, dateLabel: formatDay(d.date), text: clean(d.note), facts: '' })),
    };
  });
  const spottingDays = bleedDays.filter((d) => bleedingStatus(d) === 'spotting').map((d) => d.date).sort();
  // No bleeding at all in a range that has notes is still said, so a GP can tell "none logged" from "left out".
  const noBleeding = !runs.length && !spottingDays.length && notes.length > 0;
  if (runs.length || spottingDays.length || noBleeding) {
    all.push({
      id: 'periods',
      title: 'Periods logged',
      runs,
      spotting: spottingDays.length ? `Spotting logged: ${spottingDays.map((d) => formatShortDate(d, 'always')).join(', ')}` : '',
      windowCount: noBleeding ? 'Bleeding: none logged in this range.' : bleedWindowLine,
    });
  }

  // 4. What it got in the way of (Sex goes to its own sensitive section).
  const impactItems = impactDays(notes, (i) => i !== 'Sex');
  const legacyStopped = notes.filter((s) => !s.impacts && s.stopped === true);
  if (legacyStopped.length) {
    { const set = new Set(legacyStopped.map((s) => s.date)); impactItems.push({ label: 'Stopped me doing things', days: set.size, dates: [...set].sort() }); }
  }
  const stoppedQuotes = notes.filter((s) => clean(s.stoppedWords)).slice(0, 3).map((s) => quoteOf(s, clean(s.stoppedWords), false));
  if (impactItems.length || stoppedQuotes.length) {
    all.push({ id: 'impacts', title: 'What it got in the way of', items: impactItems, quotes: stoppedQuotes });
  }

  // 5. What I've tried — medicines (all) + "tried" words from notes in range.
  const meds = [...input.medicines.map((r) => r.data)].sort((a, b) => b.started.localeCompare(a.started));
  const tried: TriedItem[] = meds.filter((m) => clean(m.name)).map((m) => ({
    title: joinFacts(clean(m.name), clean(m.dose)),
    dates: docRange(m.started, m.startedPrecision, m.stopped, m.stoppedPrecision),
    noticed: clean(m.happened),
    helped: m.helped ? `Did it help? ${m.helped}` : '',
    sideEffects: clean(m.sideEffects),
  }));
  const triedQuotes = notes.filter((s) => clean(s.tried)).slice(0, 3).map((s) => quoteOf(s, clean(s.tried), false));
  if (tried.length || triedQuotes.length) all.push({ id: 'tried', title: 'What I’ve tried', items: tried, quotes: triedQuotes });

  // 6. Appointments. One that hasn't happened yet is never written up as past, and today's is the
  //    visit being prepared for (review 3, #5): anything dated today or later is listed under
  //    "Coming up" (today's labelled "Today"), with "What it's for" plus anything already written
  //    from it. Past ones: most recent first, labels only for fields Sam filled in. Both groups
  //    use the same date format.
  const appts = [...input.appointments.map((r) => r.data)].filter((a) => a.date || clean(a.who));
  const isAhead = (a: AppointmentData) => Boolean(a.date) && a.date >= today;
  const ahead = appts.filter(isAhead).sort((a, b) => a.date.localeCompare(b.date));
  const past = appts.filter((a) => !isAhead(a)).sort((a, b) => b.date.localeCompare(a.date));
  const apptDate = (a: AppointmentData) =>
    a.date === today ? 'Today' : (a.datePrecision ?? 'exact') === 'exact' ? formatDay(a.date, 'always') : docDate(a.date, a.datePrecision);
  const afterLines = (a: AppointmentData) => [
    { label: 'I was told', text: clean(a.told) },
    { label: 'Tests or prescriptions', text: clean(a.tests) },
    { label: 'What happens next', text: clean(a.next) },
  ];
  if (appts.length) {
    all.push({
      id: 'appointments',
      title: 'Appointments',
      upcoming: ahead.map((a) => ({
        date: apptDate(a),
        title: clean(a.who),
        lines: [{ label: 'What it’s for', text: clean(a.why) }, ...(a.date === today ? afterLines(a) : [])].filter((l) => l.text),
      })),
      items: past.slice(0, MAX_LISTED).map((a) => ({
        date: apptDate(a),
        title: clean(a.who),
        lines: [{ label: 'Why I went', text: clean(a.why) }, ...afterLines(a)].filter((l) => l.text),
      })),
      more: past.length > MAX_LISTED ? `${plural(past.length - MAX_LISTED, 'earlier appointment')} saved in Atossa.` : '',
    });
  }

  // 7. Health history — "Around" dates.
  const histAll = input.history.map((r) => r.data);
  const hist = histAll.filter((h) => h.type !== ALLERGY_TYPE && h.type !== ONSET_TYPE).sort((a, b) => b.date.localeCompare(a.date));
  // Every earlier test or scan is always listed (one line each): they are the record of what was already done. Other items stay capped.
  const TEST_TYPE: HistoryData['type'] = 'Test or scan';
  const tests = hist.filter((h) => h.type === TEST_TYPE);
  const others = hist.filter((h) => h.type !== TEST_TYPE).slice(0, Math.max(0, MAX_LISTED - tests.length));
  const listedHistory = [...tests, ...others].sort((a, b) => b.date.localeCompare(a.date));
  // Identical tests (same what and what she was told) print as ONE line with every date; different results stay as their own lines.
  const collapseTests = (list: typeof listedHistory) => {
    const groups: (typeof listedHistory)[] = [];
    for (const h of list) {
      const g = h.type === TEST_TYPE ? groups.find((x) => x[0].type === TEST_TYPE && clean(x[0].done) === clean(h.done) && clean(x[0].told) === clean(h.told)) : undefined;
      if (g) g.push(h); else groups.push([h]);
    }
    return groups;
  };
  // The patient's own allergy words, verbatim; never ticked, validated or commented on.
  const allergyText = histAll.filter((h) => h.type === ALLERGY_TYPE).map((h) => clean(h.told)).filter(Boolean).join('; ');
  const familyText = clean(input.familyHistory);
  // With any notes saved the page always says something about allergies, even if only 'not recorded'.
  if (hist.length || familyText || allergyText || notes.length) {
    all.push({
      id: 'history',
      title: 'Health history',
      items: collapseTests(listedHistory).map((g) => {
        const h = g[0];
        const short = (x: (typeof g)[number]) => docDate(x.date, x.datePrecision).replace(/^Around /, '');
        const results = [...new Set(g.map((x) => (clean(x.result) ? (g.length > 1 ? `${short(x)}: ${clean(x.result)}` : clean(x.result)) : '')).filter(Boolean))];
        return {
          date: g.length > 1 ? `Around ${g.map(short).join(', ')}` : docDate(h.date, h.datePrecision),
          title: h.type,
          inline: h.type === TEST_TYPE && results.length <= 1,
          lines: (h.type === TEST_TYPE ? [
            { label: 'What was done', text: clean(h.done) },
            { label: 'I was told', text: clean(h.told) },
            ...results.map((text) => ({ label: 'Result or how it went', text })),
          ] : [
            { label: 'I was told', text: clean(h.told) },
            { label: 'What was done', text: clean(h.done) },
            { label: 'Result or how it went', text: clean(h.result) },
          ]).filter((l) => l.text),
        };
      }),
      more: hist.length > listedHistory.length ? `${plural(hist.length - listedHistory.length, 'earlier item')} saved in Atossa.` : '',
      family: familyText,
      allergies: allergyText,
    });
  }

  // 8. Sensitive sections — only when such data exists (mood / eating have no fields yet).
  const sexItems = impactDays(notes, (i) => i === 'Sex');
  if (sexItems.length) all.push({ id: 'sex', title: 'Sex & intimacy', items: sexItems, quotes: [] });

  const order = (id: SectionId) => SECTION_META.findIndex((m) => m.id === id);
  all.sort((a, b) => order(a.id) - order(b.id));
  const available = SECTION_META.filter((m) => all.some((s) => s.id === m.id));
  const sections = all.filter((s) => sectionIncluded(s.id, include));
  const domains = domainLines(input, options, notes, bleedDays, impactItems, tried.length + triedQuotes.length);
  const recorded = domains.filter((d) => d.state === 'recorded').length;
  const agenda = clean(options.agenda);
  const entries = noteCount(input.symptoms, { from, to });
  const name = clean(input.name);

  return {
    title: name ? `Symptom summary — ${name}` : 'Symptom summary',
    meta: joinFacts(rangeLabel, options.visitType ?? '', `Made ${formatShortDate(today, 'always')}`),
    from, to, rangeLabel, agenda, agendaTitle: agendaTitleFor(options.appointmentToday),
    agendaBlock: agendaBlockOf(agenda, agendaTitleFor(options.appointmentToday)), sections, available, entries,
    domains, completeness: `${recorded} of ${plural(DOMAINS.length, 'area')} recorded`,
    footer: `Patient-reported via Atossa · not clinically verified · ${rangeLabel} · ${plural(entries, 'entry', 'entries')}`,
    // An agenda on its own isn't a summary: nothing to share until a section has data.
    empty: sections.length === 0,
  };
}

/** Text for one count item: "Work or study · 4 days". */
export const countText = (c: CountItem) => `${c.label} · ${plural(c.days, 'day')}`;
/** Text for one bar: "Days with a note · 8 of 93 days". */
export const barText = (b: FreqBar) => `${b.label} · ${b.days} of ${plural(b.total, 'day')}`;
/** "6 days" */
export const daysText = (n: number) => plural(n, 'day');

// ---- PDF / print HTML -----------------------------------------------------------------------

/** Document colours (ink on white). Plum only in the heat-strip; clay only for bleeding. */
/** Secondary text on the printed page: 10.3:1 on white (the screen's ink2 is 7.4:1), so key labels hold up in greyscale print. */
const PRINT_INK2 = '#473B57';

export const DOC_COLORS = {
  ink: colors.ink, ink2: colors.ink2, ink3: colors.ink3, hairline: colors.hairline,
  borderStrong: colors.borderStrong, track: colors.sunken, clay: colors.clay, clayTint: colors.clayTint,
  white: colors.white,
};

/** Ramp fill + digit colour for a 0–10 value. */
export const docSeverity = severityColor;

/** Split strip days into rows of `perRow`. */
export function stripRows(days: HeatDay[], perRow: number): HeatDay[][] {
  const rows: HeatDay[][] = [];
  for (let i = 0; i < days.length; i += perRow) rows.push(days.slice(i, i + perRow));
  return rows;
}

/**
 * Runs of consecutive bleeding days (or, with `kind = 'spotting'`, spotting days) within one strip
 * row → [first index, last index].
 */
export function bleedRuns(row: HeatDay[], kind: 'bleeding' | 'spotting' = 'bleeding'): [number, number][] {
  const runs: [number, number][] = [];
  row.forEach((d, i) => {
    if (!d[kind]) return;
    const last = runs[runs.length - 1];
    if (last && last[1] === i - 1) last[1] = i;
    else runs.push([i, i]);
  });
  return runs;
}

/**
 * The printed page's type scale in pt (PDF CSS and the on-screen 'page' DocumentView share it):
 * body 10.5/14.5, Sam's quotes 12/16, meta 9/12, section heads 12/16 600, footer 8.
 */
export const PAGE_TYPE = {
  title: [22, 26], meta: [9, 12], head: [12, 16], body: [10.5, 14.5], quote: [12, 16], lead: [13, 17.5],
  label: [9, 14.5], footer: [8, 11], stripLabel: 8.5, stripDigit: 9,
  /** Space above each section rule, and between items. */
  section: 14, item: 6,
} as const;

/**
 * The strip's key, under it on every rendering. Bleeding is a solid clay underline, spotting a thin
 * dashed one — told apart by shape, so both survive B/W print.
 */
export const STRIP_KEY = 'Number = strongest rating given that day, out of 10. Dot = a note with no number.';
export const STRIP_BLEED_KEY = 'bleeding logged';
export const STRIP_SPOT_KEY = 'spotting logged';
/** Sub-labels inside Appointments when one is still ahead. */
export const APPT_AHEAD = 'Coming up';
export const APPT_PAST = 'Earlier';
/** Spotting underline: stroke width and dash pattern (pt on the page, scaled on screen). */
export const SPOT_STROKE = 1.5;
export const SPOT_DASH = [2.5, 2] as const;

/** "Since your last appointment (Around March 2020) · showing the last 6 months" helper text. */
export function sinceNote(lastDate: string, precision: DatePrecision, capped: boolean): string {
  const when = precision === 'exact' ? formatShortDate(lastDate, 'always') : docDate(lastDate, precision).replace(/^Around/, 'around');
  return capped
    ? `Since your last appointment (${when}) · showing the last ${SINCE_MAX_MONTHS} months`
    : `Since your last appointment (${when})`;
}

/** Sam's words as printed: typographic apostrophes (render only — the stored words are unchanged). */
export const curly = (t: string) => t.replace(/(\w)'/g, '$1’').replace(/'/g, '’');

const esc = (t: string) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\n/g, '<br/>');

const SANS = "Inter, -apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const SERIF = "'Instrument Serif', 'Iowan Old Style', Georgia, 'Times New Roman', serif";

/**
 * Inline SVG heat-strip, 31 days per row, digit inside each cell. Bleeding = one continuous solid
 * clay underline per run of days; spotting = a thin dashed clay underline (no tint: a tint prints
 * the same grey as a low-strength cell). Sized in pt to the A4 content width (516 pt), so the
 * digits print at 9 pt; a 2 pt gap keeps neighbouring high cells from touching.
 */
function stripSvg(strip: HeatStripModel): string {
  const T = PAGE_TYPE;
  const perRow = 31;
  const labelW = 36;
  const gap = 2;
  const cell = 13.5;
  const band = 3;
  const rowH = cell + band + 12.5;
  const rows = stripRows(strip.days, perRow);
  const width = labelW + perRow * (cell + gap);
  const height = rows.length * rowH;
  const C = DOC_COLORS;
  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}pt" height="${height}pt" style="max-width:100%;height:auto" role="img" aria-label="Day-by-day strip">`;
  rows.forEach((row, r) => {
    const y = r * rowH;
    out += `<text x="0" y="${y + cell / 2 + T.stripLabel * 0.35}" font-family="${SANS}" font-size="${T.stripLabel}" fill="${C.ink2}">${esc(formatShortDate(row[0].date, 'never'))}</text>`;
    out += `<rect x="${labelW}" y="${y + cell + 0.75}" width="${row.length * (cell + gap) - gap}" height="0.5" fill="${C.borderStrong}"/>`;
    row.forEach((d, i) => {
      const x = labelW + i * (cell + gap);
      if (i > 0 && i % 7 === 0) out += `<text x="${x + cell / 2}" y="${y + cell + band + 9.5}" text-anchor="middle" font-family="${SANS}" font-size="8" fill="${C.ink}">${esc(formatShortDate(d.date, 'never'))}</text>`;
      if (d.logged && d.value != null) {
        const s = docSeverity(d.value);
        out += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="2" fill="${s.bg}" stroke="${C.borderStrong}" stroke-width="0.4"/>`;
        out += `<text x="${x + cell / 2}" y="${y + cell / 2 + T.stripDigit * 0.36}" text-anchor="middle" font-family="${SANS}" font-weight="500" font-size="${T.stripDigit}" fill="${s.fg}">${d.value}</text>`;
      } else if (d.logged) {
        out += `<rect x="${x + 0.5}" y="${y + 0.5}" width="${cell - 1}" height="${cell - 1}" rx="2" fill="${C.white}" stroke="${C.borderStrong}" stroke-width="0.8"/>`;
        out += `<circle cx="${x + cell / 2}" cy="${y + cell / 2}" r="1.6" fill="${C.ink}"/>`;
      }
    });
    for (const [a, b] of bleedRuns(row)) {
      const x = labelW + a * (cell + gap);
      out += `<rect x="${x}" y="${y + cell + 2}" width="${(b - a + 1) * (cell + gap) - gap}" height="${band}" fill="${C.clay}"/>`;
    }
    for (const [a, b] of bleedRuns(row, 'spotting')) {
      const x = labelW + a * (cell + gap);
      const ly = y + cell + 2 + band / 2;
      out += `<line x1="${x}" y1="${ly}" x2="${x + (b - a + 1) * (cell + gap) - gap}" y2="${ly}" stroke="${C.clay}" stroke-width="${SPOT_STROKE}" stroke-dasharray="${SPOT_DASH.join(' ')}"/>`;
    }
  });
  return `${out}</svg>`;
}

function quoteHtml(q: DocQuote): string {
  // No facts → the date sits on the quote's line; otherwise facts go on a meta line under it.
  if (!q.facts) return `<div class="q"><p><span class="serif">“${esc(curly(q.text))}”</span> <span class="meta">${esc(q.dateLabel)}</span></p></div>`;
  return `<div class="q"><p class="serif">“${esc(curly(q.text))}”</p><p class="meta">${esc(joinFacts(q.dateLabel, q.facts))}</p></div>`;
}

/** Notes as a table. Empty cells print an en dash, so "not answered" is visible, never read as "none". */
function wordsTableHtml(quotes: DocQuote[]): string {
  const cell = (t?: string) => (t ? esc(t) : '<span class="sep">–</span>');
  const rows = quotes.map((q) => `<tr><td class="nw">${esc(q.dateLabel)}</td><td>${cell(q.parts?.where)}</td><td>${cell(q.parts?.strength)}</td><td>${cell(q.parts?.timing)}</td><td class="serif">“${esc(curly(q.text))}”</td></tr>`).join('');
  return `<table class="notes"><thead><tr><th>Date</th><th>Where</th><th>How strong</th><th>How long</th><th>In my words</th></tr></thead><tbody>${rows}</tbody></table>`;
}

/**
 * Visits and history as a compact table on the page (date · what · details), so a typical
 * summary stays on one A4 page. Each detail keeps its label ("I was told: ...") so nothing is
 * read as the app's own words. The on-screen document uses its own layout.
 */
function datedTableHtml(items: DatedItem[]): string {
  const rows = items.map((a) => {
    const one = (l: DocLine) => `<span class="muted">${esc(l.label)}:</span> ${esc(l.text)}`;
    const details = a.inline ? a.lines.map(one).join('<span class="sep"> · </span>') : a.lines.map((l) => `<div>${one(l)}</div>`).join('');
    return `<tr><td>${esc(a.date)}</td><td class="strong">${esc(a.title)}</td><td>${details || '<span class="sep">–</span>'}</td></tr>`;
  }).join('');
  return `<table class="notes dated"><tbody>${rows}</tbody></table>`;
}

function sectionHtml(s: DocSection): string {
  const html = sectionInner(s);
  // The strip block stays whole; other sections may break between items (each item, quote and
  // heading-with-first-line stays together), which keeps a typical summary to two pages.
  return s.id === 'frequency' ? html.replace('<section>', '<section class="keep">') : html;
}

function sectionInner(s: DocSection): string {
  const head = `<h2>${esc(s.title)}</h2>`;
  switch (s.id) {
    case 'words':
      // Printed as a table (date · where · how strong · how long · my words): a GP can scan down a column.
      if (s.quotes.some((q) => q.parts && q.facts)) return `<section>${head}${wordsTableHtml(s.quotes)}${s.more ? `<p class="meta">${esc(s.more)}</p>` : ''}</section>`;
      return `<section>${head}${s.quotes.map(quoteHtml).join('')}${s.more ? `<p class="meta">${esc(s.more)}</p>` : ''}</section>`;
    case 'frequency': {
      // A real table (area · days of the window · highest rating · usual range): counts and ratings sit in right-aligned
      // tabular columns, so a clinician can scan down them. The grey bar repeats the day count; nothing depends on colour.
      const worstIn = (t: string) => /worst (\d+)\/10/.exec(t)?.[1];
      const rows = s.bars.map((b, i) => {
        const w = worstIn(b.strength ?? '');
        return `<tr${i === 0 ? ' class="all"' : ''}><td class="area">${esc(i === 0 && b.label === 'Days with a note' ? 'Any area' : b.label)}</td><td class="num">${b.days} of ${plural(b.total, 'day')}</td><td class="num">${w ? `${w}/10` : 'Not recorded'}</td><td>${esc(b.worstDate ?? '')}</td></tr>`;
      }).join('');
      const bars = `<table class="figs"><thead><tr><th>Area</th><th class="num">Days with a note</th><th class="num">Highest rating</th><th>Date of highest</th></tr></thead><tbody>${rows}</tbody></table>`;
      const bleedKey =
        (s.strip.days.some((d) => d.bleeding) ? ` <span class="key"></span> = ${STRIP_BLEED_KEY}.` : '') +
        (s.strip.days.some((d) => d.spotting) ? ` <span class="key spot"></span> = ${STRIP_SPOT_KEY}.` : '');
      const topLine = '';
      return `<section>${head}${bars}${topLine}
        <div class="strip">${stripSvg(s.strip)}</div>
        <p class="meta">${esc(STRIP_KEY)}${bleedKey}</p>
        <p class="meta">${esc(joinFacts(s.caption, s.strip.windowNote))}</p></section>`;
    }
    case 'periods':
      return `<section>${head}${s.windowCount ? `<p>${esc(s.windowCount)}</p>` : ''}${s.runs.map((r) => `<div class="item"><p><span class="strong">${esc(r.range)}</span> · ${esc(daysText(r.days))}${r.flows ? ` · ${esc(r.flows)}` : ''}</p>${r.notes.map(quoteHtml).join('')}</div>`).join('')}${s.spotting ? `<p>${esc(s.spotting)}</p>` : ''}</section>`;
    case 'impacts': case 'sex': case 'mood': case 'eating':
      return `<section>${head}${s.items.length ? `<p class="item">${s.items.map((c) => esc(countText(c))).join('<span class="sep"> · </span>')}</p>` : ''}${s.quotes.map(quoteHtml).join('')}</section>`;
    case 'tried': {
      // One row per treatment: name · dates · what she noticed (her words, serif).
      // Her answer to "Did it help?" and her side-effects words sit on a second line of the same row ('–' when blank).
      const rows = s.items.map((t) => `<tr><td class="strong">${esc(t.title)}</td><td>${esc(t.dates)}</td><td class="serif">${t.noticed ? `“${esc(curly(t.noticed))}”` : '<span class="sep">–</span>'}<div class="meta">${esc(t.helped || 'Did it help? –')} · Side effects: ${t.sideEffects ? `“${esc(curly(t.sideEffects))}”` : '–'}</div></td></tr>`).join('');
      return `<section>${head}${s.items.length ? `<table class="notes dated tried"><tbody>${rows}</tbody></table>` : ''}${s.quotes.map(quoteHtml).join('')}</section>`;
    }
    case 'appointments':
      return `<section>${head}${s.upcoming.length ? `<p class="sub">${esc(APPT_AHEAD)}</p>${datedTableHtml(s.upcoming)}${s.items.length ? `<p class="sub">${esc(APPT_PAST)}</p>` : ''}` : ''}${datedTableHtml(s.items)}${s.more ? `<p class="meta">${esc(s.more)}</p>` : ''}</section>`;
    case 'history':
      return `<section>${head}${datedTableHtml(s.items)}${s.more ? `<p class="meta">${esc(s.more)}</p>` : ''}${s.allergies ? `<p><span class="muted">${esc(ALLERGIES_LABEL)}:</span> <span class="serif">“${esc(curly(s.allergies))}”</span></p>` : `<p><span class="muted">${esc(ALLERGIES_LABEL)}:</span> not recorded</p>`}${s.family ? `<p><span class="muted">${esc(FAMILY_HISTORY_LABEL)}:</span> <span class="serif">“${esc(curly(s.family))}”</span></p>` : ''}</section>`;
  }
}

/**
 * A4 HTML for expo-print (Share PDF / Print) and the web print fallback. The footer sits in a
 * table <tfoot>, which WebKit repeats on every printed page. Fonts: Inter / Instrument Serif
 * if the device has them, else the system sans + a serif italic (they can't be embedded here).
 * Type (pt): body 10.5/14.5, quotes 12/16, meta 9/12, heads 12/16 — see PAGE_TYPE.
 */
// Areas with no section of their own on the page (tiredness, bowel and bladder, sex, mood, skin and hair, eating,
// pregnancy plans): one quiet line each so a clinic sees what she logged and what she did not ('Not recorded').
const AREAS_WITH_SECTION: DomainId[] = ['agenda', 'pain', 'bleeding', 'impact', 'tried', 'history'];
/** The 'Other areas' rows for the page and the on-screen document: recorded lines, then one line each for areas
 * with nothing recorded / left out, naming them. Empty when every area has its own section. */
export function otherAreaRows(doc: DoctorDoc): { label: string; text: string; muted: boolean }[] {
  const rows = doc.domains.filter((d) => !AREAS_WITH_SECTION.includes(d.id));
  const names = (state: DomainState) => rows.filter((d) => d.state === state).map((d) => d.heading).join(', ');
  const recorded = rows.filter((d) => d.state === 'recorded').map((d) => ({ label: d.heading, text: d.text.replace(/\u2060/g, ''), muted: false }));
  const rest = (['not-recorded', 'not-included'] as DomainState[]).filter((st) => names(st))
    .map((st) => ({ label: st === 'not-recorded' ? NOT_RECORDED : NOT_INCLUDED, text: names(st), muted: true }));
  // 'First noticed' as she told it, per area, only where she saved one (the plain-text copy already carries these).
  const first = doc.domains.filter((d) => d.onset && !d.onset.endsWith(NOT_RECORDED))
    .map((d) => ({ label: `First noticed · ${d.heading}`, text: d.onset.replace(/^First noticed: /, ''), muted: false }));
  return [...first, ...recorded, ...rest];
}

function otherAreasHtml(doc: DoctorDoc): string {
  const rows = otherAreaRows(doc);
  if (!rows.length) return '';
  const line = (r: { label: string; text: string; muted: boolean }) => `<tr><th>${esc(r.label)}</th><td${r.muted ? ' class="muted"' : ''}>${esc(r.text)}</td></tr>`;
  return `<section class="keep"><h2>Other areas</h2><table class="dl areas">${rows.map(line).join('')}</table></section>`;
}

/** The document's one range: the window the counts use (first entry to the last day) when there is one, else the chosen range. */
export function printedRange(doc: DoctorDoc): string {
  const f = doc.sections.find((x) => x.id === 'frequency');
  return f && f.id === 'frequency' ? f.windowLabel : doc.rangeLabel;
}

/** First-week rule 4: under 7 written days the Period line says how many days it covers ('3 days written so far · 29-31 Oct 2026'). */
function thinPeriodLine(doc: DoctorDoc): string {
  const range = printedRange(doc);
  const f = doc.sections.find((x) => x.id === 'frequency');
  const all = f && f.id === 'frequency' ? f.bars[0] : undefined;
  const v = thinView(all?.days ?? 0, []);
  return v.thin && v.line ? `${v.line} · ${range.replace(/ · \d+ days?$/, '')}` : range;
}

/** Two-column key/value block under the title, ruled like a record header. */
function headBlock(doc: DoctorDoc): string {
  const parts = doc.meta.split(' · ').slice(1);
  const made = parts.find((x) => x.startsWith('Made '))?.slice(5) ?? '';
  const visit = parts.find((x) => !x.startsWith('Made ')) ?? '';
  const rows: [string, string][] = [
    ['Period', thinPeriodLine(doc)],
    ...(visit ? [['Visit', visit] as [string, string]] : []),
    ['Main priority (chosen by the patient)', mainPriorityOf(doc.agendaBlock)],
    ['Generated', made],
    ['Source', 'Recorded by the patient in Atossa. Not clinically verified.'],
  ].filter(([, v]) => v) as [string, string][];
  return `<table class="kv"><tbody>${rows.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table>`;
}

/** Header line and footer with the one printed range (screen and PDF agree). */
export function printedMeta(doc: DoctorDoc): string {
  const rest = doc.meta.split(' · ').slice(1);
  return [printedRange(doc), ...rest].join(' · ');
}
export function printedFooter(doc: DoctorDoc): string {
  return doc.footer.replace(doc.rangeLabel, printedRange(doc).split(' · ')[0]);
}

export function summaryToHtml(doc: DoctorDoc): string {
  const C = DOC_COLORS;
  const T = PAGE_TYPE;
  const pt = (v: readonly [number, number]) => `font-size: ${v[0]}pt; line-height: ${v[1]}pt;`;
  const body = [
    // Her chip choice prints once, in the header block ("Main priority (chosen by the patient)"); the quote block keeps her own words.
    doc.agendaBlock && (!mainPriorityOf(doc.agendaBlock) || doc.agendaBlock.questions.length)
      ? `<section><h2>${esc(doc.agendaBlock.title)}</h2>${doc.agendaBlock.priority && !mainPriorityOf(doc.agendaBlock) ? `<p class="serif lead">“${esc(curly(doc.agendaBlock.priority))}”</p>` : ''}${
        doc.agendaBlock.questions.length ? `<ul>${doc.agendaBlock.questions.map((q) => `<li class="serif">“${esc(curly(q))}”</li>`).join('')}</ul>` : ''}</section>`
      : '',
    ...doc.sections.map(sectionHtml),
    otherAreasHtml(doc),
  ].join('');
  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(doc.title)}</title>
<style>
  @page { size: A4; margin: 10mm 14mm 9mm; @bottom-right { content: "Page " counter(page) " of " counter(pages); font-family: ${SANS}; font-size: 8pt; color: ${C.ink}; } }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; background: ${C.white}; }
  body { font-family: ${SANS}; color: ${C.ink}; ${pt(T.body)} font-variant-numeric: tabular-nums lining-nums; }
  table.page { width: 100%; border-collapse: collapse; }
  table.page > tbody > tr > td, table.page > thead > tr > td, table.page > tfoot > tr > td { padding: 0; vertical-align: top; }
  h1 { font-family: ${SANS}; font-weight: 700; letter-spacing: 0.2pt; ${pt(T.title)} margin: 0; }
  .metahead { color: ${C.ink2}; ${pt(T.meta)} margin: 3pt 0 0; padding-bottom: 8pt; border-bottom: 1pt solid ${C.ink}; }
  h2 { ${pt(T.head)} font-weight: 700; margin: 0 0 5pt; }
  section { padding: ${T.section - 8}pt 0 ${T.section - 12}pt; border-bottom: 0.75pt solid ${C.borderStrong}; }
  h2 { break-after: avoid; page-break-after: avoid; }
  .keep { break-inside: avoid; page-break-inside: avoid; }
  section:last-child { border-bottom: 0; }
  p { margin: 0; }
  .serif { font-family: ${SANS}; font-style: normal; font-weight: 400; ${pt(T.quote)} }
  .serif.lead { ${pt(T.lead)} }
  .q { margin: 0 0 ${T.item}pt; break-inside: avoid; }
  .meta { color: ${PRINT_INK2}; ${pt(T.meta)} }
  .muted { color: ${PRINT_INK2}; }
  .strong { font-weight: 600; }
  .sep { color: ${C.ink3}; }
  .sub { color: ${C.ink2}; ${pt(T.meta)} font-weight: 600; margin: 2pt 0 3pt; }
  .item { margin: 0 0 ${T.item}pt; break-inside: avoid; }
  table.dl { border-collapse: collapse; margin-top: 1pt; width: 100%; }
  table.dl th { width: 112pt; padding: 0 8pt 1pt 0; text-align: left; vertical-align: baseline; font-weight: 400; color: ${PRINT_INK2}; ${pt(T.label)} }
  table.dl td { padding: 0 0 1pt; vertical-align: baseline; }
  table.areas th { ${pt(T.meta)} width: 132pt; white-space: nowrap; } table.areas td { ${pt(T.meta)} color: ${C.ink}; } table.areas td.muted { color: ${PRINT_INK2}; }
  table.notes { width: 100%; border-collapse: collapse; table-layout: fixed; }
  table.notes th { text-align: left; font-weight: 600; color: ${C.ink2}; ${pt(T.meta)} padding: 0 6pt 3pt 0; border-bottom: 0.75pt solid ${C.borderStrong}; }
  table.notes td { padding: 3pt 6pt 3pt 0; vertical-align: top; border-bottom: 0.5pt solid ${C.borderStrong}; break-inside: avoid; ${pt(T.meta)} color: ${C.ink}; }
  table.notes td.serif { ${pt(T.body)} }
  table.notes td .meta { ${pt(T.meta)} color: ${C.ink2}; margin-top: 1pt; }
  table.notes td.nw { white-space: nowrap; }
  table.dated td { padding: 3pt 6pt 3pt 0; }
  table.dated td:nth-child(1) { width: 66pt; } table.dated td:nth-child(2) { width: 96pt; }
  table.dated.tried td:nth-child(1) { width: 120pt; } table.dated.tried td:nth-child(2) { width: 110pt; }
  table.dated tr:last-child td { border-bottom: 0; }
  table.notes th:nth-child(1) { width: 84pt; } table.notes th:nth-child(2) { width: 74pt; } table.notes th:nth-child(3) { width: 62pt; } table.notes th:nth-child(4) { width: 90pt; }
  table.kv { width: 100%; border-collapse: collapse; border-bottom: 1pt solid ${C.ink}; margin-top: 4pt; }
  table.kv th { width: 168pt; text-align: left; font-weight: 600; color: ${C.ink}; ${pt(T.meta)} padding: 1pt 6pt 1pt 0; border-top: 0.5pt solid ${C.borderStrong}; }
  table.kv td { color: ${C.ink}; ${pt(T.body)} padding: 1pt 0; border-top: 0.5pt solid ${C.borderStrong}; }
  .recorded { color: ${C.ink2}; ${pt(T.meta)} margin: 0; padding: 3pt 0 0; }
  table.figs { width: 100%; border-collapse: collapse; margin-top: 3pt; }
  table.figs th { text-align: left; font-weight: 600; color: ${C.ink2}; ${pt(T.meta)} padding: 0 6pt 3pt 0; border-bottom: 0.75pt solid ${C.borderStrong}; }
  table.figs td { padding: 2pt 6pt 2pt 0; border-bottom: 0.5pt solid ${C.borderStrong}; vertical-align: middle; ${pt(T.body)} }
  table.figs .num { text-align: right; white-space: nowrap; font-weight: 600; }
  table.figs th.num { font-weight: 600; }
  table.figs td.usual { color: ${C.ink2}; ${pt(T.meta)} }
  table.figs td.area { font-weight: 400; } table.figs tr.all td.area { font-weight: 700; }
  table.figs .barcell { width: 64pt; padding-right: 0; }
  .bar { margin: 3pt 0 6pt; }
  .track { height: 5pt; background: ${C.track}; border: 0.5pt solid ${C.borderStrong}; margin-top: 2pt; }
  .fill { height: 100%; background: ${C.ink}; }
  .strip { margin: 5pt 0 3pt; }
  .key { display: inline-block; width: 12pt; height: 3pt; background: ${C.clay}; vertical-align: middle; }
  .key.spot { height: 0; background: none; border-top: ${SPOT_STROKE}pt dashed ${C.clay}; }
  tfoot td { padding-top: 8pt !important; color: ${C.ink2}; ${pt(T.footer)} }
  .footer { border-top: 0.5pt solid ${C.borderStrong}; padding-top: 4pt; }
</style></head><body>
<table class="page">
  <thead><tr><td></td></tr></thead>
  <tbody><tr><td>
    <h1>${esc(doc.title)}</h1>
    ${headBlock(doc)}
    ${body}
  </td></tr></tbody>
  <tfoot><tr><td><div class="footer">${esc(printedFooter(doc))}</div></td></tr></tfoot>
</table>
</body></html>`;
}

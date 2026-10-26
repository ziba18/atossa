// The ONE document model for the For my doctor tab. `buildDoctorSummary` turns Sam's records +
// the builder's choices into a typed `DoctorDoc`; the on-screen preview / Show on screen
// (components/atossa/doctor/DocumentView.tsx) and the PDF (`summaryToHtml`) both render that
// same model, so they can never say different things.
//
// Rules (every string produced here): it only repeats what Sam entered. Never a condition name,
// an interpretation, a threshold label, a cause ("linked to"), a trend or a suggestion. No averages
// — strength is shown as the raw values Sam gave (or a min–max of them). Sections and fields with
// no data are omitted entirely (never an empty label). "Not sure" / "Skip" / "It varies" /
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
export const SECTION_META: { id: SectionId; title: string; sensitive: boolean }[] = [
  { id: 'words', title: 'Symptoms in my words', sensitive: false },
  { id: 'frequency', title: 'How often and how strong', sensitive: false },
  { id: 'periods', title: 'Periods logged', sensitive: false },
  { id: 'impacts', title: 'What it got in the way of', sensitive: false },
  { id: 'tried', title: 'What I’ve tried', sensitive: false },
  { id: 'appointments', title: 'Appointments', sensitive: false },
  { id: 'history', title: 'Health history', sensitive: false },
  { id: 'sex', title: 'Sex & intimacy', sensitive: true },
  { id: 'mood', title: 'Mood', sensitive: true },
  { id: 'eating', title: 'Eating', sensitive: true },
];

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

export interface FreqBar {
  /** "Days with a note", or a body zone Sam picked ("Lower back"). */
  label: string;
  days: number;
  total: number;
  /** "usually 4–6/10, at worst 9/10" — raw values Sam gave; '' when none. */
  strength: string;
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
}

export interface HeatStripModel {
  from: string;
  to: string;
  label: string;
  days: HeatDay[];
  /** Set when the strip shows only the end of a longer range. */
  windowNote: string;
}

export interface PeriodRun { range: string; days: number; flows: string; notes: DocQuote[] }
export interface CountItem { label: string; days: number }
export interface TriedItem { title: string; dates: string; noticed: string }
export interface DatedItem { date: string; title: string; lines: DocLine[] }

export type DocSection =
  | { id: 'words'; title: string; quotes: DocQuote[]; more: string }
  | { id: 'frequency'; title: string; windowLabel: string; bars: FreqBar[]; strip: HeatStripModel; caption: string }
  | { id: 'periods'; title: string; runs: PeriodRun[]; spotting: string }
  | { id: 'impacts' | 'sex' | 'mood' | 'eating'; title: string; items: CountItem[]; quotes: DocQuote[] }
  | { id: 'tried'; title: string; items: TriedItem[]; quotes: DocQuote[] }
  | { id: 'history'; title: string; items: DatedItem[]; more: string }
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
  /** Included sections with data, in document order. */
  sections: DocSection[];
  /** Every section that HAS data (included or not) — drives the Sections switches. */
  available: { id: SectionId; title: string; sensitive: boolean }[];
  entries: number;
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
}

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

export const agendaTitleFor = (appointmentToday?: boolean) =>
  appointmentToday ? 'What I’d like from today' : 'What I’d like from this appointment';

const STRIP_MAX_DAYS = 93; // three rows of 31 on the A4 page
const MAX_QUOTES = 5;
const MAX_LISTED = 3; // appointments / history items on the page; the rest are counted ("N earlier …")
const NOT_IMPACTS = new Set(['Nothing today']);
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

/** Raw strength values for a group of notes: "usually 6/10, at worst 7–9/10". */
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
    worst.length ? `at worst ${spread(worst)}` : '',
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

/** Distinct days per impact item, in first-seen order, sorted by count (desc). */
function countImpacts(notes: SymptomData[], keep: (item: string) => boolean): CountItem[] {
  const days = new Map<string, Set<string>>();
  for (const s of notes) {
    for (const item of realImpacts(s)) {
      if (NOT_IMPACTS.has(item) || !keep(item)) continue;
      if (!days.has(item)) days.set(item, new Set());
      days.get(item)!.add(s.date);
    }
  }
  return [...days.entries()]
    .map(([label, set]) => ({ label, days: set.size }))
    .sort((a, b) => b.days - a.days);
}

export function buildDoctorSummary(input: SummaryInput, options: SummaryOptions): DoctorDoc {
  const { from, to, today } = options;
  const include = options.include ?? {};
  const inRange = (d: string) => d >= from && d <= to;

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
  if (notes.length) {
    const stripFrom = inclusiveDays(from, to) > STRIP_MAX_DAYS ? addDays(to, -(STRIP_MAX_DAYS - 1)) : from;
    const windowNotes = notes.filter((s) => s.date >= stripFrom);
    const total = inclusiveDays(stripFrom, to);
    const bleedSet = new Set(bleedDays.filter((d) => bleedingStatus(d) !== 'spotting').map((d) => d.date));
    const spotSet = new Set(bleedDays.filter((d) => bleedingStatus(d) === 'spotting' && !bleedSet.has(d.date)).map((d) => d.date));
    const byDay = new Map<string, SymptomData[]>();
    for (const s of windowNotes) byDay.set(s.date, [...(byDay.get(s.date) ?? []), s]);

    const days: HeatDay[] = [];
    for (let k = stripFrom; k <= to; k = addDays(k, 1)) {
      const list = byDay.get(k) ?? [];
      const peaks = list.map(peakOf).filter((n): n is number => n != null);
      days.push({ date: k, logged: list.length > 0, value: peaks.length ? Math.max(...peaks) : null, bleeding: bleedSet.has(k), spotting: spotSet.has(k) });
    }

    const noteDays = byDay.size;
    const bars: FreqBar[] = [];
    if (noteDays) {
      bars.push({ label: 'Days with a note', days: noteDays, total, strength: groupStrength(windowNotes) });
      const zones = new Map<string, SymptomData[]>();
      for (const s of windowNotes) for (const z of s.zones ?? []) zones.set(z, [...(zones.get(z) ?? []), s]);
      [...zones.entries()]
        .map(([label, list]) => ({ label, days: new Set(list.map((s) => s.date)).size, total, strength: groupStrength(list) }))
        .sort((a, b) => b.days - a.days)
        .forEach((b) => bars.push(b));
    }

    const bleedOverlap = [...byDay.keys()].filter((d) => bleedSet.has(d)).length;
    const bleedInWindow = days.some((d) => d.bleeding);
    const spotDays = days.filter((d) => d.spotting).length;
    const windowLabel = formatRange(stripFrom, to, 'always');
    if (noteDays) {
      all.push({
        id: 'frequency',
        title: 'How often and how strong',
        windowLabel: `${windowLabel} · ${plural(total, 'day')}`,
        bars,
        strip: {
          from: stripFrom, to, label: windowLabel, days,
          windowNote: stripFrom !== from ? `Shows the last ${total} days of the range.` : '',
        },
        caption:
          `Notes were logged on ${noteDays} of ${total} days` +
          (bleedInWindow
            ? bleedOverlap ? `; ${bleedOverlap} of those ${bleedOverlap === 1 ? 'was a bleeding day' : 'were bleeding days'}.` : '; none of those were bleeding days.'
            : '.') +
          (spotDays ? ` Spotting logged on ${plural(spotDays, 'day')}.` : ''),
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
      flows: flows.length ? `Flow logged: ${flows.join(', ')}` : '',
      notes: run.filter((d) => clean(d.note)).map((d) => ({ date: d.date, dateLabel: formatDay(d.date), text: clean(d.note), facts: '' })),
    };
  });
  const spottingDays = bleedDays.filter((d) => bleedingStatus(d) === 'spotting').map((d) => d.date).sort();
  if (runs.length || spottingDays.length) {
    all.push({
      id: 'periods',
      title: 'Periods logged',
      runs,
      spotting: spottingDays.length ? `Spotting logged: ${spottingDays.map((d) => formatShortDate(d, 'always')).join(', ')}` : '',
    });
  }

  // 4. What it got in the way of (Sex goes to its own sensitive section).
  const impactItems = countImpacts(notes, (i) => i !== 'Sex');
  const legacyStopped = notes.filter((s) => !s.impacts && s.stopped === true);
  if (legacyStopped.length) {
    impactItems.push({ label: 'Stopped me doing things', days: new Set(legacyStopped.map((s) => s.date)).size });
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
  const hist = [...input.history.map((r) => r.data)].sort((a, b) => b.date.localeCompare(a.date));
  if (hist.length) {
    all.push({
      id: 'history',
      title: 'Health history',
      items: hist.slice(0, MAX_LISTED).map((h) => ({
        date: docDate(h.date, h.datePrecision),
        title: h.type,
        lines: [
          { label: 'I was told', text: clean(h.told) },
          { label: 'What was done', text: clean(h.done) },
          { label: 'Result or how it went', text: clean(h.result) },
        ].filter((l) => l.text),
      })),
      more: hist.length > MAX_LISTED ? `${plural(hist.length - MAX_LISTED, 'earlier item')} saved in Atossa.` : '',
    });
  }

  // 8. Sensitive sections — only when such data exists (mood / eating have no fields yet).
  const sexItems = countImpacts(notes, (i) => i === 'Sex');
  if (sexItems.length) all.push({ id: 'sex', title: 'Sex & intimacy', items: sexItems, quotes: [] });

  const available = SECTION_META.filter((m) => all.some((s) => s.id === m.id));
  const sections = all.filter((s) => sectionIncluded(s.id, include));
  const agenda = clean(options.agenda);
  const entries = noteCount(input.symptoms, { from, to });
  const name = clean(input.name);

  return {
    title: name ? `Symptom summary — ${name}` : 'Symptom summary',
    meta: joinFacts(rangeLabel, options.visitType ?? '', `Made ${formatShortDate(today, 'always')}`),
    from, to, rangeLabel, agenda, agendaTitle: agendaTitleFor(options.appointmentToday), sections, available, entries,
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
export const STRIP_KEY = 'Number = highest strength given that day (0–10). Dot = a note with no number.';
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
  const rowH = cell + band + 9;
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

/** One visit / history item: a bold heading line, then one labelled fact per row. */
function datedItemHtml(a: DatedItem): string {
  const rows = a.lines.map((l) => `<tr><th>${esc(l.label)}</th><td>${esc(l.text)}</td></tr>`).join('');
  return `<div class="item"><p class="strong">${esc(joinFacts(a.date, a.title))}</p>${rows ? `<table class="dl">${rows}</table>` : ''}</div>`;
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
      const bars = s.bars.map((b) => {
        const pct = b.total ? Math.max(1.5, (b.days / b.total) * 100) : 0;
        return `<div class="bar"><p><span class="strong">${esc(barText(b))}</span>${b.strength ? `<span class="muted"> · ${esc(b.strength)}</span>` : ''}</p>
          <div class="track"><div class="fill" style="width:${pct.toFixed(1)}%"></div></div></div>`;
      }).join('');
      const bleedKey =
        (s.strip.days.some((d) => d.bleeding) ? ` <span class="key"></span> = ${STRIP_BLEED_KEY}.` : '') +
        (s.strip.days.some((d) => d.spotting) ? ` <span class="key spot"></span> = ${STRIP_SPOT_KEY}.` : '');
      return `<section>${head}<p class="meta">${esc(s.windowLabel)}</p>${bars}
        <div class="strip">${stripSvg(s.strip)}</div>
        <p class="meta">${esc(STRIP_KEY)}${bleedKey}</p>
        <p class="meta">${esc(joinFacts(s.caption, s.strip.windowNote))}</p></section>`;
    }
    case 'periods':
      return `<section>${head}${s.runs.map((r) => `<div class="item"><p><span class="strong">${esc(r.range)}</span> · ${esc(daysText(r.days))}${r.flows ? ` · ${esc(r.flows)}` : ''}</p>${r.notes.map(quoteHtml).join('')}</div>`).join('')}${s.spotting ? `<p>${esc(s.spotting)}</p>` : ''}</section>`;
    case 'impacts': case 'sex': case 'mood': case 'eating':
      return `<section>${head}${s.items.length ? `<p class="item">${s.items.map((c) => esc(countText(c))).join('<span class="sep"> · </span>')}</p>` : ''}${s.quotes.map(quoteHtml).join('')}</section>`;
    case 'tried':
      return `<section>${head}${s.items.map((t) => `<div class="item"><p><span class="strong">${esc(t.title)}</span>${t.dates ? ` · ${esc(t.dates)}` : ''}</p>${t.noticed ? `<p><span class="muted">What I noticed:</span> <span class="serif">“${esc(curly(t.noticed))}”</span></p>` : ''}</div>`).join('')}${s.quotes.map(quoteHtml).join('')}</section>`;
    case 'appointments':
      return `<section>${head}${s.upcoming.length ? `<p class="sub">${esc(APPT_AHEAD)}</p>${s.upcoming.map(datedItemHtml).join('')}${s.items.length ? `<p class="sub">${esc(APPT_PAST)}</p>` : ''}` : ''}${s.items.map(datedItemHtml).join('')}${s.more ? `<p class="meta">${esc(s.more)}</p>` : ''}</section>`;
    case 'history':
      return `<section>${head}${s.items.map(datedItemHtml).join('')}${s.more ? `<p class="meta">${esc(s.more)}</p>` : ''}</section>`;
  }
}

/**
 * A4 HTML for expo-print (Share PDF / Print) and the web print fallback. The footer sits in a
 * table <tfoot>, which WebKit repeats on every printed page. Fonts: Inter / Instrument Serif
 * if the device has them, else the system sans + a serif italic (they can't be embedded here).
 * Type (pt): body 10.5/14.5, quotes 12/16, meta 9/12, heads 12/16 — see PAGE_TYPE.
 */
export function summaryToHtml(doc: DoctorDoc): string {
  const C = DOC_COLORS;
  const T = PAGE_TYPE;
  const pt = (v: readonly [number, number]) => `font-size: ${v[0]}pt; line-height: ${v[1]}pt;`;
  const body = [
    doc.agenda ? `<section>${`<h2>${esc(doc.agendaTitle)}</h2>`}<p class="serif lead">“${esc(curly(doc.agenda))}”</p></section>` : '',
    ...doc.sections.map(sectionHtml),
  ].join('');
  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(doc.title)}</title>
<style>
  @page { size: A4; margin: 14mm 14mm 12mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; background: ${C.white}; }
  body { font-family: ${SANS}; color: ${C.ink}; ${pt(T.body)} }
  table.page { width: 100%; border-collapse: collapse; }
  table.page > tbody > tr > td, table.page > thead > tr > td, table.page > tfoot > tr > td { padding: 0; vertical-align: top; }
  h1 { font-family: ${SERIF}; font-style: italic; font-weight: 400; ${pt(T.title)} margin: 0; }
  .metahead { color: ${C.ink2}; ${pt(T.meta)} margin: 3pt 0 0; padding-bottom: 8pt; border-bottom: 1pt solid ${C.ink}; }
  h2 { ${pt(T.head)} font-weight: 600; margin: 0 0 5pt; }
  section { padding: ${T.section}pt 0 ${T.section - 4}pt; border-bottom: 0.75pt solid ${C.borderStrong}; }
  h2 { break-after: avoid; page-break-after: avoid; }
  .keep { break-inside: avoid; page-break-inside: avoid; }
  section:last-child { border-bottom: 0; }
  p { margin: 0; }
  .serif { font-family: ${SERIF}; font-style: italic; font-weight: 400; ${pt(T.quote)} }
  .serif.lead { ${pt(T.lead)} }
  .q { margin: 0 0 ${T.item}pt; break-inside: avoid; }
  .meta { color: ${C.ink2}; ${pt(T.meta)} }
  .muted { color: ${C.ink2}; }
  .strong { font-weight: 600; }
  .sep { color: ${C.ink3}; }
  .sub { color: ${C.ink2}; ${pt(T.meta)} font-weight: 600; margin: 2pt 0 3pt; }
  .item { margin: 0 0 ${T.item}pt; break-inside: avoid; }
  table.dl { border-collapse: collapse; margin-top: 1pt; width: 100%; }
  table.dl th { width: 112pt; padding: 0 8pt 1pt 0; text-align: left; vertical-align: baseline; font-weight: 400; color: ${C.ink2}; ${pt(T.label)} }
  table.dl td { padding: 0 0 1pt; vertical-align: baseline; }
  table.notes { width: 100%; border-collapse: collapse; table-layout: fixed; }
  table.notes th { text-align: left; font-weight: 600; color: ${C.ink2}; ${pt(T.meta)} padding: 0 6pt 3pt 0; border-bottom: 0.75pt solid ${C.borderStrong}; }
  table.notes td { padding: 4pt 6pt 4pt 0; vertical-align: top; border-bottom: 0.5pt solid ${C.borderStrong}; break-inside: avoid; ${pt(T.meta)} color: ${C.ink}; }
  table.notes td.serif { ${pt(T.body)} }
  table.notes td.nw { white-space: nowrap; }
  table.notes th:nth-child(1) { width: 86pt; } table.notes th:nth-child(2) { width: 78pt; } table.notes th:nth-child(3) { width: 74pt; } table.notes th:nth-child(4) { width: 64pt; }
  .bar { margin: 3pt 0 6pt; }
  .track { height: 5pt; background: ${C.track}; border: 0.5pt solid ${C.borderStrong}; margin-top: 2pt; }
  .fill { height: 100%; background: ${C.ink}; }
  .strip { margin: 8pt 0 4pt; }
  .key { display: inline-block; width: 12pt; height: 3pt; background: ${C.clay}; vertical-align: middle; }
  .key.spot { height: 0; background: none; border-top: ${SPOT_STROKE}pt dashed ${C.clay}; }
  tfoot td { padding-top: 8pt !important; color: ${C.ink2}; ${pt(T.footer)} }
  .footer { border-top: 0.5pt solid ${C.borderStrong}; padding-top: 4pt; }
</style></head><body>
<table class="page">
  <thead><tr><td></td></tr></thead>
  <tbody><tr><td>
    <h1>${esc(doc.title)}</h1>
    <p class="metahead">${esc(doc.meta)}</p>
    ${body}
  </td></tr></tbody>
  <tfoot><tr><td><div class="footer">${esc(doc.footer)}</div></td></tr></tfoot>
</table>
</body></html>`;
}

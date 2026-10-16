// The ONE place that turns record data into display text. en-GB, always:
//   "Wed 24 Sep" (this year) · "Wed 24 Sep 2025" (other years) · "Sep", never "Sept"
//   ranges "11–24 Sep 2026" / "27 Jul–2 Aug" · "Around April 2019" / "Around 2019"
// Pure functions over plain data — no React, no Intl (Intl output varies by device/locale).
import type {
  BleedingStatus, DatePrecision, PeriodDayData, Rec, SymptomData,
} from '../../types/records';
import { MONTH_NAMES, addDays, mondayOf, parseKey, todayKey } from './dates';
import { WHEN_OPTIONS } from './fields';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const mon = (m0: number) => MONTH_NAMES[m0].slice(0, 3); // Sep, not Sept

function weekday(key: string): string {
  const { y, m0, d } = parseKey(key);
  return WEEKDAYS[new Date(Date.UTC(y, m0, d)).getUTCDay()];
}

const currentYear = () => parseKey(todayKey()).y;

export type YearMode = 'auto' | 'always' | 'never';
const showYear = (y: number, mode: YearMode) => mode === 'always' || (mode === 'auto' && y !== currentYear());

// ---- single dates -------------------------------------------------------------------------

/** "Wed 24 Sep" this year, "Wed 24 Sep 2025" otherwise. */
export function formatDay(key: string, year: YearMode = 'auto'): string {
  if (!key) return '';
  const { y, m0, d } = parseKey(key);
  return `${weekday(key)} ${d} ${mon(m0)}${showYear(y, year) ? ` ${y}` : ''}`;
}

/** "24 Sep" / "24 Sep 2025" — no weekday (tight spaces, PDF tables). */
export function formatShortDate(key: string, year: YearMode = 'auto'): string {
  if (!key) return '';
  const { y, m0, d } = parseKey(key);
  return `${d} ${mon(m0)}${showYear(y, year) ? ` ${y}` : ''}`;
}

/** "Today", "Yesterday", else `formatDay`. For the DatePill and capture copy. */
export function formatRelativeDay(key: string): string {
  const today = todayKey();
  if (key === today) return 'Today';
  if (key === addDays(today, -1)) return 'Yesterday';
  return formatDay(key);
}

/**
 * A record date that may be approximate: "Around April 2019", "Around 2019", or for exact
 * dates `formatDay` ("Thu 24 Sep"). Empty key → '' (callers decide on "Not entered").
 */
export function formatRecordDate(key: string, precision: DatePrecision = 'exact'): string {
  if (!key) return '';
  const { y, m0 } = parseKey(key);
  if (precision === 'year') return `Around ${y}`;
  if (precision === 'month') return `Around ${MONTH_NAMES[m0]} ${y}`;
  return formatDay(key);
}

/** Same, but lower-case "around" for mid-sentence use: "Started around April 2019". */
export function formatRecordDateInline(key: string, precision: DatePrecision = 'exact'): string {
  const s = formatRecordDate(key, precision);
  return s.startsWith('Around') ? `around${s.slice(6)}` : s;
}

// ---- ranges -------------------------------------------------------------------------------

/**
 * "11–24 Sep 2026", "27 Jul–2 Aug", "28 Dec 2025–3 Jan 2026". Identical start/end collapse to
 * one date. `year`: 'auto' adds the year only when it isn't this year; 'always' (doctor page,
 * PDF footer) always adds it.
 */
export function formatRange(start: string, end: string, year: YearMode = 'auto'): string {
  if (!start && !end) return '';
  if (!end || start === end) return formatShortDate(start || end, year);
  if (!start) return formatShortDate(end, year);
  const [a, b] = start <= end ? [start, end] : [end, start];
  const s = parseKey(a);
  const e = parseKey(b);
  if (s.y !== e.y) return `${formatShortDate(a, 'always')}–${formatShortDate(b, 'always')}`;
  const tail = showYear(e.y, year) ? ` ${e.y}` : '';
  if (s.m0 === e.m0) return `${s.d}–${e.d} ${mon(e.m0)}${tail}`;
  return `${s.d} ${mon(s.m0)}–${e.d} ${mon(e.m0)}${tail}`;
}

/**
 * A range whose ends may be approximate (medicines, history) — the same rule as the doctor page
 * (review 2, N20). Two exact dates → the compact `formatRange` ("24 Jun–24 Sep 2026"); an
 * approximate side or an open end → a spaced en dash: "Around June 2015 – around June 2016",
 * "Around June 2015 – still taking". Identical sides collapse to one.
 */
export function formatRecordRange(
  start: string, startPrecision: DatePrecision = 'exact',
  end = '', endPrecision: DatePrecision = 'exact', openEnd = '', year: YearMode = 'auto',
): string {
  if (!start) return '';
  const side = (k: string, p: DatePrecision) => (p === 'exact' ? formatShortDate(k, year) : formatRecordDate(k, p));
  if (!end) return openEnd ? `${side(start, startPrecision)} – ${openEnd}` : side(start, startPrecision);
  if (startPrecision === 'exact' && endPrecision === 'exact') return formatRange(start, end, year);
  const s = side(start, startPrecision);
  const e = side(end, endPrecision);
  if (s === e) return s;
  return `${s} – ${e.replace(/^Around/, 'around')}`;
}

/** Timeline week header for the week starting `monday`: "This week", "Last week", "27 Jul–2 Aug". */
export function weekLabel(monday: string): string {
  const thisWeek = mondayOf(todayKey());
  if (monday === thisWeek) return 'This week';
  if (monday === addDays(thisWeek, -7)) return 'Last week';
  return formatRange(monday, addDays(monday, 6));
}

// ---- symptoms -----------------------------------------------------------------------------

/** "At worst" score, tolerating old records (score) and new ones (worst). */
export function worstOf(s: SymptomData): number | null {
  if (typeof s.worst === 'number') return s.worst;
  if (typeof s.score === 'number') return s.score;
  return null;
}

export function typicalOf(s: SymptomData): number | null {
  return typeof s.typical === 'number' ? s.typical : null;
}

/** The highest number Sam gave for this note (for severity tags / heat-strips). */
export function peakOf(s: SymptomData): number | null {
  const w = worstOf(s);
  const t = typicalOf(s);
  if (w == null) return t;
  if (t == null) return w;
  return Math.max(w, t);
}

/** Non-breaking spaces inside one fact, so "9/10 at worst" never wraps as "9/10 at / worst" (V12). */
const keepTogether = (fact: string) => fact.replace(/ /g, '\u00A0');

/**
 * "6/10 usually · 9/10 at worst", "9/10 at worst", "It varies", "8/10" (quick Rough-day log).
 * Returns '' when nothing was given — callers render nothing, never "0/10" or "Not set".
 * Each fact's own spaces are non-breaking (lines only break at " · ").
 */
export function formatStrength(s: SymptomData): string {
  const typical = typicalOf(s);
  const worst = worstOf(s);
  if (s.source === 'quick') {
    const n = worst ?? typical;
    return n == null ? '' : `${n}/10`;
  }
  return [
    typical != null ? keepTogether(`${typical}/10 usually`) : '',
    worst != null ? keepTogether(`${worst}/10 at worst`) : '',
    s.strengthText ?? '',
  ].filter(Boolean).join(' · ');
}

/** The escape answers ("Not sure", "It varies") that are stored as values. */
export const ESCAPE_VALUES = ['Not sure', 'It varies'] as const;
export const isEscapeValue = (v: string | null | undefined) =>
  !!v && (ESCAPE_VALUES as readonly string[]).includes(v.trim());

const DURATION_RE = /^(since|for)\b/i;

/**
 * Timing is two separate questions (review 1, UX #4):
 *  - `when` — period timing: a WHEN_OPTIONS chip, Not sure / It varies, or her own phrase;
 *  - `duration` — "How long": her words such as "Since Tuesday".
 * Older notes put "Since Tuesday" in `when`; this reads those as the duration (display only).
 */
export function splitTiming(s: Pick<SymptomData, 'when' | 'duration'>): { when: string; duration: string } {
  const when = (s.when ?? '').trim();
  const duration = (s.duration ?? '').trim();
  const isOption = (WHEN_OPTIONS as readonly string[]).includes(when) || isEscapeValue(when);
  if (when && !duration && !isOption && DURATION_RE.test(when)) return { when: '', duration: when };
  return { when, duration };
}

/** The "When" row: "Only around my period", "It varies", … ('' when unanswered). */
export const formatWhen = (s: Pick<SymptomData, 'when' | 'duration'>) => splitTiming(s).when;
/** The "How long" row: "Since Tuesday" ('' when unanswered). */
export const formatDuration = (s: Pick<SymptomData, 'when' | 'duration'>) => splitTiming(s).duration;

// 'Nothing today' is an answer ("no"), but not something that got in the way.
const NON_ANSWERS = new Set(['Not sure', 'Skip', 'It varies', 'Nothing today']);

/** "Got in the way of" items that are real answers (drops Not sure / Skip / It varies). */
export function realImpacts(s: SymptomData): string[] {
  return (s.impacts ?? []).filter((i) => !NON_ANSWERS.has(i));
}

/** Did this note say it got in the way of something? New: impacts; old: `stopped`. */
export function gotInTheWay(s: SymptomData): boolean {
  if (s.impacts) return realImpacts(s).length > 0;
  return s.stopped === true;
}

/**
 * Where, tidy: zones joined, plus her own words / an escape answer (`whereText`) after " · ".
 * Older notes without `whereText`: zones joined, else the free-text `where`.
 */
export function formatWhere(s: SymptomData): string {
  const zones = s.zones && s.zones.length ? s.zones.join(', ') : '';
  if (typeof s.whereText === 'string') return joinFacts(zones, s.whereText);
  return zones || (s.where?.trim() ?? '');
}

/** First line of Sam's words, for cards. '' for quick logs (they have no words). */
export function firstLine(s: SymptomData): string {
  return (s.words ?? '').split('\n')[0].trim();
}

/** Join display facts with " · ", skipping empties: FactLine's text. */
export function joinFacts(...parts: (string | null | undefined | false)[]): string {
  return parts.filter((p): p is string => Boolean(p && String(p).trim())).join(' · ');
}

/** "Where: it varies" — an escape answer on its own is meaningless without its field name (UX #12). */
export function labelEscape(field: string, value: string): string {
  return isEscapeValue(value) ? `${field}: ${value.trim().toLowerCase()}` : value;
}

/**
 * "Lower tummy left · 6/10 usually · 9/10 at worst". Escape answers carry their field name:
 * "Where: it varies · How strong: not sure".
 */
export function symptomFacts(s: SymptomData): string {
  const strength = formatStrength(s);
  return joinFacts(
    labelEscape('Where', formatWhere(s)),
    s.strengthText && strength === s.strengthText ? labelEscape('How strong', strength) : strength,
  );
}

type SymptomLike = SymptomData | Rec<SymptomData>;
const symptomOf = (x: SymptomLike): SymptomData => ('data' in x ? x.data : x);

/**
 * THE note count. Every "N notes ready", toast and summary count must use this so the
 * numbers always agree. Counts symptom notes (including quick Rough-day logs), optionally
 * limited to an inclusive date range.
 */
export function noteCount(symptoms: SymptomLike[], range?: { from?: string; to?: string }): number {
  if (!range) return symptoms.length;
  return symptoms.filter((x) => {
    const d = symptomOf(x).date;
    return (!range.from || d >= range.from) && (!range.to || d <= range.to);
  }).length;
}

/** "1 note" / "12 notes". */
export function notesLabel(n: number): string {
  return `${n} ${n === 1 ? 'note' : 'notes'}`;
}

// ---- bleeding -----------------------------------------------------------------------------

/** Status of a bleeding day, tolerating old records without `status`. */
export function bleedingStatus(d: PeriodDayData): BleedingStatus {
  if (d.status) return d.status;
  if (d.isStart) return 'started';
  if (d.isEnd) return 'ended';
  return 'ongoing';
}

export const BLEEDING_STATUS_LABEL: Record<BleedingStatus, string> = {
  started: 'Period started',
  ongoing: 'Period',
  ended: 'Period ended',
  spotting: 'Spotting',
};

/** Card title for a bleeding day + optional flow: "Period started · Heavy". */
export function bleedingFacts(d: PeriodDayData): string {
  return joinFacts(BLEEDING_STATUS_LABEL[bleedingStatus(d)], d.flow && d.flow !== 'None' ? d.flow : '');
}

// ---- note times ---------------------------------------------------------------------------

/**
 * `SymptomData.createdAt` for a note being saved now about day `dateKey`: an ISO timestamp with
 * the current local time on that day, or undefined when the note is about another day (it has no
 * time of its own). Built from `todayKey()`'s date + the clock, so preview (today pinned to
 * 24 Sep 2026) still gets a sensible same-day time.
 */
export function noteStamp(dateKey: string): string | undefined {
  if (!dateKey || dateKey !== todayKey()) return undefined;
  const { y, m0, d } = parseKey(dateKey);
  const now = new Date();
  return new Date(y, m0, d, now.getHours(), now.getMinutes(), now.getSeconds()).toISOString();
}

/** "15:10" — local 24-hour time of an ISO timestamp; '' when missing/invalid. */
export function formatTimeOfDay(iso?: string | null): string {
  if (!iso) return '';
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return '';
  return `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
}

/**
 * When a note was written, for display and same-day ordering: `data.createdAt` (new notes), else
 * the record's createdAt when it falls on the note's own day (older notes); '' otherwise — a
 * back-dated note has no time of its own.
 */
export function noteWrittenAt(rec: Rec<SymptomData>): string {
  if (rec.data.createdAt) return rec.data.createdAt;
  const t = new Date(rec.createdAt);
  if (Number.isNaN(t.getTime())) return '';
  const local = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  return local === rec.data.date ? rec.createdAt : '';
}

/** The moment a note sorts by within its day: when it was written, else when it was saved. */
export const noteSortTime = (rec: Rec<SymptomData>): string => noteWrittenAt(rec) || rec.createdAt || '';

/**
 * THE "newest note" order (review 3, #4): by the note's day, then by `noteSortTime`. Today's
 * "Your latest note", Timeline and the GP document's quotes all use this so they always agree.
 */
export function compareNotesNewestFirst(a: Rec<SymptomData>, b: Rec<SymptomData>): number {
  return b.data.date.localeCompare(a.data.date) || noteSortTime(b).localeCompare(noteSortTime(a));
}

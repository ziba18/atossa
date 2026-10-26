// Patterns: counts and ranges over the last 4 or 12 weeks, computed on the device from the same
// document model as For my doctor (buildDoctorSummary), so the numbers always match the summary
// for the same dates. Descriptive only: no trends, verdicts, comparisons or predictions.
import { addDays } from './dates';
import { bleedingStatus, noteCount } from './format';
import { buildDoctorSummary, type CountItem, type DocQuote, type FreqBar, type HeatDay, type SummaryInput } from './summary';

export type PatternsRange = '4w' | '12w';
export const PATTERNS_RANGES: { value: PatternsRange; label: string; days: number }[] = [
  { value: '4w', label: '4 weeks', days: 28 },
  { value: '12w', label: '12 weeks', days: 84 },
];
/** Fewer notes than this and the screen waits ("Patterns appear after a week of notes"). */
export const MIN_NOTE_DAYS = 7;

export interface WeekBucket { from: string; to: string; label: string; noteDays: number }

export interface PatternsModel {
  from: string;
  to: string;
  totalDays: number;
  /** Notes in the range (same count as the doctor summary's "N entries"). */
  notes: number;
  /** Days with at least one note, over all of `totalDays`. */
  noteDays: number;
  /** Notes-per-week buckets, oldest first. */
  weeks: WeekBucket[];
  /** Per-day cells (for a strip); same definition as the doctor strip. */
  days: HeatDay[];
  /** Where, from the body areas she picked. */
  zones: FreqBar[];
  bleedingDays: number;
  spottingDays: number;
  /** What it got in the way of. */
  impacts: CountItem[];
  latest: DocQuote | null;
  /** Fewer than MIN_NOTE_DAYS days with a note in the last 28 days. */
  tooEarly: boolean;
}

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`;

export function buildPatterns(input: SummaryInput, today: string, range: PatternsRange): PatternsModel {
  const totalDays = PATTERNS_RANGES.find((r) => r.value === range)!.days;
  const from = addDays(today, -(totalDays - 1));
  const doc = buildDoctorSummary(input, { from, to: today, today });
  const freq = doc.sections.find((s) => s.id === 'frequency');
  const words = doc.sections.find((s) => s.id === 'words');
  const impacts = doc.sections.find((s) => s.id === 'impacts');
  const days = freq && freq.id === 'frequency' ? freq.strip.days : [];
  const bars = freq && freq.id === 'frequency' ? freq.bars : [];

  const weeks: WeekBucket[] = [];
  const n = totalDays / 7;
  for (let w = 0; w < n; w++) {
    const wFrom = addDays(from, w * 7);
    const wTo = addDays(wFrom, 6);
    weeks.push({
      from: wFrom,
      to: wTo,
      label: String(w + 1),
      noteDays: days.filter((d) => d.logged && d.date >= wFrom && d.date <= wTo).length,
    });
  }
  const noteDays = days.filter((d) => d.logged).length;
  // The 28-day check is separate so the 12-week view isn't blocked by a quiet first month.
  const recent = days.filter((d) => d.logged && d.date >= addDays(today, -27)).length;
  return {
    from, to: today, totalDays,
    notes: noteCount(input.symptoms, { from, to: today }),
    noteDays,
    weeks,
    days,
    zones: bars.filter((b) => b.label !== 'Days with a note'),
    // From the period records themselves, not the strip: the doctor strip can start at the first note.
    ...bleedingCounts(input, from, today),
    impacts: impacts && impacts.id === 'impacts' ? impacts.items : [],
    latest: words && words.id === 'words' ? words.quotes[0] ?? null : null,
    tooEarly: recent < MIN_NOTE_DAYS,
  };
}

/** The sentence a screen reader reads before any chart, and the headline under it. */
export const noteDaysText = (m: PatternsModel) => `Notes on ${m.noteDays} of ${plural(m.totalDays, 'day')}`;
export const weeksText = (m: PatternsModel) =>
  `By week, days with a note: ${m.weeks.map((w, i) => `week ${i + 1}, ${w.noteDays}`).join('; ')}.`;
export const bleedingText = (m: PatternsModel) =>
  `Bleeding logged on ${plural(m.bleedingDays, 'day')}` + (m.spottingDays ? `; spotting on ${plural(m.spottingDays, 'day')}` : '') + '.';

/** Days with bleeding / spotting-only logged in the range (spotting on a bleeding day counts once, as bleeding). */
function bleedingCounts(input: SummaryInput, from: string, to: string): { bleedingDays: number; spottingDays: number } {
  const mine = input.periodDays.map((r) => r.data).filter((d) => d.date >= from && d.date <= to);
  const bleed = new Set(mine.filter((d) => bleedingStatus(d) !== 'spotting').map((d) => d.date));
  const spot = new Set(mine.filter((d) => bleedingStatus(d) === 'spotting' && !bleed.has(d.date)).map((d) => d.date));
  return { bleedingDays: bleed.size, spottingDays: spot.size };
}

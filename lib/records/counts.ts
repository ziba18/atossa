// Shared counts for the For my doctor summary and the Timeline Patterns view. Both screens call
// these helpers, so the same range always gives the same numbers (parity test:
// scripts/ai-eval/summary-v2.test.mjs). Counts only: distinct days a thing was logged, "n of N
// days", per-week day counts and the raw strength values given. Never an average, a score, a
// percentage or a trend.
import type { SymptomData } from '../../types/records';
import { addDays, inclusiveDays, mondayOf } from './dates';
import { peakOf, realImpacts } from './format';

/** Never counted as an impact: a "no impact" answer, not something it got in the way of. */
export const NOT_IMPACTS = new Set(['Nothing today']);

export interface DayCount { label: string; days: number }
export interface WeekCount { week: string; days: number }

export const inRange = (date: string, from: string, to: string) => date >= from && date <= to;

/** Distinct dates in [from, to] with at least one note for which `has` is true. */
export function daysWith(
  notes: SymptomData[], from: string, to: string, has: (s: SymptomData) => boolean = () => true,
): number {
  return new Set(notes.filter((s) => inRange(s.date, from, to) && has(s)).map((s) => s.date)).size;
}

/** "n of N days": days with the thing, out of the days in the range. */
export function nOfN(
  notes: SymptomData[], from: string, to: string, has: (s: SymptomData) => boolean = () => true,
): { days: number; total: number } {
  return { days: daysWith(notes, from, to, has), total: inclusiveDays(from, to) };
}

/** Days with the thing per Monday-starting week, oldest first; weeks are clipped to [from, to]. */
export function weeklyDays(
  notes: SymptomData[], from: string, to: string, has: (s: SymptomData) => boolean = () => true,
): WeekCount[] {
  const weeks: WeekCount[] = [];
  for (let wk = mondayOf(from); wk <= to; wk = addDays(wk, 7)) {
    const a = wk < from ? from : wk;
    const end = addDays(wk, 6);
    weeks.push({ week: wk, days: daysWith(notes, a, end > to ? to : end, has) });
  }
  return weeks;
}

/** Distinct days per impact chip (first-seen order, then most days first). */
export function impactDays(notes: SymptomData[], keep: (item: string) => boolean = () => true): DayCount[] {
  const days = new Map<string, Set<string>>();
  for (const s of notes) {
    for (const item of realImpacts(s)) {
      if (NOT_IMPACTS.has(item) || !keep(item)) continue;
      if (!days.has(item)) days.set(item, new Set());
      days.get(item)!.add(s.date);
    }
  }
  return [...days.entries()].map(([label, set]) => ({ label, days: set.size })).sort((a, b) => b.days - a.days);
}

/** Body-zone rows shown in the summary and in Patterns (same cap in both, so the numbers match). */
export const MAX_ZONE_ROWS = 3;

/** Distinct days per body zone the patient picked, most days first. */
export function zoneDays(notes: SymptomData[]): DayCount[] {
  const days = new Map<string, Set<string>>();
  for (const s of notes) {
    for (const z of s.zones ?? []) {
      if (!days.has(z)) days.set(z, new Set());
      days.get(z)!.add(s.date);
    }
  }
  return [...days.entries()].map(([label, set]) => ({ label, days: set.size })).sort((a, b) => b.days - a.days || a.label.localeCompare(b.label)); // ties by name, so every screen lists them the same way
}

/** Lowest and highest number given in the notes (null when no number was given). Not an average. */
export function strengthRange(notes: SymptomData[]): { low: number; high: number } | null {
  const values = notes.map(peakOf).filter((n): n is number => n != null);
  return values.length ? { low: Math.min(...values), high: Math.max(...values) } : null;
}

/** Her own words that name an area she hasn't tagged (PM 2026-10-27: "tired" typed, Sleep and mood empty). */
export const WORD_CUES = {
  tired: ['tired', 'worn out', 'exhausted', 'no energy', 'drained'],
  dizzy: ['dizzy', 'lightheaded', 'light-headed', 'faint'],
} as const;
export type WordCue = keyof typeof WORD_CUES;

const NEGATED = /\b(?:not|no|never|wasn['’]?t|isn['’]?t|didn['’]?t|don['’]?t|without)\s+(?:\w+\s+){0,2}$/i;

/**
 * Notes whose words contain one of the cue's phrases, not negated ("not tired" doesn't count). A count of her words,
 * never a tag: nothing is written to the record, and the screen shows it only as "appears in n notes".
 */
export function wordMentions(notes: SymptomData[], cue: WordCue): { notes: number; total: number } {
  const worded = notes.filter((s) => s.source !== 'quick' && (s.words ?? '').trim());
  const hit = (text: string) => WORD_CUES[cue].some((p) => {
    const re = new RegExp(`\\b${p.replace(/[-]/g, '[- ]?')}\\b`, 'gi');
    for (let m = re.exec(text); m; m = re.exec(text)) if (!NEGATED.test(text.slice(0, m.index))) return true;
    return false;
  });
  return { notes: worded.filter((s) => hit(s.words)).length, total: worded.length };
}

/** Her own tiredness ratings, as days + lowest–highest (never an average): 'Tiredness rated on 8 days (3–7 out of 10)'. */
export function fatigueLine(notes: SymptomData[]): string {
  const rated = notes.filter((s) => s.fatigue != null);
  if (!rated.length) return '';
  const days = new Set(rated.map((s) => s.date)).size;
  const vals = rated.map((s) => s.fatigue as number);
  const lo = Math.min(...vals), hi = Math.max(...vals);
  return `Tiredness rated on ${days} ${days === 1 ? 'day' : 'days'} (${lo === hi ? lo : `${lo}–${hi}`} out of 10)`;
}

/** Empty-area copy when her words mention it: 'Not tagged yet — “tired” appears in 5 of 16 notes'. '' when no mention. */
export function untaggedLine(notes: SymptomData[], cue: WordCue): string {
  const { notes: n, total } = wordMentions(notes, cue);
  return n ? `Not tagged yet — “${cue}” appears in ${n} of ${total} ${total === 1 ? 'note' : 'notes'}` : '';
}

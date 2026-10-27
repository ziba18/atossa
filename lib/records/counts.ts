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
  return [...days.entries()].map(([label, set]) => ({ label, days: set.size })).sort((a, b) => b.days - a.days);
}

/** Lowest and highest number given in the notes (null when no number was given). Not an average. */
export function strengthRange(notes: SymptomData[]): { low: number; high: number } | null {
  const values = notes.map(peakOf).filter((n): n is number => n != null);
  return values.length ? { low: Math.min(...values), high: Math.max(...values) } : null;
}

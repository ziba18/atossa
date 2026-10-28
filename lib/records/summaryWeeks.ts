// Weekly peaks for the doctor PDF and the Patterns card: one pure function over the summary strip's days, so both
// show the same per-week strongest number for the same dates (PM 16:00 task 2, Design run48). Counts only: the
// highest number she gave that week and the day she gave it; null when she gave no number that week.
import { addDays } from './dates';
import type { HeatDay } from './summary';

export interface WeekPeak { from: string; to: string; noteDays: number; peak: number | null; peakDate: string | null }

/** Seven-day buckets from `from` (the last one ends at `to`), oldest first. Ties keep the earliest day. */
export function weeklyPeaks(days: HeatDay[], from: string, to: string): WeekPeak[] {
  const out: WeekPeak[] = [];
  for (let wFrom = from; wFrom <= to; wFrom = addDays(wFrom, 7)) {
    const end = addDays(wFrom, 6);
    const wTo = end < to ? end : to;
    const inWeek = days.filter((d) => d.date >= wFrom && d.date <= wTo);
    let peak: number | null = null;
    let peakDate: string | null = null;
    for (const d of inWeek) {
      if (d.value != null && (peak == null || d.value > peak)) { peak = d.value; peakDate = d.date; }
    }
    out.push({ from: wFrom, to: wTo, noteDays: inWeek.filter((d) => d.logged).length, peak, peakDate });
  }
  return out;
}

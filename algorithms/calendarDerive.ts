/**
 * Calendar derivation — turns the user's logged cycles + persisted prediction
 * into a per-day phase map covering an arbitrary date range (past + future).
 *
 * Output keys are 'yyyy-mm-dd'. Predicted days carry `predicted: true` so the
 * UI can render them dashed; logged period days carry `predicted: false`.
 */

import type { CycleLog, CyclePrediction } from '../types/database';
import { daysBetween, addDaysToStr } from './dateHelpers';

export type CalendarPhase = 'period' | 'follicular' | 'ovulation' | 'luteal';

export interface CalendarDay {
  date: string;
  phase: CalendarPhase;
  predicted: boolean;
  cycleDay: number;
}

interface Anchor {
  start: string;
  cycleLength: number;
  periodLength: number;
  predicted: boolean;
}

function phaseFor(cycleDay: number, cycleLength: number, periodLength: number): CalendarPhase {
  if (cycleDay <= periodLength) return 'period';
  const ov = Math.max(periodLength + 3, cycleLength - 14);
  if (Math.abs(cycleDay - ov) <= 1) return 'ovulation';
  if (cycleDay < ov) return 'follicular';
  return 'luteal';
}

export function deriveCalendar(
  cycleLogs: CycleLog[],
  prediction: CyclePrediction | null,
  rangeStart: string,
  rangeEnd: string,
): Map<string, CalendarDay> {
  const predictedCycleLen = prediction?.predicted_cycle_length ?? 28;
  const sorted = [...cycleLogs].sort((a, b) => a.period_start.localeCompare(b.period_start));

  // Build anchors: every logged period_start, then projected future ones
  // out to `rangeEnd + 1 cycle` so the last visible month is fully covered.
  const anchors: Anchor[] = sorted.map((l) => ({
    start: l.period_start,
    cycleLength: predictedCycleLen,
    periodLength: l.period_length ?? 5,
    predicted: false,
  }));

  // Project forward from the last logged start.
  let lastStart = sorted.length ? sorted[sorted.length - 1].period_start : rangeStart;
  let cursor = addDaysToStr(lastStart, predictedCycleLen);
  while (cursor <= addDaysToStr(rangeEnd, predictedCycleLen)) {
    anchors.push({
      start: cursor,
      cycleLength: predictedCycleLen,
      periodLength: prediction ? Math.max(2, daysBetween(prediction.next_period_start ?? cursor, prediction.next_period_end ?? cursor) + 1) : 5,
      predicted: true,
    });
    cursor = addDaysToStr(cursor, predictedCycleLen);
  }
  // If no anchors at all, seed at rangeStart.
  if (anchors.length === 0) {
    anchors.push({ start: rangeStart, cycleLength: 28, periodLength: 5, predicted: true });
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const out = new Map<string, CalendarDay>();
  const totalDays = daysBetween(rangeStart, rangeEnd) + 1;

  for (let i = 0; i < totalDays; i++) {
    const d = addDaysToStr(rangeStart, i);

    // Find latest anchor whose start ≤ d.
    let a: Anchor | null = null;
    for (const candidate of anchors) {
      if (candidate.start <= d) a = candidate;
      else break;
    }
    if (!a) continue;

    const cycleDay = daysBetween(a.start, d) + 1;
    if (cycleDay < 1) continue;

    const isFuture = d > todayStr;
    const predicted = a.predicted || isFuture;
    out.set(d, {
      date: d,
      phase: phaseFor(cycleDay, a.cycleLength, a.periodLength),
      predicted,
      cycleDay,
    });
  }

  return out;
}

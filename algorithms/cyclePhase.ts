import type { CycleLog } from '../types/database';
import { daysBetween, today as todayStr } from './dateHelpers';
import { computeCyclePrediction } from './cyclePrediction';

/**
 * Derives cycle day, phase, and ring geometry from raw logged events.
 * Nothing here is persisted — phase/day/predictions are always recomputed
 * from period_start dates + the rolling cycle-length prediction, so editing
 * a past log automatically ripples through everything that reads this.
 */

export type RingPhase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';

export interface PhaseRange { start: number; end: number }
export interface PhaseBoundaries {
  menstrual: PhaseRange;
  follicular: PhaseRange;
  ovulatory: PhaseRange;
  luteal: PhaseRange;
}

export interface CycleMath {
  hasData: boolean;
  cycleDay: number;
  cycleLength: number;
  periodLength: number;
  ovulationDay: number;
  fertileWindowStart: number;
  fertileWindowEnd: number;
  phaseBoundaries: PhaseBoundaries;
  phase: RingPhase;
  daysUntilNextPeriod: number;
  /** True when recent cycle lengths vary enough that a single date isn't trustworthy. */
  isIrregular: boolean;
  confidenceScore: number;
  accessibilityLabel: string;
}

export const PHASE_LABEL: Record<RingPhase, string> = {
  menstrual: 'Menstrual',
  follicular: 'Follicular',
  ovulatory: 'Ovulatory',
  luteal: 'Luteal',
};

export const MOON_PHASE_LABEL: Record<RingPhase, string> = {
  menstrual:  '🌑 New Moon',
  follicular: '🌒 Waxing Gibbous',
  ovulatory:  '🌕 Full Moon',
  luteal:     '🌖 Waning Gibbous',
};

function clampDay(day: number, cycleLength: number): number {
  return Math.max(1, Math.min(cycleLength, day));
}

function classify(day: number, b: PhaseBoundaries): RingPhase {
  if (day >= b.menstrual.start && day <= b.menstrual.end) return 'menstrual';
  if (day >= b.ovulatory.start && day <= b.ovulatory.end) return 'ovulatory';
  if (day >= b.follicular.start && day <= b.follicular.end) return 'follicular';
  return 'luteal';
}

export function computeCycleMath(input: {
  cycleLogs: CycleLog[]; // any order — sorted internally
  defaultCycleLength?: number;
  defaultPeriodLength?: number;
  userId: string;
}): CycleMath {
  const defaultCycleLength = input.defaultCycleLength ?? 28;
  const defaultPeriodLength = input.defaultPeriodLength ?? 5;
  const sorted = [...input.cycleLogs].sort((a, b) => a.period_start.localeCompare(b.period_start));
  const lastLog = sorted[sorted.length - 1];

  if (!lastLog) {
    return {
      hasData: false,
      cycleDay: 1,
      cycleLength: defaultCycleLength,
      periodLength: defaultPeriodLength,
      ovulationDay: Math.max(defaultPeriodLength + 1, defaultCycleLength - 14),
      fertileWindowStart: 1,
      fertileWindowEnd: 1,
      phaseBoundaries: emptyBoundaries(defaultCycleLength, defaultPeriodLength),
      phase: 'menstrual',
      daysUntilNextPeriod: defaultCycleLength,
      isIrregular: false,
      confidenceScore: 0,
      accessibilityLabel: 'No cycle data yet. Log your first period to start tracking.',
    };
  }

  const prediction = computeCyclePrediction({
    cycleLogs: sorted,
    defaultCycleLength,
    defaultPeriodLength,
    userId: input.userId,
  });

  const cycleLength = prediction.predictedCycleLength;
  const cycleDay = clampDay(daysBetween(lastLog.period_start, todayStr()) + 1, cycleLength);
  const periodLength = lastLog.period_end
    ? Math.max(1, daysBetween(lastLog.period_start, lastLog.period_end) + 1)
    : (lastLog.period_length ?? defaultPeriodLength);

  // Predicted dates are anchored off lastLog.period_start — convert back to day-of-cycle offsets.
  const ovulationDay = clampDay(daysBetween(lastLog.period_start, prediction.nextOvulation) + 1, cycleLength);
  const fertileWindowStart = clampDay(daysBetween(lastLog.period_start, prediction.fertileWindowStart) + 1, cycleLength);
  const fertileWindowEnd = clampDay(daysBetween(lastLog.period_start, prediction.fertileWindowEnd) + 1, cycleLength);

  const phaseBoundaries = buildBoundaries(cycleLength, periodLength, fertileWindowStart, fertileWindowEnd);
  const phase = classify(cycleDay, phaseBoundaries);
  const daysUntilNextPeriod = Math.max(0, daysBetween(todayStr(), prediction.nextPeriodStart));
  const isIrregular = prediction.confidenceScore < 65;

  const accessibilityLabel = buildAccessibilityLabel(cycleDay, cycleLength, phase, daysUntilNextPeriod, isIrregular);

  return {
    hasData: true,
    cycleDay,
    cycleLength,
    periodLength,
    ovulationDay,
    fertileWindowStart,
    fertileWindowEnd,
    phaseBoundaries,
    phase,
    daysUntilNextPeriod,
    isIrregular,
    confidenceScore: prediction.confidenceScore,
    accessibilityLabel,
  };
}

function buildBoundaries(cycleLength: number, periodLength: number, fertileStart: number, fertileEnd: number): PhaseBoundaries {
  const menstrualEnd = Math.min(periodLength, cycleLength);
  const follicularStart = Math.min(menstrualEnd + 1, fertileStart);
  const follicularEnd = Math.max(follicularStart - 1, fertileStart - 1);
  const lutealStart = Math.min(fertileEnd + 1, cycleLength);
  return {
    menstrual: { start: 1, end: menstrualEnd },
    follicular: { start: follicularStart, end: Math.max(follicularStart, follicularEnd) },
    ovulatory: { start: fertileStart, end: fertileEnd },
    luteal: { start: lutealStart, end: cycleLength },
  };
}

function emptyBoundaries(cycleLength: number, periodLength: number): PhaseBoundaries {
  const ov = Math.max(periodLength + 1, cycleLength - 14);
  return buildBoundaries(cycleLength, periodLength, Math.max(periodLength + 1, ov - 5), ov);
}

function buildAccessibilityLabel(
  cycleDay: number, cycleLength: number, phase: RingPhase, daysUntilNextPeriod: number, isIrregular: boolean,
): string {
  const phaseSentence = `${PHASE_LABEL[phase]} phase.`;
  const fertileNote = phase === 'ovulatory' ? ' In fertile window.' : '';
  const periodNote = daysUntilNextPeriod === 0
    ? ' Period expected today.'
    : ` ${isIrregular ? 'Estimated' : ''} ${daysUntilNextPeriod} day${daysUntilNextPeriod === 1 ? '' : 's'} until next predicted period.`.replace(/\s+/g, ' ');
  return `Day ${cycleDay} of ${cycleLength}. ${phaseSentence}${fertileNote}${periodNote}`.trim();
}

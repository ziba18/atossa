import type { CycleLog, CyclePrediction } from '../types/database';
import {
  daysBetween,
  addDaysToStr,
  standardDeviation,
  weightedAverage,
} from './dateHelpers';

export interface PredictionInput {
  cycleLogs: CycleLog[];        // sorted ASC by period_start
  defaultCycleLength: number;   // from profile
  defaultPeriodLength: number;  // from profile
  userId: string;
}

export interface PredictionResult {
  nextPeriodStart: string;
  nextPeriodEnd: string;
  nextOvulation: string;
  fertileWindowStart: string;
  fertileWindowEnd: string;
  predictedCycleLength: number;
  confidenceScore: number;
  methodUsed: 'average' | 'moving_average_6' | 'naive';
}

export function computeCyclePrediction(input: PredictionInput): PredictionResult {
  const { cycleLogs, defaultCycleLength, defaultPeriodLength } = input;

  // Compute historical cycle lengths from consecutive log pairs
  const rawLengths: number[] = [];
  for (let i = 1; i < cycleLogs.length; i++) {
    const len = daysBetween(cycleLogs[i - 1].period_start, cycleLogs[i].period_start);
    if (len >= 15 && len <= 60) {
      rawLengths.push(len);
    }
  }

  const lastLog = cycleLogs[cycleLogs.length - 1];
  const lastPeriodStart = lastLog?.period_start;

  let predictedLength: number;
  let confidence: number;
  let method: 'average' | 'moving_average_6' | 'naive';

  if (rawLengths.length === 0 || !lastPeriodStart) {
    // No data — use defaults
    predictedLength = defaultCycleLength;
    confidence = 30;
    method = 'naive';
  } else if (rawLengths.length < 6) {
    const sd = standardDeviation(rawLengths);
    const avg = rawLengths.reduce((s, v) => s + v, 0) / rawLengths.length;
    predictedLength = Math.round(avg);
    confidence = sd < 3 ? 75 : 55;
    method = 'average';
  } else {
    // Weighted moving average of last 6 cycles
    const last6 = rawLengths.slice(-6);
    const weights = [1, 1, 1, 2, 2, 3];
    const wavg = weightedAverage(last6, weights);
    const sd = standardDeviation(last6);
    predictedLength = Math.round(wavg);
    confidence = sd < 5 ? 80 : 60;
    method = 'moving_average_6';
  }

  // Estimate period length for this cycle
  const recentPeriodLengths = cycleLogs
    .filter((l) => l.period_length !== null && l.period_length! >= 2 && l.period_length! <= 10)
    .map((l) => l.period_length!);
  const estimatedPeriodLength =
    recentPeriodLengths.length > 0
      ? Math.round(recentPeriodLengths.reduce((s, v) => s + v, 0) / recentPeriodLengths.length)
      : defaultPeriodLength;

  const nextPeriodStart = addDaysToStr(lastPeriodStart, predictedLength);
  const nextPeriodEnd = addDaysToStr(nextPeriodStart, estimatedPeriodLength);
  const nextOvulation = addDaysToStr(nextPeriodStart, -14);
  const fertileWindowStart = addDaysToStr(nextOvulation, -5);
  const fertileWindowEnd = addDaysToStr(nextOvulation, 1);

  return {
    nextPeriodStart,
    nextPeriodEnd,
    nextOvulation,
    fertileWindowStart,
    fertileWindowEnd,
    predictedCycleLength: predictedLength,
    confidenceScore: confidence,
    methodUsed: method,
  };
}

/**
 * AI forecaster wrapper.
 *
 * Runs the bundled TFLite cycle-length forecaster and converts its raw
 * output into the same `PredictionResult` shape produced by the EWMA
 * fallback in `cyclePrediction.ts` — so downstream consumers (DB rows,
 * cycle ring, calendar, notifications) don't need to know which path
 * was used.
 *
 * Returns null when the model isn't loaded or when input data is too
 * sparse for the model to be useful (we want statistical confidence,
 * not hallucinated dates from a single cycle).
 */

import type { CycleLog } from '../types/database';
import { addDaysToStr } from './dateHelpers';
import { buildForecastFeatures } from './aiFeatures';
import { getForecaster } from './aiModel';
import type { PredictionResult } from './cyclePrediction';

// Minimum cycles required before we trust the AI over the EWMA prior.
// Below this threshold we let the Bayesian-shrinkage path do its job.
const MIN_CYCLES_FOR_AI = 3;

const DEFAULT_LUTEAL = 14;
const FERTILE_PRE = 5;
const FERTILE_POST = 1;
const FERTILE_MAX_EXTRA = 4;

export async function computeAIPrediction(
  cycleLogs: CycleLog[],
  defaultPeriodLength: number,
): Promise<PredictionResult | null> {
  const model = getForecaster();
  if (!model) return null;

  // Need a "last cycle" anchor to project from.
  const sorted = [...cycleLogs].sort((a, b) =>
    a.period_start.localeCompare(b.period_start),
  );
  const last = sorted[sorted.length - 1];
  if (!last) return null;

  // Count observed cycles (consecutive-pair diffs). Fewer than the
  // threshold → return null, let EWMA path handle it.
  let observedCycles = 0;
  for (let i = 1; i < sorted.length; i++) {
    const len = (new Date(sorted[i].period_start).getTime() -
      new Date(sorted[i - 1].period_start).getTime()) / 86400000;
    if (len >= 18 && len <= 90) observedCycles++;
  }
  if (observedCycles < MIN_CYCLES_FOR_AI) return null;

  let predictedLength: number;
  let logVariance: number;

  try {
    const input = buildForecastFeatures(sorted);
    // fast-tflite expects an array of input ArrayBuffers.
    const raw = await model.run([input.buffer as ArrayBuffer]);
    const out = new Float32Array(raw[0] as unknown as ArrayBuffer);
    // Model outputs: [normalized_length_delta, log_variance]
    // length_delta is the delta from the same normalization used in features.
    predictedLength = Math.round(out[0] * 10 + 28);
    logVariance = out[1];
  } catch {
    return null;
  }

  // Sanity clamp — even a misbehaving model shouldn't push us outside
  // physiologically plausible bounds.
  predictedLength = Math.max(18, Math.min(90, predictedLength));

  // Variance → SD → fertile-window widening, same logic as EWMA path.
  const sd = Math.sqrt(Math.exp(logVariance));
  const extra = Math.min(FERTILE_MAX_EXTRA, Math.ceil(sd));

  // Estimate period length (recent log average, falling back to profile).
  const periodLens = sorted
    .map((l) => l.period_length)
    .filter((p): p is number => p !== null && p !== undefined && p >= 2 && p <= 10)
    .slice(-6);
  const periodLength = periodLens.length
    ? Math.round(periodLens.reduce((s, v) => s + v, 0) / periodLens.length)
    : defaultPeriodLength;

  // Personal luteal — same shrink/stretch rules as EWMA path.
  let luteal = DEFAULT_LUTEAL;
  if (predictedLength < 24) luteal = 10;
  else if (predictedLength > 35) luteal = 15;

  const nextPeriodStart = addDaysToStr(last.period_start, predictedLength);
  const nextPeriodEnd = addDaysToStr(nextPeriodStart, Math.max(0, periodLength - 1));
  const nextOvulation = addDaysToStr(nextPeriodStart, -luteal);
  const fertileWindowStart = addDaysToStr(nextOvulation, -(FERTILE_PRE + extra));
  const fertileWindowEnd = addDaysToStr(nextOvulation, FERTILE_POST + extra);

  // Confidence from variance: tighter forecasts → higher confidence.
  // sd=1 → ~92, sd=3 → ~82, sd=7 → ~62.
  const confidence = Math.max(50, Math.min(95, Math.round(95 - sd * 5)));

  return {
    nextPeriodStart,
    nextPeriodEnd,
    nextOvulation,
    fertileWindowStart,
    fertileWindowEnd,
    predictedCycleLength: predictedLength,
    confidenceScore: confidence,
    methodUsed: 'kalman', // schema-compatible label for the AI path
  };
}

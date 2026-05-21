import type { CycleLog } from '../types/database';
import { daysBetween, addDaysToStr } from './dateHelpers';

/**
 * Cycle prediction
 * ----------------
 * Hybrid forecaster designed to handle both regular and irregular cycles
 * (incl. PCOS-style oligo-ovulation). Grounded in published findings:
 *
 *  • Luteal phase is more stable than the follicular phase within a person,
 *    but is NOT fixed at 14 days across the population (Hum. Reprod., 2024).
 *  • Only ~14% of women with 28-day cycles ovulate on cycle day 14; the
 *    modal ovulation day is closer to 16 (real-world wearable studies).
 *  • Calendar-only predictions miss the fertile window for irregular
 *    cyclers, so the fertile window must widen as variability grows.
 *  • Bayesian / state-space models outperform naive averaging — we use a
 *    lightweight equivalent: EWMA + prior-blending shrinkage toward the
 *    profile baseline when data is sparse, with a robust median fallback
 *    when variability is high.
 *
 * The output schema is intentionally identical to the previous version so
 * the persisted `cycle_predictions` row and all consumers keep working.
 */

export interface PredictionInput {
  cycleLogs: CycleLog[];        // sorted ASC by period_start (oldest → newest)
  defaultCycleLength: number;   // from profile (prior)
  defaultPeriodLength: number;  // from profile (prior)
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
  methodUsed: 'average' | 'moving_average_6' | 'kalman' | 'naive';
}

// ── Constants ───────────────────────────────────────────────────────────────
// Physiologically plausible bounds. Cycles outside [18, 90] days are almost
// certainly a missed log or a non-cycle bleed and are excluded from stats.
const MIN_CYCLE = 18;
const MAX_CYCLE = 90;

// Cycles longer than this are kept as observations but treated as outliers
// for the mean (likely a skipped/anovulatory cycle in PCOS).
const SKIP_CYCLE_THRESHOLD = 45;

// EWMA smoothing factor — higher = more weight on recent cycles.
// 0.45 balances responsiveness with noise rejection for ~6-cycle windows.
const EWMA_ALPHA = 0.45;

// Prior strength for Bayesian shrinkage toward the profile default.
// Equivalent to "the profile baseline is worth N observations".
const PRIOR_STRENGTH = 3;

// Default luteal phase length when we can't derive a personal value.
// Population mode is ~14; we use 14 as a neutral midpoint.
const DEFAULT_LUTEAL = 14;
const MIN_LUTEAL = 10;
const MAX_LUTEAL = 16;

// Fertile window widens as variability grows (Flo, Clue both do this).
// Base window is ovulation−5 to ovulation+1 (the canonical 6-day fertile
// window from Wilcox et al. 1995). We extend it by the cycle SD.
const FERTILE_PRE = 5;
const FERTILE_POST = 1;
const FERTILE_MAX_EXTRA = 4; // cap extension at ±4 days

// ── Stat helpers (local — keep this file self-contained) ────────────────────
function mean(xs: number[]): number {
  return xs.reduce((s, v) => s + v, 0) / xs.length;
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function sampleStdDev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  const v = xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(v);
}

/** Exponentially weighted moving average (most-recent value last). */
function ewma(xs: number[], alpha: number): number {
  let acc = xs[0];
  for (let i = 1; i < xs.length; i++) acc = alpha * xs[i] + (1 - alpha) * acc;
  return acc;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// ── Regularity classification ───────────────────────────────────────────────
type Regularity = 'regular' | 'variable' | 'irregular' | 'unknown';

function classifyRegularity(lengths: number[]): Regularity {
  if (lengths.length < 3) return 'unknown';
  const sd = sampleStdDev(lengths);
  // SD thresholds from the Apple Women's Health Study / Natural Cycles work:
  //  ≤ 3 days  → regular
  //  3–7 days  → variable
  //  > 7 days  → irregular (PCOS-like)
  if (sd <= 3) return 'regular';
  if (sd <= 7) return 'variable';
  return 'irregular';
}

// ── Main predictor ──────────────────────────────────────────────────────────
export function computeCyclePrediction(input: PredictionInput): PredictionResult {
  const { cycleLogs, defaultCycleLength, defaultPeriodLength } = input;

  // 1. Reconstruct cycle lengths from consecutive period_start pairs.
  const allLengths: number[] = [];
  for (let i = 1; i < cycleLogs.length; i++) {
    const len = daysBetween(cycleLogs[i - 1].period_start, cycleLogs[i].period_start);
    if (len >= MIN_CYCLE && len <= MAX_CYCLE) allLengths.push(len);
  }

  const lastLog = cycleLogs[cycleLogs.length - 1];
  const lastPeriodStart = lastLog?.period_start;

  // 2. No data → fall back to profile prior. Confidence is intentionally low.
  if (!lastPeriodStart) {
    const today = new Date().toISOString().slice(0, 10);
    return buildDates(today, defaultCycleLength, defaultPeriodLength, DEFAULT_LUTEAL, 0, {
      confidenceScore: 25,
      methodUsed: 'naive',
    });
  }

  // 3. Pick the predictor based on data quantity + regularity.
  const regularity = classifyRegularity(allLengths);
  let predictedLength: number;
  let confidence: number;
  let method: PredictionResult['methodUsed'];
  let sd = 0;

  if (allLengths.length === 0) {
    // Only one period logged — we can't estimate cycle length yet.
    predictedLength = defaultCycleLength;
    confidence = 35;
    method = 'naive';
  } else if (allLengths.length < 3) {
    // 1–2 observed cycles: blend with profile prior (Bayesian shrinkage)
    // so a single weird cycle doesn't dominate the prediction.
    const obs = mean(allLengths);
    const n = allLengths.length;
    predictedLength = Math.round(
      (n * obs + PRIOR_STRENGTH * defaultCycleLength) / (n + PRIOR_STRENGTH),
    );
    sd = sampleStdDev(allLengths);
    confidence = 50 + n * 5; // 55 / 60
    method = 'average';
  } else {
    // 3+ cycles: split by regularity.
    // - regular/variable: EWMA on last 6 cycles (recency-weighted, more
    //   responsive than the previous fixed weights).
    // - irregular: median of last 6 (robust against skip cycles).
    const window = allLengths.slice(-6);
    const inlierWindow = window.filter((l) => l < SKIP_CYCLE_THRESHOLD);

    if (regularity === 'irregular') {
      // For PCOS-style cycles the median is far more stable than the mean.
      // Use the unfiltered window so skip cycles still influence the median.
      predictedLength = Math.round(median(window));
      sd = sampleStdDev(window);
      confidence = 55;
      method = 'moving_average_6';
    } else {
      // Drop obvious skip cycles from the EWMA so a single 60-day cycle
      // doesn't pull the next prediction up by ~5 days.
      const series = inlierWindow.length >= 3 ? inlierWindow : window;
      predictedLength = Math.round(ewma(series, EWMA_ALPHA));
      sd = sampleStdDev(series);
      confidence = regularity === 'regular' ? 88 : 72;
      method = 'kalman'; // labelled "kalman" in the schema for the EWMA path
    }
  }

  predictedLength = clamp(predictedLength, MIN_CYCLE, MAX_CYCLE);

  // 4. Period length: EWMA over recorded period_length values, fall back
  //    to profile default. Same recency bias as cycle length.
  const periodLengths = cycleLogs
    .map((l) => l.period_length)
    .filter((p): p is number => p !== null && p !== undefined && p >= 2 && p <= 10);
  const estimatedPeriodLength =
    periodLengths.length === 0
      ? defaultPeriodLength
      : clamp(Math.round(ewma(periodLengths.slice(-6), EWMA_ALPHA)), 2, 10);

  // 5. Personal luteal length. Without ovulation tracking we can't measure
  //    luteal phase directly; population data shows it's typically 11–16d
  //    and is the more stable phase. We anchor at 14 and let very long
  //    cycles keep the luteal fixed (the follicular phase is what stretches).
  //    If the user's cycle is very short (<24d) we shrink the luteal a
  //    little so ovulation doesn't fall during the period.
  let luteal = DEFAULT_LUTEAL;
  if (predictedLength < 24) luteal = MIN_LUTEAL;
  else if (predictedLength > 35) luteal = Math.min(MAX_LUTEAL, DEFAULT_LUTEAL + 1);

  return buildDates(lastPeriodStart, predictedLength, estimatedPeriodLength, luteal, sd, {
    confidenceScore: confidence,
    methodUsed: method,
  });
}

// ── Date assembly ───────────────────────────────────────────────────────────
function buildDates(
  anchor: string,
  cycleLength: number,
  periodLength: number,
  luteal: number,
  sd: number,
  meta: { confidenceScore: number; methodUsed: PredictionResult['methodUsed'] },
): PredictionResult {
  const nextPeriodStart = addDaysToStr(anchor, cycleLength);
  // period_end is inclusive of the last bleeding day → length − 1 days after start
  const nextPeriodEnd = addDaysToStr(nextPeriodStart, Math.max(0, periodLength - 1));
  const nextOvulation = addDaysToStr(nextPeriodStart, -luteal);

  // Fertile window widens with variability (Flo/Clue both do this).
  // Round SD up so a 4.6-day SD adds 5 → capped at FERTILE_MAX_EXTRA.
  const extra = Math.min(FERTILE_MAX_EXTRA, Math.ceil(sd));
  const fertileWindowStart = addDaysToStr(nextOvulation, -(FERTILE_PRE + extra));
  const fertileWindowEnd = addDaysToStr(nextOvulation, FERTILE_POST + extra);

  return {
    nextPeriodStart,
    nextPeriodEnd,
    nextOvulation,
    fertileWindowStart,
    fertileWindowEnd,
    predictedCycleLength: cycleLength,
    confidenceScore: meta.confidenceScore,
    methodUsed: meta.methodUsed,
  };
}

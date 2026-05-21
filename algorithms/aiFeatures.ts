/**
 * AI feature extraction
 * ---------------------
 * Turns user data (cycle_logs, symptom_logs) into the fixed-shape Float32
 * tensors that the on-device TFLite models consume.
 *
 * IMPORTANT: the Python training pipeline (Phase B) MUST produce features
 * using the exact same constants, ordering, and normalization functions
 * defined here. If you change anything below, retrain the model.
 */

import type { CycleLog, SymptomLog, FlowIntensity } from '../types/database';
import { daysBetween, addDaysToStr, today } from './dateHelpers';

// ── Forecaster contract ─────────────────────────────────────────────────────
// Input tensor: [1, FORECAST_SEQ_LEN, FORECAST_FEATURES] float32
// Output tensor: [1, 2] float32 → [predicted_length, log_variance]
export const FORECAST_SEQ_LEN = 12;
export const FORECAST_FEATURES = 6;

// ── Backfill contract ───────────────────────────────────────────────────────
// Input tensor: [1, BACKFILL_SEQ_LEN, BACKFILL_FEATURES] float32
// Output tensor: [1, BACKFILL_SEQ_LEN, 4] float32 → per-day phase softmax
//   indices: 0=menstrual, 1=follicular, 2=ovulatory, 3=luteal
export const BACKFILL_SEQ_LEN = 90;
export const BACKFILL_FEATURES = 7;
export const BACKFILL_PHASES = ['menstrual', 'follicular', 'ovulatory', 'luteal'] as const;
export type BackfillPhase = typeof BACKFILL_PHASES[number];

// ── Forecaster ──────────────────────────────────────────────────────────────
const FLOW_TO_NUM: Record<FlowIntensity, number> = {
  spotting:   0.1,
  light:      0.3,
  medium:     0.6,
  heavy:      0.85,
  very_heavy: 1.0,
};

/**
 * Build the forecaster input from a sorted-ASC list of cycle logs.
 * Always returns a buffer of length [SEQ_LEN * FEATURES], left-padded
 * with zeros + is_valid=0 when the user has fewer than SEQ_LEN cycles.
 */
export function buildForecastFeatures(cycleLogs: CycleLog[]): Float32Array {
  const sorted = [...cycleLogs].sort((a, b) =>
    a.period_start.localeCompare(b.period_start),
  );

  // Compute cycle lengths from consecutive pairs (same outlier filter as
  // the EWMA fallback uses).
  type CycleRow = { length: number; periodLength: number; flow: number };
  const rows: CycleRow[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const len = daysBetween(sorted[i - 1].period_start, sorted[i].period_start);
    if (len < 18 || len > 90) continue;
    const prev = sorted[i - 1];
    rows.push({
      length: len,
      periodLength: prev.period_length ?? 5,
      flow: prev.flow_intensity ? FLOW_TO_NUM[prev.flow_intensity] : 0.5,
    });
  }

  // Take the most recent SEQ_LEN cycles, left-pad the rest with zeros.
  const window = rows.slice(-FORECAST_SEQ_LEN);
  const padCount = FORECAST_SEQ_LEN - window.length;

  // Running SD for the regularity feature (computed online so the model
  // sees the same signal it would at inference time).
  function runningSd(idx: number): number {
    const slice = window.slice(0, idx + 1).map((r) => r.length);
    if (slice.length < 2) return 0;
    const m = slice.reduce((s, v) => s + v, 0) / slice.length;
    const v = slice.reduce((s, x) => s + (x - m) ** 2, 0) / (slice.length - 1);
    return Math.sqrt(v);
  }

  const out = new Float32Array(FORECAST_SEQ_LEN * FORECAST_FEATURES);
  for (let i = 0; i < FORECAST_SEQ_LEN; i++) {
    const base = i * FORECAST_FEATURES;
    if (i < padCount) continue; // padded slot → all zeros, is_valid=0
    const r = window[i - padCount];
    const sd = runningSd(i - padCount);
    out[base + 0] = (r.length - 28) / 10;        // length_norm
    out[base + 1] = (r.periodLength - 5) / 3;    // period_norm
    out[base + 2] = r.flow;                       // flow_avg
    out[base + 3] = Math.min(sd, 14) / 14;       // regularity (clamped, normalized)
    out[base + 4] = i / FORECAST_SEQ_LEN;        // pos_recency
    out[base + 5] = 1;                            // is_valid
  }
  return out;
}

// ── Backfill ────────────────────────────────────────────────────────────────
const CRAMP_TYPES = new Set(['cramps', 'pelvic_pain', 'back_pain']);
const LOW_MOOD_TYPES = new Set(['low_mood', 'sadness', 'irritability', 'anxiety']);

/**
 * Build the per-day backfill input for the last BACKFILL_SEQ_LEN days,
 * ending today. Day 0 in the output sequence = oldest, day SEQ_LEN-1 = today.
 */
export function buildBackfillFeatures(
  cycleLogs: CycleLog[],
  symptomLogs: SymptomLog[],
): { features: Float32Array; dateForIndex: (i: number) => string } {
  const todayStr = today();
  const startDate = addDaysToStr(todayStr, -(BACKFILL_SEQ_LEN - 1));

  // Pre-index period days for O(1) lookup.
  type PeriodDay = { flow: number };
  const periodByDate = new Map<string, PeriodDay>();
  for (const log of cycleLogs) {
    const startStr = log.period_start;
    const endStr =
      log.period_end ?? addDaysToStr(startStr, (log.period_length ?? 5) - 1);
    let cur = startStr;
    while (cur <= endStr) {
      periodByDate.set(cur, {
        flow: log.flow_intensity ? FLOW_TO_NUM[log.flow_intensity] : 0.5,
      });
      cur = addDaysToStr(cur, 1);
    }
  }

  // Pre-index symptoms by date.
  type DaySymptoms = { cramp: number; mood: number };
  const symByDate = new Map<string, DaySymptoms>();
  for (const s of symptomLogs) {
    const cur = symByDate.get(s.logged_date) ?? { cramp: 0, mood: 0 };
    const sev = (s.severity ?? 3) / 10; // severity is 0–10 in DB
    if (CRAMP_TYPES.has(s.symptom_type)) cur.cramp = Math.max(cur.cramp, sev);
    if (LOW_MOOD_TYPES.has(s.symptom_type)) cur.mood = Math.max(cur.mood, sev);
    symByDate.set(s.logged_date, cur);
  }

  // Most recent period_start anchor for "days_since_last_period".
  const sortedStarts = cycleLogs
    .map((l) => l.period_start)
    .sort();

  function daysSinceLastPeriod(dateStr: string): number {
    let last: string | null = null;
    for (const s of sortedStarts) {
      if (s <= dateStr) last = s;
      else break;
    }
    if (!last) return 60;
    return Math.min(60, daysBetween(last, dateStr));
  }

  const out = new Float32Array(BACKFILL_SEQ_LEN * BACKFILL_FEATURES);
  const dates: string[] = [];

  for (let i = 0; i < BACKFILL_SEQ_LEN; i++) {
    const dateStr = addDaysToStr(startDate, i);
    dates.push(dateStr);

    const date = new Date(dateStr + 'T00:00:00');
    const dayOfYear = Math.floor(
      (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000,
    );
    const angle = (2 * Math.PI * dayOfYear) / 365.25;

    const periodDay = periodByDate.get(dateStr);
    const symptoms = symByDate.get(dateStr) ?? { cramp: 0, mood: 0 };

    const base = i * BACKFILL_FEATURES;
    out[base + 0] = Math.sin(angle);
    out[base + 1] = Math.cos(angle);
    out[base + 2] = periodDay ? 1 : 0;
    out[base + 3] = periodDay?.flow ?? 0;
    out[base + 4] = symptoms.cramp;
    out[base + 5] = symptoms.mood;
    out[base + 6] = daysSinceLastPeriod(dateStr) / 60;
  }

  return {
    features: out,
    dateForIndex: (i: number) => dates[i],
  };
}

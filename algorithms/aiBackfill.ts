/**
 * AI backfill — imputes likely past periods that the user didn't log.
 *
 * Runs the per-day phase classifier over the last 90 days. A "missed
 * period" suggestion is emitted when the model predicts a multi-day run
 * of menstrual-phase days that doesn't overlap any actual logged period.
 *
 * Returns [] when the model isn't loaded, when data is too sparse to
 * be useful, or when no high-confidence missed periods are found.
 */

import type { CycleLog, SymptomLog } from '../types/database';
import {
  buildBackfillFeatures,
  BACKFILL_SEQ_LEN,
  BACKFILL_PHASES,
  type BackfillPhase,
} from './aiFeatures';
import { getBackfill } from './aiModel';
import { daysBetween, addDaysToStr, today } from './dateHelpers';

export interface MissedPeriodSuggestion {
  /** First day of the suspected missed period (yyyy-mm-dd). */
  date: string;
  /** Estimated length in days (run of consecutive menstrual-phase days). */
  estimatedLength: number;
  /** Mean per-day softmax probability for the "menstrual" class across the run. */
  confidence: number;
}

// Don't surface suggestions unless the model is meaningfully confident —
// avoids "we think you missed a period 4 weeks ago" prompts with no real
// signal. Tunable once we see real model behavior.
const MIN_CONFIDENCE = 0.65;
const MIN_RUN_LENGTH = 2;

// Skip suggestions if the user has logged a period overlapping this window —
// no point asking about a period they did record.
function overlapsLoggedPeriod(
  dateStr: string,
  length: number,
  cycleLogs: CycleLog[],
): boolean {
  const start = dateStr;
  const end = addDaysToStr(dateStr, length - 1);
  for (const log of cycleLogs) {
    const logEnd = log.period_end ?? addDaysToStr(log.period_start, (log.period_length ?? 5) - 1);
    if (log.period_start <= end && logEnd >= start) return true;
  }
  return false;
}

export async function computeBackfillSuggestions(
  cycleLogs: CycleLog[],
  symptomLogs: SymptomLog[],
): Promise<MissedPeriodSuggestion[]> {
  const model = getBackfill();
  if (!model) return [];

  // Need at least one prior period for the model to anchor its
  // "days_since_last_period" feature meaningfully.
  if (cycleLogs.length === 0) return [];

  let perDayPhase: BackfillPhase[];
  let perDayConfidence: number[];

  try {
    const { features, dateForIndex } = buildBackfillFeatures(cycleLogs, symptomLogs);
    const raw = await model.run([features.buffer as ArrayBuffer]);
    const out = new Float32Array(raw[0] as unknown as ArrayBuffer);

    // Output shape [SEQ_LEN, 4] — argmax per day.
    perDayPhase = new Array(BACKFILL_SEQ_LEN);
    perDayConfidence = new Array(BACKFILL_SEQ_LEN);
    for (let i = 0; i < BACKFILL_SEQ_LEN; i++) {
      let bestIdx = 0;
      let bestProb = -Infinity;
      for (let c = 0; c < 4; c++) {
        const p = out[i * 4 + c];
        if (p > bestProb) {
          bestProb = p;
          bestIdx = c;
        }
      }
      perDayPhase[i] = BACKFILL_PHASES[bestIdx];
      // Probability of "menstrual" class specifically (idx 0) — that's
      // what matters for missed-period detection regardless of argmax.
      perDayConfidence[i] = out[i * 4 + 0];
    }
    // Use dateForIndex implicitly via the same indexing below.
    void dateForIndex;
  } catch {
    return [];
  }

  // Find runs of menstrual-phase days, score each by mean per-day
  // menstrual probability, skip runs that overlap logged periods.
  const todayStr = today();
  const startDate = addDaysToStr(todayStr, -(BACKFILL_SEQ_LEN - 1));
  const suggestions: MissedPeriodSuggestion[] = [];

  let runStart = -1;
  let runProbSum = 0;

  function flushRun(endIdx: number) {
    if (runStart < 0) return;
    const length = endIdx - runStart;
    if (length >= MIN_RUN_LENGTH) {
      const mean = runProbSum / length;
      if (mean >= MIN_CONFIDENCE) {
        const date = addDaysToStr(startDate, runStart);
        if (!overlapsLoggedPeriod(date, length, cycleLogs)) {
          suggestions.push({ date, estimatedLength: length, confidence: mean });
        }
      }
    }
    runStart = -1;
    runProbSum = 0;
  }

  for (let i = 0; i < BACKFILL_SEQ_LEN; i++) {
    if (perDayPhase[i] === 'menstrual') {
      if (runStart < 0) runStart = i;
      runProbSum += perDayConfidence[i];
    } else {
      flushRun(i);
    }
  }
  flushRun(BACKFILL_SEQ_LEN);

  // Don't double-suggest a period the user is clearly about to log
  // (within 3 days of today) — that's the forecaster's job.
  return suggestions.filter(
    (s) => daysBetween(s.date, todayStr) >= 3,
  );
}

/**
 * Public prediction API. Tries the AI forecaster first; falls back to the
 * EWMA forecaster in cyclePrediction.ts whenever AI is unavailable or
 * input data is too sparse. Either way returns the same PredictionResult
 * shape so persistence and UI consumers don't change.
 */

import type { CycleLog, SymptomLog } from '../types/database';
import {
  computeCyclePrediction,
  type PredictionResult,
  type PredictionInput,
} from './cyclePrediction';
import { computeAIPrediction } from './aiCyclePrediction';
import {
  computeBackfillSuggestions,
  type MissedPeriodSuggestion,
} from './aiBackfill';

export type { PredictionResult, MissedPeriodSuggestion };

export async function predictCycle(input: PredictionInput): Promise<PredictionResult> {
  const ai = await computeAIPrediction(input.cycleLogs, input.defaultPeriodLength);
  if (ai) return ai;
  return computeCyclePrediction(input);
}

export async function predictMissedPeriods(
  cycleLogs: CycleLog[],
  symptomLogs: SymptomLog[],
): Promise<MissedPeriodSuggestion[]> {
  return computeBackfillSuggestions(cycleLogs, symptomLogs);
}

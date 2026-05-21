/**
 * Lazy loader for the bundled TFLite models. Designed to fail gracefully
 * so the app keeps working with the EWMA fallback while real models are
 * being trained — the stubs in assets/models/ are intentionally invalid
 * placeholders that fail at parse time.
 *
 * Call `initAIModels()` once at app start. After that, the AI predictors
 * can call `getForecaster()` / `getBackfill()` and branch on null.
 */

import { loadTensorflowModel, type TensorflowModel } from 'react-native-fast-tflite';

let forecaster: TensorflowModel | null = null;
let backfill: TensorflowModel | null = null;
let initialized = false;

export async function initAIModels(): Promise<void> {
  if (initialized) return;
  initialized = true;

  // Load both in parallel. Either failing is non-fatal — the prediction
  // pipeline falls back to the EWMA forecaster from cyclePrediction.ts.
  await Promise.all([
    (async () => {
      try {
        forecaster = await loadTensorflowModel(
          require('../assets/models/forecaster.tflite'),
          [],
        );
      } catch (e) {
        // Stub model or missing — EWMA fallback handles it.
        forecaster = null;
      }
    })(),
    (async () => {
      try {
        backfill = await loadTensorflowModel(
          require('../assets/models/backfill.tflite'),
          [],
        );
      } catch (e) {
        backfill = null;
      }
    })(),
  ]);
}

export function getForecaster(): TensorflowModel | null {
  return forecaster;
}

export function getBackfill(): TensorflowModel | null {
  return backfill;
}

export function isAIReady(): { forecaster: boolean; backfill: boolean } {
  return { forecaster: forecaster !== null, backfill: backfill !== null };
}

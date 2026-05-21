/**
 * Lazy loader for the bundled TFLite models. Designed to fail gracefully
 * so the app keeps working with the EWMA fallback while real models are
 * being trained — the stubs in assets/models/ are intentionally invalid
 * placeholders that fail at parse time.
 *
 * Call `initAIModels()` once at app start. After that, the AI predictors
 * can call `getForecaster()` / `getBackfill()` and branch on null.
 */

// Lazy-require fast-tflite so the app doesn't crash on dev clients that
// haven't been rebuilt with the native module linked. Falls through to
// the EWMA forecaster when the import or model load fails.
let _loadTensorflowModel: ((source: any, delegates: any[]) => Promise<any>) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  _loadTensorflowModel = require('react-native-fast-tflite').loadTensorflowModel;
} catch {
  _loadTensorflowModel = null;
}

type TensorflowModel = { run: (input: any[]) => Promise<any[]> } | null;

let forecaster: TensorflowModel = null;
let backfill: TensorflowModel = null;
let initialized = false;

export async function initAIModels(): Promise<void> {
  if (initialized) return;
  initialized = true;

  // If the native module didn't load (dev client without fast-tflite), skip.
  if (!_loadTensorflowModel) return;
  const loadTensorflowModel = _loadTensorflowModel;

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

export function getForecaster(): TensorflowModel {
  return forecaster;
}

export function getBackfill(): TensorflowModel {
  return backfill;
}

export function isAIReady(): { forecaster: boolean; backfill: boolean } {
  return { forecaster: forecaster !== null, backfill: backfill !== null };
}

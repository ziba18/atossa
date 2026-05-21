# On-device AI models

Two TFLite models power the app's cycle AI:

| File | Purpose | Input | Output |
|---|---|---|---|
| `forecaster.tflite` | Predict the next cycle length and variance | `float32[1, 12, 6]` — last 12 cycles × 6 features | `float32[1, 2]` — `[predicted_length, log_variance]` |
| `backfill.tflite` | Per-day phase classifier for imputing missed periods | `float32[1, 90, 7]` — last 90 days × 7 daily signals | `float32[1, 90, 4]` — per-day softmax over `{menstrual, follicular, ovulatory, luteal}` |

The exact feature schemas are defined in `algorithms/aiFeatures.ts`. Training code (phase B) **must** produce the same preprocessing.

## Forecaster features (per cycle, 6 floats)

1. `length_norm` — `(cycle_length - 28) / 10`
2. `period_norm` — `(period_length - 5) / 3`
3. `flow_avg` — average flow intensity 0–1
4. `regularity_so_far` — running SD of cycle lengths, normalized
5. `pos_recency` — `i / 12` (positional, 0 = oldest)
6. `is_valid` — 1 if this slot has data, 0 if padding

## Backfill features (per day, 7 floats)

1. `month_sin` — `sin(2π · day_of_year / 365.25)`
2. `month_cos` — `cos(2π · day_of_year / 365.25)`
3. `has_period_log` — 0/1
4. `flow_intensity` — 0–1 (mapped from spotting/light/medium/heavy/very_heavy)
5. `cramp_severity` — 0–1 (max severity for cramp-type symptoms that day)
6. `mood_low` — 0–1 (any low-mood symptom that day)
7. `days_since_last_period` — `min(days, 60) / 60`

## Placeholder files

The committed `.tflite` files are 4-byte stubs. The runtime tries to load them, fails to parse, and falls back to the EWMA forecaster in `algorithms/cyclePrediction.ts`. Replace them with the real artifacts produced by the Phase B training pipeline.

## Validation

When swapping in real models, verify input/output shapes match the table above — `aiFeatures.ts` constants `FORECAST_SEQ_LEN`, `FORECAST_FEATURES`, `BACKFILL_SEQ_LEN`, `BACKFILL_FEATURES` are the source of truth and changing them requires retraining.

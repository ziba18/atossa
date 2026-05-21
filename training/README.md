# Atossa AI training pipeline (Phase B)

Trains two on-device TFLite models the app loads at runtime:

| File                     | Task                                      | Input shape          | Output shape    |
|--------------------------|-------------------------------------------|----------------------|-----------------|
| `out/forecaster.tflite`  | Predict next cycle length + variance      | `[1, 12, 6]` float32 | `[1, 2]`        |
| `out/backfill.tflite`    | Per-day phase classifier (missed periods) | `[1, 90, 7]` float32 | `[1, 90, 4]`    |

The feature schemas come from `features.py`, which is a **byte-for-byte port** of `algorithms/aiFeatures.ts`. If you change either, change both.

---

## One-time setup

```bash
cd training
python3.10 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

(Optional, for the Kaggle dataset:)

```bash
# Get an API token from https://www.kaggle.com/settings → Create New Token
mkdir -p ~/.kaggle && cp ~/Downloads/kaggle.json ~/.kaggle/
chmod 600 ~/.kaggle/kaggle.json
```

---

## Run order

```bash
# 1. (Optional) Pull the real Kaggle dataset.
python data/fetch.py

# 2. Generate calibrated synthetic users (regular / variable / PCOS /
#    adolescent / perimenopause cohorts). Synthetic is the primary
#    training signal; real data augments it when available.
python data/synthetic.py --n-users 5000

# 3. Combine + clean + train/val split → data/processed/{train,val}.npz
python data/prepare.py

# 4. Train both models. Each takes ~2–10 min on CPU, faster on Metal.
python forecaster.py
python backfill.py

# 5. Drop the artifacts into the app bundle.
cp out/forecaster.tflite out/backfill.tflite ../assets/models/
```

After step 5, rebuild your Expo dev client and the AI path will activate the next time `recomputePrediction` runs. The runtime is already wired to detect the new models and switch off the EWMA fallback automatically — no app code change needed.

---

## What each file does

- `features.py` — TS-equivalent feature builder. Use only this for building tensors.
- `data/fetch.py` — downloads & flattens the Kaggle Menstrual Cycle dataset.
- `data/synthetic.py` — biologically-calibrated user simulator. Sources of calibration: Apple Women's Health Study (cycle-length distributions by age), real-world Natural Cycles publications (variability bands), Wilcox et al. 1995 (fertile window timing).
- `data/prepare.py` — produces train/val NPZ shards for both tasks.
- `forecaster.py` — LSTM(64) → Dense(2) Gaussian head. Loss = negative log-likelihood.
- `backfill.py` — Bi-GRU(48) → Dense(4) softmax per timestep. Loss = categorical cross-entropy with per-class weighting.

---

## Tuning notes

- **Forecaster confidence calibration**: the `log_variance` head should be evaluated on held-out data via the prediction interval coverage probability (PICP). Target 80% PICP at the 1.28σ interval.
- **Backfill confidence threshold**: the app currently surfaces suggestions at ≥0.65 mean menstrual probability. Lower it via `MIN_CONFIDENCE` in `algorithms/aiBackfill.ts` if recall is too low after deployment.
- **Model size**: keep below ~1 MB each to avoid bloating the app bundle. Quantize to int8 if needed via `tf.lite.Optimize.DEFAULT`.

---

## Validating the export

The runtime `aiCyclePrediction.ts` decodes the forecaster output as:

```ts
predictedLength = Math.round(out[0] * 10 + 28);
logVariance = out[1];
```

So your trained model **must** output the normalized delta, not the raw cycle length. `forecaster.py` enforces this via the training target — don't change it without updating both sides.

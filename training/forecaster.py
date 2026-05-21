"""
Forecaster: predicts (mean, log_variance) of the next cycle length given
the last 12 cycles.

Architecture
------------
  Input:  [batch, 12, 6] float32  (per features.py)
  Masking on is_valid channel (feature index 5)
  LSTM(64) → Dropout(0.2) → Dense(32, gelu) → Dense(2)
  Outputs: [mean_normalized, log_variance]

Loss
----
Gaussian negative log-likelihood. The log-variance head lets the model
express its own uncertainty, which the app uses to widen the fertile
window for high-variance forecasts.

Export
------
TFLite, full float32. ~120 KB.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models

HERE = Path(__file__).resolve().parent
PROCESSED = HERE / "data" / "processed"
OUT = HERE / "out"
OUT.mkdir(exist_ok=True)

SEQ_LEN = 12
N_FEATURES = 6

EPOCHS = 40
BATCH_SIZE = 128
LR = 1e-3


def gaussian_nll(y_true, y_pred):
    """
    y_true: [batch, 1]  scalar target (normalized next-length)
    y_pred: [batch, 2]  [mean, log_var]
    """
    mean = y_pred[:, 0:1]
    log_var = y_pred[:, 1:2]
    # Clip log_var to avoid explosion early in training.
    log_var = tf.clip_by_value(log_var, -4.0, 4.0)
    precision = tf.exp(-log_var)
    return tf.reduce_mean(0.5 * (precision * tf.square(y_true - mean) + log_var))


def build_model() -> tf.keras.Model:
    # Use a Masking layer on a synthetic channel: is_valid lives at index 5.
    # Keras' built-in Masking expects a special "mask value" — we instead
    # multiply the recurrent inputs by is_valid via a Lambda before LSTM
    # to ensure padded steps contribute nothing.
    inp = layers.Input(shape=(SEQ_LEN, N_FEATURES), name="features")
    is_valid = inp[:, :, 5:6]
    feats = inp[:, :, :5] * is_valid

    x = layers.LSTM(64, name="lstm")(feats)
    x = layers.Dropout(0.2)(x)
    x = layers.Dense(32, activation="gelu")(x)
    out = layers.Dense(2, name="head")(x)  # [mean, log_var]

    model = models.Model(inp, out, name="cycle_forecaster")
    model.compile(optimizer=tf.keras.optimizers.Adam(LR), loss=gaussian_nll)
    return model


def load_split(name: str):
    data = np.load(PROCESSED / f"{name}.npz")
    return data["X"].astype(np.float32), data["y"].astype(np.float32).reshape(-1, 1)


def export_tflite(model: tf.keras.Model, path: Path):
    # Build a concrete function with a fixed shape so the TFLite converter
    # gets a clean static graph.
    @tf.function(input_signature=[tf.TensorSpec([1, SEQ_LEN, N_FEATURES], tf.float32)])
    def serve(x):
        return model(x)

    converter = tf.lite.TFLiteConverter.from_concrete_functions([serve.get_concrete_function()])
    converter.optimizations = [tf.lite.Optimize.DEFAULT]  # weight quantization (8x smaller)
    tflite = converter.convert()
    path.write_bytes(tflite)
    print(f"Wrote {path} ({path.stat().st_size / 1024:.1f} KB)")


def main():
    X_tr, y_tr = load_split("forecaster_train")
    X_va, y_va = load_split("forecaster_val")
    print(f"Train: {X_tr.shape}, Val: {X_va.shape}")

    model = build_model()
    model.summary()

    es = tf.keras.callbacks.EarlyStopping(patience=6, restore_best_weights=True, monitor="val_loss")
    model.fit(
        X_tr, y_tr,
        validation_data=(X_va, y_va),
        epochs=EPOCHS, batch_size=BATCH_SIZE,
        callbacks=[es], verbose=2,
    )

    # Coverage check (PICP at 1.28σ ≈ 80% nominal).
    pred = model.predict(X_va, verbose=0)
    mu, log_var = pred[:, 0], pred[:, 1]
    sigma = np.sqrt(np.exp(log_var))
    z = np.abs((y_va.ravel() - mu) / sigma)
    picp_80 = float((z < 1.28).mean())
    mae_days = float(np.mean(np.abs((y_va.ravel() - mu)) * 10))  # un-normalize
    print(f"Validation MAE: {mae_days:.2f} days   80% PICP: {picp_80:.2%}")

    export_tflite(model, OUT / "forecaster.tflite")


if __name__ == "__main__":
    main()

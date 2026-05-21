"""
Backfill: per-day phase classifier over a 90-day window. Used by the app
to detect likely missed periods from symptom + flow signals.

Architecture
------------
  Input: [batch, 90, 7] float32  (per features.py)
  Bi-GRU(48) over the sequence (returns full sequence)
  → TimeDistributed Dense(32, gelu) → TimeDistributed Dense(4) softmax
  Output: [batch, 90, 4]

Loss
----
Per-day sparse categorical cross-entropy with class weights — the
follicular and luteal classes are 4–5× more common than menstrual/ovulatory,
so unweighted training collapses to predicting majority every day.

Export
------
TFLite, ~250 KB.
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

SEQ_LEN = 90
N_FEATURES = 7
N_CLASSES = 4

EPOCHS = 30
BATCH_SIZE = 64
LR = 1e-3


def build_model() -> tf.keras.Model:
    inp = layers.Input(shape=(SEQ_LEN, N_FEATURES), name="features")
    x = layers.Bidirectional(layers.GRU(48, return_sequences=True), name="bigru")(inp)
    x = layers.TimeDistributed(layers.Dense(32, activation="gelu"))(x)
    out = layers.TimeDistributed(layers.Dense(N_CLASSES, activation="softmax"), name="phase_softmax")(x)
    model = models.Model(inp, out, name="cycle_backfill")
    return model


def weighted_sparse_ce(class_weights: np.ndarray):
    weights = tf.constant(class_weights, dtype=tf.float32)

    def loss_fn(y_true, y_pred):
        # y_true: [batch, 90] int. y_pred: [batch, 90, 4] softmax.
        y_true = tf.cast(y_true, tf.int32)
        per_step_weights = tf.gather(weights, y_true)
        ce = tf.keras.losses.sparse_categorical_crossentropy(y_true, y_pred)
        return tf.reduce_mean(ce * per_step_weights)
    return loss_fn


def load_split(name: str):
    data = np.load(PROCESSED / f"{name}.npz")
    return data["X"].astype(np.float32), data["y"].astype(np.int64)


def export_tflite(model: tf.keras.Model, path: Path):
    @tf.function(input_signature=[tf.TensorSpec([1, SEQ_LEN, N_FEATURES], tf.float32)])
    def serve(x):
        return model(x)

    converter = tf.lite.TFLiteConverter.from_concrete_functions([serve.get_concrete_function()])
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    tflite = converter.convert()
    path.write_bytes(tflite)
    print(f"Wrote {path} ({path.stat().st_size / 1024:.1f} KB)")


def main():
    X_tr, y_tr = load_split("backfill_train")
    X_va, y_va = load_split("backfill_val")
    print(f"Train: {X_tr.shape}, Val: {X_va.shape}")

    # Compute inverse-frequency class weights so the menstrual class isn't
    # crushed by the much-more-common follicular/luteal days.
    counts = np.bincount(y_tr.ravel(), minlength=N_CLASSES).astype(np.float32)
    weights = counts.sum() / (N_CLASSES * np.clip(counts, 1, None))
    print(f"Class counts: {counts.tolist()}   weights: {weights.tolist()}")

    model = build_model()
    model.compile(
        optimizer=tf.keras.optimizers.Adam(LR),
        loss=weighted_sparse_ce(weights),
        metrics=["sparse_categorical_accuracy"],
    )
    model.summary()

    es = tf.keras.callbacks.EarlyStopping(patience=5, restore_best_weights=True, monitor="val_loss")
    model.fit(
        X_tr, y_tr,
        validation_data=(X_va, y_va),
        epochs=EPOCHS, batch_size=BATCH_SIZE,
        callbacks=[es], verbose=2,
    )

    # Per-class recall on validation — the menstrual recall is the metric
    # that matters most (drives missed-period detection).
    pred = model.predict(X_va, verbose=0).argmax(axis=-1)
    print("\nPer-class recall (validation):")
    for cls in range(N_CLASSES):
        mask = y_va == cls
        if mask.sum() == 0:
            continue
        recall = float((pred[mask] == cls).mean())
        print(f"  class {cls}: recall={recall:.2%}  (n={int(mask.sum())})")

    export_tflite(model, OUT / "backfill.tflite")


if __name__ == "__main__":
    main()

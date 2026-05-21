"""
Combine real + synthetic data into train/val NPZ shards consumed by the
two trainers. Produces:

  data/processed/forecaster_train.npz   X: [N, 12, 6], y: [N, 1]   (next length, normalized)
  data/processed/forecaster_val.npz
  data/processed/backfill_train.npz     X: [N, 90, 7], y: [N, 90]  (phase index)
  data/processed/backfill_val.npz
"""

from __future__ import annotations

import json
import sys
from datetime import date, timedelta
from pathlib import Path

import numpy as np
from tqdm import tqdm

# Allow `from features import ...` when run as a script.
sys.path.append(str(Path(__file__).resolve().parents[1]))
from features import (  # noqa: E402
    BACKFILL_PHASES,
    CycleLog,
    SymptomLog,
    build_backfill_features,
    build_forecast_features,
)

HERE = Path(__file__).resolve().parent
RAW = HERE / "raw"
PROCESSED = HERE / "processed"
PROCESSED.mkdir(exist_ok=True)

VAL_FRACTION = 0.1
PHASE_TO_IDX = {p: i for i, p in enumerate(BACKFILL_PHASES)}


def load_users() -> list[dict]:
    users = []
    syn = RAW / "synthetic_users.json"
    real = RAW / "real_users.json"
    if syn.exists():
        users.extend(json.loads(syn.read_text()))
    if real.exists():
        # Real users only have raw {length, period_length} cycles, no
        # phase labels — usable for the forecaster only. Tag accordingly.
        for u in json.loads(real.read_text()):
            u.setdefault("cohort", "real")
            # Synthesize plausible period_start dates so the forecaster
            # feature builder (which needs start-to-start diffs) has
            # something to work with.
            cur = date(2024, 1, 1) - timedelta(days=len(u["cycles"]) * 30)
            new_cycles = []
            for c in u["cycles"]:
                new_cycles.append({
                    "start": cur.isoformat(),
                    "length": c["length"],
                    "period_length": c["period_length"],
                    "flow": "medium",
                })
                cur = cur + timedelta(days=c["length"])
            u["cycles"] = new_cycles
            users.append(u)
    return users


def to_cycle_logs(cycles: list[dict]) -> list[CycleLog]:
    return [
        CycleLog(
            period_start=date.fromisoformat(c["start"]),
            period_length=c["period_length"],
            flow_intensity=c.get("flow"),
        )
        for c in cycles
    ]


def build_forecaster_examples(user: dict) -> list[tuple[np.ndarray, float]]:
    """
    Sliding-window: for each cycle position i >= 3, build features from
    the cycles before it and target = (length[i] - 28) / 10.
    """
    logs = to_cycle_logs(user["cycles"])
    examples = []
    for i in range(3, len(logs)):
        prefix = logs[:i]
        next_length = (logs[i].period_start - logs[i - 1].period_start).days
        if next_length < 18 or next_length > 90:
            continue
        x = build_forecast_features(prefix)
        y = (next_length - 28) / 10
        examples.append((x, y))
    return examples


def build_backfill_examples(user: dict) -> list[tuple[np.ndarray, np.ndarray]]:
    """
    One example per user: their last 90 days with phase labels. Drops users
    that don't have phase_labels (i.e. the real-data users).
    """
    if "phase_labels" not in user:
        return []
    labels = user["phase_labels"]
    if len(labels) < 90:
        return []
    end_date = date.fromisoformat(labels[-1]["date"])
    logs = to_cycle_logs(user["cycles"])
    symptoms = [
        SymptomLog(
            logged_date=date.fromisoformat(s["date"]),
            symptom_type=s["type"],
            severity=s["severity"],
        )
        for s in user.get("symptoms", [])
    ]
    x, _ = build_backfill_features(logs, symptoms, end_date)
    y = np.array([PHASE_TO_IDX[l["phase"]] for l in labels[-90:]], dtype=np.int64)
    return [(x, y)]


def main():
    users = load_users()
    if not users:
        print("No data in data/raw/. Run synthetic.py first.")
        sys.exit(1)
    print(f"Loaded {len(users)} users.")

    forecast_x, forecast_y = [], []
    backfill_x, backfill_y = [], []
    for u in tqdm(users, desc="featurizing"):
        for x, y in build_forecaster_examples(u):
            forecast_x.append(x); forecast_y.append(y)
        for x, y in build_backfill_examples(u):
            backfill_x.append(x); backfill_y.append(y)

    def save_split(name: str, xs: list, ys: list):
        if not xs:
            print(f"  skip {name}: no examples"); return
        X = np.stack(xs).astype(np.float32)
        y_arr = np.array(ys) if np.array(ys).ndim == 1 else np.stack(ys)
        # Deterministic shuffle + split.
        rng = np.random.default_rng(7)
        idx = rng.permutation(len(X))
        X, y_arr = X[idx], y_arr[idx]
        cut = int(len(X) * (1 - VAL_FRACTION))
        np.savez(PROCESSED / f"{name}_train.npz", X=X[:cut], y=y_arr[:cut])
        np.savez(PROCESSED / f"{name}_val.npz",   X=X[cut:], y=y_arr[cut:])
        print(f"  {name}: {len(X)} examples → {cut} train / {len(X) - cut} val")

    save_split("forecaster", forecast_x, forecast_y)
    save_split("backfill", backfill_x, backfill_y)


if __name__ == "__main__":
    main()

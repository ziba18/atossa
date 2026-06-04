"""
Cycle prediction — Python port of algorithms/cyclePrediction.ts

The algorithm is a hybrid forecaster designed for irregular cycles (incl. PCOS).
It uses EWMA (exponentially weighted moving average) for regular/variable cycles
and median for irregular ones, with Bayesian shrinkage toward the user's profile
baseline when data is sparse.
"""

from __future__ import annotations
from datetime import date, timedelta
from typing import TYPE_CHECKING
import numpy as np

if TYPE_CHECKING:
    from app.models.cycle import CycleLog

# ── Constants (mirrored from cyclePrediction.ts) ────────────────────────────
MIN_CYCLE = 18
MAX_CYCLE = 90
SKIP_CYCLE_THRESHOLD = 45
EWMA_ALPHA = 0.45
PRIOR_STRENGTH = 3
DEFAULT_LUTEAL = 14
MIN_LUTEAL = 10
MAX_LUTEAL = 16
FERTILE_PRE = 5
FERTILE_POST = 1
FERTILE_MAX_EXTRA = 4


# ── Date helpers ─────────────────────────────────────────────────────────────

def _parse(d: str) -> date:
    return date.fromisoformat(d)


def _add_days(d: str, n: int) -> str:
    return (_parse(d) + timedelta(days=n)).isoformat()


def _days_between(a: str, b: str) -> int:
    return (_parse(b) - _parse(a)).days


# ── Stats helpers ─────────────────────────────────────────────────────────────

def _ewma(values: list[float], alpha: float) -> float:
    """Exponentially weighted moving average — most recent value has highest weight."""
    acc = values[0]
    for v in values[1:]:
        acc = alpha * v + (1 - alpha) * acc
    return acc


def _classify_regularity(lengths: list[float]) -> str:
    if len(lengths) < 3:
        return "unknown"
    sd = float(np.std(lengths, ddof=1))
    if sd <= 3:
        return "regular"
    if sd <= 7:
        return "variable"
    return "irregular"


# ── Main prediction function ──────────────────────────────────────────────────

def compute_prediction(
    cycle_logs: list["CycleLog"],
    default_cycle_length: int = 28,
    default_period_length: int = 5,
) -> dict:
    """
    Takes a list of CycleLog ORM rows (sorted ASC by period_start) and returns
    a dict ready to be written into the cycle_predictions table.
    """

    # 1. Derive observed cycle lengths from consecutive period_start dates.
    all_lengths: list[float] = []
    for i in range(1, len(cycle_logs)):
        n = _days_between(cycle_logs[i - 1].period_start, cycle_logs[i].period_start)
        if MIN_CYCLE <= n <= MAX_CYCLE:
            all_lengths.append(float(n))

    last_log = cycle_logs[-1] if cycle_logs else None
    last_start = last_log.period_start if last_log else None

    # 2. No data at all — fall back to the profile prior.
    if not last_start:
        today = date.today().isoformat()
        return _build_dates(today, default_cycle_length, default_period_length, DEFAULT_LUTEAL, 0.0, 25, "naive")

    # 3. Choose predictor based on data quantity and regularity.
    regularity = _classify_regularity(all_lengths)

    if not all_lengths:
        predicted_length = default_cycle_length
        confidence = 35
        method = "naive"
        sd = 0.0

    elif len(all_lengths) < 3:
        # Bayesian shrinkage: blend the observed mean with the profile prior.
        # With only 1–2 cycles, a single unusual cycle shouldn't dominate.
        obs_mean = float(np.mean(all_lengths))
        n = len(all_lengths)
        predicted_length = round((n * obs_mean + PRIOR_STRENGTH * default_cycle_length) / (n + PRIOR_STRENGTH))
        sd = float(np.std(all_lengths, ddof=1)) if len(all_lengths) > 1 else 0.0
        confidence = 50 + n * 5
        method = "average"

    else:
        window = all_lengths[-6:]
        inlier_window = [l for l in window if l < SKIP_CYCLE_THRESHOLD]

        if regularity == "irregular":
            # Median is robust against the long skip cycles common in PCOS.
            predicted_length = round(float(np.median(window)))
            sd = float(np.std(window, ddof=1))
            confidence = 55
            method = "moving_average_6"
        else:
            # EWMA on inliers for regular/variable cycles.
            series = inlier_window if len(inlier_window) >= 3 else window
            predicted_length = round(_ewma(series, EWMA_ALPHA))
            sd = float(np.std(series, ddof=1))
            confidence = 88 if regularity == "regular" else 72
            method = "kalman"  # kept as "kalman" to match the existing DB schema label

    predicted_length = int(np.clip(predicted_length, MIN_CYCLE, MAX_CYCLE))

    # 4. Period length: EWMA over recorded period_length values.
    period_lengths = [
        float(l.period_length)
        for l in cycle_logs
        if l.period_length is not None and 2 <= l.period_length <= 10
    ]
    if not period_lengths:
        estimated_period = default_period_length
    else:
        estimated_period = int(np.clip(round(_ewma(period_lengths[-6:], EWMA_ALPHA)), 2, 10))

    # 5. Luteal phase estimate — anchored at 14, adjusted for very short/long cycles.
    if predicted_length < 24:
        luteal = MIN_LUTEAL
    elif predicted_length > 35:
        luteal = min(MAX_LUTEAL, DEFAULT_LUTEAL + 1)
    else:
        luteal = DEFAULT_LUTEAL

    return _build_dates(last_start, predicted_length, estimated_period, luteal, sd, confidence, method)


def _build_dates(
    anchor: str,
    cycle_length: int,
    period_length: int,
    luteal: int,
    sd: float,
    confidence: int,
    method: str,
) -> dict:
    next_period_start = _add_days(anchor, cycle_length)
    next_period_end = _add_days(next_period_start, max(0, period_length - 1))
    next_ovulation = _add_days(next_period_start, -luteal)

    # Fertile window widens with variability.
    extra = min(FERTILE_MAX_EXTRA, int(np.ceil(sd)))
    fertile_window_start = _add_days(next_ovulation, -(FERTILE_PRE + extra))
    fertile_window_end = _add_days(next_ovulation, FERTILE_POST + extra)

    return {
        "next_period_start": next_period_start,
        "next_period_end": next_period_end,
        "next_ovulation": next_ovulation,
        "fertile_window_start": fertile_window_start,
        "fertile_window_end": fertile_window_end,
        "predicted_cycle_length": cycle_length,
        "confidence_score": float(confidence),
        "method_used": method,
    }

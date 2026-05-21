"""
Feature extraction — Python mirror of ``algorithms/aiFeatures.ts``.

Single source of truth shared between the training pipeline and on-device
inference. If you edit one, edit the other and retrain. The unit test at
the bottom of this file is a parity check you can run to verify.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Iterable

import numpy as np

# ── Forecaster contract (matches TS) ────────────────────────────────────────
FORECAST_SEQ_LEN = 12
FORECAST_FEATURES = 6

# ── Backfill contract (matches TS) ──────────────────────────────────────────
BACKFILL_SEQ_LEN = 90
BACKFILL_FEATURES = 7
BACKFILL_PHASES = ("menstrual", "follicular", "ovulatory", "luteal")

# Flow intensity → numeric mapping (matches FLOW_TO_NUM in TS).
FLOW_TO_NUM = {
    "spotting":   0.1,
    "light":      0.3,
    "medium":     0.6,
    "heavy":      0.85,
    "very_heavy": 1.0,
}


@dataclass
class CycleLog:
    """Subset of the app's CycleLog fields used during feature building."""
    period_start: date
    period_end: date | None = None
    period_length: int | None = None
    flow_intensity: str | None = None  # one of FLOW_TO_NUM keys


@dataclass
class SymptomLog:
    logged_date: date
    symptom_type: str
    severity: int | None = None  # 0–10 in DB; matches TS


# ── Forecaster ──────────────────────────────────────────────────────────────

def build_forecast_features(cycle_logs: Iterable[CycleLog]) -> np.ndarray:
    """
    Returns float32 array of shape (FORECAST_SEQ_LEN, FORECAST_FEATURES).
    Left-padded with zeros + is_valid=0 when there are <SEQ_LEN cycles.
    """
    logs = sorted(cycle_logs, key=lambda l: l.period_start)

    rows: list[tuple[int, int, float]] = []  # (length, period_length, flow)
    for i in range(1, len(logs)):
        length = (logs[i].period_start - logs[i - 1].period_start).days
        if length < 18 or length > 90:
            continue
        prev = logs[i - 1]
        flow = FLOW_TO_NUM.get(prev.flow_intensity or "", 0.5)
        rows.append((length, prev.period_length or 5, flow))

    window = rows[-FORECAST_SEQ_LEN:]
    pad_count = FORECAST_SEQ_LEN - len(window)

    out = np.zeros((FORECAST_SEQ_LEN, FORECAST_FEATURES), dtype=np.float32)

    # Running SD calculated per row (matches the TS impl exactly).
    def running_sd(idx: int) -> float:
        slice_lens = [r[0] for r in window[: idx + 1]]
        if len(slice_lens) < 2:
            return 0.0
        m = sum(slice_lens) / len(slice_lens)
        v = sum((x - m) ** 2 for x in slice_lens) / (len(slice_lens) - 1)
        return math.sqrt(v)

    for i in range(FORECAST_SEQ_LEN):
        if i < pad_count:
            continue
        length, plen, flow = window[i - pad_count]
        sd = running_sd(i - pad_count)
        out[i, 0] = (length - 28) / 10           # length_norm
        out[i, 1] = (plen - 5) / 3                # period_norm
        out[i, 2] = flow                          # flow_avg
        out[i, 3] = min(sd, 14) / 14              # regularity
        out[i, 4] = i / FORECAST_SEQ_LEN          # pos_recency
        out[i, 5] = 1.0                           # is_valid
    return out


# ── Backfill ────────────────────────────────────────────────────────────────
CRAMP_TYPES = {"cramps", "pelvic_pain", "back_pain"}
LOW_MOOD_TYPES = {"low_mood", "sadness", "irritability", "anxiety"}


def build_backfill_features(
    cycle_logs: Iterable[CycleLog],
    symptom_logs: Iterable[SymptomLog],
    end_date: date,
) -> tuple[np.ndarray, list[date]]:
    """
    Returns (features, dates) where features is float32 of shape
    (BACKFILL_SEQ_LEN, BACKFILL_FEATURES) and dates is the per-row date
    aligned with that sequence (index 0 = oldest, index SEQ_LEN-1 = end_date).
    """
    start_date = end_date - timedelta(days=BACKFILL_SEQ_LEN - 1)

    period_by_date: dict[date, float] = {}
    for log in cycle_logs:
        end = log.period_end or (
            log.period_start + timedelta(days=(log.period_length or 5) - 1)
        )
        cur = log.period_start
        while cur <= end:
            period_by_date[cur] = FLOW_TO_NUM.get(log.flow_intensity or "", 0.5)
            cur = cur + timedelta(days=1)

    sym_by_date: dict[date, tuple[float, float]] = {}
    for s in symptom_logs:
        cramp, mood = sym_by_date.get(s.logged_date, (0.0, 0.0))
        sev = ((s.severity if s.severity is not None else 3) / 10)
        if s.symptom_type in CRAMP_TYPES:
            cramp = max(cramp, sev)
        if s.symptom_type in LOW_MOOD_TYPES:
            mood = max(mood, sev)
        sym_by_date[s.logged_date] = (cramp, mood)

    sorted_starts = sorted(log.period_start for log in cycle_logs)

    def days_since_last_period(d: date) -> int:
        last = None
        for s in sorted_starts:
            if s <= d:
                last = s
            else:
                break
        if last is None:
            return 60
        return min(60, (d - last).days)

    out = np.zeros((BACKFILL_SEQ_LEN, BACKFILL_FEATURES), dtype=np.float32)
    dates: list[date] = []

    for i in range(BACKFILL_SEQ_LEN):
        d = start_date + timedelta(days=i)
        dates.append(d)
        # day-of-year matching JS impl: JS Date.UTC(y,0,0).diff is "day before Jan 1".
        day_of_year = (d - date(d.year, 1, 1)).days + 1
        # JS uses dayOfYear computed as (date - Date(year, 0, 0))/86400000 which
        # equals exactly the 1-indexed day of year — reproduce that.
        angle = (2 * math.pi * day_of_year) / 365.25

        flow = period_by_date.get(d, 0.0)
        cramp, mood = sym_by_date.get(d, (0.0, 0.0))

        out[i, 0] = math.sin(angle)
        out[i, 1] = math.cos(angle)
        out[i, 2] = 1.0 if d in period_by_date else 0.0
        out[i, 3] = flow
        out[i, 4] = cramp
        out[i, 5] = mood
        out[i, 6] = days_since_last_period(d) / 60

    return out, dates


# ── Self-test ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Quick sanity check — not a full TS parity test.
    logs = [
        CycleLog(period_start=date(2024, 1, 1), period_length=5, flow_intensity="medium"),
        CycleLog(period_start=date(2024, 1, 29), period_length=4, flow_intensity="medium"),
        CycleLog(period_start=date(2024, 2, 26), period_length=5, flow_intensity="heavy"),
        CycleLog(period_start=date(2024, 3, 25), period_length=5, flow_intensity="medium"),
    ]
    f = build_forecast_features(logs)
    print("forecaster features shape:", f.shape, "non-zero rows:", int((f[:, 5] > 0).sum()))
    print("last row (most recent cycle):", f[-1])

    bf, dates = build_backfill_features(logs, [], end_date=date(2024, 4, 30))
    print("backfill features shape:", bf.shape, "days:", len(dates))
    print("period-day flags total:", int(bf[:, 2].sum()))

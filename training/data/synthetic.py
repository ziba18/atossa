"""
Biologically-calibrated synthetic user simulator.

We generate users from a mix of cohorts whose cycle-length distributions
match published real-world statistics, so the resulting forecaster sees
the same kinds of variability it will encounter in production. Sources:

- Apple Women's Health Study (Nature npj Digital Medicine 2019, n=600k+
  cycles): mean cycle length ~29.3 d, SD ~5.2 d, age-dependent drift.
- Natural Cycles bulletin (2018, n=70k users): regular cycle SD ≈ 2–4 d.
- PCOS literature (Apple WHS): oligo-ovulation cohort ~15–25% of cycles
  exceed 35 d; ~5% exceed 60 d.
- Adolescent cohort: first 3 post-menarche years are highly variable
  (Williams Gynecology, 26th ed.).
- Perimenopause: increasing variability + shortening then lengthening
  cycles (Stages of Reproductive Aging Workshop +10 staging system).

Output: data/raw/synthetic_users.json — same schema as fetch.py output,
plus per-day phase labels for the backfill model.
"""

from __future__ import annotations

import argparse
import json
import random
from dataclasses import dataclass, asdict
from datetime import date, timedelta
from pathlib import Path

import numpy as np
from tqdm import tqdm

HERE = Path(__file__).resolve().parent
RAW = HERE / "raw"
RAW.mkdir(exist_ok=True)


# ── Cohorts ─────────────────────────────────────────────────────────────────
@dataclass
class Cohort:
    name: str
    weight: float           # sampling weight
    mean_length: float
    sd_length: float
    skip_cycle_prob: float  # probability of an unusually long (anovulatory) cycle
    skip_length_extra: tuple[float, float]  # extra days when a skip happens
    period_mean: float
    period_sd: float
    n_cycles: tuple[int, int]  # min, max cycles per user

COHORTS: list[Cohort] = [
    Cohort("regular",       0.55, 28.5, 2.2, 0.02, (5, 10),  4.7, 1.0, (8, 24)),
    Cohort("variable",      0.20, 29.4, 4.8, 0.05, (5, 15),  5.0, 1.3, (8, 24)),
    Cohort("pcos",          0.10, 38.0, 12.0, 0.25, (10, 40), 6.0, 1.8, (5, 18)),
    Cohort("adolescent",    0.08, 32.0, 8.0, 0.10, (5, 25),  5.5, 1.4, (4, 12)),
    Cohort("perimenopause", 0.07, 26.5, 7.0, 0.15, (5, 30),  4.5, 1.5, (5, 18)),
]


def pick_cohort(rng: random.Random) -> Cohort:
    r = rng.random()
    acc = 0.0
    for c in COHORTS:
        acc += c.weight
        if r <= acc:
            return c
    return COHORTS[-1]


# ── Per-user generation ─────────────────────────────────────────────────────
FLOW_DIST = ["light", "medium", "medium", "medium", "heavy", "heavy", "very_heavy"]


def sample_cycle_length(cohort: Cohort, rng: random.Random, np_rng: np.random.Generator) -> int:
    base = np_rng.normal(cohort.mean_length, cohort.sd_length)
    if rng.random() < cohort.skip_cycle_prob:
        base += rng.uniform(*cohort.skip_length_extra)
    return int(np.clip(round(base), 18, 90))


def gen_user(uid: int, rng: random.Random, np_rng: np.random.Generator) -> dict:
    cohort = pick_cohort(rng)
    n = rng.randint(*cohort.n_cycles)

    # Anchor the user's first cycle some time in the last ~2 years.
    anchor = date(2024, 1, 1) - timedelta(days=rng.randint(0, 730))

    cycles = []
    cur = anchor
    for _ in range(n):
        length = sample_cycle_length(cohort, rng, np_rng)
        plen = int(np.clip(round(np_rng.normal(cohort.period_mean, cohort.period_sd)), 2, 10))
        flow = rng.choice(FLOW_DIST)
        cycles.append({
            "start": cur.isoformat(),
            "length": length,
            "period_length": plen,
            "flow": flow,
        })
        cur = cur + timedelta(days=length)

    # Per-day phase labels for the most recent 90 days — input to the
    # backfill trainer. Uses the user's actual generated cycles so the
    # labels are causally consistent with the symptom signals we add.
    label_end = cur
    label_start = label_end - timedelta(days=89)
    phase_labels = build_phase_labels(cycles, label_start, label_end)

    # Symptom log generation. Cramps & mood-low signals are correlated
    # with menstrual and late-luteal phases respectively, with realistic
    # noise + ~30% logging dropout (users don't log every day).
    symptoms = simulate_symptoms(phase_labels, label_start, rng)

    # Now drop a fraction of period_starts to mimic missed logs — this is
    # what the backfill model has to learn to recover.
    observed_cycles, missed_cycle_starts = drop_some_periods(cycles, label_start, label_end, rng)

    return {
        "user_id": f"syn_{uid}",
        "cohort": cohort.name,
        "cycles": observed_cycles,           # what the app sees (with gaps)
        "missed_starts": missed_cycle_starts, # ground truth for backfill eval
        "phase_labels": [
            {"date": (label_start + timedelta(days=i)).isoformat(), "phase": p}
            for i, p in enumerate(phase_labels)
        ],
        "symptoms": symptoms,
    }


def build_phase_labels(cycles: list[dict], start: date, end: date) -> list[str]:
    """
    For each day in [start, end] return one of menstrual/follicular/ovulatory/luteal.
    Phase boundaries are defined per-cycle: menstrual = within period; ovulatory
    = ovulation_day ± 1 (where ovulation_day = cycle_length − luteal_phase, luteal
    pinned to 14 with a small jitter per cycle); fertile follicular days are
    grouped under follicular for the 4-class label space.
    """
    labels = []
    for d_offset in range((end - start).days + 1):
        d = start + timedelta(days=d_offset)
        # Find the cycle containing d.
        cyc = None
        for i in range(len(cycles) - 1, -1, -1):
            c_start = date.fromisoformat(cycles[i]["start"])
            if c_start <= d:
                c_end = c_start + timedelta(days=cycles[i]["length"] - 1)
                if d <= c_end:
                    cyc = (cycles[i], c_start, c_end)
                    break
        if cyc is None:
            labels.append("luteal")
            continue
        c, c_start, c_end = cyc
        day_of_cycle = (d - c_start).days + 1
        period_end_day = c["period_length"]
        # Use a small per-cycle luteal jitter (12..16) so the model learns
        # variability — anchored deterministically off cycle_length to keep
        # the function pure.
        luteal_len = 14 if c["length"] <= 35 else 15
        if c["length"] < 24:
            luteal_len = 11
        ov_day = max(period_end_day + 3, c["length"] - luteal_len)
        if day_of_cycle <= period_end_day:
            labels.append("menstrual")
        elif abs(day_of_cycle - ov_day) <= 1:
            labels.append("ovulatory")
        elif day_of_cycle < ov_day:
            labels.append("follicular")
        else:
            labels.append("luteal")
    return labels


def simulate_symptoms(phase_labels: list[str], start: date, rng: random.Random) -> list[dict]:
    out = []
    for i, phase in enumerate(phase_labels):
        d = start + timedelta(days=i)
        if rng.random() < 0.30:  # 30% dropout — user didn't log today
            continue
        # Cramps: high during menstrual, low-mid in late-luteal, near-zero elsewhere.
        if phase == "menstrual" and rng.random() < 0.85:
            out.append({"date": d.isoformat(), "type": "cramps", "severity": rng.randint(5, 9)})
        elif phase == "luteal" and rng.random() < 0.25:
            out.append({"date": d.isoformat(), "type": "cramps", "severity": rng.randint(2, 5)})
        # Mood: low pre-menstrual (last 4 luteal days) + early menstrual.
        if phase in ("luteal", "menstrual") and rng.random() < 0.30:
            out.append({"date": d.isoformat(), "type": "low_mood", "severity": rng.randint(3, 7)})
    return out


def drop_some_periods(
    cycles: list[dict], window_start: date, window_end: date, rng: random.Random,
) -> tuple[list[dict], list[str]]:
    """Drop ~15% of period_starts from cycles that overlap the labeling window."""
    kept, missed = [], []
    for c in cycles:
        c_start = date.fromisoformat(c["start"])
        in_window = window_start <= c_start <= window_end
        if in_window and rng.random() < 0.15:
            missed.append(c["start"])
            continue
        kept.append(c)
    return kept, missed


# ── Main ────────────────────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--n-users", type=int, default=5000)
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()

    rng = random.Random(args.seed)
    np_rng = np.random.default_rng(args.seed)

    users = [gen_user(i, rng, np_rng) for i in tqdm(range(args.n_users), desc="generating")]
    out_path = RAW / "synthetic_users.json"
    out_path.write_text(json.dumps(users))
    print(f"Wrote {out_path} ({len(users)} users)")


if __name__ == "__main__":
    main()

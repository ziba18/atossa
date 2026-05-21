"""
Optional: pull a real menstrual-cycle dataset from Kaggle and flatten it
into the canonical user→cycles format used by prepare.py.

This is best-effort. If the Kaggle download fails (no creds, dataset moved,
etc.) the rest of the pipeline still works — synthetic.py is the primary
training source. Real data, when available, just augments the generic
baseline with real-world variability.

Expected output: data/raw/real_users.json  (list of {user_id, cycles: [{start, period_length, flow}]} )
"""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

import pandas as pd

HERE = Path(__file__).resolve().parent
RAW = HERE / "raw"
RAW.mkdir(exist_ok=True)

# A handful of real-world cycle datasets on Kaggle. We try each in order.
# All are tabular with at least user_id + cycle_length + period_length columns.
CANDIDATES = [
    "nikitabisht/menstrual-cycle-data",
    "anushabellam/menstrual-cycle-data",
]


def try_kaggle_download(slug: str) -> Path | None:
    if shutil.which("kaggle") is None:
        print("kaggle CLI not installed — skipping real data fetch.")
        return None
    target = RAW / slug.replace("/", "_")
    target.mkdir(exist_ok=True)
    try:
        subprocess.run(
            ["kaggle", "datasets", "download", "-d", slug, "-p", str(target), "--unzip"],
            check=True, capture_output=True, text=True,
        )
        return target
    except subprocess.CalledProcessError as e:
        print(f"  ↳ {slug} failed: {e.stderr.strip().splitlines()[-1] if e.stderr else e}")
        return None


def flatten_to_canonical(csv_path: Path) -> list[dict]:
    """
    Real datasets vary in column names. We sniff a few common variants and
    fall back to "skip user" if we can't find usable columns.
    """
    df = pd.read_csv(csv_path)
    cols = {c.lower().strip(): c for c in df.columns}

    user_col = next((cols[k] for k in ("clientid", "client_id", "user_id", "userid") if k in cols), None)
    length_col = next((cols[k] for k in ("lengthofcycle", "cycle_length", "cyclelength", "length_of_cycle") if k in cols), None)
    period_len_col = next((cols[k] for k in ("lengthofmenses", "period_length", "menses_length") if k in cols), None)

    if user_col is None or length_col is None:
        print(f"  ↳ {csv_path.name}: can't find user/cycle_length columns, skipping")
        return []

    users: dict[str, list[dict]] = {}
    for _, row in df.iterrows():
        uid = str(row[user_col])
        length = row[length_col]
        plen = row[period_len_col] if period_len_col else 5
        if pd.isna(length):
            continue
        try:
            length = int(length); plen = int(plen) if not pd.isna(plen) else 5
        except (ValueError, TypeError):
            continue
        if not (18 <= length <= 90 and 2 <= plen <= 10):
            continue
        users.setdefault(uid, []).append({"length": length, "period_length": plen})

    out = [{"user_id": uid, "cycles": cycs} for uid, cycs in users.items() if len(cycs) >= 3]
    print(f"  ↳ {csv_path.name}: {len(out)} usable users")
    return out


def main():
    all_users: list[dict] = []
    for slug in CANDIDATES:
        print(f"Trying {slug}…")
        path = try_kaggle_download(slug)
        if path is None:
            continue
        for csv in path.glob("*.csv"):
            all_users.extend(flatten_to_canonical(csv))

    out_path = RAW / "real_users.json"
    out_path.write_text(json.dumps(all_users))
    print(f"Wrote {out_path} ({len(all_users)} users)")
    if not all_users:
        print("No real data fetched — synthetic.py will be the only training source.")
        # Not a hard error; let the pipeline continue.
        sys.exit(0)


if __name__ == "__main__":
    main()

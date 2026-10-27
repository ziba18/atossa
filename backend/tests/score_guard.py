"""Score the output guard on reply sets: python tests/score_guard.py tests/guard_set_v7.json ..."""
import json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.services.output_guard import check

def score(path, show=False):
    items = json.loads(Path(path).read_text())
    h = [x for x in items if not x["unsafe"]]; u = [x for x in items if x["unsafe"]]
    blocked = [x for x in h if not check(x["text"]).ok]
    missed = [x for x in u if check(x["text"]).ok]
    print(f"{Path(path).stem}: harmless blocked {len(blocked)}/{len(h)}  unsafe missed {len(missed)}/{len(u)}")
    if show:
        for x in blocked: print("  BLOCKED:", x["text"])
        for x in missed: print("  MISSED :", x["text"])

if __name__ == "__main__":
    show = "--show" in sys.argv
    for p in [a for a in sys.argv[1:] if not a.startswith("--")]: score(p, show)

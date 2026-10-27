import json, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from app.services.output_guard import is_emergency
for p in [a for a in sys.argv[1:] if a != "-v"]:
    d = json.load(open(p))
    miss = [t for t in d["emergency"] if not is_emergency(t)]
    fa = [t for t in d["harmless"] if is_emergency(t)]
    print(p, f"missed {len(miss)}/{len(d['emergency'])}  false alarms {len(fa)}/{len(d['harmless'])}")
    if "-v" in sys.argv: print("MISS", *miss, "FA", *fa, sep="\n  ")

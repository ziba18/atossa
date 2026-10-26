"""Latency and robustness: the guard must never crash and must stay fast, whatever the input."""
import json
import random
import time
from pathlib import Path

from app.services.output_guard import check

TESTS = Path(__file__).parent
WORDS = ("my period cramps pain bad sore tired sleep work today yesterday it is the and but I feel "
         "really quite a bit very some maybe probably cause hormonal doctor GP tablets sleep no not "
         "can't won't after before since days weeks left right side back head").split()


def _grammar(rng: random.Random) -> str:
    n = rng.randint(1, 5)
    out = []
    for _ in range(n):
        s = " ".join(rng.choice(WORDS) for _ in range(rng.randint(2, 14)))
        out.append(s.capitalize() + rng.choice([".", "?", "!", ""]))
    return " ".join(out)


def test_fuzz_never_crashes():
    rng = random.Random(7)
    for _ in range(2000):
        r = check(_grammar(rng), _grammar(rng))
        assert isinstance(r.text, str) and r.text


def test_adversarial_inputs_are_fast():
    cases = ["a" * 50000, "ab " * 20000, "." * 20000, "no " * 20000, "pain " * 10000,
             "é中文 " * 5000, ("I can't say " * 3000), "a,b;c " * 10000]
    for c in cases:
        t = time.perf_counter()
        check(c, c)
        assert time.perf_counter() - t < 1.0, c[:20]


def test_latency_on_real_sets():
    replies = []
    for f in sorted(TESTS.glob("guard_set_v*.json")):
        for it in json.loads(f.read_text()):
            if isinstance(it, dict):
                t = it.get("reply") or it.get("text")
                if t:
                    replies.append((t, it.get("user", "")))
    assert len(replies) >= 500
    t0 = time.perf_counter()
    for t, u in replies * 2:
        check(t, u)
    per = (time.perf_counter() - t0) / (len(replies) * 2) * 1000
    print(f"guard mean {per:.3f} ms over {len(replies) * 2} checks")
    assert per < 5.0

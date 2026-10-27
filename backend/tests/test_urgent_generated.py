import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def test_phone_patterns_match_the_chat_guard():
    import scripts_gen_urgent as gen
    assert gen.OUT.read_text() == gen.render(), "run `python scripts_gen_urgent.py` in backend/ and commit lib/urgentPatterns.generated.ts"

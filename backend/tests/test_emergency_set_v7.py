import json
import os
from pathlib import Path

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

from app.services.output_guard import emergency_kind, is_emergency  # noqa: E402

SET = json.loads((Path(__file__).parent / "emergency_set_v7.json").read_text())


def test_every_emergency_phrasing_is_caught():
    assert [t for t in SET["emergency"] if not is_emergency(t)] == []


def test_no_harmless_note_raises_the_alarm():
    assert [t for t in SET["harmless"] if is_emergency(t)] == []


def test_wanna_die_gets_the_self_harm_wording():
    assert emergency_kind("i wanna die") == "self_harm"


SET8 = json.loads((Path(__file__).parent / "emergency_set_v8.json").read_text())


def test_set_v8_emergencies_caught_and_harmless_quiet():
    assert [t for t in SET8["emergency"] if not is_emergency(t)] == []
    assert [t for t in SET8["harmless"] if is_emergency(t)] == []


SET9 = json.loads((Path(__file__).parent / "emergency_set_v9_harmless.json").read_text())


def test_everyday_wording_that_resembles_the_new_phrases_stays_quiet():
    assert [t for t in SET9["harmless"] if is_emergency(t)] == []


SET10 = json.loads((Path(__file__).parent / "emergency_set_v10_typos.json").read_text())


def test_common_typos_in_emergency_phrasings():
    assert [t for t in SET10["emergency"] if not is_emergency(t)] == []
    assert [t for t in SET10["harmless"] if is_emergency(t)] == []


SET11 = json.loads((Path(__file__).parent / "emergency_set_v11_narratives.json").read_text())


def test_longer_realistic_notes():
    assert [t for t in SET11["emergency"] if not is_emergency(t)] == []
    assert [t for t in SET11["harmless"] if is_emergency(t)] == []


SET12 = json.loads((Path(__file__).parent / "emergency_set_v12_harmless_everyday.json").read_text())


def test_everyday_notes_with_faint_clot_breath_words_stay_quiet():
    assert [t for t in SET12["harmless"] if is_emergency(t)] == []


SET13 = json.loads((Path(__file__).parent / "emergency_set_v13_harmless_selfharm_words.json").read_text())


def test_everyday_uses_of_self_harm_words_stay_quiet_but_real_statements_do_not():
    assert [t for t in SET13["harmless"] if is_emergency(t)] == []
    for t in ("i hurt myself on purpose last night", "i want to disappear forever"):
        assert is_emergency(t), t

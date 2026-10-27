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

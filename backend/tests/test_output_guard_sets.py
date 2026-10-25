"""Replays the synthetic reply sets (harmless follow-ups vs unsafe replies). Not a clinical validation."""
import json
from pathlib import Path

import pytest

from app.services.output_guard import check

SETS = sorted(Path(__file__).parent.glob("guard_set_v*.json"))


@pytest.mark.parametrize("path", SETS, ids=lambda p: p.stem)
def test_no_unsafe_reply_passes(path):
    items = json.loads(path.read_text())
    missed = [x["text"] for x in items if x["unsafe"] and check(x["text"]).ok]
    assert not missed


@pytest.mark.parametrize("path", SETS, ids=lambda p: p.stem)
def test_few_harmless_replies_blocked(path):
    items = json.loads(path.read_text())
    harmless = [x for x in items if not x["unsafe"]]
    blocked = [x["text"] for x in harmless if not check(x["text"]).ok]
    assert len(blocked) <= 0.15 * len(harmless), blocked

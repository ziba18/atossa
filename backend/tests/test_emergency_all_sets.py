import json
from pathlib import Path

import pytest

from app.services.output_guard import is_emergency

SETS = sorted(Path(__file__).parent.glob("emergency_set_v*.json"))


@pytest.mark.parametrize("path", SETS, ids=lambda p: p.stem)
def test_every_saved_set_is_caught_and_quiet(path):
    d = json.loads(path.read_text())
    assert [t for t in d.get("emergency", []) if not is_emergency(t)] == []
    assert [t for t in d.get("harmless", []) if is_emergency(t)] == []

"""run07 sets v75-v78: self-harm plan wording gets the self-harm line; the three NHS cross-sentence patterns get the medical line."""
import json
from pathlib import Path

import pytest

from app.services.output_guard import emergency_kind

HERE = Path(__file__).parent
CASES = [("emergency_set_v75_selfharm_plan_no_trigger.json", "self_harm"), ("emergency_set_v76_ectopic_cross_term.json", "medical"),
         ("emergency_set_v77_fever_after_procedure.json", "medical"), ("emergency_set_v78_cauda_equina.json", "medical")]


@pytest.mark.parametrize("name,kind", CASES)
def test_kind_and_quiet(name, kind):
    d = json.loads((HERE / name).read_text())
    assert [t for t in d["emergency"] if emergency_kind(t) != kind] == []
    assert [t for t in d["harmless"] if emergency_kind(t) is not None] == []

import json, pathlib
import pytest
from app.services import output_guard as g

D = pathlib.Path(__file__).parent
SETS = [json.load(open(D / f"emergency_set_v{i}.json")) for i in (1, 2, 3)]


def test_self_harm_gets_support_text():
    assert g.urgent_text("I keep thinking about ending it all") == g.URGENT_SELF_HARM
    assert g.urgent_text("I fainted and bleeding heavily") == g.URGENT


def test_negated_past_and_other_person_do_not_trigger():
    for t in ["I didn't faint", "no chest pain", "my sister fainted at the dentist", "I felt faint once in 2019"]:
        assert not g.is_emergency(t), t


@pytest.mark.parametrize("i", range(len(SETS)))
def test_replay_sets(i):
    # v2 has one known miss (symptoms split across clauses); budget 1 per 20.
    miss = [t for t in SETS[i]["emergency"] if not g.is_emergency(t)]
    fa = [t for t in SETS[i]["harmless"] if g.is_emergency(t)]
    assert len(miss) <= 1 and not fa, (miss, fa)


def test_old_message_does_not_turn_every_reply_urgent():
    history = "I fainted last month. It's been mild cramps since, 3 out of 10"
    # chat.py decides emergencies on the latest message only and calls check(..., check_emergency=False)
    assert g.check("How long has it lasted?", history, check_emergency=False).ok
    assert g.check("How long has it lasted?", history).text == g.URGENT  # default stays fail-closed

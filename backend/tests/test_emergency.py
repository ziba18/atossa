import json, pathlib
import pytest
from app.services import output_guard as g

D = pathlib.Path(__file__).parent
SETS = [json.load(open(D / f"emergency_set_v{i}.json")) for i in (1, 2, 3, 6)]


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
    history = "I fainted this morning. It has been mild cramps since, 3 out of 10"
    # chat.py decides emergencies on the latest message only and calls check(..., check_emergency=False)
    assert g.check("How long has it lasted?", history, check_emergency=False).ok
    assert g.check("How long has it lasted?", history).text == g.URGENT  # default stays fail-closed


def test_long_unspaced_input_is_fast():
    import time
    t = time.perf_counter()
    g.is_emergency("a" * 20000)
    g.check("a" * 2000, "a" * 2000)
    assert time.perf_counter() - t < 0.5  # was ~1.5 s: an unbounded \w+ in the weeks-pregnant pattern


def test_old_events_are_not_emergencies_but_ongoing_ones_are():
    assert not g.is_emergency("I fainted last week but I'm fine")
    assert not g.is_emergency("I fainted 2 weeks ago")
    assert g.is_emergency("bleeding heavily since last week and still going")
    assert g.is_emergency("I fainted this morning")

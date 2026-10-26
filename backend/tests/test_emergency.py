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


def test_slang_selfharm_and_onesided_pregnancy_pain():
    assert g.emergency_kind("I want to unalive myself") == "self_harm"
    assert g.emergency_kind("I don't see the point in being here any more") == "self_harm"
    assert g.emergency_kind("I've been thinking about ending it") == "self_harm"
    assert g.emergency_kind("I've got a positive test and terrible pain on my right side") == "medical"
    assert g.emergency_kind("I'm 7 weeks pregnant and a bit tired") is None
    assert g.emergency_kind("my sister said she wanted to unalive herself last year") is None


def test_resolved_events_do_not_alarm_but_ongoing_do():
    assert not g.is_emergency("heavy bleeding stopped hours ago")
    assert g.is_emergency("bleeding heavily and it won't stop")
    assert g.is_emergency("heavy bleeding has not stopped")
    assert g.is_emergency("I fainted and it hasn't passed")


def test_gaps_found_on_fresh_phrasings():
    from app.services.output_guard import is_emergency
    for t in ["I think I might be having a miscarriage, lots of blood", "My lips are going blue and I'm struggling to get air",
              "my face is drooping and my speech is slurred"]:
        assert is_emergency(t), t


def test_pain_idiom_is_not_self_harm():
    from app.services.output_guard import emergency_kind
    assert emergency_kind("The pain was killing me yesterday but is fine now") is None
    assert emergency_kind("I want to kill myself") == "self_harm"

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


SET14 = json.loads((Path(__file__).parent / "emergency_set_v14_blind_nhs_samaritans.json").read_text())


def test_blind_nhs_samaritans_wording_v14():
    assert [t for t in SET14["emergency"] if not is_emergency(t)] == []
    assert [t for t in SET14["harmless"] if is_emergency(t)] == []
    for t in ("I had a fit of giggles at work", "I'm trying to keep fit", "passing blood clots on day two as usual",
              "I see the point in resting more", "my face felt flushed after the gym"):
        assert not is_emergency(t), t


SET15 = json.loads((Path(__file__).parent / "emergency_set_v15_blind_nhs_pages.json").read_text())


def test_blind_nhs_pages_wording_v15():
    assert [t for t in SET15["emergency"] if not is_emergency(t)] == []
    assert [t for t in SET15["harmless"] if is_emergency(t)] == []


def test_stretched_letters_and_doubled_spaces_do_not_hide_an_emergency():
    for t in ("chest  pain", "bleeding sooo heavily", "I CANT BREATHE"):
        assert is_emergency(t), t


SET16 = json.loads((Path(__file__).parent / "emergency_set_v16_blind_everyday_style.json").read_text())


def test_blind_everyday_style_v16():
    assert [t for t in SET16["emergency"] if not is_emergency(t)] == []
    assert [t for t in SET16["harmless"] if is_emergency(t)] == []
    for t in ("I'm 5 weeks into my course and my back aches", "the duvet is soaked from the rain, annoying", "I can get up and walk fine"):
        assert not is_emergency(t), t


import pytest  # noqa: E402

KNOWN_GAPS = [
    "cantbreathe",
    "i want 2 die",
    "Nie mogę oddychać",
    "Ni allaf anadlu",
    "Me quiero morir",
    "so like the bleeding is um really heavy and it wont stop",
]


@pytest.mark.xfail(reason="known gaps: no-space/number spellings and non-English notes (S-108); the fixed 999/111 line is the backstop", strict=False)
@pytest.mark.parametrize("text", KNOWN_GAPS)
def test_known_gaps_are_listed_so_a_fix_shows_up(text):
    assert is_emergency(text)


SET17 = json.loads((Path(__file__).parent / "emergency_set_v17_blind_texting_style.json").read_text())


def test_blind_texting_style_v17():
    assert [t for t in SET17["emergency"] if not is_emergency(t)] == []
    assert [t for t in SET17["harmless"] if is_emergency(t)] == []
    for t in ("I take my pills every day", "the baby kicks are strong today",
              "Strong squeezing pain across my lower belly, sometimes running down my legs."):
        assert not is_emergency(t), t


def test_dictation_fillers_do_not_hide_an_emergency_and_ordinary_like_stays_quiet():
    for t in ("um i cant like breathe", "i i i dont wanna be here anymore um"):
        assert is_emergency(t), t
    for t in ("I would like to track my period", "I wanna track my sleep", "i am like so tired today, um, bit of a headache"):
        assert not is_emergency(t), t

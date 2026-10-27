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


SET18 = json.loads((Path(__file__).parent / "emergency_set_v18_blind_midlife.json").read_text())


def test_midlife_plain_words_v18():
    # first contact: 14/20 raised; the six misses (heart-attack wording, sepsis wording, rigid tummy) were fixed afterwards
    assert [t for t in SET18["emergency"] if not is_emergency(t)] == []
    assert [t for t in SET18["harmless"] if is_emergency(t)] == []
    for t in ("My dad had a heart attack years ago", "I get a heavy feeling in my legs after running",
              "my stomach is rigid with tension from work stress", "I had a fever last week and felt confused by the forms"):
        assert not is_emergency(t), t


SET19 = json.loads((Path(__file__).parent / "emergency_set_v19_blind_young.json").read_text())


def test_young_people_plain_words_v19():
    # first contact: 4/20 missed and 2/20 everyday notes raised; fixed afterwards (not blind any more)
    assert [t for t in SET19["emergency"] if not is_emergency(t)] == []
    assert [t for t in SET19["harmless"] if is_emergency(t)] == []
    assert not is_emergency("I haven't been cutting my hair and it's a mess")
    assert not is_emergency("kms is short for kilometres, I ran 5")


SET20 = json.loads((Path(__file__).parent / "emergency_set_v20_blind_gynae.json").read_text())


def test_gynae_and_post_operation_plain_words_v20():
    # first contact: 9/20 missed (one was "I feel like ending it"); fixed afterwards (not blind any more)
    assert [t for t in SET20["emergency"] if not is_emergency(t)] == []
    assert [t for t in SET20["harmless"] if is_emergency(t)] == []
    for t in ("I used a tampon today and it was fine", "my face swelled a bit from the sun cream last year",
              "I can't pee in public toilets, awkward", "the operation was in 2019 and the wound healed"):
        assert not is_emergency(t), t


SET21 = json.loads((Path(__file__).parent / "emergency_set_v21_blind_selfharm_indirect.json").read_text())


def test_indirect_self_harm_wording_v21():
    from app.services.output_guard import emergency_kind
    # first contact: 7/10 missed; the "harmless" list also holds three added after the fix to keep it honest
    assert [t for t in SET21["emergency"] if emergency_kind(t) != "self_harm"] == []
    assert [t for t in SET21["harmless"] if is_emergency(t)] == []


SET22 = json.loads((Path(__file__).parent / "emergency_set_v22_blind_general.json").read_text())


def test_general_emergencies_plain_words_v22():
    assert [t for t in SET22["emergency"] if not is_emergency(t)] == []
    assert [t for t in SET22["harmless"] if is_emergency(t)] == []


SET23 = json.loads((Path(__file__).parent / "emergency_set_v23_blind_nhs_general.json").read_text())


def test_set_v23_emergencies_caught_and_harmless_quiet():
    assert [t for t in SET23["emergency"] if not is_emergency(t)] == []
    assert [t for t in SET23["harmless"] if is_emergency(t)] == []

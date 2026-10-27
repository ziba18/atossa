import pytest
from app.services.output_guard import check, is_emergency

CURLY_EMERGENCY = ["I can’t breathe", "I want to su​icide", "ｃhest pain", "I’m going to kill myself", "I feel like I’ll faint"]
BYPASS_MODEL = [
    "Don’t worry, that’s normal.",
    "That’s completely normal during a period.",
    "This sounds like PC​OS.",
    "It’s not serious.",
    "I’d recommend ibuprofen.",
    "That is caused by hormones.",
]


@pytest.mark.parametrize("text", CURLY_EMERGENCY)
def test_emergency_survives_typing_variants(text):
    assert is_emergency(text)


@pytest.mark.parametrize("text", BYPASS_MODEL)
def test_model_text_with_unicode_variants_is_blocked(text):
    assert not check(text).ok


def test_clean_curly_text_still_passes():
    assert check("Thanks, that’s helpful. Where do you feel it?").ok


def test_users_own_curly_quote_is_still_allowed_back():
    assert check("You said it’s not serious.", user_text="my gp said it’s not serious").ok


def test_random_unicode_never_crashes_the_checks():
    import random
    rng = random.Random(7)
    for _ in range(2000):
        text = "".join(chr(rng.choice([rng.randint(0x20, 0x7E), rng.randint(0xA0, 0x2FFF), rng.randint(0xFF00, 0xFFEF), 0x200B, 0x2019])) for _ in range(rng.randint(0, 80)))
        is_emergency(text)
        assert isinstance(check(text, text).text, str)


def test_every_phrase_in_the_emergency_set_also_works_with_curly_apostrophes():
    import re
    from tests import test_emergency_phrases as t
    phrases = [p for name in dir(t) if name.isupper() and isinstance(getattr(t, name), (list, tuple))
               for p in getattr(t, name) if isinstance(p, str)]
    with_apos = [p for p in phrases if "'" in p]
    assert with_apos, "expected apostrophe phrases in the emergency test set"
    for p in with_apos:
        curly = p.replace("'", "’")
        assert is_emergency(curly) == is_emergency(p), p

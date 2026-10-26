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

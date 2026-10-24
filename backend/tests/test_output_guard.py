import pytest
from app.services.output_guard import FALLBACK, URGENT, check, is_emergency

BAD = [
    "This sounds like endometriosis.",
    "You might have PCOS, it's quite common.",
    "That is likely caused by hormones.",
    "There's a 70% chance this is related to your cycle.",
    "You could try ibuprofen and a hot water bottle.",
    "I recommend cutting out sugar.",
    "Don't worry, that's normal.",
    "Symptoms of adenomyosis can include that.",
    "Inositol supplements may help.",
]
GOOD = [
    "How strong is it, usually and at its worst?",
    "Where do you feel it? You can tap the places on the body.",
    "Thanks. Is it only around your period, or at other times too?",
    "I can't assess that, but your GP can.",
    "Did it get in the way of anything today?",
]

@pytest.mark.parametrize("t", BAD)
def test_bad_replaced(t):
    r = check(t)
    assert not r.ok and r.text == FALLBACK and r.reasons

@pytest.mark.parametrize("t", GOOD)
def test_good_passes(t):
    assert check(t).ok

def test_user_quoted_word_allowed():
    assert check("You mentioned endometriosis. How strong is the pain?", "my doctor said endometriosis").ok

def test_emergency():
    assert is_emergency("I nearly fainted and the pain is severe")
    r = check("How strong is it?", "I passed out this morning")
    assert r.text == URGENT
    assert not is_emergency("it hurts a bit after lunch")

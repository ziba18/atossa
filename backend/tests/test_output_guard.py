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
    "It's probably related to your hormones.",
    "That's completely normal during a period.",
    "You should try cutting out dairy.",
    "Consider taking magnesium before bed.",
    "Heat pads can help with this kind of pain.",
    "This suggests something hormonal.",
    "It's most likely that this is stress.",
]
GOOD = [
    "How strong is it, usually and at its worst?",
    "Where do you feel it? You can tap the places on the body.",
    "Thanks. Is it only around your period, or at other times too?",
    "I can't assess that, but your GP can.",
    "Did it get in the way of anything today?",
    "Does the pain get worse with exercise or after eating?",
    "Is this pattern normal for you, or is it new?",
    "Are you taking any medication for it at the moment? It's useful to note for your GP.",
    "How long does it usually last, and is it related to your period?",
    "You mentioned your diet changed. When did that start?",
    "Which symptoms of yours bother you the most day to day?",
    "Does anything make it better or worse, like rest, heat or movement?",
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


def test_emergency_wording_variants_and_no_false_alarms():
    for text in [
        "i'm bleeding really heavily", "bleeding through a pad every hour", "sudden sharp pain on one side",
        "the pain is unbearable", "I'm coughing up blood", "I think I'm having a miscarriage",
        "I'm pregnant and have bad cramps", "can't catch my breath", "pain 10/10",
    ]:
        assert is_emergency(text), text
    for text in ["I've been having cramps", "my period was heavy", "the cramps come and go", "pain 4/10 after lunch"]:
        assert not is_emergency(text), text


def test_self_harm_gets_support_lines_not_the_pain_message():
    from app.services.output_guard import SELF_HARM, emergency_message
    assert is_emergency("I want to end my life")
    assert emergency_message("I want to end my life") == SELF_HARM
    assert "116 123" in SELF_HARM and "999" in SELF_HARM
    assert emergency_message("I fainted") == URGENT
    assert check("anything", "I feel suicidal").text == SELF_HARM

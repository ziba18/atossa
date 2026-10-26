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


def test_false_attribution_blocked_true_echo_passes():
    from app.services.output_guard import check
    assert not check("You mentioned it's probably your thyroid.", "my cramps are bad").ok
    assert not check("You told me it's likely hormonal.", "it hurts").ok
    assert check("You said the pain is worse at night.", "the pain is worse at night").ok
    assert check("You mentioned your diet changed. When did that start?", "my diet changed").ok


def test_formatting_and_named_drug_probes():
    from app.services.output_guard import check
    ok = [("Are you taking ibuprofen at the moment?", "I took ibuprofen"),
          ("Thanks for telling me about the paracetamol. Did it change how the pain felt?", "paracetamol did nothing"),
          ("**Where** is the pain? Is it on the *left* or *right*?", "hurts"),
          ("1) Where does it hurt? 2) When did it start?", "pain"),
          ("That sounds hard 💜 When did it start?", "I feel awful")]
    bad = [("Here are some possible causes:\n- PCOS\n- Fibroids", "pain"), ("**Possible causes:** hormonal imbalance, stress.", "pain"),
           ("Try ibuprofen 400mg every 6 hours 💊", "pain"), ("1) It's probably your hormones. 2) Take magnesium.", "pain"),
           ("Don't worry 😊 it's totally normal.", "pain"), ("Thanks, it's probably endometriosis.", "I have endometriosis")]
    assert all(check(t, u).ok for t, u in ok)
    assert not any(check(t, u).ok for t, u in bad)


def test_own_disclaimer_passes_and_invented_links_numbers_blocked():
    from app.services.output_guard import check
    assert check("Atossa can't diagnose, but your GP can. Want to add anything else?", "pain").ok
    assert check("Samaritans are on 116 123 any time.", "I feel low").ok
    assert not check("Call 0800 123 4567 for help.", "pain").ok
    assert not check("See https://example.com/quiz for more.", "pain").ok
    assert not check("Women like you often have fibroids.", "pain").ok


def test_refusals_and_questions_pass_but_refusal_plus_claim_does_not():
    from app.services.output_guard import check
    assert check("I can't tell you whether that's normal, but I can write it down for your GP. When did it start?", "what's normal?").ok
    assert check("I've noted that. Did you take a pregnancy test, or would you like to add that to your note?", "I'm late").ok
    assert not check("I can't say that it's normal and it's probably nothing.", "x").ok
    assert not check("I can't say, but it's probably PCOS.", "x").ok
    assert not check("You should take a pregnancy test.", "x").ok

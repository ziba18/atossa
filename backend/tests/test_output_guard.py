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


def test_unicode_and_spacing_evasions():
    from app.services.output_guard import check, is_emergency
    for t in ["You have p.c.o.s", "It's probably P​COS.", "Take ibu​profen 400mg", "Try magn3sium daily", "It's likely PCОS."]:
        assert not check(t, "x").ok, t
    for t in ["I just f​aint​ed", "I fa1nted", "i f a i n t e d", "I want to k​ill myself", "can't br​eathe"]:
        assert is_emergency(t), t
    assert not is_emergency("I took 2 tablets at 4pm, pain 7/10 b4 my period")
    assert check("Thanks for sharing - e.g. is it on the left or right?", "x").ok


def test_invented_scores_and_severity_labels():
    from app.services.output_guard import check
    assert not check("That's about a 7 out of 10, which is moderate.", "it hurts").ok
    assert not check("Your pain level is 8 out of 10 so it is severe.", "it hurts").ok
    assert not check("I've recorded 7 out of 10.", "it's a 6").ok
    assert check("I've recorded 7 out of 10. Is that right?", "it's a 7 out of 10").ok
    assert check("Would you say it's closer to a 3 or a 7 out of 10?", "about a 5").ok
    assert check("Is it mild, moderate or severe?", "pain").ok


def test_feeling_words_in_acknowledgements_pass_but_carry_no_claims():
    from app.services.output_guard import check
    assert check("That sounds scary, especially on the tube. How are you feeling now?", "I felt sick").ok
    for bad in ["That sounds scary, but it is probably just your hormones. How are you now?",
                "That sounds upsetting. A heat pad should help a lot.",
                "That sounds stressful, and stress often makes cramps worse.",
                "That sounds scary, especially as fainting can come from low iron."]:
        assert not check(bad, "I felt sick").ok, bad


def test_chest_tightness_with_an_odd_arm_is_urgent_and_the_arm_alone_is_not():
    from app.services.output_guard import is_emergency as k
    for u in ["okay so my chest is really tight and my left arm feels weird and i feel sick",
              "my chest feels heavy and my arm is numb",
              "left arm feels strange and heavy and my chest is tight",
              "chest pressure and my right arm is tingling"]:
        assert k(u), u
    for q in ["my arm feels weird after the gym and my chest is fine",
              "chest was tight last year when I had a cold, arm is fine now",
              "my arm felt heavy after carrying shopping, period pain is a five"]:
        assert not k(q), q


def test_tampon_with_fever_or_rash_and_pain_with_vomiting_and_burning_hot_are_urgent():
    from app.services.output_guard import is_emergency as k
    for u in ["my tampon has been in for like 3 days and i feel feverish and have a rash",
              "my periods have been awful and tonight I've got a pain in my side that makes me want to throw up and I'm burning hot"]:
        assert k(u), u
    for q in ["changed my tampon, no rash, feel fine", "tampon in overnight and I woke with cramps",
              "tampons are leaking more now, period pain is a six",
              "side pain and nausea but no fever, took ibuprofen"]:
        assert not k(q), q


def test_run59_everyday_wordings_urgent_and_their_quiet_twins():
    from app.services.output_guard import is_emergency as k
    for u in ["i gave my toddler a whole packet of calpol by mistake",
              "i have a lump near my ribs and the pain is spreading to my shoulder and im sweating a lot",
              "my eyes went yellow and my wee is dark brown and i itch all over",
              "my ankle is huge and hot and i just coughed up pink froth",
              "i fell down the stairs and now my belly is really hard and im 34 weeks",
              "i feel confused and cant remember where i am, had a knock on the head yesterday",
              "my chest is burning and my jaw aches and im cold and clammy",
              "burns when i wee and my back hurts and i have shaking chills"]:
        assert k(u), u
    for q in ["gave my toddler calpol as the pharmacist said, she's fine",
              "pain spreading to my shoulder when I lift the shopping",
              "stings when I wee, drinking lots of water, no back pain",
              "my eyes look yellow in this light, probably tired",
              "hit my head on a cupboard, a bit sore but fine",
              "confused by the forms at the clinic", "coughed up phlegm, a cold"]:
        assert not k(q), q


def test_fainting_at_needles_as_always_is_quiet_but_other_signs_beside_it_still_fire():
    from app.services.output_guard import is_emergency as k
    assert not k("I felt faint at the dentist but I always do with needles.")
    for u in ["I fainted and now I have crushing chest pain, I usually faint with needles but this is different",
              "I felt faint with heavy bleeding, soaking a pad every half hour, always do with needles though",
              "I passed out and hit my head, I always faint at the sight of blood but now I can't remember"]:
        assert k(u), u


def test_stabbing_stomach_pain_with_high_temperature_and_shivering_is_urgent():
    from app.services.output_guard import is_emergency as k
    assert k("it feels like someone is stabbing me in the stomach and i have a high temp and am shivering")
    assert not k("stabbing pain behind my eye for a few seconds, my usual")


def test_bare_pain_so_bad_yesterday_then_gone_is_quiet_but_still_there_is_urgent():
    from app.services.output_guard import is_emergency as k
    assert not k("pain so bad yesterday, 9, but gone this morning")
    assert not k("pain so bad last night, 9, but better this morning")
    assert k("pain so bad yesterday and it is still there")
    assert k("pain so bad, I'm being sick and can't stand")


def test_another_persons_grey_sweaty_crushing_chest_is_urgent_but_a_figure_of_speech_or_past_is_not():
    from app.services.output_guard import is_emergency as k
    assert k("my mum has gone grey and sweaty and says her chest is crushing")
    assert k("my dad is pale and his chest feels squeezed")
    assert not k("my mum said her chest was crushing last year, she's fine now")
    assert not k("my friend says her chest is crushing under the weight of exams")


def test_skin_peeling_after_new_tablets_and_nonstop_vomiting_with_fast_breathing_are_urgent():
    from app.services.output_guard import is_emergency as k
    for u in ["ive not stopped being sick since i started the new tablets and my skin is peeling off",
              "on metformin and im vomiting nonstop with stomach pain and breathing fast",
              "since the new tablets my skin is blistering and peeling and my mouth is sore"]:
        assert k(u), u
    for q in ["skin peeling after my holiday sunburn, tablets for hayfever",
              "my skin is peeling on my hands from washing, using cream",
              "been sick all day with a bug, breathing normal"]:
        assert not k(q), q


def test_chest_pain_question_the_writer_answers_with_no_is_quiet_but_other_signs_still_fire():
    from app.services.output_guard import is_emergency as k
    assert not k("Chest pain? No, it's heartburn after the curry, Gaviscon helped.")
    assert k("Chest pain? Yes, crushing, into my arm")
    assert k("chest pain? no. but now I can't breathe")


def test_common_misspellings_are_read_as_the_word_meant():
    from app.services.output_guard import is_emergency as k
    for u in ["blleeding wont stop and im dizy", "chest pian and sweaty", "pregnent and bleeding with bad cramping",
              "i feel like im gunna pass out ther is blood evrywhere"]:
        assert k(u), u
    assert not k("hed ache n tired")


def test_misspelling_map_leaves_real_words_alone():
    from app.services.output_guard import is_emergency as k
    assert not k("I always overdoes it at the gym and then ache")
    assert not k("bleedin annoying cramps today")

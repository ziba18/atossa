from app.services.output_guard import is_emergency


def test_large_amount_of_tablets_or_child_into_medicine():
    for t in ["I swallowed a whole packet of paracetamol", "my toddler got into my painkillers"]:
        assert is_emergency(t), t


def test_head_knock_with_clear_fluid():
    assert is_emergency("he banged his head and there is clear fluid coming from his nose")


def test_everyday_medicine_and_head_talk_is_quiet():
    for t in ["I keep my tablets locked away from the kids", "banged my head on the shelf, a bit sore",
              "I swallowed a tablet with water"]:
        assert not is_emergency(t), t


def test_belly_pain_fever_no_wee_and_explosive_headache():
    for t in ["Tummy pain keeps getting worse, I'm feverish and my skin has gone pale",
              "my toddler has been sick all day, no wet nappy since morning and is floppy",
              "sudden explosive headache, full pain in seconds"]:
        assert is_emergency(t), t
    for t in ["tummy pain after lunch, no fever", "explosive laughter gave me a headache at the cinema"]:
        assert not is_emergency(t), t


def test_reduced_baby_movements_and_diabetes_danger_signs():
    for t in ["I'm 34 weeks and the baby has hardly moved all day", "I haven't felt my baby kick since yesterday",
              "type 1 and ketones are high, belly pain, sick and breathing deeply"]:
        assert is_emergency(t), t
    for t in ["baby shower on saturday, not moving house though", "my mum is diabetic and checks her sugar twice a day",
              "baby kicked all evening, so active tonight"]:
        assert not is_emergency(t), t

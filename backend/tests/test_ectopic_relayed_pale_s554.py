from app.services import output_guard as g


def test_early_pregnancy_one_side_pain_pale():
    assert g.is_emergency("my wife is 9 weeks and has bad pain on her right side and has gone very pale")
    assert g.is_emergency("she is pregnant, sharp pain on the left side, looks very pale")


def test_usual_notes_stay_quiet():
    for t in ["period pain on my right side like usual, a bit pale from the winter",
              "pregnant and my skin is pale in winter, no pain",
              "ovulation twinge on the left side, mild, i am pale as always"]:
        assert not g.is_emergency(t), t

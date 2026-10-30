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

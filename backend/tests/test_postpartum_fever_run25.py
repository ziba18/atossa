"""run25: childbirth counts as a recent procedure for the procedure + fever rule; speech-to-text "c section"."""
from app.services.output_guard import is_emergency


def test_birth_plus_fever_is_urgent():
    assert is_emergency("um so i had the baby like nine days ago and now i've got a really high temperature and i'm shaking all over")
    assert is_emergency("uh since the c section last week i've been burning up hot and cold and the cut is all red and smelly")


def test_birth_without_fever_or_old_fever_stays_quiet():
    assert not is_emergency("um had the baby three weeks ago and i'm just really tired you know feeding every two hours")
    assert not is_emergency("gave birth two years ago and had a fever from the cold last week")

"""'seizer' is a misspelling of seizure only when it is not the noun 'seizer of ...'."""
from app.services import output_guard as g

QUIET = [
    "the seizer of the keys by the landlord stressed me out, mild headache 3",
    "seizer of the day, tired, pain 3 in lower back",
]
URGENT = [
    "seizer last night, lost time",
    "i had a seizer today and bit my tongue",
]


def test_noun_seizer_of_is_quiet():
    for t in QUIET:
        assert not g.is_emergency(t), t


def test_misspelled_seizer_still_urgent():
    for t in URGENT:
        assert g.is_emergency(t), t

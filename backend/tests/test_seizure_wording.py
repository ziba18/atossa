from app.services.output_guard import is_emergency

URGENT = [
    "my sister is having a seizure and it won't stop",
    "she is having her first ever fit and is shaking on the floor",
    "had another seizure and he isn't waking up",
]
QUIET = [
    "the dog had a fit of the zoomies",
    "my fit bit says I slept badly",
    "that joke gave me the giggles and a fit of laughter",
]


def test_seizure_with_a_sign_is_flagged():
    for t in URGENT:
        assert is_emergency(t), t


def test_seizure_talk_without_a_sign_is_quiet():
    for t in QUIET:
        assert not is_emergency(t), t

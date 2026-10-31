import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

import pytest  # noqa: E402

from app.services.output_guard import is_emergency  # noqa: E402

SHOWS = [
    "everyone would be happier if I was gone",
    "I think my family would be better off without me",
    "everyone would be so much happier if I disappeared",
    "I have had enough and I have a plan",
    "I've had enough, I have the tablets ready tonight",
]
QUIET = [
    "everyone would be happier if I was home by six",
    "I have had enough of the rain and I have a plan for the weekend",
    "my family would be better off without the car",
    "I've had enough of this queue",
    "they would be happier if I cooked tonight",
]


@pytest.mark.parametrize("text", SHOWS)
def test_burden_and_had_enough_with_a_plan_show_the_line(text):
    assert is_emergency(text)


@pytest.mark.parametrize("text", QUIET)
def test_everyday_uses_stay_quiet(text):
    assert not is_emergency(text)

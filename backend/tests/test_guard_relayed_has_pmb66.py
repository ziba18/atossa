"""PM-B66 (run42): someone else's sign said with present 'has/have (got)', and someone else's suicidal words in reported speech."""
import pytest

from app.services.output_guard import _emergency_kind

URGENT = [
    ("my partner has got pain in her chest that spreads up into her jaw", "emergency"),
    ("my sister told me she doesn't want to be here anymore", "self_harm"),
    ("my son says everyone would be better off without him", "self_harm"),
]
QUIET = [
    "he has always had a lopsided smile",
    "she has been fine since her heart check last year",
    "my sister has period cramps spreading to her back",
    "my mum has got a cold and a bit of a tight chest when she coughs",
    "my son says his tummy hurts after lunch",
    "my flatmate says she can't be bothered to cook tonight",
    "My mum said she'd kill herself laughing if she saw my hot water bottle collection",
    "my sister said years ago that she wanted to die",
]


@pytest.mark.parametrize("text,kind", URGENT)
def test_relayed_fires(text, kind):
    got = _emergency_kind(text)
    assert got is not None and (got == "self_harm") == (kind == "self_harm")


@pytest.mark.parametrize("text", QUIET)
def test_relayed_quiet(text):
    assert _emergency_kind(text) is None

import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

import pytest  # noqa: E402

from app.services.output_guard import is_emergency  # noqa: E402


@pytest.mark.parametrize("text", [
    "I can't stop the bleeding",
    "bleeding for hours and wont stop",
    "I'm losing a lot of blood",
    "the toilet water turned red",
    "red toilet water",
    "I'm breathing very fast",
    "I'm confused and not making sense",
    "a rash that does not fade when I press it",
    "my skin is blotchy",
    "I think I might have sepsis",
    "pain under my right ribs and in my right shoulder",
    "very high temperature with chills and pelvic pain",
    "very dizzy and looking pale and I might be pregnant",
    "I had a tampon in and now I have a fever and vomiting",
    "high temperature, dizzy, and I'm using a tampon",
    "a rash that doesn't fade under a glass",
    "bright red palms and a sandpaper rash",
    "the toilet bowl was full of blood",
    "blood filled the toilet",
    "a lot of blood in the toilet",
])
def test_bleeding_that_will_not_stop_is_urgent(text):
    assert is_emergency(text)


@pytest.mark.parametrize("text", [
    "my period is late",
    "there was blood in the toilet",
    "I cleaned the toilet",
    "I jogged and was breathing fast for a minute",
    "I had a cold last week",
    "I had a fever and chills last week",
    "pain in my right shoulder from the gym",
    "I might be pregnant",
    "I use tampons on heavy days",
    "I have a fever",
    "I have a rash on my arm",
    "I had a bleed last week that stopped",
    "bleeding on and off, it didn't stop when I rested",
])
def test_ordinary_bleeding_words_are_not_urgent(text):
    assert not is_emergency(text)

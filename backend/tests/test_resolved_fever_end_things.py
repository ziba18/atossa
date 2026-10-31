import pytest
from app.services.output_guard import is_emergency

QUIET = [
    "Had a fever 38 last week with a cold, over now. Period pain today 5.",
    "fever last week, gone now, period pain 6 today",
    "my friend said she wants to end things with her boyfriend, I'm worried about her relationship",
    "I'm going to end things with my partner this weekend, stressed",
    "my dog collapsed at the park but the vet says he's fine",
    "our cat had a fit last night, vet booked, I'm anxious and tired",
]
LIVE = [
    "I have a fever of 39 and bad period pain",
    "fever came back today and my pelvic pain is worse",
    "I want to end things",
    "he said he wants to end things tonight",
    "I'm thinking of ending things, I have the tablets ready",
    "my dog collapsed and I'm having chest pain spreading to my arm",
    "my dog collapsed and now I can't breathe",
]


@pytest.mark.parametrize("note", QUIET)
def test_quiet(note):
    assert not is_emergency(note)


@pytest.mark.parametrize("note", LIVE)
def test_live(note):
    assert is_emergency(note)

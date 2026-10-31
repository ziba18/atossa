"""PM-B74 (run43): hopeless/worthless and trapped/no-way-out (samaritans.org/difficultconversations signs list, read 31 Oct 2026)
show the self-harm line; everyday uses of the same words stay quiet. Own lines, written before the code (tuned, not fresh)."""
import pytest

from app.services.output_guard import is_emergency

URGENT = [
    "I feel completely worthless, like I'm just a waste of space",
    "I'm worthless and everyone would be fine if I wasn't around",
    "I feel so hopeless, nothing is ever going to get better for me",
    "there's no hope left for me anymore",
    "I feel trapped in my life and I can't see any way out",
    "I can't escape my own thoughts and I don't know how much longer I can do this",
    "my sister keeps saying she feels worthless and there's no way out",
    "he told me he feels hopeless and trapped and can't see a way out of it",
    "I feel like a burden and totally worthless to everyone",
    "I'm stuck in my head and I can't see a way out of this, it's never going to end",
]
QUIET = [
    "I'm hopeless at remembering to take my pill",
    "felt a bit hopeless about the waiting list today but the GP rang back",
    "trapped wind again, bloated and sore",
    "stuck in traffic for an hour, cramps were bad",
    "I couldn't see a way out of the meeting so I took paracetamol at my desk",
    "feeling tearful and tired, finding it hard to cope with work this week",
    "my phone is worthless since it broke, couldn't log my pain",
    "the pain feels like it's never going to end today, 7/10, heat pad helps",
    "escape room with friends was fun even with cramps",
    "helpless feeling when the pain hits but it passed after an hour",
]


@pytest.mark.parametrize("text", URGENT)
def test_fires(text):
    assert is_emergency(text)


@pytest.mark.parametrize("text", QUIET)
def test_quiet(text):
    assert not is_emergency(text)

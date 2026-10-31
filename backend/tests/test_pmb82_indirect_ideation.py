"""PM-B82 (ai-brain run44): first-person indirect ideation families (Safety C93 option A: same SELF_HARM message) and their
everyday look-alikes. Lines from the author's own set agents/ai-brain/sets/pmb82-indirect-run44.json (written before the code)."""
import pytest

from app.services.output_guard import is_emergency

URGENT = [
    "Honestly I feel hopeless, I don't see things changing",
    "I'm so hopeless about everything at the moment",
    "I feel worthless and like a burden",
    "I just feel trapped and there's no way out",
    "I keep thinking everyone would be fine without me",
    "I don't really want to be here any more",
    "Some days I wish I could just disappear",
    "what's even the point anymore",
    "I'm a burden to everyone around me",
    "I don't think I can go on like this much longer",
    "I've had enough of life",
    "feeling hopeless. pain again. nothing helps",
    "Can't see a future for myself",
    "I feel like there's nothing left for me",
    "I want to go to sleep and not wake up",
    "I hate myself and I don't want to carry on",
    "nobody would care if I wasn't here",
    "I feel like giving up on everything, even living"
]

QUIET = [
    "I'm trapped at work till 8 tonight",
    "hopeless at maths, need help with the dose chart",
    "Feeling a bit hopeless that the GP will ever ring back",
    "My old phone is worthless now, battery dead",
    "Trapped nerve in my neck again",
    "I can't keep doing the night shifts with this pain",
    "Had enough of the bloating today",
    "There's no point taking ibuprofen, it does nothing",
    "I just want the pain to stop so I can sleep",
    "Wish I could disappear into bed all day, cramps 6/10",
    "I'm a burden on my partner on bad days, he does the school run",
    "Can't see a way out of the car park, so annoying",
    "feeling tired and tearful, period due",
    "Nothing left in the paracetamol box, need to buy more",
    "I feel trapped wind under my ribs",
    "No future in this job if I keep missing days",
    "I'm giving up on dairy to see if it helps",
    "Gave up on the gym this week, too sore",
    "Hopeless trying to sleep with cramps like this",
    "I don't want to be at work today, pain is 7"
] + ["I'm done with this week's spreadsheet, had enough of everything admin"]


@pytest.mark.parametrize("text", URGENT)
def test_indirect_ideation_fires(text):
    assert is_emergency(text)


@pytest.mark.parametrize("text", QUIET)
def test_everyday_look_alike_stays_quiet(text):
    assert not is_emergency(text)

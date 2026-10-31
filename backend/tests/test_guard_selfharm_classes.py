"""B61/B62 (run41): self-harm acts said in plain words show the self-harm line; adherence with 'all' / 'every' stays quiet."""
import pytest

from app.services.output_guard import emergency_kind

SELF_HARM = [
    "I cut myself on purpose and the bleeding just keeps coming",
    "my brother swallowed a pile of pills and he's throwing up",
    "I've been saving my tablets for weeks and I'm going to take them later tonight",
    "he texted me goodbye and said I won't be around much longer, look after the dog",
    "found my dad really drowsy next to empty blister packs",
    "he's locked in his room with a bottle of pills and won't open the door",
    "she took my tramadol and texted me sorry for everything",
    "I'm standing at the edge of the bridge right now",
    "after tonight none of this will matter, the pills are lined up on the table",
]

ADHERENCE_QUIET = [
    "took all my tablets today like I'm supposed to",
    "took every tablet on time this week, proud of myself",
    "remembered to take all my pills before work",
    "took all my tablets with breakfast",
]

OTHER_QUIET = [
    "taking the old tablets back to the pharmacy to get rid of them",
    "I accidentally took a double dose of my pill this morning and rang 111",
    "standing at the edge of the pool waiting for my swim lesson",
    "after tonight's shift I won't be around till Monday",
    "my sister locked herself in the bathroom to cry after the argument",
    "cut myself shaving and it took ages to stop",
]


@pytest.mark.parametrize("text", SELF_HARM)
def test_self_harm_classes_show_the_self_harm_line(text):
    assert emergency_kind(text) == "self_harm"


@pytest.mark.parametrize("text", ADHERENCE_QUIET + OTHER_QUIET)
def test_routine_and_everyday_lines_stay_quiet(text):
    assert emergency_kind(text) is None


def test_adherence_words_do_not_quiet_an_amount():
    assert emergency_kind("took 30 of my tablets today") == "self_harm"
    assert emergency_kind("took all my tablets at once today and feel sick") == "self_harm"

"""'my back is killing me' is pain, not self-harm (PM repro 2026-10-27 21:52); same lines as scripts/ai-eval/urgent-idiom-killing.test.mjs."""
import pytest
from app.services.output_guard import emergency_kind

IDIOMS = [
    "My lower back is killing me and my legs feel heavy.",
    "Absolutely knackered and my lower back is killing me.",
    "Got the monthlies and my back is killing me.",
    "Me tum is killing me today",
    "No pain during sex but my back has been killing me.",
    "my stomache is killing me on the right",
    "my back’s killing me",
    "my head has been absolutely killing me all week",
]
SELF = ["I want to kill myself", "its killing me i want it to end", "my head is telling me to kill myself",
        "I think I want to die, the pain never stops", "my back is killing me and I want to kill myself"]


@pytest.mark.parametrize("t", IDIOMS)
def test_body_part_killing_me_is_not_self_harm(t):
    assert emergency_kind(t) != "self_harm"


@pytest.mark.parametrize("t", SELF)
def test_self_harm_kept(t):
    assert emergency_kind(t) == "self_harm"


@pytest.mark.parametrize("t", ["i've thought about taking my own life", "my side is killing me and I have thought about taking my own life"])
def test_taking_my_own_life(t):
    assert emergency_kind(t) == "self_harm"


@pytest.mark.parametrize("t", ["i tried to kill myself last year and i want to do it again", "i used to self harm and the urge is back",
                               "two years ago i overdosed and im thinking about doing it again tonight",
                               "i self harmed as a teenager and today i cut myself again"])
def test_past_attempt_plus_present_intent(t):
    assert emergency_kind(t) == "self_harm"


def test_past_only_stays_quiet():
    assert emergency_kind("i self harmed as a teenager, not since") is None

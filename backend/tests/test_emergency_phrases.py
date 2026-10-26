import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

from app.services.output_guard import is_emergency  # noqa: E402

# Second phrase set, written after the first round of pattern changes (then fixed to pass).
EMERGENCY = ["I'm gushing blood and my head is spinning", "I can't stop shaking and the pain is agony", 'I nearly blacked out in the shop', "severe stabbing pain in my side and I'm vomiting", 'I keep thinking about ending my life', 'I can hardly breathe', "i feel like i'm going to collapse", 'Pain is a 10 out of 10 and not easing', 'bleeding through my clothes every hour', "I'm pregnant and I've got sharp pain", 'I overdosed on paracetamol', "I'm coughing up blood", "I think I'm having a miscarriage", "it's the worst pain of my life", 'I woke up in a pool of blood']
ORDINARY = ['My pain was a 7 on Tuesday', "I've been feeling low since the diagnosis", 'heavy periods since I was 15', 'bloating gets worse before my period', 'My GP said the pain could be linked to my cycle', 'I felt dizzy after standing up fast', 'I bled for 8 days last month', "I'm tired all the time and my back aches", 'Can I add a note about my appointment', 'the cramps woke me up last night', 'my friend is pregnant', 'I was told I might need a scan', 'sharp pain once when I coughed', "I'm worried about the wait for my referral"]


def test_second_set_of_emergency_phrases_is_caught():
    missed = [t for t in EMERGENCY if not is_emergency(t)]
    assert not missed, missed


def test_second_set_of_ordinary_phrases_is_not_flagged():
    flagged = [t for t in ORDINARY if is_emergency(t)]
    assert not flagged, flagged

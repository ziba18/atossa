from app.services import output_guard as g


def test_mening_urgent():
    for line in ["toddler very sleepy with a high temp, rash that wont fade and cries when picked up",
                 "killer headache, hates the light, neck wont move, shivering and sick"]:
        assert g.is_emergency(line), line


def test_mening_quiet():
    for line in ["pink rash that fades when pressed, heat rash from the weather",
                 "neck stiff after the gym, sore trapezius",
                 "hangover headache, light sensitive, dry mouth"]:
        assert not g.is_emergency(line), line

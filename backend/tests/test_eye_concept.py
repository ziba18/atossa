from app.services import output_guard as g


def test_eye_urgent():
    for line in ["my left eye is red and really painful and everything looks hazy since this afternoon",
                 "suddenly seeing halos around lights and my eye aches, feel sick too",
                 "woke up with a red painful eye and blurred vision, feel nauseous",
                 "my eye is red and painful and hazy since this morning"]:
        assert g.is_emergency(line), line


def test_eye_quiet():
    for line in ["eyes tired and a bit dry from screens all day", "hayfever, eyes red and itchy, sneezing",
                 "new glasses and my vision is blurry until i adjust, headache",
                 "saw halos around lights after my eye test dilated my pupils",
                 "sore eyes, feeling sick, vision a bit hazy after the flight",
                 "hazy vision and eye ache after migraine aura"]:
        assert not g.is_emergency(line), line

from app.services import output_guard as g


def test_mouth_swelling_urgent():
    for line in ["probably an allergy but my tongue feels like its getting bigger",
                 "after the antibiotic my lips went huge within the hour",
                 "my lips ballooned in about ten minutes after the injection",
                 "i ate prawns and my lips are swelling up fast"]:
        assert g.is_emergency(line), line


def test_mouth_swelling_quiet():
    for line in ["itchy lips after trying a new lip balm", "lip filler last week still a bit swollen",
                 "my face is puffy after the flight", "mouth ulcer making my tongue sore",
                 "lips swollen from the dentist yesterday"]:
        assert not g.is_emergency(line), line

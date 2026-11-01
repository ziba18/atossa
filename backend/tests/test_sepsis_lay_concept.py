from app.services import output_guard as g


def test_sepsis_lay_urgent():
    for line in ["wound after my c-section is hot and weeping, i have chills and feel awful and dizzy",
                 "so cold and shaky with a high temp, breathing fast, feel like something is very wrong",
                 "cut on my foot is red and hot with a line up my leg, i have a fever and feel so ill"]:
        assert g.is_emergency(line), line


def test_sepsis_lay_quiet():
    for line in ["fever 39 with tonsillitis, feel awful, on antibiotics from the gp",
                 "feeling awful after my jab, chills and a high temp, aching",
                 "shaking with nerves before my interview, heart racing",
                 "wound from my op is a bit itchy and pink, healing well, no fever"]:
        assert not g.is_emergency(line), line

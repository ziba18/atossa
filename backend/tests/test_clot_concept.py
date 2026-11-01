from app.services import output_guard as g


def test_clot_urgent():
    for line in ["mum has one swollen painful leg and now she says she cant get her breath",
                 "started on a new contraceptive and now one leg is hot swollen and throbbing",
                 "my thigh is swollen and painful after the c-section and im struggling to catch my breath"]:
        assert g.is_emergency(line), line


def test_clot_quiet():
    for line in ["calf cramp last night, gone this morning, stretched it",
                 "swollen ankles at the end of the day in the heat, both sides",
                 "pulled calf playing football, bruised and sore, no swelling",
                 "flew back yesterday, tired and jet lagged, legs fine"]:
        assert not g.is_emergency(line), line

from app.services import output_guard as g


def test_pillow_is_not_a_pill():
    assert not g.is_emergency("my lips are a bit puffy in the morning, think its the new pillow")
    assert g.is_emergency("my lips swelled up after the new pills i started today")


def test_swollen_glands_are_not_a_swollen_throat():
    assert not g.is_emergency("sore throat and swollen glands, temp 38, tired")
    assert g.is_emergency("my throat feels swollen and tight")

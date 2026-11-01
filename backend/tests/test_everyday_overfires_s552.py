from app.services import output_guard as g


def test_pillow_is_not_a_pill():
    assert not g.is_emergency("my lips are a bit puffy in the morning, think its the new pillow")
    assert g.is_emergency("my lips swelled up after the new pills i started today")


def test_swollen_glands_are_not_a_swollen_throat():
    assert not g.is_emergency("sore throat and swollen glands, temp 38, tired")
    assert g.is_emergency("my throat feels swollen and tight")


def test_bitten_tongue_and_cartoon_stay_quiet():
    assert not g.is_emergency("bit my tongue and it is swollen and sore")
    assert not g.is_emergency("he is not responding because he is watching Peppa Pig")
    assert g.is_emergency("my tongue is swollen and my throat is closing")


def test_coffee_grounds_wordings():
    for t in ["i threw up and it looked like coffee granules", "i was sick and it looked like ground coffee", "sick was dark brown, coffee-ground stuff"]:
        assert g.is_emergency(t), t
    for t in ["i drink ground coffee every morning and it was fine", "love the smell of coffee granules"]:
        assert not g.is_emergency(t), t

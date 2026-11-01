from app.services import output_guard as g


def test_infant_hot_to_touch_urgent():
    for line in ["my 2 month old feels burning hot and wont stop crying, nothing settles her",
                 "baby is 6 weeks and feels really hot to touch and is breathing quickly",
                 "newborn feels cold and mottled and is sleeping through all her feeds"]:
        assert g.is_emergency(line), line


def test_infant_warm_quiet():
    for line in ["my 8 month old is teething, a bit grizzly and warm cheeks",
                 "baby is hot after her nap in the warm room, drinking fine and smiling",
                 "toddler had her jabs yesterday and is a bit warm and clingy but eating"]:
        assert not g.is_emergency(line), line

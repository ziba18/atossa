from app.services import output_guard as g


def test_vision_trouble_without_sudden():
    assert g.is_emergency("my dad says he cant see properly out of one eye since an hour ago")
    assert g.is_emergency("everything went dim in both eyes and my head is pounding")


def test_everyday_eye_notes_quiet():
    for t in ["cant see properly out of one eye with my new contacts, since this morning",
              "vision went dim in both eyes when i stood up fast, head is pounding from the heat, usual for me"]:
        assert not g.is_emergency(t), t

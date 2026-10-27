from app.services.output_guard import reply_shape


def test_ok_shape():
    assert reply_shape("That sounds sore. Where exactly do you feel it?") == []


def test_too_long():
    assert "too_long" in reply_shape("One. Two. Three. Four. Five.")


def test_many_questions():
    assert reply_shape("Where is it? How long?") == ["many_questions"]


def test_empty():
    assert reply_shape("  ") == ["empty"]

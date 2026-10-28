import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

from app.services.output_guard import emergency_kind  # noqa: E402


def test_body_part_killing_me_is_pain_not_self_harm():
    for t in ["ovary on the left is killing me", "my belly's been killing me since lunch", "my left hip is killing me"]:
        assert emergency_kind(t) != "self_harm", t


def test_self_injury_and_doubt_get_the_self_harm_line():
    for t in ["i cut myself last night after the pain", "not sure i want to carry on living"]:
        assert emergency_kind(t) == "self_harm", t


def test_wanting_a_baby_is_not_being_pregnant():
    assert emergency_kind("Pain during sex again and we've been trying to get pregnant since March.") is None
    assert emergency_kind("I'm pregnant and I have sharp pain on one side") is not None

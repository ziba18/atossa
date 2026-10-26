import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.services.password_policy import password_problem  # noqa: E402


def test_422_does_not_echo_the_submitted_value():
    r = TestClient(app).post("/auth/register", json={"email": "not-an-email", "password": "my-secret-pw-123"})
    assert r.status_code == 422
    assert "my-secret-pw-123" not in r.text and "not-an-email" not in r.text
    assert r.json()["detail"][0]["loc"]


def test_nul_character_in_password_is_refused_not_a_server_error():
    assert password_problem("abcdefgh\x00ijk")


def test_wrong_kind_of_password_just_fails_to_verify():
    from app.services.auth import hash_password, verify_password
    assert verify_password("abc\x00def", hash_password("abcdefgh1234")) is False

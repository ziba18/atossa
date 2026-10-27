import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

from app.services import auth as auth_service  # noqa: E402


def test_unknown_email_still_runs_a_password_hash(monkeypatch):
    calls = []
    real = auth_service.verify_password
    monkeypatch.setattr(auth_service, "verify_password", lambda p, h: calls.append(h) or real(p, h))
    assert auth_service.verify_password_or_dummy("whatever-123", None) is False
    assert calls and calls[0].startswith(("$2", "$bcrypt-sha256$"))


def test_known_user_still_verifies():
    h = auth_service.hash_password("right-password-1")
    assert auth_service.verify_password_or_dummy("right-password-1", h) is True
    assert auth_service.verify_password_or_dummy("wrong-password-1", h) is False
    assert auth_service.verify_password_or_dummy("anything-at-all", "") is False

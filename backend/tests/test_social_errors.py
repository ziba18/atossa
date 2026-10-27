import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

import pytest  # noqa: E402
from fastapi import HTTPException  # noqa: E402

from app.routers.auth import login_with_apple  # noqa: E402
from app.schemas.auth import SocialAuthRequest  # noqa: E402


def test_garbage_apple_token_gets_a_plain_message(monkeypatch):
    from app.routers import auth as auth_router
    from app.services.social_auth import SocialAuthError

    def boom(*a, **k):
        raise SocialAuthError("Invalid Apple identity token: Invalid header padding")
    monkeypatch.setattr(auth_router, "verify_apple_identity_token", boom)
    with pytest.raises(HTTPException) as e:
        login_with_apple(SocialAuthRequest(id_token="not.a.token"), db=None)
    assert e.value.status_code == 401
    assert e.value.detail == "Apple sign-in failed"


def test_helpful_messages_still_pass_through(monkeypatch):
    from app.routers import auth as auth_router
    from app.services.social_auth import SocialAuthError

    def boom(*a, **k):
        raise SocialAuthError("Apple did not confirm this email address")
    monkeypatch.setattr(auth_router, "verify_apple_identity_token", boom)
    with pytest.raises(HTTPException) as e:
        login_with_apple(SocialAuthRequest(id_token="x.y.z"), db=None)
    assert e.value.detail == "Apple did not confirm this email address"

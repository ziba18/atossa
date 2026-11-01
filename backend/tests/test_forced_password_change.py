"""PM-B158: after a one-time password, data routes answer 403 password_change_required (token kept) until she changes it."""
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.dependencies import PASSWORD_CHANGE_EXEMPT, require_password_ok
from app.main import app
from app.routers.auth import change_password
from app.schemas.auth import ChangePasswordRequest
from app.services.auth import hash_password


def req(path):
    return SimpleNamespace(url=SimpleNamespace(path=path))


def u(flag):
    return SimpleNamespace(id="u1", email="sam.jones@example.com", must_change_password=flag, hashed_password=hash_password("temp-pass-1234"), token_version=1)


@pytest.mark.parametrize("path", ["/records", "/me", "/connections", "/chat"])
def test_flagged_user_gets_403_detail_not_401(path):
    with pytest.raises(HTTPException) as e:
        require_password_ok(req(path), u(True))
    assert e.value.status_code == 403 and e.value.detail == "password_change_required"


@pytest.mark.parametrize("path", PASSWORD_CHANGE_EXEMPT)
def test_exempt_routes_and_unflagged_users_pass(path):
    assert require_password_ok(req(path), u(True)).id == "u1"
    assert require_password_ok(req("/records"), u(False)).id == "u1"


def test_change_password_clears_the_flag():
    user = u(True)
    change_password(ChangePasswordRequest(current_password="temp-pass-1234", new_password="my-own-pass-5678"),
                    db=SimpleNamespace(commit=lambda: None), current_user=user)
    assert user.must_change_password is False


def test_routes_through_the_app():
    """End to end through FastAPI: a flagged token gets 403 password_change_required on data routes, never 401."""
    from fastapi.testclient import TestClient

    from app.dependencies import get_current_user
    app.dependency_overrides[get_current_user] = lambda: u(True)
    try:
        c = TestClient(app)
        for path in ("/records", "/me"):
            r = c.get(path, headers={"Authorization": "Bearer x"})
            assert r.status_code == 403 and r.json()["detail"] == "password_change_required", (path, r.status_code)
        r = c.get("/auth/me", headers={"Authorization": "Bearer x"})
        assert r.status_code == 200 and r.json()["must_change_password"] is True
    finally:
        app.dependency_overrides.clear()

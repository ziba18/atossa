from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from app.dependencies import get_current_user
from app.routers.auth import change_password, logout_all, refresh
from app.schemas.auth import ChangePasswordRequest, RefreshRequest
from app.services.auth import create_access_token, create_refresh_token, decode_claims, hash_password


class Db:
    def __init__(self, user):
        self.user = user
        self.committed = False

    def query(self, *a):
        return self

    def filter(self, *a, **k):
        return self

    def first(self):
        return self.user

    def commit(self):
        self.committed = True


def user(version=0):
    return SimpleNamespace(id="u1", is_active=True, token_version=version, hashed_password=hash_password("old-password-1"))


def bearer(token):
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)


def test_tokens_carry_the_version():
    assert decode_claims(create_access_token("u1", 3)) == ("u1", 3)
    assert decode_claims(create_refresh_token("u1", 2), "refresh") == ("u1", 2)


def test_old_tokens_stop_working_after_a_bump():
    u = user(version=1)
    old_access, old_refresh = create_access_token("u1", 0), create_refresh_token("u1", 0)
    with pytest.raises(HTTPException) as e:
        get_current_user(bearer(old_access), Db(u))
    assert e.value.status_code == 401
    with pytest.raises(HTTPException):
        refresh(RefreshRequest(refresh_token=old_refresh), db=Db(u))


def test_current_version_still_works():
    u = user(version=1)
    assert get_current_user(bearer(create_access_token("u1", 1)), Db(u)) is u


def test_tokens_without_ver_count_as_version_zero():
    import jwt
    from app.config import settings
    legacy = jwt.encode({"sub": "u1", "type": "access", "exp": 9999999999}, settings.secret_key, algorithm=settings.algorithm)
    assert get_current_user(bearer(legacy), Db(user(0))).id == "u1"
    with pytest.raises(HTTPException):
        get_current_user(bearer(legacy), Db(user(1)))


def test_logout_all_and_change_password_bump_the_version():
    u = SimpleNamespace(id="u1", is_active=True, token_version=0, hashed_password=hash_password("old-password-1"))
    logout_all(db=Db(u), current_user=u)
    assert u.token_version == 1
    out = change_password(ChangePasswordRequest(current_password="old-password-1", new_password="new-password-22"), db=Db(u), current_user=u)
    assert u.token_version == 2
    # the device that changed the password gets a working session for the new version
    assert decode_claims(out.access_token) == ("u1", 2)
    assert decode_claims(out.refresh_token, "refresh") == ("u1", 2)

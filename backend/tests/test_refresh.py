from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from app.models import UsedRefreshToken
from app.routers.auth import refresh
from app.schemas.auth import RefreshRequest
from app.services.auth import create_access_token, create_refresh_token, decode_token


class FakeQuery:
    def __init__(self, user, model=None):
        self.user = user
        self.model = model

    def delete(self, *a, **k):
        return 0

    def filter(self, *a, **k):
        return self

    def first(self):
        return None if self.model is UsedRefreshToken else self.user


class FakeDb:
    def __init__(self, user):
        self.user = user

    def query(self, model=None):
        return FakeQuery(self.user, model)

    def add(self, *a):
        pass

    def commit(self):
        pass


def call(token, user):
    return refresh(RefreshRequest(refresh_token=token), db=FakeDb(user))


def test_refresh_returns_new_pair_for_existing_user():
    out = call(create_refresh_token("u1"), SimpleNamespace(id="u1", is_active=True, token_version=0))
    assert decode_token(out.access_token) == "u1"
    assert decode_token(out.refresh_token, "refresh") == "u1"


def test_access_token_cannot_refresh():
    with pytest.raises(HTTPException) as e:
        call(create_access_token("u1"), SimpleNamespace(id="u1", is_active=True, token_version=0))
    assert e.value.status_code == 401


def test_deleted_user_cannot_refresh():
    with pytest.raises(HTTPException) as e:
        call(create_refresh_token("gone"), None)
    assert e.value.status_code == 401


def test_garbage_token_rejected():
    with pytest.raises(HTTPException):
        call("not.a.jwt", SimpleNamespace(id="u1", is_active=True, token_version=0))


def test_deactivated_user_cannot_refresh():
    with pytest.raises(HTTPException) as e:
        call(create_refresh_token("u1"), SimpleNamespace(id="u1", is_active=False, token_version=0))
    assert e.value.status_code == 401

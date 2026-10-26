from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from app.routers.auth import change_password
from app.schemas.auth import ChangePasswordRequest
from app.services.auth import hash_password, verify_password


class FakeDb:
    committed = False

    def commit(self):
        self.committed = True


def user(pw="old-password-1"):
    return SimpleNamespace(hashed_password=hash_password(pw) if pw else None, token_version=0)


def call(u, cur, new):
    db = FakeDb()
    change_password(ChangePasswordRequest(current_password=cur, new_password=new), db=db, current_user=u)
    return db


def test_changes_password_when_current_is_right():
    u = user()
    assert call(u, "old-password-1", "new-password-2").committed
    assert verify_password("new-password-2", u.hashed_password)


@pytest.mark.parametrize("cur,new", [("wrong-password", "new-password-2"), ("old-password-1", "short"), ("old-password-1", "old-password-1")])
def test_rejects_bad_requests_and_keeps_old_password(cur, new):
    u = user()
    with pytest.raises(HTTPException) as e:
        call(u, cur, new)
    assert e.value.status_code == 400
    assert verify_password("old-password-1", u.hashed_password)


def test_social_only_account_cannot_use_it():
    with pytest.raises(HTTPException):
        call(user(None), "x", "new-password-2")

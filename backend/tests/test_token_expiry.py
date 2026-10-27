import os
from datetime import datetime, timedelta, timezone

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

import jwt
import pytest
from fastapi import HTTPException

from app.config import settings
from app.routers.auth import refresh
from app.schemas.auth import RefreshRequest
from app.services.auth import create_access_token, create_refresh_token, decode_token


def _expired(kind: str) -> str:
    past = datetime.now(timezone.utc) - timedelta(seconds=5)
    return jwt.encode({"sub": "u1", "exp": past, "type": kind, "ver": 0, "jti": "x"}, settings.secret_key, algorithm=settings.algorithm)


def test_lifetimes_are_as_documented():
    assert settings.access_token_expire_minutes == 60
    assert settings.refresh_token_expire_days == 30


def test_expired_access_token_is_not_accepted():
    assert decode_token(create_access_token("u1")) == "u1"
    with pytest.raises(jwt.PyJWTError):
        decode_token(_expired("access"))


def test_expired_refresh_token_is_rejected():
    with pytest.raises(HTTPException) as e:
        refresh(RefreshRequest(refresh_token=_expired("refresh")), db=None)
    assert e.value.status_code == 401

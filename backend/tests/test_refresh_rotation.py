import os
from datetime import datetime, timedelta, timezone

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

import pytest  # noqa: E402
from fastapi import HTTPException  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

from app.database import Base  # noqa: E402
import app.models  # noqa: E402,F401
from app.models import UsedRefreshToken, User  # noqa: E402
from app.routers.auth import refresh  # noqa: E402
from app.schemas.auth import RefreshRequest  # noqa: E402
from app.services.auth import create_refresh_token, create_user, refresh_token_claims  # noqa: E402


def _db():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)()


def _refresh(db, token):
    return refresh(RefreshRequest(refresh_token=token), db=db)


def _age_use(db, token, seconds):
    jti, _ = refresh_token_claims(token)
    row = db.query(UsedRefreshToken).filter_by(jti=jti).first()
    row.used_at = datetime.now(timezone.utc) - timedelta(seconds=seconds)
    db.commit()


def test_new_pair_works_and_the_old_token_is_recorded():
    db = _db()
    u = create_user(db, "a@example.com", "first-password-1")
    old = create_refresh_token(u.id, 0)
    out = _refresh(db, old)
    assert out.refresh_token != old
    assert db.query(UsedRefreshToken).count() == 1
    _refresh(db, out.refresh_token)  # the chain keeps working


def test_retry_within_the_grace_window_is_not_treated_as_theft():
    db = _db()
    u = create_user(db, "a@example.com", "first-password-1")
    old = create_refresh_token(u.id, 0)
    _refresh(db, old)
    _refresh(db, old)
    db.refresh(u)
    assert u.token_version == 0


def test_reuse_after_the_grace_window_signs_the_account_out_everywhere():
    db = _db()
    u = create_user(db, "a@example.com", "first-password-1")
    old = create_refresh_token(u.id, 0)
    newer = _refresh(db, old).refresh_token
    _age_use(db, old, 60)
    with pytest.raises(HTTPException) as e:
        _refresh(db, old)
    assert e.value.status_code == 401
    db.refresh(u)
    assert u.token_version == 1
    with pytest.raises(HTTPException):  # the thief's and the owner's newer token both stop working
        _refresh(db, newer)


def test_expired_rows_are_cleared_on_refresh():
    db = _db()
    u = create_user(db, "a@example.com", "first-password-1")
    db.add(UsedRefreshToken(jti="old", user_id=u.id, expires_at=datetime.now(timezone.utc) - timedelta(days=1)))
    db.commit()
    _refresh(db, create_refresh_token(u.id, 0))
    assert db.query(UsedRefreshToken).filter_by(jti="old").count() == 0


def test_tokens_without_an_id_still_refresh():
    from jwt import encode
    from app.config import settings
    db = _db()
    u = create_user(db, "a@example.com", "first-password-1")
    exp = datetime.now(timezone.utc) + timedelta(days=1)
    legacy = encode({"sub": u.id, "exp": exp, "type": "refresh", "ver": 0}, settings.secret_key, algorithm=settings.algorithm)
    assert _refresh(db, legacy).access_token


def test_a_lost_race_to_record_the_same_token_is_a_retry_not_a_server_error():
    db = _db()
    u = create_user(db, "a@example.com", "first-password-1")
    tok = create_refresh_token(u.id, 0)
    jti, exp = refresh_token_claims(tok)
    other = sessionmaker(bind=db.get_bind())()
    other.add(UsedRefreshToken(jti=jti, user_id=u.id, expires_at=exp))
    other.commit()
    # the first session looked before the other one wrote: emulate by hiding the row from its lookup
    real_first = type(db.query(UsedRefreshToken)).first
    calls = {"n": 0}

    def first_hidden(self):
        calls["n"] += 1
        return None if calls["n"] == 1 and self.column_descriptions and self.column_descriptions[0]["entity"] is UsedRefreshToken else real_first(self)
    type(db.query(UsedRefreshToken)).first = first_hidden
    try:
        out = _refresh(db, tok)
    finally:
        type(db.query(UsedRefreshToken)).first = real_first
    assert out.access_token


def test_deleted_users_token_gets_401_and_no_row():
    db = _db()
    u = create_user(db, "a@example.com", "first-password-1")
    tok = create_refresh_token(u.id, 0)
    db.query(User).filter(User.id == u.id).delete()
    db.commit()
    with pytest.raises(HTTPException) as e:
        _refresh(db, tok)
    assert e.value.status_code == 401
    assert db.query(UsedRefreshToken).count() == 0

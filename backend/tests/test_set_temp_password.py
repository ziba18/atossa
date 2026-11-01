import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

import logging  # noqa: E402

import pytest  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

from app.models.user import User  # noqa: E402
from app.services.auth import hash_password, pwd_context, verify_password  # noqa: E402
from scripts.set_temp_password import ALPHABET, TempPasswordError, main, make_temp_password, set_temp_password  # noqa: E402


@pytest.fixture
def db():
    engine = create_engine("sqlite://")
    User.__table__.create(engine)
    s = sessionmaker(bind=engine)()
    s.add(User(id="u1", email="sam.jones@example.com", hashed_password=hash_password("old-password-1"), token_version=3))
    s.add(User(id="u2", email="apple.only@example.com", hashed_password=None))
    s.commit()
    yield s
    s.close()


def test_unknown_email_changes_nothing(db):
    before = {u.id: (u.hashed_password, u.token_version) for u in db.query(User)}
    with pytest.raises(TempPasswordError):
        set_temp_password(db, "nobody@example.com")
    assert {u.id: (u.hashed_password, u.token_version) for u in db.query(User)} == before


def test_success_sets_current_scheme_and_ends_sessions(db, caplog):
    with caplog.at_level(logging.WARNING, logger="atossa.security"):
        temp = set_temp_password(db, "  Sam.Jones@Example.com ")
    u = db.get(User, "u1")
    assert verify_password(temp, u.hashed_password)
    assert not verify_password("old-password-1", u.hashed_password)
    assert pwd_context.identify(u.hashed_password) == "bcrypt_sha256"
    assert u.token_version == 4
    log = caplog.text
    assert "u1" in log and temp not in log and "sam.jones" not in log.lower()


def test_social_only_account_is_refused(db):
    with pytest.raises(TempPasswordError):
        set_temp_password(db, "apple.only@example.com")
    assert db.get(User, "u2").hashed_password is None


def test_password_shape():
    p = make_temp_password()
    assert len(p) == 19 and all(c in ALPHABET for c in p.replace("-", ""))
    assert len({make_temp_password() for _ in range(50)}) == 50


def test_cli_unknown_email_exits_1(monkeypatch, db):
    import app.database as database
    monkeypatch.setattr(database, "SessionLocal", lambda: db)
    assert main(["--email", "nobody@example.com"]) == 1

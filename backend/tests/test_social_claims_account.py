import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")


from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

from app.database import Base  # noqa: E402
import app.models  # noqa: E402,F401
from app.models import SocialIdentity, User  # noqa: E402
from app.services.auth import (  # noqa: E402
    create_refresh_token, create_user, decode_claims, get_or_create_social_user, verify_password,
)


def _db():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)()


def _still_valid(db, token):
    user_id, ver = decode_claims(token, "refresh")
    user = db.query(User).filter(User.id == user_id).first()
    return user is not None and ver == user.token_version


def test_social_sign_in_clears_the_password_of_an_unconfirmed_account():
    db = _db()
    attacker = create_user(db, "victim@example.com", "attacker-chosen-pass-1")
    old_refresh = create_refresh_token(attacker.id, attacker.token_version)
    user = get_or_create_social_user(db, "victim@example.com", None, "google", "victim-sub")
    assert user.id == attacker.id
    assert user.hashed_password is None
    assert not _still_valid(db, old_refresh)


def test_old_password_no_longer_verifies():
    db = _db()
    u = create_user(db, "a@example.com", "first-password-1")
    old_hash = u.hashed_password
    get_or_create_social_user(db, "a@example.com", None, "apple", "sub-a")
    db.refresh(u)
    assert u.hashed_password is None
    assert verify_password("first-password-1", old_hash)  # the hash itself is unchanged, it is just no longer stored


def test_second_social_sign_in_keeps_working_and_does_not_bump_again():
    db = _db()
    create_user(db, "a@example.com", "first-password-1")
    u = get_or_create_social_user(db, "a@example.com", None, "google", "sub-1")
    version = u.token_version
    again = get_or_create_social_user(db, "a@example.com", None, "google", "sub-1")
    assert again.id == u.id and again.token_version == version
    assert db.query(SocialIdentity).filter_by(user_id=u.id).count() == 1


def test_account_created_by_social_sign_in_is_untouched_by_another_provider():
    db = _db()
    u = get_or_create_social_user(db, "a@example.com", None, "google", "sub-1")
    version = u.token_version
    v = get_or_create_social_user(db, "a@example.com", None, "apple", "sub-2")
    assert v.id == u.id and v.token_version == version


def test_password_set_after_a_social_link_survives_a_later_provider():
    db = _db()
    u = get_or_create_social_user(db, "a@example.com", None, "google", "sub-1")
    u.hashed_password = "stored-hash"
    db.commit()
    get_or_create_social_user(db, "a@example.com", None, "apple", "sub-2")
    db.refresh(u)
    assert u.hashed_password == "stored-hash"

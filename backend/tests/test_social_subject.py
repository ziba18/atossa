import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

from app.database import Base  # noqa: E402
import app.models  # noqa: E402,F401
from app.models import SocialIdentity, User  # noqa: E402
from app.services.auth import get_or_create_social_user  # noqa: E402


def _db():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)()


def test_first_sign_in_creates_account_and_link():
    db = _db()
    u = get_or_create_social_user(db, "a@example.com", None, "google", "sub-1")
    assert db.query(SocialIdentity).filter_by(user_id=u.id, provider="google", subject="sub-1").count() == 1


def test_same_subject_finds_account_even_if_email_changed():
    db = _db()
    u = get_or_create_social_user(db, "a@example.com", None, "google", "sub-1")
    again = get_or_create_social_user(db, "renamed@example.com", None, "google", "sub-1")
    assert again.id == u.id
    assert db.query(User).count() == 1


def test_new_subject_with_old_email_links_existing_account_once():
    db = _db()
    u = get_or_create_social_user(db, "a@example.com", None, "google", "sub-1")
    # same email, different Apple identity: existing behaviour (match by email) is kept and the link is recorded
    v = get_or_create_social_user(db, "a@example.com", None, "apple", "apple-9")
    assert v.id == u.id
    assert db.query(SocialIdentity).filter_by(user_id=u.id).count() == 2


def test_providers_do_not_share_subjects():
    db = _db()
    a = get_or_create_social_user(db, "a@example.com", None, "google", "same")
    b = get_or_create_social_user(db, "b@example.com", None, "apple", "same")
    assert a.id != b.id

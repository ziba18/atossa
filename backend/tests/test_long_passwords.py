import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

from passlib.context import CryptContext  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

from app.database import Base  # noqa: E402
import app.models  # noqa: E402,F401
from app.models import User  # noqa: E402
from app.services.auth import hash_password, upgrade_hash_if_needed, verify_password  # noqa: E402
from app.services.password_policy import password_problem  # noqa: E402


def test_64_non_ascii_characters_are_accepted_and_all_of_them_count():
    pw = "éàüöçñ" * 10 + "abcd"  # 64 characters, 124 bytes: used to be rejected at 72
    assert password_problem(pw, "a@example.com") is None
    h = hash_password(pw)
    assert verify_password(pw, h)
    assert not verify_password(pw[:-1] + "e", h)


def test_characters_after_byte_72_still_matter():
    base = "correct horse battery staple " * 3  # 87 ASCII characters
    h = hash_password(base)
    assert verify_password(base, h)
    assert not verify_password(base[:-1] + "!", h)


def test_over_128_characters_still_refused():
    assert password_problem("a1b2c3d4" * 17, "") is not None


def test_old_plain_bcrypt_hash_still_verifies_and_is_upgraded_at_login():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    old = CryptContext(schemes=["bcrypt"]).hash("old-style pass 123")
    u = User(email="o@example.com", hashed_password=old)
    db.add(u)
    db.commit()
    assert verify_password("old-style pass 123", old)
    upgrade_hash_if_needed(db, u, "old-style pass 123")
    assert u.hashed_password.startswith("$bcrypt-sha256$")
    assert verify_password("old-style pass 123", u.hashed_password)

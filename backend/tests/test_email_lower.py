import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

from app.database import Base  # noqa: E402
from app.services.auth import create_user, get_user_by_email  # noqa: E402


def test_new_accounts_store_a_lowercase_email():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    u = create_user(db, "  Mixed.Case@Example.com ", "a-long-test-password-1")
    assert u.email == "mixed.case@example.com"
    assert get_user_by_email(db, "MIXED.case@example.com").id == u.id

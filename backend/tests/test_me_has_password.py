import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

from app.database import Base  # noqa: E402
from app.models import User  # noqa: E402
from app.routers.auth import get_me  # noqa: E402


def _db():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)()


def test_me_says_whether_the_account_has_a_password_and_never_returns_the_hash():
    db = _db()
    with_pw = User(email="a@example.com", hashed_password="$2b$secret-hash")
    social = User(email="b@example.com", hashed_password=None)
    db.add_all([with_pw, social])
    db.commit()
    a, b = get_me(with_pw), get_me(social)
    assert a.has_password is True and b.has_password is False
    assert "secret-hash" not in a.model_dump_json()

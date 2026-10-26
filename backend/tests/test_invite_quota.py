import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

import pytest  # noqa: E402
from fastapi import HTTPException  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

from app.database import Base  # noqa: E402
from app.models import User  # noqa: E402


def test_invites_are_capped_per_account_per_day():
    from app.routers.connections import invite_friend
    from app.schemas.connection import InviteFriendRequest
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    me = User(email="quota-owner@example.com", hashed_password="x")
    db.add(me)
    db.commit()
    for i in range(20):
        invite_friend(InviteFriendRequest(invite_email=f"friend{i}@example.com"), current_user=me, db=db)
    with pytest.raises(HTTPException) as e:
        invite_friend(InviteFriendRequest(invite_email="friend99@example.com"), current_user=me, db=db)
    assert e.value.status_code == 429

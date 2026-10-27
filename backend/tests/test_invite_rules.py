import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

import pytest  # noqa: E402
from fastapi import HTTPException  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

from app.database import Base  # noqa: E402
from app.models import ConnectedAccount, User  # noqa: E402
from app.routers.connections import accept_invite, decline_invite, list_pending_invites  # noqa: E402


@pytest.fixture()
def world():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    owner = User(email="owner@example.com", hashed_password="x")
    invitee = User(email="invitee@example.com", hashed_password="x")
    stranger = User(email="stranger@example.com", hashed_password="x")
    db.add_all([owner, invitee, stranger])
    db.commit()
    conn = ConnectedAccount(owner_user_id=owner.id, invite_email="invitee@example.com",
                            relationship="friend", status="pending")
    db.add(conn)
    db.commit()
    return db, owner, invitee, stranger, conn


def test_stranger_cannot_accept_or_decline_or_see(world):
    db, owner, invitee, stranger, conn = world
    with pytest.raises(HTTPException) as e:
        accept_invite(conn.id, current_user=stranger, db=db)
    assert e.value.status_code == 404
    with pytest.raises(HTTPException) as e:
        decline_invite(conn.id, current_user=stranger, db=db)
    assert e.value.status_code == 404
    assert list_pending_invites(current_user=stranger, db=db) == []


def test_owner_cannot_accept_own_invite(world):
    db, owner, invitee, stranger, conn = world
    with pytest.raises(HTTPException):
        accept_invite(conn.id, current_user=owner, db=db)


def test_invitee_accepts_once_then_invite_is_closed(world):
    db, owner, invitee, stranger, conn = world
    accept_invite(conn.id, current_user=invitee, db=db)
    db.refresh(conn)
    assert conn.status == "accepted" and conn.viewer_user_id == invitee.id
    with pytest.raises(HTTPException):
        accept_invite(conn.id, current_user=invitee, db=db)
    with pytest.raises(HTTPException):
        decline_invite(conn.id, current_user=invitee, db=db)


def test_unknown_id_is_404(world):
    db, owner, invitee, stranger, conn = world
    with pytest.raises(HTTPException) as e:
        accept_invite("nope", current_user=invitee, db=db)
    assert e.value.status_code == 404

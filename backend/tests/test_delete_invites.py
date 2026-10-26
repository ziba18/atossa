from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models import ConnectedAccount, User
from app.routers.profiles import delete_account


def _db():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)()


def test_delete_account_removes_invites_addressed_to_the_email():
    db = _db()
    owner = User(email="owner@example.com")
    other = User(email="gone@example.com")
    db.add_all([owner, other])
    db.commit()
    db.add(ConnectedAccount(owner_user_id=owner.id, invite_email="gone@example.com", relationship="friend"))
    db.add(ConnectedAccount(owner_user_id=owner.id, invite_email="keep@example.com", relationship="friend"))
    db.commit()

    delete_account(current_user=other, db=db)

    left = [c.invite_email for c in db.query(ConnectedAccount).all()]
    assert left == ["keep@example.com"]

import json
import os
from datetime import datetime, timedelta, timezone

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

from app.database import Base  # noqa: E402
from app.models import ConnectedAccount, HealthRecord, Profile, SocialIdentity, UsedRefreshToken, User  # noqa: E402
from app.routers.profiles import delete_account  # noqa: E402


def test_delete_account_removes_everything_for_that_user_and_nothing_for_others():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    a, b = User(email="a@example.com"), User(email="b@example.com")
    db.add_all([a, b])
    db.commit()
    for u in (a, b):
        db.add(Profile(id=u.id, display_name="x"))
        db.add(HealthRecord(user_id=u.id, kind="symptom", data=json.dumps({"note": "n"})))
        db.add(SocialIdentity(user_id=u.id, provider="apple", subject=f"s-{u.id}"))
        db.add(UsedRefreshToken(jti=f"j-{u.id}", user_id=u.id, expires_at=datetime.now(timezone.utc) + timedelta(days=1)))
    db.add(ConnectedAccount(owner_user_id=a.id, viewer_user_id=b.id, relationship="friend"))
    db.add(ConnectedAccount(owner_user_id=b.id, invite_email="a@example.com", relationship="friend"))
    db.commit()
    a_id = a.id

    delete_account(current_user=a, db=db)

    assert db.query(User).filter(User.id == a_id).count() == 0
    for model, col in ((Profile, Profile.id), (HealthRecord, HealthRecord.user_id), (SocialIdentity, SocialIdentity.user_id),
                       (UsedRefreshToken, UsedRefreshToken.user_id)):
        assert db.query(model).filter(col == a_id).count() == 0, model.__name__
    assert db.query(ConnectedAccount).count() == 0  # both links involved a
    assert db.query(User).filter(User.id == b.id).count() == 1
    assert db.query(HealthRecord).filter(HealthRecord.user_id == b.id).count() == 1
    assert db.query(SocialIdentity).filter(SocialIdentity.user_id == b.id).count() == 1

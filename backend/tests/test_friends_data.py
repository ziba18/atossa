"""What a Friends connection exposes (S-009 / S-073). These tests record today's behaviour."""
import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

import pytest  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

from app.database import Base  # noqa: E402
from app.models import CycleLog, User  # noqa: E402
from app.routers.connections import accept_invite, invite_friend, list_friends  # noqa: E402
from app.schemas.connection import InviteFriendRequest  # noqa: E402


@pytest.fixture()
def pair():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    a = User(email="a@example.com", hashed_password="x")
    b = User(email="b@example.com", hashed_password="x")
    db.add_all([a, b])
    db.commit()
    for u, d in ((a, "2026-09-01"), (b, "2026-09-10")):
        db.add(CycleLog(user_id=u.id, period_start=d, period_end=None, period_length=5))
    db.commit()
    return db, a, b


def test_pending_invite_shows_nothing_to_anyone(pair):
    db, a, b = pair
    invite_friend(InviteFriendRequest(invite_email="b@example.com"), current_user=a, db=db)
    assert list_friends(current_user=a, db=db) == []
    assert list_friends(current_user=b, db=db) == []


def test_new_invite_defaults_share_cycle_only(pair):
    db, a, b = pair
    from app.models import ConnectedAccount
    invite_friend(InviteFriendRequest(invite_email="b@example.com"), current_user=a, db=db)
    c = db.query(ConnectedAccount).one()
    assert c.can_view_cycle is True  # sharing is ON from the moment of the invite
    assert not c.can_view_symptoms and not c.can_view_metrics and not c.can_receive_alerts


def test_after_accept_both_sides_see_exact_period_dates(pair):
    """Not 'phase only': each side receives the other's raw period start dates, in both directions."""
    db, a, b = pair
    invite_friend(InviteFriendRequest(invite_email="b@example.com"), current_user=a, db=db)
    from app.models import ConnectedAccount
    conn = db.query(ConnectedAccount).one()
    accept_invite(conn.id, current_user=b, db=db)
    seen_by_b = list_friends(current_user=b, db=db)
    seen_by_a = list_friends(current_user=a, db=db)
    assert [l.period_start for l in seen_by_b[0].cycle_logs] == ["2026-09-01"]
    assert [l.period_start for l in seen_by_a[0].cycle_logs] == ["2026-09-10"]  # inviter sees the accepter too
    assert set(seen_by_b[0].model_dump()) == {
        "connection_id", "friend_id", "display_name", "average_cycle_length",
        "average_period_length", "cycle_logs"}

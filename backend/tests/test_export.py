import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

import json  # noqa: E402

from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

from app.database import Base  # noqa: E402
from app.models import ConnectedAccount, HealthRecord, User  # noqa: E402
from app.routers.profiles import export_my_data  # noqa: E402


def test_export_contains_own_rows_only_and_no_secrets():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    me = User(email="me@example.com", hashed_password="$2b$secret-hash")
    other = User(email="other@example.com", hashed_password="$2b$other-hash")
    db.add_all([me, other])
    db.commit()
    db.add_all([
        HealthRecord(user_id=me.id, kind="symptom", data=json.dumps({"note": "mine"})),
        HealthRecord(user_id=other.id, kind="symptom", data=json.dumps({"note": "theirs"})),
        ConnectedAccount(owner_user_id=me.id, invite_email="f@example.com", relationship="friend"),
    ])
    db.commit()

    out = export_my_data(current_user=me, db=db)
    text = json.dumps(out)

    assert out["tables"]["health_records"][0]["data"] == {"note": "mine"}
    assert len(out["tables"]["health_records"]) == 1
    assert "theirs" not in text and "other@example.com" not in text
    assert "secret-hash" not in text and "hashed_password" not in text
    assert "invite_token" not in text
    assert out["tables"]["users"][0]["email"] == "me@example.com"


def test_export_includes_consent_record():
    from datetime import datetime, timezone
    from app.models import Profile

    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    me = User(email="me@example.com", hashed_password="$2b$secret-hash")
    db.add(me)
    db.commit()
    db.add(Profile(id=me.id, consent_version=1, consented_at=datetime.now(timezone.utc)))
    db.commit()

    out = export_my_data(current_user=me, db=db)
    row = out["tables"]["profiles"][0]
    assert row["consent_version"] == 1
    assert row["consented_at"]


def test_export_covers_every_table():
    """A table added later must be added to the export too (right of access)."""
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    me = User(email="me@example.com", hashed_password="$2b$secret-hash")
    db.add(me)
    db.commit()
    out = export_my_data(current_user=me, db=db)
    assert {t.name for t in Base.metadata.sorted_tables} <= set(out["tables"])

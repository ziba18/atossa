import json
import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

import pytest  # noqa: E402
from fastapi import HTTPException  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

from app.database import Base  # noqa: E402
from app.models import HealthRecord, User  # noqa: E402
from app.routers.records import delete_record, list_records, update_record  # noqa: E402
from app.schemas.record import RecordUpdate  # noqa: E402


@pytest.fixture()
def world():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    a, b = User(email="a@example.com"), User(email="b@example.com")
    db.add_all([a, b])
    db.commit()
    rec = HealthRecord(user_id=a.id, kind="symptom", data=json.dumps({"note": "a's note"}))
    db.add(rec)
    db.commit()
    return db, a, b, rec


def test_other_user_cannot_update_or_delete_a_record(world):
    db, a, b, rec = world
    with pytest.raises(HTTPException) as e:
        update_record(rec.id, RecordUpdate(data={"note": "changed"}), current_user=b, db=db)
    assert e.value.status_code == 404
    with pytest.raises(HTTPException) as e:
        delete_record(rec.id, current_user=b, db=db)
    assert e.value.status_code == 404
    db.refresh(rec)
    assert json.loads(rec.data) == {"note": "a's note"}


def test_list_only_returns_own_records(world):
    db, a, b, rec = world
    assert len(list_records(current_user=a, db=db).records) == 1
    assert list_records(current_user=b, db=db).records == []

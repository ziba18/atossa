import json
import os
import pathlib

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

import pytest  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

from app.database import Base  # noqa: E402
from app.models import HealthRecord, User  # noqa: E402
from app.routers.profiles import delete_account  # noqa: E402
from app.routers.records import create_record, list_records  # noqa: E402
from app.schemas.record import RecordCreate  # noqa: E402

KINDS = ["fertility_wish", "allergy"]


@pytest.fixture()
def world():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    a, b = User(email="a@example.com"), User(email="b@example.com")
    db.add_all([a, b])
    db.commit()
    return db, a, b


@pytest.mark.parametrize("kind", KINDS)
def test_kind_is_accepted_and_owner_only(world, kind):
    db, a, b = world
    create_record(RecordCreate(kind=kind, data={"text": "own words"}), current_user=a, db=db)
    assert [r.kind for r in list_records(current_user=a, db=db).records] == [kind]
    assert list_records(current_user=b, db=db).records == []


@pytest.mark.parametrize("kind", KINDS)
def test_account_deletion_removes_the_kind(world, kind):
    db, a, b = world
    create_record(RecordCreate(kind=kind, data={"text": "x"}), current_user=a, db=db)
    delete_account(current_user=a, db=db)
    assert db.query(HealthRecord).filter(HealthRecord.kind == kind).count() == 0


def test_only_the_records_and_deletion_routers_read_record_content():
    # Friends/connections, chat and analytics must never read HealthRecord (fertility wishes and allergies stay out of sharing).
    root = pathlib.Path(__file__).resolve().parent.parent / "app"
    users = sorted(str(p.relative_to(root)) for p in root.rglob("*.py") if "HealthRecord" in p.read_text() and "models" not in p.parts)
    assert users == ["routers/profiles.py", "routers/records.py"]

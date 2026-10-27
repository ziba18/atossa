import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

from app.routers.records import router  # noqa: E402


def _limited(route):
    return any(getattr(d.call, "__qualname__", "").startswith("limit.") for d in route.dependant.dependencies)


def test_create_and_update_are_rate_limited_but_reads_and_deletes_are_not():
    by = {(m, r.path): r for r in router.routes for m in r.methods}
    assert _limited(by[("POST", "/records")])
    assert _limited(by[("PUT", "/records/{record_id}")])
    assert not _limited(by[("GET", "/records")])
    assert not _limited(by[("DELETE", "/records/{record_id}")])


def test_daily_cap_per_account_not_per_address():
    from datetime import datetime, timedelta, timezone
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from fastapi import HTTPException
    import pytest
    from app.database import Base
    import app.models  # noqa: F401
    from app.models import HealthRecord, User
    from app.routers import records as r
    from app.schemas.record import RecordCreate

    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    a, b = User(email="a@example.com"), User(email="b@example.com")
    db.add_all([a, b])
    db.commit()
    now = datetime.now(timezone.utc)
    db.add_all([HealthRecord(user_id=a.id, kind="symptom", data="{}", created_at=now) for _ in range(r.MAX_NEW_RECORDS_PER_DAY)])
    db.add(HealthRecord(user_id=b.id, kind="symptom", data="{}", created_at=now))
    db.commit()
    body = RecordCreate(kind="symptom", data={"x": 1})
    with pytest.raises(HTTPException) as e:
        r.create_record(body, current_user=a, db=db)
    assert e.value.status_code == 429
    assert r.create_record(body, current_user=b, db=db).kind == "symptom"
    # older rows do not count
    db.query(HealthRecord).filter(HealthRecord.user_id == a.id).update({"created_at": now - timedelta(hours=25)})
    db.commit()
    assert r.create_record(body, current_user=a, db=db).kind == "symptom"

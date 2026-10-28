import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")


def test_list_records_pages_in_order_and_only_for_the_owner():
    from datetime import datetime, timedelta, timezone
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.database import Base
    import app.models  # noqa: F401
    from app.models import HealthRecord, User
    from app.routers import records as r

    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    a, b = User(email="a@example.com"), User(email="b@example.com")
    db.add_all([a, b])
    db.commit()
    t0 = datetime.now(timezone.utc)
    db.add_all([HealthRecord(user_id=a.id, kind="symptom", data="{}", created_at=t0 + timedelta(seconds=i)) for i in range(5)])
    db.add(HealthRecord(user_id=b.id, kind="symptom", data="{}", created_at=t0))
    db.commit()
    everything = r.list_records(limit=r.MAX_RECORDS_PER_USER, offset=0, current_user=a, db=db).records
    assert len(everything) == 5
    page = r.list_records(limit=2, offset=2, current_user=a, db=db).records
    assert [x.id for x in page] == [x.id for x in everything[2:4]]
    assert r.list_records(limit=2, offset=10, current_user=a, db=db).records == []

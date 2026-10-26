import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

import pytest  # noqa: E402
from pydantic import ValidationError  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

from app.database import Base  # noqa: E402
from app.models import Profile, User  # noqa: E402
from app.routers.profiles import update_profile  # noqa: E402
from app.schemas.profile import ProfileUpdate  # noqa: E402


@pytest.fixture()
def world():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    user = User(email="c@example.com", hashed_password="x")
    db.add(user)
    db.commit()
    db.add(Profile(id=user.id))
    db.commit()
    return db, user


def test_new_profile_has_no_consent(world):
    db, user = world
    p = db.query(Profile).one()
    assert p.consent_version is None and p.consented_at is None


def test_saving_consent_sets_time_on_the_server(world):
    db, user = world
    out = update_profile(ProfileUpdate(consent_version=1), current_user=user, db=db)
    assert out.consent_version == 1 and out.consented_at is not None


def test_client_cannot_supply_the_time_or_other_values(world):
    db, user = world
    # an extra "consented_at" field is ignored by the schema
    body = ProfileUpdate.model_validate({"consent_version": 2, "consented_at": "2001-01-01T00:00:00Z"})
    out = update_profile(body, current_user=user, db=db)
    assert out.consented_at.year >= 2026
    for bad in (0, -1, 1001):
        with pytest.raises(ValidationError):
            ProfileUpdate(consent_version=bad)


def test_other_updates_leave_consent_alone(world):
    db, user = world
    update_profile(ProfileUpdate(consent_version=1), current_user=user, db=db)
    first = db.query(Profile).one().consented_at
    update_profile(ProfileUpdate(display_name="Sam"), current_user=user, db=db)
    p = db.query(Profile).one()
    assert p.consent_version == 1 and p.consented_at == first


def test_consent_cannot_be_erased_or_lowered(world):
    from fastapi import HTTPException
    db, user = world
    update_profile(ProfileUpdate(consent_version=2), current_user=user, db=db)
    out = update_profile(ProfileUpdate(consent_version=None), current_user=user, db=db)
    assert out.consent_version == 2
    with pytest.raises(HTTPException) as e:
        update_profile(ProfileUpdate(consent_version=1), current_user=user, db=db)
    assert e.value.status_code == 400

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


def test_export_includes_every_record_kind_and_history_rows():
    from app.schemas.record import RecordKind
    kinds = list(RecordKind.__args__)
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    me = User(email="me@example.com", hashed_password="$2b$x")
    other = User(email="other@example.com", hashed_password="$2b$y")
    db.add_all([me, other])
    db.commit()
    for k in kinds:
        db.add(HealthRecord(user_id=me.id, kind=k, data=json.dumps({"note": f"mine-{k}"})))
        db.add(HealthRecord(user_id=other.id, kind=k, data=json.dumps({"note": f"theirs-{k}"})))
    db.add(HealthRecord(user_id=me.id, kind="history", data=json.dumps({"type": "Allergies (in my words)", "told": "mine-allergy-words"})))
    db.commit()

    out = export_my_data(current_user=me, db=db)
    rows = out["tables"]["health_records"]
    assert sorted(r["kind"] for r in rows if r["data"].get("note")) == sorted(kinds)
    assert any(r["data"].get("told") == "mine-allergy-words" for r in rows)
    assert "theirs-" not in json.dumps(out)


def test_export_shape_has_only_real_columns_and_no_secret_like_keys():
    """Shape guard for the 'Download all my notes' file (PM 28 Oct ai-brain task 5): a user with
    empty and null fields must get only real column names (no ORM internals such as
    _sa_instance_state), no credential-like key, and an empty list for an empty table."""
    import re
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    me = User(email="me@example.com", hashed_password="$2b$secret-hash")
    db.add(me)
    db.commit()
    db.add_all([HealthRecord(user_id=me.id, kind="symptom", data="{}"),
                HealthRecord(user_id=me.id, kind="symptom", data="")])
    db.commit()

    out = export_my_data(current_user=me, db=db)
    assert set(out) == {"exported_at", "tables"}
    tables = {t.name: t for t in Base.metadata.sorted_tables}
    secretish = re.compile(r"password|token|secret|hash|api_?key|salt", re.I)
    for name, rows in out["tables"].items():
        assert name in tables, name
        assert isinstance(rows, list), name
        real = {c.name for c in tables[name].c}
        for row in rows:
            assert set(row) <= real, (name, set(row) - real)
            # token_version is a sign-out counter, not a credential (kept; Safety may hide it).
            assert not [k for k in row if k.startswith("_") or (secretish.search(k) and k != "token_version")], (name, sorted(row))
    assert out["tables"].get("connected_accounts", []) == []  # an empty table is an empty list
    datas = [r["data"] for r in out["tables"]["health_records"]]
    assert sorted(datas, key=repr) == sorted([{}, ""], key=repr)  # empty fields stay empty, never another row's data
    json.dumps(out)  # the file is valid JSON

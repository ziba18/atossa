import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

import inspect  # noqa: E402
from pathlib import Path  # noqa: E402

import app.routers as routers_pkg  # noqa: E402
from app.main import app  # noqa: E402

# Only these modules may read note content, and only for the signed-in owner.
MAY_TOUCH_RECORDS = {"records.py", "profiles.py"}


def test_only_owner_routes_touch_record_content():
    base = Path(routers_pkg.__file__).parent
    offenders = [
        p.name for p in base.glob("*.py")
        if "HealthRecord" in p.read_text() and p.name not in MAY_TOUCH_RECORDS
    ]
    assert not offenders, f"new module reads record content; needs a share-record check: {offenders}"


def test_record_and_export_routes_reject_requests_without_a_token():
    from fastapi.testclient import TestClient

    client = TestClient(app)
    paths = app.openapi()["paths"]
    guarded = {p: m for p, m in paths.items() if p.startswith("/records") or p == "/me/export"}
    assert guarded, "expected /records and /me/export routes"
    for path, methods in guarded.items():
        for method in methods:
            url = path.replace("{record_id}", "x")
            res = client.request(method.upper(), url, json={"kind": "symptom", "data": {}})
            assert res.status_code in (401, 403), f"{method} {path} answered {res.status_code} without a token"


def test_record_queries_always_filter_by_the_owner():
    from app.routers import records

    for fn in (records.list_records, records._get_owned, records.create_record):
        assert "user_id" in inspect.getsource(fn), fn.__name__


def test_no_clinic_or_share_route_exists_yet():
    paths = list(app.openapi()["paths"])
    assert not [p for p in paths if "clinic" in p or "/share" in p], (
        "a clinic/share route now exists: add a per-summary share-record check and update this test"
    )

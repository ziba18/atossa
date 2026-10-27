import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import MAX_BODY_BYTES, app  # noqa: E402


def test_oversized_declared_body_is_refused_before_parsing():
    r = TestClient(app).post("/auth/login", content=b"x" * (MAX_BODY_BYTES + 1), headers={"content-type": "application/json"})
    assert r.status_code == 413 and r.json()["detail"] == "Request is too large"


def test_normal_requests_still_reach_the_route():
    r = TestClient(app).get("/health")
    assert r.status_code == 200

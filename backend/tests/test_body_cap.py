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


def test_chunked_body_over_the_cap_is_refused_while_reading():
    def chunks():
        for _ in range(MAX_BODY_BYTES // 1024 + 8):
            yield b"x" * 1024

    r = TestClient(app).post("/auth/login", content=chunks(), headers={"content-type": "application/json"})
    assert r.status_code == 413 and r.json()["detail"] == "Request is too large"


def test_chunked_body_under_the_cap_still_reaches_the_route():
    def chunks():
        yield b'{"refresh_token":'
        yield b' "x"}'

    r = TestClient(app).post("/auth/refresh", content=chunks(), headers={"content-type": "application/json"})
    assert r.status_code == 401

import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


def test_api_docs_are_not_served_by_default():
    c = TestClient(app)
    for path in ("/docs", "/redoc", "/openapi.json"):
        assert c.get(path).status_code == 404, path
    assert c.get("/health").status_code == 200

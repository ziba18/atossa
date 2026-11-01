"""PM-B144: GET /health reports the deployed git sha (RENDER_GIT_COMMIT) and nothing else secret."""
from fastapi.testclient import TestClient

from app.main import app

SHA = "bacb3b1661bc349cdf9cc4071a221b0c42bd83b1"


def test_health_reports_render_commit(monkeypatch):
    monkeypatch.setenv("RENDER_GIT_COMMIT", SHA)
    r = TestClient(app).get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok", "version": SHA}


def test_health_without_env_is_unknown(monkeypatch):
    monkeypatch.delenv("RENDER_GIT_COMMIT", raising=False)
    assert TestClient(app).get("/health").json() == {"status": "ok", "version": "unknown"}


def test_health_never_echoes_non_sha(monkeypatch):
    for bad in ["postgres://user:pw@host/db", "abc", "g" * 40, SHA + "0", "<script>"]:
        monkeypatch.setenv("RENDER_GIT_COMMIT", bad)
        assert TestClient(app).get("/health").json()["version"] == "unknown"


def test_health_short_sha_and_case(monkeypatch):
    monkeypatch.setenv("RENDER_GIT_COMMIT", " BACB3B1 ")
    assert TestClient(app).get("/health").json()["version"] == "bacb3b1"


def test_health_needs_no_auth_and_no_db(monkeypatch):
    monkeypatch.setenv("RENDER_GIT_COMMIT", SHA)
    r = TestClient(app).get("/health")
    assert set(r.json()) == {"status", "version"}

import importlib

from fastapi.testclient import TestClient


def _client(monkeypatch, hide):
    monkeypatch.setenv("HIDE_API_DOCS", "1" if hide else "0")
    import app.config as config
    import app.main as main
    importlib.reload(config)
    importlib.reload(main)
    return TestClient(main.app)


def test_docs_served_by_default(monkeypatch):
    assert _client(monkeypatch, False).get("/openapi.json").status_code == 200


def test_docs_hidden_when_flag_set(monkeypatch):
    c = _client(monkeypatch, True)
    assert c.get("/openapi.json").status_code == 404
    assert c.get("/docs").status_code == 404
    _client(monkeypatch, False)

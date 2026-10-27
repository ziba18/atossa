import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

import re  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

# Routes that are open on purpose. A new route must either be added here
# (with a reason) or require a signed-in user; the test fails otherwise.
PUBLIC = {
    ("GET", "/health"),
    ("GET", "/warmup"),
    ("POST", "/auth/register"),
    ("POST", "/auth/login"),
    ("POST", "/auth/apple"),
    ("POST", "/auth/google"),
    ("POST", "/auth/refresh"),
}
PUBLIC_PREFIXES = ("/privacy", "/terms", "/basket-buddy/", "/docs", "/openapi.json", "/redoc")


def _routes():
    # openapi lists every route, including those on included routers; the
    # legal pages are hidden from it (include_in_schema=False) and listed below.
    for path, ops in app.openapi()["paths"].items():
        for m in ops:
            yield m.upper(), path


def _is_public(method, path):
    return (method, path) in PUBLIC or path.startswith(PUBLIC_PREFIXES)


@pytest.mark.parametrize("method,path", sorted(_routes()))
def test_route_rejects_requests_without_a_token(method, path):
    if _is_public(method, path):
        pytest.skip("open on purpose")
    url = re.sub(r"\{[^}]+\}", "1", path)
    r = TestClient(app).request(method, url, json={})
    assert r.status_code in (401, 403), f"{method} {path} answered {r.status_code} without a token"
    assert "detail" in r.json()
    assert "note" not in r.text.lower()


def test_public_list_has_no_stale_entries():
    known = set(_routes())
    stale = {p for p in PUBLIC if p not in known}
    assert not stale, f"remove from PUBLIC: {stale}"

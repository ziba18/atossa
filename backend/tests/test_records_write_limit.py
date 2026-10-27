import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

from app.routers.records import router  # noqa: E402


def _limited(route):
    return any(getattr(d.call, "__qualname__", "").startswith("limit.") for d in route.dependant.dependencies)


def test_create_and_update_are_rate_limited_but_reads_and_deletes_are_not():
    by = {(m, r.path): r for r in router.routes for m in r.methods}
    assert _limited(by[("POST", "/records")])
    assert _limited(by[("PUT", "/records/{record_id}")])
    assert not _limited(by[("GET", "/records")])
    assert not _limited(by[("DELETE", "/records/{record_id}")])

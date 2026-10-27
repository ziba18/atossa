import pytest
from fastapi import HTTPException
from app.services.rate_limit import FailureThrottle


def test_locks_after_max_failures_and_success_clears():
    t = FailureThrottle(3, 60)
    for _ in range(2):
        t.check("a@x.com")
        t.fail("a@x.com")
    t.clear("a@x.com")
    for _ in range(3):
        t.check("a@x.com")
        t.fail("a@x.com")
    with pytest.raises(HTTPException) as e:
        t.check("a@x.com")
    assert e.value.status_code == 429


def test_other_emails_unaffected():
    t = FailureThrottle(1, 60)
    t.fail("a@x.com")
    with pytest.raises(HTTPException):
        t.check("a@x.com")
    t.check("b@x.com")


def test_window_expires(monkeypatch):
    import app.services.rate_limit as rl
    now = [1000.0]
    monkeypatch.setattr(rl.time, "monotonic", lambda: now[0])
    t = FailureThrottle(1, 10)
    t.fail("a@x.com")
    now[0] += 11
    t.check("a@x.com")

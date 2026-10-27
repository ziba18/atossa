import logging
import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

from app.services import security_events as se  # noqa: E402


def test_counter_logs_at_thresholds_and_resets_each_hour(caplog):
    caplog.set_level(logging.WARNING, logger="atossa.security")
    t = 1_800_000_000.0
    for _ in range(20):
        se.record("login_failed", now=t)
    assert [r.getMessage() for r in caplog.records] == ["security event login_failed reached 20 this hour"]
    assert se.record("login_failed", now=t + 3600) == 1  # new hour, new count
    assert se.record("refresh_rejected", now=t + 3600) == 1  # events are counted separately


def test_log_line_carries_no_identifying_text(caplog):
    caplog.set_level(logging.WARNING, logger="atossa.security")
    t = 1_900_000_000.0
    for _ in range(20):
        se.record("login_failed", now=t)
    text = " ".join(r.getMessage() for r in caplog.records)
    assert "@" not in text and "." not in text.replace("this hour", "")

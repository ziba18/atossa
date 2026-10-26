import pytest
from app.services.secret_check import check_secret, weak_secret_reason


def test_short_and_placeholder_secrets_are_weak():
    assert weak_secret_reason("changeme")
    assert weak_secret_reason("a1b2c3d4")
    assert weak_secret_reason("x" * 40)


def test_long_random_secret_passes():
    assert weak_secret_reason("kP9vQ2mZr7LxT4nB8wYc1HdJ6sFgA3eUoIqVbN5tXyM0") is None


def test_strict_raises_and_default_only_warns(caplog):
    check_secret("short")
    assert "SECRET_KEY" in caplog.text
    with pytest.raises(RuntimeError):
        check_secret("short", strict=True)

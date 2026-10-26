import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

import pytest  # noqa: E402
from fastapi import HTTPException  # noqa: E402
from pydantic import ValidationError  # noqa: E402

from app.schemas.chat import ChatRequest  # noqa: E402
from app.services.user_quota import check_user_quota  # noqa: E402


def _msgs(n, size):
    return [{"role": "user", "content": "a" * size} for _ in range(n)]


def test_whole_conversation_length_is_capped():
    assert len(ChatRequest(messages=_msgs(3, 1500)).messages) == 3
    trimmed = ChatRequest(messages=_msgs(20, 2000)).messages
    assert sum(len(m.content) for m in trimmed) <= 6000 and trimmed[-1].content == "a" * 2000
    with pytest.raises(ValidationError):
        ChatRequest(messages=[{"role": "assistant", "content": "x"}])


def test_user_quota_blocks_after_limit_and_is_per_user():
    for _ in range(3):
        check_user_quota("t", "u1", 3, 60)
    with pytest.raises(HTTPException) as e:
        check_user_quota("t", "u1", 3, 60)
    assert e.value.status_code == 429
    check_user_quota("t", "u2", 3, 60)

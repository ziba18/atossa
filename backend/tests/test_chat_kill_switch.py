import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

import pytest  # noqa: E402
from fastapi import HTTPException  # noqa: E402
from types import SimpleNamespace  # noqa: E402

from app.config import settings  # noqa: E402
from app.routers import chat as chat_router  # noqa: E402
from app.schemas.chat import ChatRequest  # noqa: E402
from app.services import llm  # noqa: E402


def _req(text):
    return ChatRequest(messages=[{"role": "user", "content": text}])


def test_no_key_means_chat_is_off_and_nothing_is_sent(monkeypatch):
    monkeypatch.setattr(settings, "llm_api_key", "")
    sent = []
    monkeypatch.setattr(llm.httpx, "post", lambda *a, **k: sent.append(1))
    user = SimpleNamespace(id="kill-switch-user")
    with pytest.raises(HTTPException) as e:
        chat_router.chat(_req("my cramps are worse this week"), current_user=user)
    assert e.value.status_code == 503 and not sent


def test_emergency_text_gets_urgent_message_without_calling_the_model(monkeypatch):
    monkeypatch.setattr(settings, "llm_api_key", "")
    monkeypatch.setattr(llm.httpx, "post", lambda *a, **k: pytest.fail("model called"))
    user = SimpleNamespace(id="kill-switch-user-2")
    out = chat_router.chat(_req("I can’t breathe"), current_user=user)
    assert "999" in out.reply

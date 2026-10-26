import json
import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

from app.services.output_guard import is_emergency  # noqa: E402

PHRASES = json.load(open(os.path.join(os.path.dirname(__file__), "urgent_phrases.json"), encoding="utf-8"))


def test_shared_phrase_list():
    # scripts/urgent-wording-live.test.mjs runs the app check against the same file.
    wrong = [(t, want) for t, want in PHRASES if is_emergency(t) != want]
    assert wrong == []

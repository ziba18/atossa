import os
import re
from pathlib import Path

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

from app.services.output_guard import URGENT  # noqa: E402


def test_phone_signpost_is_the_server_sentence_without_its_opening_line():
    ts = (Path(__file__).resolve().parents[2] / "lib" / "urgentWording.ts").read_text()
    phone = re.search(r"URGENT_SIGNPOST =\s*'([^']+)'", ts).group(1)
    assert URGENT == "This could need urgent help. " + phone

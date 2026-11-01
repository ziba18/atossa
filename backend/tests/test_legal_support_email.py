"""PM-B153: /privacy and /terms never print a hard-coded personal address."""
import pathlib

import pytest
from app.routers.legal import privacy_policy, terms_of_service

PAGES = {"/privacy": privacy_policy, "/terms": terms_of_service}
BACKEND = pathlib.Path(__file__).resolve().parents[1]


@pytest.mark.parametrize("path", ["/privacy", "/terms"])
def test_unset_hides_questions_line(monkeypatch, path):
    monkeypatch.delenv("SUPPORT_EMAIL", raising=False)
    html = PAGES[path]().body.decode()
    assert "Questions? Email" not in html and "mailto:" not in html


@pytest.mark.parametrize("path", ["/privacy", "/terms"])
def test_set_shows_address(monkeypatch, path):
    monkeypatch.setenv("SUPPORT_EMAIL", " help@example.org ")
    html = PAGES[path]().body.decode()
    assert 'mailto:help@example.org">help@example.org</a>' in html


@pytest.mark.parametrize("bad", ["not-an-email", "<script>@x.io", "a@b", "https://x.io"])
def test_non_email_hidden(monkeypatch, bad):
    monkeypatch.setenv("SUPPORT_EMAIL", bad)
    assert "Questions? Email" not in privacy_policy().body.decode()


def test_no_personal_gmail_in_backend():
    hits = [p for p in BACKEND.rglob("*.py") if ".venv" not in p.parts and ("zamaniziba18" + "@gmail.com") in p.read_text(errors="ignore")]
    assert hits == []

import pytest
from app.routers.legal import privacy_policy, terms_of_service


@pytest.mark.parametrize("page", [privacy_policy, terms_of_service])
def test_pages_render_without_unfilled_placeholders(page):
    html = page().body.decode()
    assert "Atossa" in html
    assert "[" not in html.split("<body", 1)[1], "unfilled [placeholder] left in a public page"


def test_terms_do_not_exclude_liability_for_personal_injury():
    html = terms_of_service().body.decode()
    assert "death or personal injury" in html


def test_privacy_page_states_basis_reply_time_and_complaint_route():
    html = privacy_policy().body.decode()
    assert "Why we use it" in html
    assert "within one month" in html
    assert "ico.org.uk" in html

from types import SimpleNamespace

from app.services.rate_limit import client_ip


def req(xff=None, host="10.0.0.1"):
    headers = {"x-forwarded-for": xff} if xff is not None else {}
    return SimpleNamespace(headers=headers, client=SimpleNamespace(host=host))


def test_spoofed_leftmost_entry_is_ignored():
    assert client_ip(req("1.1.1.1, 9.9.9.9, 10.1.1.1")) == "9.9.9.9"


def test_single_entry_and_no_header():
    assert client_ip(req("9.9.9.9")) == "9.9.9.9"
    assert client_ip(req()) == "10.0.0.1"

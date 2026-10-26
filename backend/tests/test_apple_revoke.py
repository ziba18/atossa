import httpx
import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec

from app.services import apple_revoke

_KEY = ec.generate_private_key(ec.SECP256R1())
PRIV = _KEY.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8,
                          serialization.NoEncryption()).decode()
PUB = _KEY.public_key()
KW = dict(team_id="TEAM", key_id="KEY", private_key=PRIV, client_id="com.example.app")


def test_client_secret_claims():
    tok = apple_revoke.build_client_secret("TEAM", "KEY", PRIV, "com.example.app", now=1000)
    claims = jwt.decode(tok, PUB, algorithms=["ES256"], audience="https://appleid.apple.com", options={"verify_exp": False})
    assert claims["iss"] == "TEAM" and claims["sub"] == "com.example.app" and claims["exp"] - claims["iat"] == 300
    assert jwt.get_unverified_header(tok)["kid"] == "KEY"


def test_skipped_without_settings(monkeypatch):
    called = []
    monkeypatch.setattr(httpx, "post", lambda *a, **k: called.append(1))
    assert apple_revoke.revoke_refresh_token("t", team_id="", key_id="", private_key="", client_id="x") is False
    assert not called


def test_revoke_posts_refresh_token(monkeypatch):
    seen = {}

    def fake_post(url, data, timeout):
        seen.update(url=url, data=data)
        return httpx.Response(200)
    monkeypatch.setattr(httpx, "post", fake_post)
    assert apple_revoke.revoke_refresh_token("rt", **KW) is True
    assert seen["url"] == apple_revoke.APPLE_REVOKE_URL
    assert seen["data"]["token"] == "rt" and seen["data"]["token_type_hint"] == "refresh_token"


def test_failure_never_raises(monkeypatch):
    def boom(*a, **k):
        raise httpx.ConnectError("down")
    monkeypatch.setattr(httpx, "post", boom)
    assert apple_revoke.revoke_refresh_token("rt", **KW) is False

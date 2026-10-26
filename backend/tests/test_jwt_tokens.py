import base64
import os
import hashlib
import json
import time

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

from app.services import social_auth  # noqa: E402
from app.services.auth import create_access_token, create_refresh_token, decode_token  # noqa: E402

KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)
JWKS = {"keys": [{**json.loads(jwt.algorithms.RSAAlgorithm.to_jwk(KEY.public_key())), "kid": "k1", "alg": "RS256"}]}


def _token(**claims):
    base = {"exp": int(time.time()) + 600, "email": "a@example.com", "email_verified": True, "sub": "1"}
    return jwt.encode({**base, **claims}, KEY, algorithm="RS256", headers={"kid": "k1"})


@pytest.fixture(autouse=True)
def _jwks(monkeypatch):
    monkeypatch.setattr(social_auth, "_get_jwks", lambda url: JWKS)


def test_app_tokens_roundtrip_and_type_checked():
    assert decode_token(create_access_token("u1")) == "u1"
    with pytest.raises(jwt.PyJWTError):
        decode_token(create_refresh_token("u1"))


def test_apple_ok_and_wrong_audience():
    t = _token(iss=social_auth.APPLE_ISSUER, aud="com.example.app")
    assert social_auth.verify_apple_identity_token(t, "com.example.app")["email"] == "a@example.com"
    with pytest.raises(social_auth.SocialAuthError):
        social_auth.verify_apple_identity_token(t, "other.app")


def test_google_audience_list_issuer_and_at_hash():
    at = "access-token-value"
    h = base64.urlsafe_b64encode(hashlib.sha256(at.encode()).digest()[:16]).rstrip(b"=").decode()
    t = _token(iss="https://accounts.google.com", aud="web-id", at_hash=h)
    assert social_auth.verify_google_id_token(t, ["ios-id", "web-id"], at)["email"] == "a@example.com"
    with pytest.raises(social_auth.SocialAuthError):
        social_auth.verify_google_id_token(t, ["ios-id", "web-id"], "wrong")
    with pytest.raises(social_auth.SocialAuthError):
        social_auth.verify_google_id_token(t, "other-id", at)
    bad_iss = _token(iss="https://evil.example", aud="web-id")
    with pytest.raises(social_auth.SocialAuthError):
        social_auth.verify_google_id_token(bad_iss, "web-id")


def test_tampered_signature_rejected():
    other = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    t = jwt.encode({"exp": int(time.time()) + 600, "iss": social_auth.APPLE_ISSUER, "aud": "a", "sub": "1"},
                   other, algorithm="RS256", headers={"kid": "k1"})
    with pytest.raises(social_auth.SocialAuthError):
        social_auth.verify_apple_identity_token(t, "a")

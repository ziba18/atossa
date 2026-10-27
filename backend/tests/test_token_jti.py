import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

import jwt  # noqa: E402

from app.config import settings  # noqa: E402
from app.services.auth import create_access_token, create_refresh_token, decode_claims  # noqa: E402


def test_tokens_made_in_the_same_second_differ():
    a, b = create_access_token("u1"), create_access_token("u1")
    assert a != b
    r1, r2 = create_refresh_token("u1"), create_refresh_token("u1")
    assert r1 != r2


def test_tokens_still_verify_and_old_ones_without_jti_do_too():
    assert decode_claims(create_access_token("u1", 3)) == ("u1", 3)
    old = jwt.encode({"sub": "u1", "exp": 4102444800, "type": "access", "ver": 0}, settings.secret_key, algorithm=settings.algorithm)
    assert decode_claims(old) == ("u1", 0)

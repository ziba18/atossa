"""PM-B155: /auth/me says whether the account has an email password (Profile > Change password shown only then)."""
from app.models.user import User
from app.schemas.auth import UserResponse


def test_password_account_has_password():
    u = User(id="u1", email="a@example.org", hashed_password="$2b$hash")
    assert UserResponse.model_validate(u).has_password is True


def test_social_only_account_has_no_password():
    for hp in (None, ""):
        u = User(id="u2", email="b@example.org", hashed_password=hp)
        assert UserResponse.model_validate(u).has_password is False


def test_hash_never_in_response():
    u = User(id="u1", email="a@example.org", hashed_password="$2b$hash")
    assert set(UserResponse.model_validate(u).model_dump()) == {"id", "email", "has_password", "must_change_password"}

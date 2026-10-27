import secrets
from datetime import datetime, timedelta, timezone
import jwt
from jwt import PyJWTError as JWTError
from passlib.context import CryptContext
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.config import settings
from app.models.user import User, Profile, SocialIdentity

# bcrypt_sha256 hashes the password with SHA-256 first, so long passphrases and non-ASCII text are not cut at
# bcrypt's 72 bytes (ASVS 5.0 6.2.9). Old plain-bcrypt hashes still verify and are re-hashed at the next login.
pwd_context = CryptContext(schemes=["bcrypt_sha256", "bcrypt"], deprecated=["bcrypt"])


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


# A real hash to compare against when the email is unknown, so a miss costs as long as a hit.
_DUMMY_HASH = pwd_context.hash("unused-password-for-timing")


def verify_password_or_dummy(plain: str, hashed: str | None) -> bool:
    ok = verify_password(plain, hashed or _DUMMY_HASH)
    return bool(hashed) and ok


def upgrade_hash_if_needed(db: Session, user: User, plain: str) -> None:
    """Replace a deprecated (plain bcrypt) hash with the current scheme after a correct password."""
    if user.hashed_password and pwd_context.needs_update(user.hashed_password):
        user.hashed_password = hash_password(plain)
        db.commit()


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(plain, hashed)
    except ValueError:  # e.g. a NUL character, which bcrypt cannot hash
        return False


def create_access_token(user_id: str, version: int = 0) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode({"sub": user_id, "exp": expire, "type": "access", "ver": version, "jti": secrets.token_urlsafe(16)}, settings.secret_key, algorithm=settings.algorithm)


def create_refresh_token(user_id: str, version: int = 0) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    return jwt.encode({"sub": user_id, "exp": expire, "type": "refresh", "ver": version, "jti": secrets.token_urlsafe(16)}, settings.secret_key, algorithm=settings.algorithm)


def decode_claims(token: str, expected_type: str = "access") -> tuple[str, int]:
    """Returns (user_id, token_version) from a valid token of the expected type, raises JWTError if invalid."""
    payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    # Tokens issued before the "type" claim existed are access tokens.
    if payload.get("type", "access") != expected_type:
        raise JWTError("Wrong token type")
    user_id: str = payload.get("sub")
    if not user_id:
        raise JWTError("Missing subject")
    # Tokens issued before "ver" existed count as version 0.
    return user_id, int(payload.get("ver", 0))


def decode_token(token: str, expected_type: str = "access") -> str:
    """Returns the user_id from a valid token of the expected type, raises JWTError if invalid."""
    return decode_claims(token, expected_type)[0]


def get_user_by_email(db: Session, email: str) -> User | None:
    # Case-insensitive, so Foo@x.com and foo@x.com are one account however it was first saved.
    return db.query(User).filter(func.lower(User.email) == email.strip().lower()).first()


def get_or_create_social_user(db: Session, email: str, display_name: str | None = None,
                              provider: str | None = None, subject: str | None = None) -> User:
    """Find the account for a signed-in Apple/Google identity, creating one (no password) if none exists.

    The provider's subject id is matched first, so an email address that moves to another person
    does not open the old account; the email is only used the first time an identity is seen.
    """
    if provider and subject:
        link = db.query(SocialIdentity).filter_by(provider=provider, subject=subject).first()
        if link:
            user = db.query(User).filter(User.id == link.user_id).first()
            if user:
                return user
    user = get_user_by_email(db, email)
    if user is None:
        user = create_user(db, email, password=None, display_name=display_name)
    elif user.hashed_password and not db.query(SocialIdentity).filter_by(user_id=user.id).first():
        # A password account whose email was never confirmed: the provider has now confirmed the
        # email, so whoever typed the password at sign-up loses access (password cleared, sessions ended).
        user.hashed_password = None
        user.token_version = (user.token_version or 0) + 1
        db.commit()
    if provider and subject:
        db.add(SocialIdentity(user_id=user.id, provider=provider, subject=subject))
        db.commit()
    return user


def create_user(db: Session, email: str, password: str | None, display_name: str | None = None) -> User:
    user = User(
        email=email.strip().lower(),
        hashed_password=hash_password(password) if password else None,
    )
    db.add(user)
    db.flush()  # write to DB but don't commit yet — we need user.id for the profile

    profile = Profile(id=user.id, display_name=display_name)
    db.add(profile)
    db.commit()
    db.refresh(user)
    return user

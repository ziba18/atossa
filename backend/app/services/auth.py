from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.config import settings
from app.models.user import User, Profile

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


# A real hash to compare against when the email is unknown, so a miss costs as long as a hit.
_DUMMY_HASH = pwd_context.hash("unused-password-for-timing")


def verify_password_or_dummy(plain: str, hashed: str | None) -> bool:
    ok = verify_password(plain, hashed or _DUMMY_HASH)
    return bool(hashed) and ok


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode({"sub": user_id, "exp": expire, "type": "access"}, settings.secret_key, algorithm=settings.algorithm)


def create_refresh_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    return jwt.encode({"sub": user_id, "exp": expire, "type": "refresh"}, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str, expected_type: str = "access") -> str:
    """Returns the user_id from a valid token of the expected type, raises JWTError if invalid."""
    payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    # Tokens issued before the "type" claim existed are access tokens.
    if payload.get("type", "access") != expected_type:
        raise JWTError("Wrong token type")
    user_id: str = payload.get("sub")
    if not user_id:
        raise JWTError("Missing subject")
    return user_id


def get_user_by_email(db: Session, email: str) -> User | None:
    # Case-insensitive, so Foo@x.com and foo@x.com are one account however it was first saved.
    return db.query(User).filter(func.lower(User.email) == email.strip().lower()).first()


def get_or_create_social_user(db: Session, email: str, display_name: str | None = None) -> User:
    """Find a user by email, creating one (with no password — OAuth-only) if none exists."""
    user = get_user_by_email(db, email)
    if user:
        return user
    return create_user(db, email, password=None, display_name=display_name)


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

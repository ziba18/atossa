from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.config import settings
from app.models.user import User, Profile

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode({"sub": user_id, "exp": expire}, settings.secret_key, algorithm=settings.algorithm)


def create_refresh_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    return jwt.encode({"sub": user_id, "exp": expire, "type": "refresh"}, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str) -> str:
    """Returns the user_id from a valid token, raises JWTError if invalid."""
    payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    user_id: str = payload.get("sub")
    if not user_id:
        raise JWTError("Missing subject")
    return user_id


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, email: str, password: str | None, display_name: str | None = None) -> User:
    user = User(
        email=email,
        hashed_password=hash_password(password) if password else None,
    )
    db.add(user)
    db.flush()  # write to DB but don't commit yet — we need user.id for the profile

    profile = Profile(id=user.id, display_name=display_name)
    db.add(profile)
    db.commit()
    db.refresh(user)
    return user

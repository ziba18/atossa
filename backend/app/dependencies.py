from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWTError as JWTError
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.services.auth import decode_claims

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Extract and verify the JWT from the Authorization header, return the User row."""
    try:
        user_id, version = decode_claims(credentials.credentials)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active or user.token_version != version:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


# PM-B158: routes a user with a one-time password may still call (everything else answers 403 until she changes it).
PASSWORD_CHANGE_EXEMPT = ("/auth/me", "/auth/change-password", "/auth/logout", "/auth/refresh")


def require_password_ok(request: Request, user: User = Depends(get_current_user)) -> User:
    """403 `password_change_required` (NOT 401: the token is fine, so the app must keep it) while the flag is set."""
    if getattr(user, "must_change_password", False) and not request.url.path.endswith(PASSWORD_CHANGE_EXEMPT):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="password_change_required")
    return user

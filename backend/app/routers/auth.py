from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from jwt import PyJWTError as JWTError
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User, Profile, UsedRefreshToken
from app.schemas.auth import (
    ChangePasswordRequest, LoginRequest, RegisterRequest, RefreshRequest, SocialAuthRequest, TokenResponse, UserResponse,
)
from app.services.auth import (
    create_access_token, create_refresh_token, create_user, hash_password,
    decode_claims, decode_token, refresh_token_claims, upgrade_hash_if_needed, get_or_create_social_user, get_user_by_email, verify_password, verify_password_or_dummy,
)
from app.services.password_policy import password_problem
from app.services.rate_limit import FailureThrottle, limit
from app.services.social_auth import SocialAuthError, verify_apple_identity_token, verify_google_id_token

router = APIRouter(prefix="/auth", tags=["auth"])


def _social_detail(e: SocialAuthError, provider: str) -> str:
    """Token-library wording stays out of the response; messages that tell the person what to do (e.g. an unconfirmed email) pass through."""
    text = str(e)
    return f"{provider} sign-in failed" if text.startswith("Invalid") else text
# An app retry after a dropped connection re-sends the same token; within this window it is not theft.
REFRESH_REUSE_GRACE_SECONDS = 10
_auth_limit = Depends(limit("auth", 20, 60))
# 8 wrong passwords for one email in 15 minutes locks that email for the rest of the window.
_login_failures = FailureThrottle(8, 900)


def _issue_tokens_for_social_user(db: Session, email: str, display_name: str | None, provider: str, subject: str) -> TokenResponse:
    user = get_or_create_social_user(db, email, display_name, provider, subject)
    if display_name:
        profile = db.query(Profile).filter(Profile.id == user.id).first()
        if profile and not profile.display_name:
            profile.display_name = display_name
            db.commit()
    return TokenResponse(
        access_token=create_access_token(user.id, user.token_version),
        refresh_token=create_refresh_token(user.id, user.token_version),
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED, dependencies=[_auth_limit])
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if get_user_by_email(db, body.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    problem = password_problem(body.password, body.email)
    if problem:
        raise HTTPException(status_code=400, detail=problem)
    user = create_user(db, body.email, body.password, body.display_name)
    return TokenResponse(
        access_token=create_access_token(user.id, user.token_version),
        refresh_token=create_refresh_token(user.id, user.token_version),
    )


@router.post("/login", response_model=TokenResponse, dependencies=[_auth_limit])
def login(body: LoginRequest, db: Session = Depends(get_db)):
    email_key = body.email.strip().lower()
    _login_failures.check(email_key)
    user = get_user_by_email(db, body.email)
    if not verify_password_or_dummy(body.password, user.hashed_password if user else None):
        _login_failures.fail(email_key)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    _login_failures.clear(email_key)
    upgrade_hash_if_needed(db, user, body.password)
    return TokenResponse(
        access_token=create_access_token(user.id, user.token_version),
        refresh_token=create_refresh_token(user.id, user.token_version),
    )


@router.post("/apple", response_model=TokenResponse, dependencies=[_auth_limit])
def login_with_apple(body: SocialAuthRequest, db: Session = Depends(get_db)):
    try:
        claims = verify_apple_identity_token(body.id_token, settings.apple_bundle_id)
    except SocialAuthError as e:
        raise HTTPException(status_code=401, detail=_social_detail(e, "Apple"))
    return _issue_tokens_for_social_user(db, claims["email"], body.display_name, "apple", claims["sub"])


@router.post("/google", response_model=TokenResponse, dependencies=[_auth_limit])
def login_with_google(body: SocialAuthRequest, db: Session = Depends(get_db)):
    if not settings.google_web_client_id:
        raise HTTPException(status_code=500, detail="Google sign-in is not configured on the server")
    try:
        claims = verify_google_id_token(body.id_token, settings.google_web_client_id, body.access_token)
    except SocialAuthError as e:
        raise HTTPException(status_code=401, detail=_social_detail(e, "Google"))
    return _issue_tokens_for_social_user(db, claims["email"], body.display_name or claims.get("name"), "google", claims["sub"])


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/refresh", response_model=TokenResponse)
def refresh(body: RefreshRequest, db: Session = Depends(get_db)):
    try:
        user_id, version = decode_claims(body.refresh_token, "refresh")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active or user.token_version != version:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    jti, expires_at = refresh_token_claims(body.refresh_token)
    if jti and expires_at:
        now = datetime.now(timezone.utc)
        db.query(UsedRefreshToken).filter(UsedRefreshToken.expires_at < now).delete(synchronize_session=False)
        seen = db.query(UsedRefreshToken).filter(UsedRefreshToken.jti == jti).first()
        if seen:
            used_at = seen.used_at if seen.used_at.tzinfo else seen.used_at.replace(tzinfo=timezone.utc)
            if (now - used_at).total_seconds() > REFRESH_REUSE_GRACE_SECONDS:
                # Exchanged before and presented again later: a copy exists. End every session.
                user.token_version += 1
                db.commit()
                raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
        else:
            db.add(UsedRefreshToken(jti=jti, user_id=user_id, used_at=now, expires_at=expires_at))
        try:
            db.commit()
        except IntegrityError:
            # Two requests with the same token raced to record it: the other one won, which is the retry case.
            db.rollback()
    return TokenResponse(
        access_token=create_access_token(user_id, user.token_version),
        refresh_token=create_refresh_token(user_id, user.token_version),
    )


@router.post("/change-password", response_model=TokenResponse, dependencies=[_auth_limit])
def change_password(body: ChangePasswordRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Accounts created through Apple/Google have no password to change.
    if not current_user.hashed_password or not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    problem = password_problem(body.new_password, current_user.email)
    if problem:
        raise HTTPException(status_code=400, detail=problem)
    if body.new_password == body.current_password:
        raise HTTPException(status_code=400, detail="Choose a different password")
    current_user.hashed_password = hash_password(body.new_password)
    current_user.token_version += 1  # every other signed-in device must sign in again
    db.commit()
    # This device keeps its session: hand back tokens for the new version.
    return TokenResponse(
        access_token=create_access_token(current_user.id, current_user.token_version),
        refresh_token=create_refresh_token(current_user.id, current_user.token_version),
    )


@router.post("/logout-all", status_code=status.HTTP_204_NO_CONTENT, dependencies=[_auth_limit])
def logout_all(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Sign this account out everywhere (all access and refresh tokens issued so far stop working)."""
    current_user.token_version += 1
    db.commit()

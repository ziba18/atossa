from fastapi import APIRouter, Depends, HTTPException, status
from jwt import PyJWTError as JWTError
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User, Profile
from app.schemas.auth import (
    ChangePasswordRequest, LoginRequest, RegisterRequest, RefreshRequest, SocialAuthRequest, TokenResponse, UserResponse,
)
from app.services.auth import (
    create_access_token, create_refresh_token, create_user, hash_password,
    decode_token, get_or_create_social_user, get_user_by_email, verify_password,
)
from app.services.password_policy import password_problem
from app.services.rate_limit import FailureThrottle, limit
from app.services.social_auth import SocialAuthError, verify_apple_identity_token, verify_google_id_token

router = APIRouter(prefix="/auth", tags=["auth"])
_auth_limit = Depends(limit("auth", 20, 60))
# 8 wrong passwords for one email in 15 minutes locks that email for the rest of the window.
_login_failures = FailureThrottle(8, 900)


def _issue_tokens_for_social_user(db: Session, email: str, display_name: str | None) -> TokenResponse:
    user = get_or_create_social_user(db, email, display_name)
    if display_name:
        profile = db.query(Profile).filter(Profile.id == user.id).first()
        if profile and not profile.display_name:
            profile.display_name = display_name
            db.commit()
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
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
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/login", response_model=TokenResponse, dependencies=[_auth_limit])
def login(body: LoginRequest, db: Session = Depends(get_db)):
    email_key = body.email.strip().lower()
    _login_failures.check(email_key)
    user = get_user_by_email(db, body.email)
    if not user or not user.hashed_password or not verify_password(body.password, user.hashed_password):
        _login_failures.fail(email_key)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    _login_failures.clear(email_key)
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/apple", response_model=TokenResponse, dependencies=[_auth_limit])
def login_with_apple(body: SocialAuthRequest, db: Session = Depends(get_db)):
    try:
        claims = verify_apple_identity_token(body.id_token, settings.apple_bundle_id)
    except SocialAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))
    return _issue_tokens_for_social_user(db, claims["email"], body.display_name)


@router.post("/google", response_model=TokenResponse, dependencies=[_auth_limit])
def login_with_google(body: SocialAuthRequest, db: Session = Depends(get_db)):
    if not settings.google_web_client_id:
        raise HTTPException(status_code=500, detail="Google sign-in is not configured on the server")
    try:
        claims = verify_google_id_token(body.id_token, settings.google_web_client_id, body.access_token)
    except SocialAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))
    return _issue_tokens_for_social_user(db, claims["email"], body.display_name or claims.get("name"))


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/refresh", response_model=TokenResponse)
def refresh(body: RefreshRequest, db: Session = Depends(get_db)):
    try:
        user_id = decode_token(body.refresh_token, "refresh")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    if not db.query(User).filter(User.id == user_id).first():
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    return TokenResponse(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
    )


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT, dependencies=[_auth_limit])
def change_password(body: ChangePasswordRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Accounts created through Apple/Google have no password to change.
    if not current_user.hashed_password or not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(body.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if body.new_password == body.current_password:
        raise HTTPException(status_code=400, detail="Choose a different password")
    current_user.hashed_password = hash_password(body.new_password)
    db.commit()

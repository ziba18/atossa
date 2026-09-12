from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User, Profile
from app.schemas.auth import (
    LoginRequest, RegisterRequest, RefreshRequest, SocialAuthRequest, TokenResponse, UserResponse,
)
from app.services.auth import (
    create_access_token, create_refresh_token, create_user,
    decode_token, get_or_create_social_user, get_user_by_email, verify_password,
)
from app.services.social_auth import SocialAuthError, verify_apple_identity_token, verify_google_id_token

router = APIRouter(prefix="/auth", tags=["auth"])


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


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if get_user_by_email(db, body.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    user = create_user(db, body.email, body.password, body.display_name)
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, body.email)
    if not user or not user.hashed_password or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/apple", response_model=TokenResponse)
def login_with_apple(body: SocialAuthRequest, db: Session = Depends(get_db)):
    try:
        claims = verify_apple_identity_token(body.id_token, settings.apple_bundle_id)
    except SocialAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))
    return _issue_tokens_for_social_user(db, claims["email"], body.display_name)


@router.post("/google", response_model=TokenResponse)
def login_with_google(body: SocialAuthRequest, db: Session = Depends(get_db)):
    if not settings.google_web_client_id:
        raise HTTPException(status_code=500, detail="Google sign-in is not configured on the server")
    try:
        claims = verify_google_id_token(body.id_token, settings.google_web_client_id)
    except SocialAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))
    return _issue_tokens_for_social_user(db, claims["email"], body.display_name or claims.get("name"))


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/refresh", response_model=TokenResponse)
def refresh(body: RefreshRequest):
    try:
        user_id = decode_token(body.refresh_token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    return TokenResponse(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
    )

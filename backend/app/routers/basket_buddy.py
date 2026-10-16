"""Apple/Google sign-in for Basket Buddy ("Groceries Mate"), a separate app.

It shares this server only for sign-in: the identity token is checked here exactly as for
Atossa (services/social_auth.py), but against Basket Buddy's bundle ID / Google client, and the
response is a session for Basket Buddy's own Supabase project (services/basket_buddy_auth.py).
Nothing is stored in Atossa's database.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import settings
from app.schemas.auth import SocialAuthRequest
from app.services.basket_buddy_auth import BasketBuddyAuthError, create_supabase_session
from app.services.social_auth import SocialAuthError, verify_apple_identity_token, verify_google_id_token

router = APIRouter(prefix="/basket-buddy", tags=["basket-buddy"])


class SupabaseSessionResponse(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int | None = None
    token_type: str = "bearer"


def _session(email: str, display_name: str | None) -> SupabaseSessionResponse:
    try:
        return SupabaseSessionResponse(**create_supabase_session(email, display_name))
    except BasketBuddyAuthError as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.post("/auth/apple", response_model=SupabaseSessionResponse)
def basket_login_with_apple(body: SocialAuthRequest):
    try:
        claims = verify_apple_identity_token(body.id_token, settings.basket_apple_bundle_id)
    except SocialAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))
    return _session(claims["email"], body.display_name)


@router.post("/auth/google", response_model=SupabaseSessionResponse)
def basket_login_with_google(body: SocialAuthRequest):
    if not settings.basket_google_web_client_id:
        raise HTTPException(status_code=500, detail="Google sign-in is not configured on the server")
    try:
        claims = verify_google_id_token(body.id_token, settings.basket_google_web_client_id, body.access_token)
    except SocialAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))
    return _session(claims["email"], body.display_name or claims.get("name"))

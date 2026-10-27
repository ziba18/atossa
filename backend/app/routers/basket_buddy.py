"""Apple/Google sign-in for Basket Buddy ("Groceries Mate"), a separate app.

It shares this server only for sign-in: the identity token is checked here exactly as for
Atossa (services/social_auth.py), but against Basket Buddy's bundle ID / Google client, and the
response is a session for Basket Buddy's own Supabase project (services/basket_buddy_auth.py).
Nothing is stored in Atossa's database.
"""
import html
import re

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from app.config import settings
from app.schemas.auth import SocialAuthRequest
from app.services.rate_limit import limit
from app.services.basket_buddy_auth import BasketBuddyAuthError, create_supabase_session
from app.services.social_auth import SocialAuthError, verify_apple_identity_token, verify_google_id_token

router = APIRouter(prefix="/basket-buddy", tags=["basket-buddy"])
_auth_limit = Depends(limit("basket-auth", 20, 60))


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


@router.post("/auth/apple", response_model=SupabaseSessionResponse, dependencies=[_auth_limit])
def basket_login_with_apple(body: SocialAuthRequest):
    try:
        claims = verify_apple_identity_token(body.id_token, settings.basket_apple_bundle_id)
    except SocialAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))
    return _session(claims["email"], body.display_name)


@router.post("/auth/google", response_model=SupabaseSessionResponse, dependencies=[_auth_limit])
def basket_login_with_google(body: SocialAuthRequest):
    audiences = [settings.basket_google_web_client_id.strip()] + [
        c.strip() for c in settings.basket_google_known_client_ids.split(",")
    ]
    audiences = list(dict.fromkeys(a for a in audiences if a))
    if not audiences:
        raise HTTPException(status_code=500, detail="Google sign-in is not configured on the server")
    try:
        claims = verify_google_id_token(body.id_token, audiences, body.access_token)
    except SocialAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))
    return _session(claims["email"], body.display_name or claims.get("name"))


# Home invite links. The app shares https://<this server>/basket-buddy/join?code=XXXX (and encodes it in
# the Settings QR code) because chat apps don't make the app's custom scheme tappable. This page hands
# off to basketbuddy://join?code=XXXX, which the installed app routes to its join screen, and otherwise
# shows the store links and the code to type in by hand.
_PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.zibazamani.basketbuddy"
_INVITE_CODE = re.compile(r"^[A-Z0-9]{4,12}$")

_JOIN_PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Join a Home on Basket Buddy</title>
<style>
  :root {{ color-scheme: light dark; }}
  body {{ margin: 0; font-family: -apple-system, system-ui, sans-serif; background: Canvas; color: CanvasText; }}
  main {{ max-width: 420px; margin: 0 auto; padding: 48px 20px; text-align: center; }}
  h1 {{ font-size: 26px; margin: 0 0 8px; }}
  p {{ opacity: .75; line-height: 1.5; }}
  .code {{ font-size: 34px; font-weight: 700; letter-spacing: 6px; margin: 24px 0; }}
  a.button {{ display: block; padding: 14px; border-radius: 14px; margin: 12px 0; font-weight: 600;
             text-decoration: none; background: CanvasText; color: Canvas; }}
  a.secondary {{ background: rgba(127,127,127,.18); color: CanvasText; }}
</style>
</head>
<body>
<main>
  <h1>You're invited</h1>
  <p>Someone wants to share their shopping list with you on Basket Buddy.</p>
  <div class="code">{code}</div>
  <a class="button" href="{app_url}">Open in Basket Buddy</a>
  <a class="button secondary" href="{play_url}">Get it on Google Play</a>
  <p>On iPhone, get Basket Buddy (Groceries Mate) from the App Store, then come back and tap
     &ldquo;Open in Basket Buddy&rdquo; &mdash; or choose <b>Join a Home</b> in the app and enter the code above.</p>
</main>
<script>window.location.href = {app_url_js};</script>
</body>
</html>"""


@router.get("/join", response_class=HTMLResponse)
def basket_join_page(code: str = ""):
    code = code.strip().upper()
    if not _INVITE_CODE.match(code):
        raise HTTPException(status_code=404, detail="Invalid invite link")
    app_url = f"basketbuddy://join?code={code}"
    return HTMLResponse(
        _JOIN_PAGE.format(
            code=html.escape(code),
            app_url=html.escape(app_url),
            app_url_js=f'"{app_url}"',
            play_url=_PLAY_STORE_URL,
        )
    )

"""Supabase sessions for Basket Buddy, minted after this server has verified a social token.

Basket Buddy keeps all its data in its own Supabase project, protected by row-level security
on `auth.uid()`, so a sign-in has to end in a real Supabase session (access + refresh token),
not one of this server's own JWTs. The admin API does that in three calls:

1. create the user (pre-confirmed) if the email is new — the project's `handle_new_user`
   trigger then makes the `profiles` row from the `nickname` metadata;
2. generate a magic link for the email (admin-generated links are not emailed);
3. verify that link's hashed token, which returns the session.

The user is found by email, so someone who signed up with a password or with the old
Supabase-side Apple/Google sign-in keeps the same account and data.
"""
import httpx

from app.config import settings


class BasketBuddyAuthError(Exception):
    pass


def _headers() -> dict:
    key = settings.basket_supabase_secret_key
    headers = {"apikey": key, "Content-Type": "application/json"}
    # A legacy service_role key is a JWT and must also go in Authorization. The newer
    # `sb_secret_...` keys are not JWTs; Supabase's gateway accepts them in `apikey` alone.
    if key.startswith("eyJ"):
        headers["Authorization"] = f"Bearer {key}"
    return headers


def _post(client: httpx.Client, path: str, body: dict) -> httpx.Response:
    try:
        return client.post(f"{settings.basket_supabase_url}/auth/v1{path}", json=body, headers=_headers())
    except httpx.HTTPError as e:
        raise BasketBuddyAuthError(f"Could not reach Basket Buddy's Supabase: {e}")


def create_supabase_session(email: str, display_name: str | None, client: httpx.Client | None = None) -> dict:
    """Return {access_token, refresh_token, expires_in, token_type} for this email's user."""
    if not settings.basket_supabase_secret_key:
        raise BasketBuddyAuthError("Basket Buddy sign-in is not configured on the server")

    own_client = client is None
    client = client or httpx.Client(timeout=15)
    try:
        created = _post(client, "/admin/users", {
            "email": email,
            "email_confirm": True,
            "user_metadata": {"nickname": display_name} if display_name else {},
        })
        # 422 = the email already has an account, which is the normal sign-in case.
        if created.status_code not in (200, 201, 422):
            raise BasketBuddyAuthError(f"Could not create the user ({created.status_code})")

        link = _post(client, "/admin/generate_link", {"type": "magiclink", "email": email})
        if link.status_code != 200:
            raise BasketBuddyAuthError(f"Could not start the session ({link.status_code})")
        link_data = link.json()
        token_hash = link_data.get("hashed_token") or link_data.get("properties", {}).get("hashed_token")
        if not token_hash:
            raise BasketBuddyAuthError("Supabase did not return a sign-in token")

        verified = _post(client, "/verify", {
            "type": link_data.get("verification_type") or "magiclink",
            "token_hash": token_hash,
        })
        if verified.status_code != 200:
            raise BasketBuddyAuthError(f"Could not create the session ({verified.status_code})")
        session = verified.json()
        if not session.get("access_token") or not session.get("refresh_token"):
            raise BasketBuddyAuthError("Supabase did not return a session")
        return {
            "access_token": session["access_token"],
            "refresh_token": session["refresh_token"],
            "expires_in": session.get("expires_in"),
            "token_type": session.get("token_type", "bearer"),
        }
    finally:
        if own_client:
            client.close()

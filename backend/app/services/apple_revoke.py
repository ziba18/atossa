import time
import httpx
import jwt

APPLE_AUDIENCE = "https://appleid.apple.com"
APPLE_REVOKE_URL = "https://appleid.apple.com/auth/revoke"


def build_client_secret(team_id: str, key_id: str, private_key: str, client_id: str, now: float | None = None) -> str:
    """Short-lived ES256 JWT Apple accepts as the client secret."""
    issued = int(now if now is not None else time.time())
    claims = {"iss": team_id, "iat": issued, "exp": issued + 300, "aud": APPLE_AUDIENCE, "sub": client_id}
    return jwt.encode(claims, private_key, algorithm="ES256", headers={"kid": key_id})


def revoke_refresh_token(refresh_token: str, *, team_id: str, key_id: str, private_key: str, client_id: str) -> bool:
    """Tell Apple to end the link between this app and the person's Apple ID.

    Returns True when Apple accepted the call. Returns False (never raises) when the
    settings are empty or the call fails, so deleting an account is never blocked by it.
    """
    if not (team_id and key_id and private_key and refresh_token):
        return False
    try:
        secret = build_client_secret(team_id, key_id, private_key, client_id)
        resp = httpx.post(
            APPLE_REVOKE_URL,
            data={"client_id": client_id, "client_secret": secret, "token": refresh_token,
                  "token_type_hint": "refresh_token"},
            timeout=10,
        )
        return resp.status_code == 200
    except Exception:
        return False

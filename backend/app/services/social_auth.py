import time
import httpx
from jose import JWTError, jwt

APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys"
GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs"
APPLE_ISSUER = "https://appleid.apple.com"
GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"]

_CACHE_TTL_SECONDS = 3600
_jwks_cache: dict[str, tuple[float, dict]] = {}


class SocialAuthError(Exception):
    pass


def _get_jwks(url: str) -> dict:
    cached = _jwks_cache.get(url)
    if cached and time.time() - cached[0] < _CACHE_TTL_SECONDS:
        return cached[1]
    try:
        resp = httpx.get(url, timeout=10)
        resp.raise_for_status()
    except httpx.HTTPError as e:
        raise SocialAuthError(f"Could not fetch signing keys from {url}: {e}")
    jwks = resp.json()
    _jwks_cache[url] = (time.time(), jwks)
    return jwks


def _verified_email(claims: dict, provider: str) -> str:
    """The token's email, lowercased, only if the provider says it is verified.

    Social sign-in finds the account by email, so an unverified address (possible on a
    Google account made with a non-Gmail address) could otherwise sign in to someone
    else's email-and-password account. Apple sends the flag as the string "true".
    """
    email = claims.get("email")
    if not email:
        raise SocialAuthError(f"{provider} identity token did not include an email")
    if claims.get("email_verified") not in (True, "true"):
        raise SocialAuthError(f"{provider} has not verified this email address")
    return email.strip().lower()


def verify_apple_identity_token(id_token: str, bundle_id: str) -> dict:
    """Verify an Apple `identityToken` from expo-apple-authentication. Returns {sub, email}."""
    jwks = _get_jwks(APPLE_JWKS_URL)
    try:
        claims = jwt.decode(id_token, jwks, algorithms=["RS256"], audience=bundle_id, issuer=APPLE_ISSUER)
    except JWTError as e:
        raise SocialAuthError(f"Invalid Apple identity token: {e}")
    return {"sub": claims["sub"], "email": _verified_email(claims, "Apple")}


def verify_google_id_token(
    id_token: str, client_id: str | list[str], access_token: str | None = None,
) -> dict:
    """Verify a Google `idToken` from @react-native-google-signin. Returns {sub, email, name}.

    Google's iOS ID tokens carry an `at_hash` claim, which python-jose rejects unless it
    gets the matching access token to check it against — so the app sends that too.
    `client_id` may be a list of accepted audiences (python-jose only takes one, so the
    audience is then checked here instead).
    """
    jwks = _get_jwks(GOOGLE_JWKS_URL)
    audiences = [client_id] if isinstance(client_id, str) else [c for c in client_id if c]
    try:
        claims = jwt.decode(
            id_token, jwks, algorithms=["RS256"], issuer=GOOGLE_ISSUERS, access_token=access_token,
            audience=audiences[0] if len(audiences) == 1 else None,
            options={"verify_aud": len(audiences) == 1},
        )
    except JWTError as e:
        raise SocialAuthError(f"Invalid Google identity token: {e}")
    if len(audiences) > 1:
        token_aud = claims.get("aud")
        token_auds = token_aud if isinstance(token_aud, list) else [token_aud]
        if not any(a in audiences for a in token_auds):
            raise SocialAuthError("Invalid Google identity token: Invalid audience")
    return {"sub": claims["sub"], "email": _verified_email(claims, "Google"), "name": claims.get("name")}

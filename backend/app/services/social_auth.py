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


def verify_apple_identity_token(id_token: str, bundle_id: str) -> dict:
    """Verify an Apple `identityToken` from expo-apple-authentication. Returns {sub, email}."""
    jwks = _get_jwks(APPLE_JWKS_URL)
    try:
        claims = jwt.decode(id_token, jwks, algorithms=["RS256"], audience=bundle_id, issuer=APPLE_ISSUER)
    except JWTError as e:
        raise SocialAuthError(f"Invalid Apple identity token: {e}")
    email = claims.get("email")
    if not email:
        raise SocialAuthError("Apple identity token did not include an email")
    return {"sub": claims["sub"], "email": email}


def verify_google_id_token(id_token: str, client_id: str) -> dict:
    """Verify a Google `idToken` from @react-native-google-signin. Returns {sub, email, name}."""
    jwks = _get_jwks(GOOGLE_JWKS_URL)
    try:
        claims = jwt.decode(id_token, jwks, algorithms=["RS256"], audience=client_id, issuer=GOOGLE_ISSUERS)
    except JWTError as e:
        raise SocialAuthError(f"Invalid Google identity token: {e}")
    email = claims.get("email")
    if not email:
        raise SocialAuthError("Google identity token did not include an email")
    return {"sub": claims["sub"], "email": email, "name": claims.get("name")}

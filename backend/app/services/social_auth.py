import base64
import hashlib
import time
import httpx
import jwt
from jwt import PyJWTError as JWTError

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


def _signing_key(id_token: str, jwks: dict):
    """The JWKS key whose `kid` matches the token header."""
    kid = jwt.get_unverified_header(id_token).get("kid")
    for k in jwks.get("keys", []):
        if k.get("kid") == kid:
            return jwt.PyJWK(k).key
    raise JWTError("Signing key not found")


def _check_at_hash(claims: dict, access_token: str | None) -> None:
    """OIDC at_hash: left half of SHA-256(access_token), base64url without padding."""
    expected = claims.get("at_hash")
    if not expected:
        return
    if not access_token:
        raise JWTError("Missing access token for at_hash")
    digest = hashlib.sha256(access_token.encode("ascii")).digest()[:16]
    if base64.urlsafe_b64encode(digest).rstrip(b"=").decode() != expected:
        raise JWTError("Invalid at_hash")


def verify_apple_identity_token(id_token: str, bundle_id: str) -> dict:
    """Verify an Apple `identityToken` from expo-apple-authentication. Returns {sub, email}."""
    jwks = _get_jwks(APPLE_JWKS_URL)
    try:
        claims = jwt.decode(
            id_token, _signing_key(id_token, jwks), algorithms=["RS256"],
            audience=bundle_id, issuer=APPLE_ISSUER,
        )
    except JWTError as e:
        raise SocialAuthError(f"Invalid Apple identity token: {e}")
    return {"sub": claims["sub"], "email": _verified_email(claims, "Apple")}


def verify_google_id_token(
    id_token: str, client_id: str | list[str], access_token: str | None = None,
) -> dict:
    """Verify a Google `idToken` from @react-native-google-signin. Returns {sub, email, name}.

    Google's iOS ID tokens carry an `at_hash` claim, which is checked against the access
    token the app sends along.
    `client_id` may be a list of accepted audiences.
    """
    jwks = _get_jwks(GOOGLE_JWKS_URL)
    audiences = [client_id] if isinstance(client_id, str) else [c for c in client_id if c]
    try:
        claims = jwt.decode(
            id_token, _signing_key(id_token, jwks), algorithms=["RS256"], audience=audiences,
            options={"require": ["exp", "iss", "aud"]},
        )
        if claims.get("iss") not in GOOGLE_ISSUERS:
            raise JWTError("Invalid issuer")
        _check_at_hash(claims, access_token)
    except JWTError as e:
        raise SocialAuthError(f"Invalid Google identity token: {e}")
    return {"sub": claims["sub"], "email": _verified_email(claims, "Google"), "name": claims.get("name")}

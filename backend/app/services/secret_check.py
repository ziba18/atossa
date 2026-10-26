"""Sanity check for the token-signing secret (SECRET_KEY)."""
import logging

logger = logging.getLogger(__name__)

MIN_LENGTH = 32
_PLACEHOLDERS = {"secret", "changeme", "change-me", "change_me", "your-secret-key", "your_secret_key", "password", "development", "dev", "test", "supersecret"}


def weak_secret_reason(secret: str) -> str | None:
    """Return why the secret is too weak to sign tokens with, or None if it looks fine."""
    s = secret.strip()
    if s.lower() in _PLACEHOLDERS:
        return "is a placeholder value"
    if len(s) < MIN_LENGTH:
        return f"is shorter than {MIN_LENGTH} characters"
    if len(set(s)) < 8:
        return "uses fewer than 8 distinct characters"
    return None


def check_secret(secret: str, strict: bool = False) -> None:
    """Warn about a weak secret; raise instead when strict (opt in once the live value is known to pass)."""
    reason = weak_secret_reason(secret)
    if reason is None:
        return
    message = f"SECRET_KEY {reason}; generate one with `python -c \"import secrets; print(secrets.token_urlsafe(48))\"`"
    if strict:
        raise RuntimeError(message)
    logger.warning(message)

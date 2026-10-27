from pathlib import Path

def _load_common() -> frozenset:
    # All 8+ character entries of SecLists 10k-most-common.txt (MIT licence, Daniel Miessler); shorter ones
    # already fail the length rule, so this covers ASVS 5.0 6.2.4 (top 3,000 common passwords).
    path = Path(__file__).resolve().parent.parent / "data" / "common_passwords.txt"
    try:
        return frozenset(path.read_text().split())
    except OSError:
        return frozenset()


COMMON_PASSWORDS = _load_common() | frozenset("""
password password1 password12 password123 passw0rd p@ssw0rd 12345678 123456789 1234567890 11111111
00000000 87654321 qwertyui qwerty123 qwertyuiop 1q2w3e4r 1q2w3e4r5t iloveyou iloveyou1 letmein1
welcome1 welcome123 admin123 abc12345 abcd1234 monkey123 dragon123 football1 baseball1 sunshine1
princess1 trustno1 changeme changeme1 atossa123 atossa1234 password! passwort1 london123 summer2024
""".split())



def password_problem(password: str, email: str = "") -> str | None:
    """Return a user-facing reason the password is not acceptable, or None."""
    if len(password) < 8:
        return "Password must be at least 8 characters"
    if "\x00" in password:
        return "Password contains a character that is not allowed"
    if len(password) > 128:
        return "Password must be at most 128 characters"
    lowered = password.lower()
    if lowered in COMMON_PASSWORDS or len(set(lowered)) == 1:
        return "That password is too common. Please choose another"
    local = email.split("@", 1)[0].lower()
    if len(local) >= 4 and lowered == local:
        return "Password must not be your email name"
    return None

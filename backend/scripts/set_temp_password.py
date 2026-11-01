"""Owner-only: give an Atossa account a temporary password when the patient has forgotten hers.

Run on the owner's own machine against the production database (DATABASE_URL in backend/.env):

    cd backend && source .venv/bin/activate
    python -m scripts.set_temp_password --email someone@example.com

What it does (gate 11, pm/before-first-patient.md):
- looks the email up in Atossa's own `users` table only (Basket Buddy accounts live in a separate
  auth project and are never touched); an unknown email changes nothing and exits 1;
- refuses accounts with no password (Apple/Google sign-in only), so no new way in is added;
- sets a random temporary password hashed with the app's own `hash_password` (current scheme),
  bumps `token_version` so every old session on a lost phone ends, and prints the password ONCE
  to this terminal. Say it only on a call-back YOU start to the number on the pilot sign-up sheet;
  she changes it in Profile (not enforced yet: Safety S-544).

Full owner runbook (who to trust, exact steps, what to log): backend/scripts/FORGOTTEN_PASSWORD.md.
- writes an audit line with the account id only (no email, no password) to the `atossa.security` log.

Agents never run or deploy this; it is not imported by the app.
"""
import argparse
import logging
import secrets
import sys

from sqlalchemy import func
from sqlalchemy.orm import Session

logger = logging.getLogger("atossa.security")

# No 0/O, 1/l/I: the password is read out over the phone.
ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"


class TempPasswordError(Exception):
    pass


def make_temp_password(groups: int = 4, size: int = 4) -> str:
    return "-".join("".join(secrets.choice(ALPHABET) for _ in range(size)) for _ in range(groups))


def set_temp_password(db: Session, email: str) -> str:
    from app.models.user import User
    from app.services.auth import hash_password
    from app.services import security_events

    address = (email or "").strip().lower()
    if not address or "@" not in address:
        raise TempPasswordError("not an email address")
    user = db.query(User).filter(func.lower(User.email) == address).first()
    if user is None:
        raise TempPasswordError("no Atossa account with that email; nothing changed")
    if not user.hashed_password:
        raise TempPasswordError("this account signs in with Apple or Google only; nothing changed")
    temp = make_temp_password()
    user.hashed_password = hash_password(temp)
    user.token_version = (user.token_version or 0) + 1
    db.commit()
    security_events.record("temp_password_set")
    logger.warning("temp password set by owner script for account %s (sessions ended)", user.id)
    return temp


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("--email", required=True)
    args = p.parse_args(argv)
    logging.basicConfig(level=logging.INFO)
    from app.database import SessionLocal

    db = SessionLocal()
    try:
        temp = set_temp_password(db, args.email)
    except TempPasswordError as e:
        print(f"Refused: {e}", file=sys.stderr)
        return 1
    finally:
        db.close()
    print("Temporary password (shown once, not saved anywhere):")
    print(f"    {temp}")
    print("Say it only on a call-back you start to the number on the pilot sign-up sheet. She signs in, then changes it in Profile.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

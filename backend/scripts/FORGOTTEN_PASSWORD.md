# Forgotten password — owner runbook (pilot)

One runbook for the owner. It joins the tool (`set_temp_password.py`, AI Brain B139) and the
checks from Safety (`agents/safety/rights-runbooks.md` "Forgotten password", run66 review of B139).
Run by the owner only, on the owner's own machine. Agents never run it and never touch production.

## What she sees in the app
Forgot password screen (Safety wording B):
"Email us from the address you signed up with. We'll check it's you and give you a temporary
password; your saved notes stay as they are. If you signed up with Apple or Google, use that
button on the sign-in screen instead."

## Steps
1. **The request must come from the email address on her account.** A request from any other
   address, a phone call or a message on social media: reply "please email us from the address
   you signed up with" and stop.
2. **Check two account facts before acting:** the month she signed up and the name on her profile
   (you look these up; she tells you). Never use anything about her notes to check who she is,
   and never read her notes.
3. **Run the tool** (owner's machine, production `DATABASE_URL` in `backend/.env`, never committed):
   ```
   cd backend && source .venv/bin/activate
   python -m scripts.set_temp_password --email her.address@example.com
   ```
   - `Refused: no Atossa account with that email; nothing changed` (exit 1): nothing changed. Check the spelling with her by email.
   - `Refused: this account signs in with Apple or Google only; nothing changed` (exit 1): nothing changed. Tell her to use the Apple/Google
     button on the sign-in screen.
   - Success prints `Temporary password (shown once, not saved anywhere):` and the password.
     Do not copy it into email, chat or a file.
4. **Give it only on a call-back you start** to the phone number on the pilot sign-up sheet. Never
   to a number the caller gives, never in writing. Read it in groups of four (no 0/O/1/l/I in it).
5. **She signs in and changes it straight away** in Profile. The app does not force this yet
   (Safety S-544), so ask her to confirm she has changed it.
6. Every old session (for example on a lost phone) has already ended (`token_version` + 1).
   Her notes are untouched.
7. **Log** date + account id (the tool prints neither email nor password to the log; the
   `atossa.security` line has the id) in the rights/ops log. Count it as a rights-log entry.

## Try it safely first (no production)
```
cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt pytest
DATABASE_URL=sqlite:///./throwaway.db SECRET_KEY=local-test-only python -m pytest -q tests/test_set_temp_password.py
rm -f throwaway.db
```

## Never
- Never on production without the owner at the keyboard.
- Never to an unverified caller or address; never by email or text.
- Never for Basket Buddy accounts (separate auth project; the tool cannot reach them).

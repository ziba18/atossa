# Atossa — Claude Code Project Notes

## Current work: MVP pivot (branch `mvp-symptom-capture`)

Atossa is pivoting from a cycle-tracking app to a symptom-capture tool for
PCOS/endometriosis patients: turning how someone describes symptoms into a
structured, GP-ready summary. No diagnostic language anywhere in the UI —
never names a condition, gives a probability, suggests a cause, or
recommends treatment. `MVP.md` has the three-feature roadmap (status +
acceptance criteria per feature); `WORKLOG.md` is the dated, detailed log
of every decision, what was verified, and why — treat WORKLOG.md as the
source of truth for specifics, this file is just the orientation summary.

**Status as of 2026-09-08:** Steps A–D of Feature 1's capture layer are
code-complete; Step D isn't live-verified yet (blocked on disk space, see
below). **Nothing on this branch is committed** — all changes are sitting
in the working tree since the session that started this branch.

### Done
- Branch + `MVP.md` + `WORKLOG.md`
- Backend: `/captures` endpoints (`POST`, `GET ?limit=10`),
  `symptom_captures` table + Alembic migration — verified live via curl
  (create, validation rejects, list ordering, auth enforcement)
- Frontend: `app/(tabs)/chat/capture.tsx` — text-capture path verified
  live in Expo Go in the simulator (register → onboarding → save →
  persisted across remount). Voice-capture path (`lib/transcription.ts`,
  `expo-speech-recognition`) is written with full failure-mode handling
  but **not yet run** — needs a dev-client build, not Expo Go, since
  it's a native module Expo Go doesn't include.
- A temporary entry point (clipboard icon next to the profile avatar in
  the chat header) routes to the capture screen for testing. Step E
  replaces this with the real integration.

### Not done yet
- **Step D live verification** — blocked on disk space (see below).
  Once there's room, retry with a **direct `xcodebuild` call**, not
  `npx expo run:ios` — that's broken on this Mac (Expo CLI's devicectl
  JSON parsing doesn't match this Xcode version, 26.4.1, and
  misclassifies the simulator as a physical device, demanding code
  signing that will never be there). Working command:
  ```
  xcrun simctl boot "iPhone 17 Pro"   # or whatever's available
  xcrun simctl list devices booted    # get the UDID
  cd ios && xcodebuild -workspace Atossa.xcworkspace -scheme Atossa \
    -configuration Debug -sdk iphonesimulator -derivedDataPath build \
    -destination 'platform=iOS Simulator,id=<UDID>' build
  ```
  Then `xcrun simctl install booted ios/build/Build/Products/Debug-iphonesimulator/Atossa.app`
  and launch it, with Metro running (`npx expo start`) alongside.
  **Delete `ios/build` after** — it's ~3GB of derived data and this
  Mac has very little headroom.
- **Step E**: strip the fake `AI_RESPONSE` / fake "analysing" animation
  out of `app/(tabs)/chat/index.tsx` (hardcoded diagnostic-sounding text
  — violates the no-diagnostic-language rule; user explicitly approved
  removing it), and wire the real voice/text entry points there into the
  capture screen, replacing the temporary header icon.
- Features 2 (Missing Piece Questions) and 3 (Next Step Tracker) are
  explicitly out of scope until Feature 1 is fully done — don't start
  them early.

### Local dev environment facts
- Backend: `cd backend && source .venv/bin/activate && uvicorn app.main:app --port 8000`.
  Postgres is hosted on a Supabase project (ref `xdczqwbetzpmneazszcu`,
  org "ziba18's Org") used purely as free DB hosting — the app itself
  never talks to Supabase directly, only to this FastAPI backend.
- `.env` (root) and `backend/.env` are gitignored and already populated
  from a prior session — don't need to be recreated.
- **Disk space is tight on this Mac** — check `df -h /` before any
  native build. Clean up `ios/build` and `android/` derived-data
  directories after testing; don't leave them lying around.
- Test accounts created during dev/testing are cleaned up after each
  session (see WORKLOG.md for the SQL/Python cleanup pattern used).

### Separate, paused thread (unrelated to the MVP work)
Transferring the app's App Store Connect listing from the coworker's
Apple Developer account to the user's own — paused, user needs to enroll
in the Apple Developer Program (Individual is sufficient, confirmed via
Apple's docs — no Organization/D-U-N-S needed) before this can continue.

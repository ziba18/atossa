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

**Cleanup (2026-09-24, later):** all cycle *prediction* code is gone
(app, server, `training/`, TFLite stubs), as are `/captures`, the old
`/cycles/symptoms*` endpoints, the old hidden screens and ~23 unused npm
packages. `/chat` is deliberately kept deployed but unused. See the top
WORKLOG entry.

**Redesign (2026-09-24):** the app now has three tabs — Chat, Dashboard,
For my doctor — ported from a Lovable prototype; new generic `/records`
backend store. See the top WORKLOG entry. Not yet run on a device or
simulator before the TestFlight build. The Chat tab no longer uses the
`/chat` LLM (it is a fixed four-question flow).

**Status as of 2026-09-24 (before the redesign):** everything was committed and pushed —
`mvp-symptom-capture` (`d0ff597`) matches GitHub, and Render serves this
branch. Steps A–C of Feature 1's capture layer are live-verified; Step D
(voice) is code-complete but not live-verified (blocked on disk space,
see below). The chat tab now has a real `/chat` backend (see below).

### Done
- Branch + `MVP.md` + `WORKLOG.md`
- Backend: `/captures` endpoints (`POST`, `GET ?limit=10`),
  `symptom_captures` table + Alembic migration — verified live via curl
  (create, validation rejects, list ordering, auth enforcement)
- (Historical — `capture.tsx` has since been deleted.) Frontend: `app/(tabs)/chat/capture.tsx` — text-capture path verified
  live in Expo Go in the simulator (register → onboarding → save →
  persisted across remount). Voice-capture path (`lib/transcription.ts`,
  `expo-speech-recognition`) is written with full failure-mode handling
  but **not yet run** — needs a dev-client build, not Expo Go, since
  it's a native module Expo Go doesn't include.
- Out-of-roadmap additions (details in WORKLOG.md / MVP.md): Period Log
  page, and invite-only Friends cycle-phase matching (`/connections`).
- **Chat (`POST /chat`, 2026-09-24):** auth-required proxy to an
  OpenAI-compatible LLM — Groq free tier, `openai/gpt-oss-20b`,
  `reasoning_effort=low` (without it the model returns *empty* replies;
  the old default `llama-3.1-8b-instant` was retired). System prompt in
  `backend/app/services/llm.py` enforces the no-diagnosis rule **at prompt
  level only** — no server-side filter yet. Chat text therefore leaves our
  backend for Groq (a deliberate tradeoff against the earlier
  privacy-first plan; the base URL is swappable to a self-hosted model).
  `chat/index.tsx` `send()` calls it; the fake `AI_RESPONSE` is gone.
  Verified live on Render; **not** yet verified inside a TestFlight build.
- **Cold-start fix (2026-09-24):** Render's free tier sleeps after ~15 min
  idle, which made login slow. Added `GET /warmup` (wakes the process +
  opens a DB connection), `pool_pre_ping`/`pool_recycle` on the engine,
  `warmBackend()` in `lib/api.ts` called from `app/(auth)/_layout.tsx`
  on mount and on app foreground, and a GitHub Action
  (`.github/workflows/keep-backend-warm.yml`, **on `main` only** — GitHub
  runs schedules from the default branch) that pings `/warmup` every
  10 min.
- TestFlight: build 19 (v1.1.0) queued with `--auto-submit` on
  2026-09-24 — check `eas build:list` / App Store Connect for the outcome.
  **Build 20 (the redesign, commit `89ad606`) was queued the same day**
  (build `a9057a19-c91a-40cb-892a-53ceb02ceaeb`, submission scheduled) —
  check its outcome the same way.
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
- **Step E** (partly done): the fake `AI_RESPONSE` / analysing animation
  is already stripped and `send()` is wired to `/chat`. Still to do: wire
  real voice/text entry points in `app/(tabs)/chat/index.tsx` into the
  capture screen, replacing the temporary header clipboard icon; consider
  a server-side check on chat replies (swap in a safe fallback if one
  names a condition).
- `main` has only the keep-warm workflow; the MVP branch has all app work.
  Merge into `main` when the MVP is ready.
- Features 2 (Missing Piece Questions) and 3 (Next Step Tracker) are
  explicitly out of scope until Feature 1 is fully done — don't start
  them early.

### Local dev environment facts
- Backend: `cd backend && source .venv/bin/activate && uvicorn app.main:app --port 8000`.
  Postgres is hosted on a Supabase project (ref `xdczqwbetzpmneazszcu`,
  org "ziba18's Org") used purely as free DB hosting — the app itself
  never talks to Supabase directly, only to this FastAPI backend.
- `.env` (root) and `backend/.env` are gitignored and already populated
  from a prior session — don't need to be recreated. `backend/.env` also
  has `LLM_API_KEY` (Groq). Never print or commit it.
- **Deploy:** Render service `atossa-backend`
  (`https://atossa-backend.onrender.com`, id `srv-dap3bj6gekts73fkupn0`)
  auto-deploys the `mvp-symptom-capture` branch; blueprint in
  `render.yaml`. `LLM_API_KEY` must be set as a variable **on the service**
  — a Render Environment Group only counts if it's *linked* to the service
  (the `atossa` group isn't; it's unused). The app's TestFlight build uses
  `EXPO_PUBLIC_API_URL` from the EAS `production` env.
- Build/submit: `eas build --platform ios --profile production
  --auto-submit` (the App Store Connect API key is already on EAS).
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

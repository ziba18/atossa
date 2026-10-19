# Atossa — Claude Code Project Notes

## Current work: MVP pivot (branch `mvp-symptom-capture`)

**Redesign built locally (2026-10-01/02, uncommitted):** "Warm Paper, Deep Ink" —
tabs Today · Timeline · For my doctor (+ Profile/Records via avatar), new kit
(`design/KIT.md` is the reference — read it before touching UI), design-preview web
mode `npm run preview:web` (Sam seed, no login; never set its env var in EAS).
Plan/status: `design/PORT_PLAN.md`; WORKLOG 2026-10-01/02. Final agent review 9/10.
Open: Friends still shows a computed cycle phase (user to decide), app icon, and an
Expo Go device check before any TestFlight build.

**SDK 57 (2026-09-25, uncommitted):** upgraded from Expo SDK 54 / RN 0.81
to SDK 57 / RN 0.86 so the app runs in the App Store Expo Go (SDK 57 only).
Test with plain `npx expo start` + QR scan. `expo-dev-client` removed.
Build 22 (SDK 54) crashes on launch on iOS 26 — see WORKLOG 2026-09-25.
User said: **no TestFlight pushes** until every page is checked in Expo Go.

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

**One design system (2026-09-24, latest):** every screen now uses
`components/atossa/kit.tsx` + `constants/atossaUI.ts`; the old theme
(`constants/colors|theme|typography`, ThemeContext, dark mode, Fraunces)
is gone. Onboarding is name → basics → last-period → reminders, with the
MVP-breaking promises removed. See WORKLOG.

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
  **EAS builds are limited on the free plan (~15 iOS/month)** — for
  JS-only changes use `eas update --channel production --environment production --message "..."`
  (`--environment` is required since SDK 55)
  instead (expo-updates added 2026-09-24, `runtimeVersion` = fingerprint,
  channels = profile names). Only builds made after that commit receive
  updates; build 22 and earlier do not.
- **Disk space is tight on this Mac** — check `df -h /` before any
  native build. Clean up `ios/build` and `android/` derived-data
  directories after testing; don't leave them lying around.
- Test accounts created during dev/testing are cleaned up after each
  session (see WORKLOG.md for the SQL/Python cleanup pattern used).



### Agent team — 7 cloud routines (2026-10-19)
The app was pulled from the App Store; the owner wants a full team working around the clock.
Seven routines run in Anthropic's cloud (laptop can be off). **Lean schedule (owner is on Pro):**
PM 06:40 + 19:40 UTC (morning/evening reports), Design 08:00 + 14:00, Data 09:00, AI Brain 10:00,
Safety 11:00, Finance 12:00, Marketing 13:00 — all Sonnet 5.5, staggered to spread the 5-hour window.
Their shared office is branch **`claude/agents-hq`**
(never merged): `agents/README.md`, `RULES.md`, `CONTEXT.md`, `OWNER.md` (owner approvals/answers —
the only way to authorise outward actions), `bin/push.sh`, and one folder per agent with
`CHARTER.md` (edit to change the job), `STATE.md`, `log/`. Daily reports by the PM:
`agents/reports/YYYY-MM-DD-{morning,evening}.md` (07:40 and 19:40 UTC) + a Google Doc in Drive folder
"Atossa Agents". Code changes only on `claude/<agent>-*` branches for review — agents never push to
`main`/`mvp-symptom-capture`, never deploy, never post/message/spend. Routine IDs: Data
`trig_01VSCYE3DLGUf9bHJ3vMMtFe`, AI Brain `trig_011hE271Ypq4Y3vBBXHykv8c`, Safety
`trig_014WdTMMf85x26Q9wZUDQJ1t`, Finance `trig_013YCD2yE9RfHBxNBXntpNos`, Marketing
`trig_019DKEPVZSKVNwEqFtU8Q7CB`, Design `trig_01MoabdY1SRHc6Tj1eC1RG2d`, PM
`trig_01Ju1pFcLkez7B5u4rUWe5wY`. Usage: check claude.ai/settings/usage; "usage credits" auto-spend is
OFF — keep it off. Default env network access = **Full** (2026-10-19). Video = Kling **web free
credits only** (API is paid); voice = ElevenLabs free plan. Manage at https://claude.ai/code/routines. See WORKLOG 2026-10-19.

### Daily cloud health check (2026-10-16)
Routine "Atossa daily health check (5am)" (`trig_01SdCbNC4eBveA7ZgyXLBPxD`,
https://claude.ai/code/routines/trig_01SdCbNC4eBveA7ZgyXLBPxD) runs every day at 05:00 **UTC** in
Anthropic's cloud (independent of the laptop): read-only typecheck + iOS bundle + backend import
check on `mvp-symptom-capture`, wakes Render (`/warmup`, `/docs`, `/basket-buddy/auth/apple`) and
runs `select 1` on Supabase via the MCP connector. Read its reports in the run history at
claude.ai/code/routines. Commands are listed in WORKLOG 2026-10-16. Basket Buddy has its own routine. Both
share the Render backend, which also serves `/basket-buddy/auth/{apple,google}` (see
`backend/app/routers/basket_buddy.py`).

## Reference stack: "$30K/month app" video (saved 2026-10-15)
From https://www.youtube.com/watch?v=P4QodeA_lQ0 (Starter Story, Benji Chen). Cursor IDE +
Claude Code (Max) for code; Figma designs first, then fed to Claude Code; Supabase backend;
**Superwall** (paywall A/B tests), **Mixpanel** (onboarding funnel analytics), **Loops**
(win-back emails to churned users); GoDaddy domain; Apple Developer account. Growth: UGC
creators -> TikTok -> Meta paid ads. Atossa already uses Claude Code and Supabase (Postgres
behind FastAPI, kept deliberately). Superwall/Mixpanel/Loops are not yet adopted — each needs
a user-created account/key, and analytics on health data needs App Store privacy-label changes.

### Separate, paused thread (unrelated to the MVP work)
Transferring the app's App Store Connect listing from the coworker's
Apple Developer account to the user's own — paused, user needs to enroll
in the Apple Developer Program (Individual is sufficient, confirmed via
Apple's docs — no Organization/D-U-N-S needed) before this can continue.

# MVP Work Log

Running log for the `mvp-symptom-capture` branch: what changed, what broke,
what was decided and why. Newest entries at the top.

---

## 2026-09-12 — Strip fake AI_RESPONSE ahead of TestFlight build

User asked to ship the branch to TestFlight to review it there going
forward. Before doing that, flagged that `chat/index.tsx` still had the
hardcoded fake `AI_RESPONSE` text and "Sage is analysing…" animation
noted in this file's own "Not done yet" list as diagnostic-language
rule violation, already approved for removal (Step E) but never
executed. Shipping it to a real TestFlight build would put that exact
text in front of a real tester, so did the minimal removal now rather
than shipping it: `send()` now just appends the user's message with no
fake processing delay or fake AI reply. Removed the now-dead
`processing`/`step`/`fadeAnims` state, the `beginProcessing` function,
the `STEPS` array, the "Sage is analysing…" card, and its now-unused
styles/`Animated` import. `npx tsc --noEmit` is clean.

Deliberately did NOT do the rest of Step E (real voice/text entry
points replacing the temporary header clipboard icon into the capture
screen) — that's separate, larger scope than "don't ship known-bad
diagnostic text."

## 2026-09-12 — Period Log page (out-of-roadmap addition, user-requested)

User asked mid-session for a new "Period Log" page with a linear
period-logging calendar, independent of the Feature 1 capture-layer
work already in progress. Flagged first since it's not on the 3-feature
MVP roadmap and looks like the cycle-tracking direction the pivot is
moving away from — user chose to add it to `MVP.md` as an explicit new
feature (0) rather than parking it or skipping it.

Added `app/(tabs)/chat/period-log.tsx`: a vertically-scrolling calendar
covering the last 12 months through the current month as one continuous
run (no per-month paging/swiping — this is what makes it "linear"),
grouped by month with a standard 7-column Sun–Sat grid. Tapping any day
(past, present, or future) opens the existing `LogEntrySheet` for that
date, so a period can be logged retroactively on the day it actually
started rather than only "today." Logged period days render as filled
circles.

Deliberately did not build new backend or duplicate logging logic: this
reuses the pre-existing (pre-pivot) `/cycles` endpoints and the
`LogEntrySheet` component as-is — same contiguous-range merge behavior,
same "start of a new period?" confirmation dialog, same flow/symptom/
mood/notes fields. The only new code is the calendar grid and month
list; `periodDates` is derived client-side from `/cycles` the same way
`cycle-data.tsx` derives its day-strip dots.

Entry point: added a "Period Log" card to the chat tab's existing
multimodal strip (`MODAL_CARDS` in `chat/index.tsx`), alongside the
pre-existing "Cycle data" card — both route to real screens now.

Not verified live yet — blocked on the same iOS Simulator / disk-space
situation as Step D below (see that entry); typechecks clean
(`npx tsc --noEmit`).

## 2026-09-08 — Step D: voice recording + on-device transcription

Added:

- Dependency `expo-speech-recognition` (^57.0.0) — approved earlier this
  session. Wraps iOS's `SFSpeechRecognizer` and Android's
  `SpeechRecognizer`. Config plugin added to `app.config.ts` with
  explicit, honest permission strings; the existing `expo-av`
  microphone permission string was broadened to cover both uses since
  they share the same iOS `NSMicrophoneUsageDescription` key.
- `lib/transcription.ts` — `isVoiceCaptureSupported()` (checks both
  `isRecognitionAvailable()` and `supportsOnDeviceRecognition()` —
  voice is hidden entirely on devices that can't do this on-device),
  `ensureMicPermission()` (mic-only permission — since we only ever
  use `requiresOnDeviceRecognition: true`, we deliberately never
  request iOS's separate network Speech Recognizer authorization,
  which we don't need and don't want to prompt for), and
  `messageForErrorCode()` mapping every one of the library's error
  codes to a specific, non-raw-error user message.
- `app/(tabs)/chat/capture.tsx` — voice is now a real equal input:
  a "Speak instead" control becomes a "Listening… tap to stop" bar
  while recording, live interim transcript fills the same text box
  used for typing (so voice and text truly produce the same
  downstream object, and the user can review/edit a transcript before
  saving), tagged with `input_method: 'voice'` vs `'text'` correctly.

**Failure modes implemented** (all with a specific message and a way
to recover — never silent, never a raw error string):
- Mic permission denied (both "can ask again" and "must go to
  Settings" cases) or not yet requested.
- Empty/near-silent recording (`no-speech`/`speech-timeout`).
- Over-length: a 60s max recording timer auto-stops and tells the
  user, separate from the existing 8000-char text cap.
- Device without on-device speech recognition support: voice control
  doesn't appear at all, with a message steering to text — no dead
  button.
- App backgrounded mid-recording: recording is aborted (discarded,
  not saved) with an explanatory message, via `AppState` — same
  pattern already used in `chat/index.tsx`'s existing recording code.
- Every other native error code from the library (`audio-capture`,
  `network`, `busy`, `interrupted`, etc.) mapped individually.
- Fixed a real bug caught before shipping: the `end` event fires
  after every `error` event too, and its own generic "couldn't hear
  anything" fallback was unconditionally overwriting more specific
  error messages (e.g. permission-denied) with a wrong one. Added a
  `hadError` guard so `end` only sets its fallback message when no
  `error` event already explained what happened.

**DPIA update:** confirmed via the library's docs — with
`recordingOptions.persist` left at its default (`false`, and this
code never sets it), **no audio file is written to disk at all**.
Audio streams directly into the OS's on-device recognizer and is
discarded as it's processed. This is a stronger privacy position than
Step A's inventory assumed (which pictured a temp file that gets
deleted after transcription, since it hadn't been verified which
library would be used yet) — there is no file to delete because none
is ever created. Updating the inventory: mic → OS on-device
recognizer (in-memory/streamed only) → transcript text in component
state → HTTPS to backend → Postgres. No audio ever exists as a file
this app controls, on-device or otherwise.

**Also fixed:** `SafeScreen scrollable={false}` from Step C would
have made the bottom of a full 10-entry Recent list unreachable on
smaller screens once the voice UI added more content above the fold.
Switched to the default scrollable behavior.

**Testing note:** this library requires a real dev-client build
(`expo run:ios`) — it's a native module Expo Go doesn't include, so
Step C's Expo Go testing approach doesn't apply here. `npx tsc --noEmit`
clean throughout.

## 2026-09-08 — Step C: capture screen (text-only path)

Added:

- `types/database.ts` — `SymptomCapture` / `CaptureInputMethod` types,
  matching the backend response shape.
- `app/(tabs)/chat/capture.tsx` — the new screen. Text input (equal
  citizen for now; voice comes in Step D), Save button disabled while
  empty/over-length/saving, a "Saved" confirmation card showing the
  transcript back, and a "Recent" section (last 10, empty state when
  none yet). Built against `useColors()` / `constants/theme.ts` —
  the actual system-level design tokens — rather than the hardcoded
  hex constants some older screens (`chat/index.tsx`, `cycle-data.tsx`)
  drifted into. Gets dark-mode support for free as a result.
- `app/(tabs)/chat/index.tsx` — added one temporary header icon
  (clipboard icon, next to the profile avatar) routing to the new
  screen, so it's reachable to test before Step E does the real
  integration and removes this stand-in.

**Verified live in the iOS Simulator** (Expo Go, not just `tsc`):
registered a real account through the actual UI, ran the full
onboarding flow, reached the chat tab, opened the capture screen,
typed and saved a real symptom entry, confirmed the "Saved" card
echoed it back, then re-entered the screen from scratch to confirm
the entry persisted via a fresh `GET /captures` (not just optimistic
local state). Test account cleaned up afterward.

**Broke / worth recording:** the iOS Simulator's synthetic keyboard
input was unreliable via direct keystroke injection (characters
dropped or triggered OS-level long-press menus instead of typing).
Worked around it using clipboard paste instead. Not a code issue —
noted here in case it comes up again when testing later steps.

**Nothing else broke.** `npx tsc --noEmit` clean throughout.

## 2026-09-08 — Step B: backend capture endpoints

Added, following the existing `cycles.py`/`cycle.py` pattern exactly:

- `backend/app/models/capture.py` — `SymptomCapture` (`id`, `user_id`,
  `transcript`, `input_method`, `created_at`). Nothing beyond what the
  capture layer needs.
- `backend/app/schemas/capture.py` — `CaptureCreate` (rejects blank or
  >8000-char transcripts with a specific message, not a raw 500),
  `CaptureResponse`.
- `backend/app/routers/captures.py` — `POST /captures`,
  `GET /captures?limit=10` (capped at 50), both scoped to
  `current_user` via the existing JWT dependency.
- Alembic migration `cf7f93edfec5_add_symptom_captures_table` — applied
  to the dev database.

**Verified live via curl** (not just reviewed): register → create text
capture → create voice capture → empty transcript rejected (422, clear
message) → over-length transcript rejected (422, clear message) →
invalid `input_method` rejected (422) → list returns both, newest
first → unauthenticated request rejected (403). Test user cleaned up
afterward.

**Nothing broke.** No deviations from the plan.

## 2026-09-08 — Branch setup, decisions from planning

**Branch created** off `main` (`mvp-symptom-capture`). `main`'s working
tree had uncommitted changes from a prior session (Supabase → FastAPI
backend consolidation) — those carried onto this branch unchanged, not
part of this work.

**Conflicts found between the brief and the repo, resolved with the user:**

- Brief assumed Supabase is accessed directly by the app. It isn't —
  a prior session moved all client-side data access onto the FastAPI
  backend (`lib/api.ts`, JWT bearer auth). Supabase now only hosts the
  Postgres database behind that backend. Symptom capture persistence
  will follow the same backend pattern as `cycles`/`symptoms`.
- Brief specified a teal/mint/coral/blush palette. The live palette in
  `constants/colors.ts` is a "cottagecore herbalist" system (moss/bark/
  amber/paper/ink). **Decision: use the existing live palette**, not the
  brief's colors.

**Other decisions:**

- Transcription: **on-device only**, via a new dependency
  `expo-speech-recognition` (wraps Apple's Speech framework / Android
  SpeechRecognizer, forced to on-device-only mode where the OS supports
  it). Approved by the user, who was told what data passes through it
  (audio stays on-device; no cloud service involved). Android on-device
  support isn't universal — devices that don't support it get a clear
  "voice isn't available on this device, try text" message, not a
  silent failure or a crash.
- Persistence: through the FastAPI backend (new `/captures` endpoints
  and `symptom_captures` table), not Supabase directly.
- Audio retention: the raw recording is **deleted immediately after
  successful transcription** (or on failure/cancel). Only the transcript
  text is ever persisted — nothing server-side ever sees the audio file.
- Scope: capture layer of Feature 1 only. Features 2 and 3 not started.
  The chat tab's fake AI response (hardcoded diagnostic-sounding text
  and a fake "analysing" animation) will be removed as part of this
  work, since it's live today and violates the "no diagnostic language"
  rule — flagged by the user as in-scope despite being outside the
  original feature list.

**DPIA data-flow inventory** (kept accurate here as the source of truth):

1. Device microphone → transient on-device audio file (app cache dir,
   written by `expo-av`). Deleted immediately after transcription
   succeeds, fails, or is cancelled. Never uploaded anywhere.
2. On-device OS speech recognition (Apple Speech framework / Android
   SpeechRecognizer, on-device mode) processes the audio locally on
   devices that support it. This is an OS-level service, not code we
   control end-to-end — noted as the accurate framing rather than an
   absolute guarantee.
3. Resulting transcript (plain text) held in React component state,
   in-memory, until saved or discarded.
4. On save: transcript text sent from device to the FastAPI backend
   over HTTPS with a JWT bearer token → held transiently in the request
   handler → written to the `symptom_captures` table in Postgres
   (hosted on the user's Supabase project), scoped by `user_id`.
5. Retrieval: `GET /captures` returns the last 10 transcripts over
   HTTPS back to the device, held in component state for display.
6. No raw audio is ever transmitted to or stored on the server.
7. Uvicorn's default access logs record method/path/status only, not
   request bodies — transcript content shouldn't appear in server logs
   as currently configured. Worth re-checking if logging middleware is
   ever added later.

**Files added this entry:** `MVP.md`, `WORKLOG.md`.

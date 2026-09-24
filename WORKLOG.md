# MVP Work Log

Running log for the `mvp-symptom-capture` branch: what changed, what broke,
what was decided and why. Newest entries at the top.

---

## 2026-09-24 — Redesign: Chat / Dashboard / For my doctor (ported from Lovable)

**What & why:** the UI direction was designed with the user in a Lovable
project ("Atossa: Your Health Compass", web prototype, in-memory data),
tested against a real published patient story (Crystal Richardson,
Weill Cornell), and then ported into this Expo app. The app now has three
tabs — **Chat**, **Dashboard**, **For my doctor** — with large text/tap
targets for older, non-technical users, the lighter coral / mist-green /
blue / ivory palette (`constants/atossaUI.ts`, converted from Lovable's
oklch tokens), Instrument Serif + Work Sans. The old Analyse and People
tabs are hidden (`href: null`), not deleted; so are the old capture,
period-log and cycle-data screens (unreachable, still in the tree).

**Screens (all under `app/(tabs)/`, shared pieces in `components/atossa/`):**
- `chat/index.tsx` — deterministic symptom flow: user describes → "I've
  noted this" card (edit/save) → four fixed questions (where, 0–10, how
  long, did it stop you doing things) → saved as a `symptom` record. No
  LLM is involved, so no diagnostic text can appear; **the `/chat` LLM
  endpoint is still deployed but this screen no longer calls it.** Mic
  button dictates into the box via `hooks/useDictation.ts` (on-device
  `expo-speech-recognition`, reusing `lib/transcription.ts`).
- `dashboard/` — index (figures, pain chart, weekly "stopped me doing
  things" bars, recent symptoms, cycle card, appointments, medicines,
  health history) + `calendar`, `symptoms`, `appointments`, `medicines`,
  `health` sub-screens (add/edit/delete with confirmation). Bleeding days
  are deep red with a sparkle (static under Reduce Motion).
- `report/index.tsx` — "For my doctor": At-a-glance card, collapsible
  sections, editable doctor's notes (saved), Share / PDF via
  `expo-print` + `expo-sharing` (falls back to sharing plain text).
- Rules carried through: user's own words only; clinician statements are
  always labelled "I was told:"; dates can be "Around …" (month/year or
  year); future dates ask for confirmation and show "Upcoming"; no
  predictions, no interpretation.

**Backend:** new generic per-user store, `health_records` (migration
`b7c41d9e2a10`, model `HealthRecord`, router `/records` — `GET`, `POST`,
`PUT /{id}`, `DELETE /{id}`). One JSON document per row, `kind` ∈
symptom | appointment | medicine | history | period_day | doctor_note;
20 000-char cap per record, 5 000 records per user. Deliberately generic
so the record shapes (`types/records.ts`) can change without a migration
each time — the tradeoff is no relational integrity or server-side
validation of the fields. Frontend state is `stores/recordsStore.ts`
(loaded per signed-in user from `(tabs)/_layout.tsx`); pure logic
(dates, cycles, summaries) is in `lib/records/`.
**Period data is separate from the old `/cycles` table** — the new
calendar writes `period_day` records, so what onboarding stored via
`/cycles` does not appear in it.

**Verified:** the `/records` endpoints via curl against a local backend
(auth required 403; create/update/list/delete; bad `kind`, oversize and
non-object bodies → 422; a second user gets 404 on another user's record
and an empty list); test users deleted afterwards. The pure logic
(dates, cycles incl. period vs. cycle length, distinct stopped-days,
weekly buckets, doctor summary text/HTML) with a throwaway assertion
script. `npx tsc --noEmit` clean and `expo export --platform ios`
bundles. **Not verified:** the screens have never been run on a device or
simulator (user asked not to open the simulator this session), so
layout, keyboard handling in Chat, voice dictation and PDF sharing are
untested until the TestFlight build.

**Known gaps / ideas not built** (kept out on purpose until more patient
stories justify them): one merged timeline for appointments/medicines/
history (a test appointment and a health-history entry can describe the
same event), optional symptom tags in Chat, a "no periods now" state
(e.g. after a hysterectomy), no seed/example data in the real app.

---

## 2026-09-24 — Slow login (Render cold start), keep-warm, and a real chat backend

**Problem:** user reported login "takes too long" coming back to the app
from TestFlight. Measured before changing anything (local machine → the
Supabase pooler in eu-west-1): cold DB connection ~770 ms, warm query
20–46 ms, bcrypt verify ~300 ms (existing hashes are `$2b$12$` — left
alone, lowering the cost would weaken stored passwords). So a *warm*
backend logs in in ~0.5–1 s; the multi-second-to-50 s delay is Render's
free tier spinning the service down after ~15 min idle (already noted in
README). Confirmed the TestFlight build targets Render (`EXPO_PUBLIC_API_URL`
is `https://atossa-backend.onrender.com` in the EAS `production` env).

**Fix, three layers:**
- Backend: `GET /warmup` (in `main.py`) — wakes the instance *and* runs
  `select 1` so a pooled DB connection is already open. `/health` is
  deliberately left DB-free (Render's `healthCheckPath`). Also
  `pool_pre_ping=True, pool_recycle=300` on the engine, because the
  Supabase pooler drops idle connections and the first request after a
  lull would otherwise hit a dead one.
- App: `warmBackend()` in `lib/api.ts` (fire-and-forget `fetch` of
  `/warmup`), called from `app/(auth)/_layout.tsx` on mount and on every
  `AppState` → `active`, so the wake-up overlaps the user typing their
  credentials. This *hides* the cold start; it doesn't remove it.
- Keep-warm: `.github/workflows/keep-backend-warm.yml` curls `/warmup`
  every 10 min. **It lives on `main`, not this branch** — GitHub only
  runs scheduled workflows from the default branch. Repo is public, so
  Actions minutes are free. Manually triggered once via `gh workflow run`:
  green, `{"status":"ok"}`. Caveat: GitHub pauses scheduled workflows
  after 60 days of repo inactivity; scheduled runs are best-effort.

**Deploy facts learned:** Render serves the `mvp-symptom-capture` branch
(the live `/openapi.json` had `/captures`, which only exists here), so
pushing this branch redeploys the backend. The service is
"Blueprint managed" (`render.yaml`).

**Chat (`POST /chat`) — "first page" got a real backend.** User asked for
"a free AI wrapper to chat simply." Before building, flagged the conflict
with the project's stated privacy goal (user data never reaching
third-party AI companies): chat text now leaves our backend for a hosted
LLM. Free-to-host and fully private don't coexist (a local model can't run
on Render's free tier), so it was built as a thin proxy over any
OpenAI-compatible API, so it can be re-pointed at a self-hosted model
(Ollama etc.) later without touching the app.
- `routers/chat.py` (auth required), `schemas/chat.py` (≤20 messages, each
  ≤2000 chars, last one must be from the user), `services/llm.py`.
- Config (`config.py`): `LLM_API_KEY`, `LLM_BASE_URL`
  (default Groq `https://api.groq.com/openai/v1`), `LLM_MODEL`,
  `LLM_REASONING_EFFORT`. Only `role`/`content` are forwarded — no user id,
  email, or profile data.
- System prompt (in `services/llm.py`) makes "Sage" a short, one-question-
  at-a-time symptom-description helper with the hard no-diagnosis /
  no-cause / no-treatment rule and an emergency-services escape hatch.
  **This is prompt-level enforcement only, not a filter** — a small model
  can slip, especially if the user names a condition first. A server-side
  check on the reply (swap in a safe fallback if it names a condition) is
  the obvious follow-up and was offered, not built.
- Model gotchas hit for real: the default I first chose,
  `llama-3.1-8b-instant`, **no longer exists on Groq** (`model_not_found`;
  checked via the provider's `/models`). Now `openai/gpt-oss-20b`. That's a
  reasoning model: without `reasoning_effort=low` it burns the whole
  300-token cap thinking and returns an *empty* reply (`finish_reason:
  length`) — hence the setting and an empty-reply guard in `llm.py`.
- Chat screen (`app/(tabs)/chat/index.tsx`): `send()` now posts to `/chat`
  with a "…" typing bubble and a friendly in-chat error on failure/429.
  This continues (does not finish) Step E — the header clipboard icon →
  capture screen is still the temporary entry point.
- Verified: mocked-provider unit checks (503 unconfigured, 200, 429, 422s,
  403 no auth); then live against Render with a throwaway account
  (deleted afterwards, 0 rows left): normal reply in ~1.7 s, and on the
  bait "could this be endometriosis? should I take ibuprofen?" it declined
  to name a condition. It did add "check with your GP or pharmacist first"
  about the ibuprofen — points to a professional rather than recommending
  a treatment, but close to the line; tighten the prompt if it bothers.
  **Not verified:** chat inside the actual TestFlight app.

**Gotcha — env var on Render:** the Groq key was first saved into a Render
*Environment Group* (`atossa`) that isn't linked to the service, so the
running service couldn't see it. It has to be a variable on the
`atossa-backend` service itself (or the group has to be linked — not done,
since the group's contents are masked and linking could override
`DATABASE_URL`/`SECRET_KEY`). Fixed; the leftover group is unused and
safe to delete. `render.yaml` declares `LLM_API_KEY` with `sync: false`.
The key itself is in `backend/.env` (gitignored) and on Render only.

**TestFlight:** queued iOS `production` build with `--auto-submit`
(version 1.1.0, build 19, EAS build `595ef7d0-947f-4268-b90e-305b26da2ff7`,
submission `4b23c108-df64-4983-a69e-e5c24182924d`) using the App Store
Connect API key already stored on EAS for ASC app `6762570606`. Outcome
not confirmed at the time of writing.

**Branch state:** `mvp-symptom-capture` (`d0ff597`) and `main` (`d88eed1`)
both match GitHub. `main` only has the keep-warm workflow; all app work is
on the MVP branch, so they have diverged — merge the MVP branch into
`main` when it's ready.

## 2026-09-12 — Friends: invite-only cycle phase matching

User asked to let people invite friends to see each other's cycles and
"match" them, plus "enable users to come together locally," with the
explicit principle "engineer the size of the community, rather than
inflating empty metrics." Flagged before building: this is a genuinely
different feature category from the symptom-capture MVP pivot, and
"come together locally" implies some form of location-based discovery,
which for a health app sharing PCOS/endo-relevant data carries real
safety risk (exposing location + health status to people who aren't
already trusted contacts). Asked the user to scope it explicitly rather
than defaulting into the riskiest interpretation; they chose the
conservative options across the board:
- Mutual, invite-only friends only — no public/stranger discovery.
- Phase-alignment sharing only — no raw flow/symptom/notes data ever
  crosses accounts.
- No real geolocation for this pass — "locally" is dropped entirely
  rather than becoming a stub city field nobody asked to keep.

Backend: found `backend/app/models/social.py` already had a
`ConnectedAccount` model — `owner_user_id`/`viewer_user_id`,
`invite_email`, `relationship`, `status`, granular `can_view_cycle`/
`can_view_symptoms`/etc. flags, `invite_token` — scaffolded for a
different (partner/parent monitoring) concept but never wired to any
router, and already present in the initial Alembic migration (so no
new migration needed, table already exists). Reused it rather than
building a parallel Friendship table: new rows use
`relationship="friend"`, `can_view_cycle=True`, `can_view_symptoms=
False` always. Added `backend/app/routers/connections.py`:
- `POST /connections/invite` {invite_email} — idempotent (returns the
  existing row if one already exists for that owner+email+relationship
  rather than creating a duplicate); rejects inviting yourself.
- `GET /connections/pending` — invites sent TO the current user
  (matched on their own account email), each with the inviter's
  display name.
- `POST /connections/{id}/accept` / `.../decline` — decline just
  deletes the row (no need for a lingering "declined" status here).
- `GET /connections/friends` — for every accepted `relationship=
  "friend"` row involving the current user (either side), returns the
  *other* person's display name, cycle-length/period-length defaults,
  and up to 12 cycle logs shaped by a new `FriendCycleLog` schema that
  only has `period_start`/`period_end`/`period_length` fields — so
  `flow_intensity` and `notes` are structurally impossible to leak
  through this response, not just filtered out by convention.
- `DELETE /connections/{id}` — either side can unfriend.

Verified the whole flow end-to-end with two disposable test accounts
via curl: registered both, logged a period on each (with a marker
string in `notes` to make leakage obvious), A invited B by email, B
saw the pending invite with A's display name, B accepted, and both
sides' `/connections/friends` response showed the other's period
dates but — confirmed by inspecting the raw JSON — never the marker
notes or flow_intensity. Cleaned up both test accounts and all their
rows (connections, cycle_logs, profiles, users) afterward.

Frontend: added `app/(tabs)/profile/friends.tsx` (a real screen, not
another "coming soon" stub like its siblings `connected-accounts.tsx`/
`emergency-contacts.tsx`/`add-connection.tsx`, which stay stubs — this
is a different feature/permission model, out of scope to build out
today). Shows pending invites with accept/decline, a friends list with
each friend's current phase computed client-side via the same
`computeCycleMath` used for the self view, and an explicit "You're
both in your X phase" note when phases match — the literal "cycle
matching" ask. Deliberately no counts, badges, or "invite more"
prompts anywhere, per the stated community-size principle. Entry point
added to `profile/index.tsx`'s Account section and registered in
`profile/_layout.tsx`.

Along the way, extracted `CyclePhaseLog` (`algorithms/cyclePhaseLog.ts`
— see the entry below) specifically so a friend's shared cycle data
never needs to be shaped like a full `CycleLog`; `computeCycleMath`
already only reads the three fields that type has.

Not yet visually verified live — same simulator/Expo-Go blockers as
Feature 1 Step D. `npx tsc --noEmit` clean across the whole project.

## 2026-09-12 — Reveal animation + completion-drive progress (Period Log)

Follow-up to the gamified confirmation below: user asked for period
logging to feel "fun, dopamine-hitting, rewarding," with anticipation
and a "completion drive."

Deliberately did NOT implement this as an artificial delay before
showing the confirmation (a fake "processing" wait to manufacture
suspense) — that's the same deceptive-delay pattern just removed from
the fake `AI_RESPONSE`/"Sage is analysing…" flow above, just repurposed
for engagement instead of fake diagnostics. Also skipped streak
counters, loss-aversion messaging ("don't break your streak"), and any
push-notification nagging — those are the addictive/dark-pattern half
of "gamification" and don't belong in a health tracker for a chronic
pain condition.

What shipped instead, both using genuinely earned moments rather than
manufactured ones:
- `LogEntrySheet.tsx`: the confirmation pill now pops in with an
  overshoot spring animation (`Animated.spring`, native driver) instead
  of a flat fade — the "reward" is in how the real, instant confirmation
  is revealed, not in a delay.
- `period-log.tsx`: added a "days logged this period" dot-progress row
  when the most recently started period is shorter than the user's
  typical period length and still recent (≤20 days old) — genuine
  completion pull, since a complete period range is literally what
  makes the cycle-length prediction more accurate, not an arbitrary
  metric.

Refactored `algorithms/cyclePhase.ts` / `cyclePrediction.ts` along the
way: extracted a `CyclePhaseLog` type (`Pick<CycleLog, 'period_start' |
'period_end' | 'period_length'>`) into its own file
(`cyclePhaseLog.ts`) since `computeCycleMath`/`computeCyclePrediction`
never actually touch `flow_intensity`/`notes`/etc. — only the AI
forecaster path (`aiCyclePrediction.ts` → `aiFeatures.ts`, currently
unused by any screen) genuinely needs full `CycleLog` for
`flow_intensity`, so `predictCycle`'s own signature was narrowed back
to require that. This was set up for the friend cycle-matching feature
(below/next), which needs to share phase timing without ever exposing
flow/notes. `npx tsc --noEmit` clean throughout.

## 2026-09-12 — Gamified confirmation on period logging

User asked for a gamification touch every time a period gets logged
(examples given: "wow you did!", "your health matters!"). Added a pool
of 8 encouraging messages (`PERIOD_LOGGED_MESSAGES` in
`LogEntrySheet.tsx`) and pick one at random via `flash()` whenever a
period day is actually logged (`selectFlow` with a non-null flow
value) — deliberately scoped to period logging only, not the
symptoms/mood/notes autosave, which keeps its plain "Saved" pill.
Applies everywhere `LogEntrySheet` is used (`cycle-data.tsx` and the
new `period-log.tsx`) since both share the same component — no
duplicated logic.

Had to restructure the sheet's header layout to fit this: the old
confirm pill sat inline next to the date in a `space-between` row,
sized for "Saved" (5 chars). Longer messages like "You're building a
helpful record. 💚" would have overflowed or clipped in that space.
Changed the header to stack the date row and the confirm pill
vertically instead, with the pill wrapping up to 2 lines. `npx tsc
--noEmit` clean.

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

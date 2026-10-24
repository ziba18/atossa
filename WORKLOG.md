# MVP Work Log

Running log for the `mvp-symptom-capture` branch: what changed, what broke,
what was decided and why. Newest entries at the top.

---

## 2026-10-24 — Upgrade to Expo SDK 58

The App Store Expo Go on the user's phone updated to SDK 58 and refused the
SDK 57 project ("Project is incompatible with this version of Expo Go");
older Expo Go can't be installed on iOS. Changes (uncommitted): expo
57.0.26 → 58.0.19, React Native 0.86.3 → 0.88.0, React 19.3, all expo-* to
58.x, gesture-handler 3.3, screens 4.30, safe-area 5.10, svg 15.16.
`expo-speech-recognition` stays at 57 (lazy-required, not in Expo Go anyway).
Breaking changes handled:
- RN 0.88 makes `ScrollView`/`View`/`TextInput` function components, so refs
  are typed with `ScrollViewInstance` / `HostInstance` / `TextInputInstance`.
- `BottomTabBarProps` no longer has `navigation`: `MainTabBar` uses
  `emitter.emit` (tabPress), `navigateToTab(route.key)`, and
  `descriptors[key].navigation.dispatch` for the nested-stack RESET.
Verified: tsc clean, expo-doctor 20/20, iOS export (4.2 MB Hermes bundle).
**Not yet run in Expo Go.** Check re-tapping a tab still resets its stack.

---

## 2026-10-20 — agent workspace moved to a private repo; owner decisions

- **Why:** `ziba18/atossa` is **public**, so agent reports, security findings, contacts and owner decisions on
  `claude/agents-hq` were world-readable. The owner doesn't want this repo private: private Actions minutes
  (2,000/month) can't cover the 10-minute keep-warm job, and Render's link to the repo would need re-checking.
- **Move:** created **private** `ziba18/atossa-hq` and copied the `agents/` folder (snapshot of `bf34868`, 42 files)
  to `main` + `claude/agents-hq` (`4fd5c4f`, rules update `761b520`). Local clone: `~/projects/atossa-hq`. All 7
  routines now have two sources: cloud checkouts are `/home/user/atossa-hq` (office, push here) and
  `/home/user/atossa` (app code; `claude/<agent>-*` code branches still go here). Cloud cwd is `/home/user`.
  RULES.md now covers both repos: nothing secret anywhere; nothing exploit-level or personal in the public one.
- **Gotchas:** (1) a create call with `mcp_connections: []` still attaches **all** connectors, so always follow it
  with `clear_mcp_connections: true`. (2) The cloud auto-mode classifier blocked a bare "probe: push test" push
  ("Modify Shared Resources"). Real agent prompts now state the owner's authorisation and the exact folder they own.
- **Owner decisions** (recorded in `agents/OWNER.md`): 2.3 rejection details (new app record needed; Extended Review
  warning, so submit only when polished); Apple account stays under the coworker's account (transfer dropped);
  card shadows approved; **Today = capture-first** with up to 3 guided follow-up questions (agent decision at the
  owner's request); **KI EndoLIST access granted** (PhysioNet account + DUA only). The DUA allows research use
  only, no sharing, data stays local. A permission request to the corresponding author is drafted in Drive
  ("Atossa Agents" folder), not sent.

## 2026-10-19 — 7-agent cloud team set up

- **Why:** the app was taken off the App Store and the owner is unhappy with the result (design
  most of all). Asked for 7 agents (Data, AI Brain, Safety, Finance, Marketing, Design, Project
  Manager) running in parallel every 4 hours, all day, with the laptop shut, plus start- and
  end-of-day reports.
- **Shape:** 7 Claude Code routines on the "Default" cloud env. Cron `0 3,7,11,15,19,23 * * *` UTC
  for the six workers, `40 3,7,11,15,19,23 * * *` for the PM so it reads fresh work. 07 UTC run =
  start of day, 19 UTC run = end of day (07:00/19:00 London in winter, 08:00/20:00 BST).
  Models: Sonnet 5.5, except Design and PM on Opus 5.5.
- **Office:** branch `claude/agents-hq` (cut from `mvp-symptom-capture` at `921f5ab`, first commit
  `b679e27`). `claude/` prefix because cloud sessions can push to `claude/*` branches. Each agent
  writes only its own `agents/<name>/` folder; `agents/bin/push.sh` does a rebase-and-retry push so
  parallel runs don't conflict. Owner approvals go in `agents/OWNER.md`.
- **Connectors (all read-only by rule):** Data → Clinical-Trials; Safety → Supabase (advisors/schema);
  Finance → Supabase (org/plan); Design → Lovable (read-only, sending spends credits); PM → Google
  Drive (report docs). AI Brain and Marketing → none. Creating a routine without
  `mcp_connections` attaches **every** connector by default, so both were cleared afterwards.
- **Deliberate limits:** no agent posts, DMs, emails, signs up, applies for dataset access or spends
  credits without a matching line in `OWNER.md`. There are no LinkedIn/WhatsApp/Instagram connectors,
  and Higgsfield (AI video + TikTok publishing) is not attached until the owner approves a budget.
  Finance can't see bank accounts or invoices; anything the owner hasn't confirmed is marked ESTIMATE.
- **Test run (Data, `cse_01AU3NpJejtRsNyduSA5b8Qz`):** clone, branch checkout, WebSearch and
  Clinical-Trials work. **WebFetch fails** (`getaddrinfo ENOTFOUND` for ncbi.nlm.nih.gov,
  ukbiobank.ac.uk, figshare.com): the Default environment's network allowlist. Fix (owner):
  claude.ai/code → environment settings → network access **Full** (or add research domains).
- Watch run caps and plan usage: 42 runs/day.

- **Same evening — Pro-plan usage, lean schedule.** claude.ai showed "Approaching weekly usage limit"
  on the **Pro** plan; 42 runs/day can't fit. All 7 were paused, then the owner chose the **lean schedule**:
  PM `40 6,19 * * *` (reports), Design `0 8,14 * * *`, Data `0 9`, AI Brain `0 10`, Safety `0 11`,
  Finance `0 12`, Marketing `0 13` UTC; Design and PM moved Opus → Sonnet. The owner then reset the weekly
  limit (usage page: weekly 0%, resets Wed 8 PM) and all 7 were re-enabled. Usage credits ($24.13)
  auto-spend toggle is OFF and stays off. RULES.md now requires **checkpoint pushes** every ~10 min so a
  run cut off by a limit keeps its work (`f7aee79` on `claude/agents-hq`).
- **Network:** at the owner's request, Default env network access set Limited → **Full** in the browser
  ("Environment updated"). Fixes the WebFetch DNS failures. The two allowlisted domains became redundant.
- **Kling / ElevenLabs:** Kling's developer API has no free tier (prepaid packs), so "keep video free" =
  kling.ai website free credits only; Marketing keeps `content/kling-queue.md` of paste-ready prompts.
  ElevenLabs free plan (10k credits/mo, API key, no card) is approved in `agents/OWNER.md` for voice-overs;
  needs the owner's key added as a **network secret** on the Default environment. No claude.ai connector
  exists for either.
- **Usage checks:** cloud agents can't read the usage meter. Probe routine `trig_01TaWWmHZwHyK8WtWWYbFCod`
  checks whether the `Claude_Code_Remote` connector can (see result below).

## 2026-10-16 — main merged; Basket Buddy sign-in endpoints; daily 5am cloud health check

- **`mvp-symptom-capture` merged into `main`** and pushed (`4d21bc0`), at the user's request while
  1.1.0 (build 25) is still Waiting for Review. Keep-warm workflow survived. Render still deploys
  `mvp-symptom-capture`.
- **Age-rating "social media" questions** (new ASC banner): already answered "No" for every capability
  (web access, UGC, social media, messaging, ads); rating stays 13+. Nothing needed saving.
- **Basket Buddy sign-in endpoints (uncommitted):** `POST /basket-buddy/auth/{apple,google}`
  (`routers/basket_buddy.py`, `services/basket_buddy_auth.py`, `basket_*` settings in `config.py`).
  They verify the token with `social_auth.py` and return a session for Basket Buddy's own Supabase
  project. Nothing is written to Atossa's DB. Hosted here rather than in a second Render service
  because the free plan's 750 h/month is already used by Atossa's keep-warm. Needs
  `BASKET_SUPABASE_SECRET_KEY` + `BASKET_GOOGLE_WEB_CLIENT_ID` on Render. Checked with a mock-Supabase
  script; not live yet. Details: basket_buddy repo `WORKLOG.md`.
- **Basket Buddy Google sign-in "Invalid audience" (fixed same day):** `/basket-buddy/auth/google` now accepts
  a list of audiences (Basket Buddy's Web + iOS client IDs, `basket_google_known_client_ids` in `config.py`, plus
  `BASKET_GOOGLE_WEB_CLIENT_ID`). `verify_google_id_token` takes a str or list; with a str (Atossa's `/auth/google`)
  the behaviour is unchanged. Tested with locally signed tokens; the user confirmed Apple and Google sign-in on
  Basket Buddy TestFlight build 12.
- **Daily cloud health check** — routine "Atossa daily health check (5am)",
  `trig_01SdCbNC4eBveA7ZgyXLBPxD`, https://claude.ai/code/routines/trig_01SdCbNC4eBveA7ZgyXLBPxD.
  Runs in Anthropic's cloud (works with the laptop off), cron `0 5 * * *` **UTC** (5am London in
  winter, 6am during BST), model claude-sonnet-5-5, Supabase connector attached. Read-only: checks out
  `mvp-symptom-capture`, `npm ci` → `npx tsc --noEmit` → `npx expo export --platform ios`; backend
  `pip install` + `compileall` + `import app.main`; `curl` `/warmup` (retries; wakes Render + opens a DB
  connection), `/docs`, and the `/basket-buddy/auth/apple` route; `select 1` on Supabase
  `xdczqwbetzpmneazszcu` via MCP. Ends with a pass/fail table. Results: the routine's run history at
  claude.ai/code/routines. Needed GitHub connected to Claude (`/web-setup`, done 2026-10-16).
  Edit/pause: https://claude.ai/code/routines (deleting is only possible there).
- **First test run (2026-10-16 09:43 UTC, run `cse_011tiVgskWT2H4mauG5cxEtM`):** repo, `tsc`, iOS bundle,
  backend import (32 routes) and Supabase `select 1` (ACTIVE_HEALTHY) all PASS. **Render BLOCKED:** the
  cloud sandbox's egress proxy refuses `atossa-backend.onrender.com` (`CONNECT tunnel failed, response 403`).
  Fix = add `atossa-backend.onrender.com` (+ `uwqmhhbxthnpgcbgvgqh.supabase.co` for Basket Buddy) to the
  "Default" cloud environment's network allowlist at claude.ai/code (user action). Until then, the
  GitHub keep-warm Action on `main` is still what keeps Render awake.

## 2026-10-15 (evening) — build 23 rejected; build 24; Google sign-in fix

- **Build 23 failed Apple processing** (ITMS-90683, missing `NSMicrophoneUsageDescription`):
  `expo-image-picker`'s `microphonePermission: false` deleted the string that
  `expo-speech-recognition` adds. Fixed (`67a02a8`), checked with a clean prebuild in a scratch copy
  (the local `ios/` folder is a stale, gitignored prebuild — `expo config --type introspect` reads
  it, so don't trust introspect for Info.plist). **Build 24** processed fine → TestFlight.
- **Google sign-in failed on build 24** ("Session expired. Please log in again."). Real sign-in had
  never been tried before. Cause: Google's iOS ID tokens carry `at_hash`, and python-jose's
  `jwt.decode` rejects such a token unless given the access token. Fix: the app sends
  `GoogleSignin.getTokens().accessToken` with the ID token; `/auth/google` passes it as
  `access_token=` so `at_hash` is actually checked (not skipped). Field is optional.
  Also `lib/api.ts`: a 401 from `/auth/login|apple|google` no longer goes through refresh →
  "Session expired"; the server's reason is shown (this is what hid the real error).
  Verified: locally signed tokens (right/wrong/missing access token, no at_hash, wrong audience,
  unverified email) all behave; tsc clean. JS-only → ships to build 24 as an EAS update.
- Device-tested on build 24 + update: launch, Google + Apple sign-in, voice dictation,
  photos/camera, Share PDF — all pass. (An update applies on the launch *after* it downloads.)
- **Build 25** made so the binary itself has the Google fix (a reviewer's first launch runs the
  embedded JS). Attached to 1.1.0 and **submitted to App Review** — status "Waiting for Review".
  The "License Agreement Updated" banner did not block it.

---

## 2026-10-15 (later) — 1.1.0 prepared for App Store review

- **Build 23** (v1.1.0, commit `f84e3d2`) finished on EAS; auto-submit `eaa33a29` was waiting in the
  Expo free-tier queue at end of session. Not yet in TestFlight.
- **App Store Connect, version 1.1.0 created and filled:** new promo text, description, keywords,
  What's New, review notes, subtitle "Symptom notes for your doctor"; privacy URL →
  `https://atossa-backend.onrender.com/privacy`; age rating social-media questions = No (13+);
  release = automatic after approval (user's choice). New screenshots from `preview:web` via headless
  Chrome (iPhone 1206×2622, iPad 2064×2752: Today, chat, Timeline list/month, For my doctor); old
  cycle-app shots removed from 1.1.0 (still in the Asset Library).
- **Reviewer account** `reviewer@atossa.app` did not exist in the current DB (lost in the auth move);
  user created it via the web app against the live backend (password = the one in ASC App Review),
  onboarding finished, one sample note saved.
- **Support site** (`support-site/index.html`, Vercel project `support-site`) rewritten for the new
  app and deployed by the user (`b44d736`).
- **Left:** build 23 → TestFlight; user tests launch (build 22 crashed on iOS 26), voice, Apple/Google
  sign-in, photos/camera, Share PDF; attach build 23 to 1.1.0; user clicks Add for Review → Submit.

---

## 2026-10-15 — Mixpanel onboarding analytics; privacy policy

User asked to apply the stack from a Starter Story video (P4QodeA_lQ0: Cursor + Claude Code,
Figma, Supabase, Superwall, Mixpanel, Loops, GoDaddy — saved in CLAUDE.md). Agreed scope for this
release: **Mixpanel only**. Superwall needs paid subscriptions/IAP (Atossa has none; App Store
listing still on the coworker's account) and is a native module, not in Expo Go; Loops needs
churned users + email backend; GoDaddy breaks "free to host".
- `lib/analytics.ts` — `track()`; Mixpanel JS mode (`useNative=false`, AsyncStorage) so it runs in
  Expo Go; no-op without `EXPO_PUBLIC_MIXPANEL_TOKEN` and on web (design preview); never throws;
  no `identify()` — anonymous ID only. Events: Welcome Viewed, Signup Completed {method},
  Onboarding Step Completed {step, skipped?}, Onboarding Completed {reminder}. No health data.
- Privacy policy (`backend/app/routers/legal.py`): removed "we don't use analytics"; added Mixpanel
  and **Groq** (chat text was already going to Groq but wasn't listed) as service providers.
- **App Store Connect privacy label must be updated** before submitting: Product Interaction /
  Device ID used for Analytics, not linked to identity, not tracking.
- Token: set `EXPO_PUBLIC_MIXPANEL_TOKEN` in `.env` and in the EAS `production` env.
Verified: tsc clean, iOS export bundles. Not verified: events arriving in Mixpanel (no token yet).
- Later the same day: token set in `.env` + EAS production env (project "Atossa", US residency, kept);
  test event accepted. IP geolocation turned off (`abe7409`). App Privacy label **published** with
  Device ID + Product Interaction (Analytics, not linked, not tracking). Full web click-through
  (local backend) passed: welcome/sign-in/register/forgot links, sign-up → onboarding → Today, all
  tabs + profile pages, sign out/in, wrong password, chat reply, save-as-note, session restore,
  delete account (test account gone). **To do with 1.1.0:** change the App Store Privacy Policy URL
  from `support-site-gold.vercel.app` to `https://atossa-backend.onrender.com/privacy`.

---

## 2026-10-06 — Today becomes a chat (uncommitted)

User asked for a ChatGPT-style first page instead of the mic hero + Rough day card, keeping the
"Warm Paper, Deep Ink" design. Decisions (user, asked up front): replies come from the **`/chat`
LLM** (Groq — chat text now leaves our backend again; still prompt-level no-diagnosis only, no
server-side filter); **attachments stay on the phone** (copied to the app's document folder; the AI
only sees "[Attached a photo: name]"); **chat history on the phone** (AsyncStorage, key per user,
removed on account deletion).
- `app/(tabs)/today/index.tsx` — header ☰ · Today · new chat · avatar; empty state = greeting +
  serif prompt + starter chips (chips only change the hint, "My period" opens LogBleedingSheet);
  thread (her words serif in a white bubble, replies plain ink); "Save as a note for my GP" →
  `openCapture({mode:'type', words})` (new `words` option); static "can't diagnose" caption.
- `components/atossa/chat/` — `Composer` (+ · input · dictation via useDictation · send),
  `ChatDrawer` (new chat, search, grouped history, long-press → destructive ConfirmCard),
  `AttachSheet` (Photo, Take a photo (native only), File, Log bleeding, Make a full note).
- `stores/chatStore.ts`; preview mode answers with fixed questions, in memory.
- New packages (all in Expo Go): async-storage, expo-image-picker (+ config plugin with photo/camera
  strings — changes the fingerprint, so needs a new build, not an OTA update), expo-document-picker,
  expo-file-system. Icons added: menu, image, paperclip, arrow-up, search, square-pen.
- `TodayCards.tsx` / `AppointmentCard.tsx` are now unused (kept; Rough day and the appointment card
  are no longer on Today).
Verified: tsc clean, iOS export bundles, web preview at phone width (send → reply, drawer, + sheet,
save-as-note prefill), no console errors.
- **Lovable pass (same day):** sent the chat spec to the Lovable prototype (commit `210d167`,
  `src/components/atossa/TodayChat.tsx`). Ported its visual choices: hairline under the header, plum
  ☰, balanced two-line prompt, starters as a 2×2 grid of white tiles, taller composer ("Your words…"),
  roomier thread, "+ Save as a note for my GP" link, drawer "Your chats" with a ⋯ delete button per
  chat (long-press kept) and a plum "Profile and settings" row, flat rows in "Add to your chat".
  NOT ported: Lovable's starters type the chip label into the box (kit rule: chips never put words in
  her mouth) and its per-reply direct save (we keep the capture sheet so she checks the note).
  ChatDrawer now unmounts at once on web (like the kit Sheet). While testing, Chrome-automation mouse
  clicks sometimes didn't reach the page at all (no pointerdown logged); a DOM click opened the drawer
  fine, so that was tooling, not the app. Not verified: Expo Go on a device (pickers, camera,
dictation, keyboard), live `/chat` from the app.

---

## 2026-10-02 — Sign-in check, account deletion, privacy policy

Audited sign-in/sign-up. Apple and Google sign-in were already fully wired
natively (expo-apple-authentication, @react-native-google-signin → backend
`/auth/apple`, `/auth/google`); Google client IDs are set in EAS `production`
and the live backend has `GOOGLE_WEB_CLIENT_ID` (garbage token → 401, not the
500 "not configured"). Supabase Auth was **not** added: it would only make
Google work inside Expo Go, at the cost of a second auth system (removed on
purpose 2026-09-08), and Apple via Supabase needs a Services ID + key from an
Apple Developer account the user doesn't have yet.
Fixes:
- **Security:** social sign-in finds the account by email but never checked
  `email_verified`, so an unverified Google email could sign in to someone
  else's password account. `_verified_email` in `social_auth.py` now requires
  it (Apple sends `"true"` as a string) and lowercases the email.
- `get_user_by_email` is case-insensitive (no duplicate accounts by case).
  Couldn't count existing mixed-case rows: the DB pooler timed out from here.
- Expo Go: the social buttons are replaced by a one-line note (Google's
  native module isn't in Expo Go; it could only error).
- Google client IDs checked equal (without printing) across EAS
  `production`, `backend/.env` and `render.yaml`; iOS URL scheme matches the
  iOS client.
- **Account deletion** (App Store guideline 5.1.1(v); there was none):
  `DELETE /me` clears every user-owned table (none cascade from `users` —
  add new tables to its list) and friend links both ways; Profile → "Delete
  account" with a destructive ConfirmCard, also cancels local reminders.
  Hidden in preview mode.
- **Privacy policy + terms**: `backend/app/routers/legal.py` serves `/privacy`
  and `/terms` (HTML, app palette). Linked from sign-up (`LegalLinks`) and a
  Profile "About" group. App Store Connect privacy URL =
  `https://atossa-backend.onrender.com/privacy`. Written to match the code —
  notably friends' apps receive name, cycle/period length and the last 12
  period dates (the UI only shows a phase). Not reviewed by a lawyer.
Verified: 6 locally signed token cases (verified/unverified/missing flag/
wrong audience, both providers); account deletion against in-memory SQLite
(only the deleted user's rows go; friend's data intact; old token → 401;
case-variant duplicate register → 400); legal pages render 200; tsc clean;
iOS export builds. Not verified: a real Apple/Google sign-in — needs a build
(no TestFlight push yet).

---

## 2026-10-01/02 — "Warm Paper, Deep Ink" redesign built locally (uncommitted)

The Lovable prototype ran out of credits partway through Stage 2a, and the user asked to port what
was built and finish the redesign in this repo with design/review agents. Plan and status:
`design/PORT_PLAN.md`; component and token reference: `design/KIT.md`; Lovable snapshot:
`design/lovable-reference/` (excluded from tsc).
- Foundation: exact palette/type/spacing tokens (`constants/atossaUI.ts`, legacy `UI.*` aliases kept),
  Inter 400/500/600 + Instrument Serif Italic (Work Sans removed), rebuilt kit
  (`components/atossa/kit-parts/*`), extended record types (all new fields optional, old data still
  renders; backend `/records` is free-form JSON so no migration), `lib/records/format.ts` (en-GB dates,
  strength, `noteCount`).
- Tabs are now Today · Timeline · For my doctor (+ Profile via the avatar). Old chat/dashboard/report
  screens, Charts, Calendar, DateChoice and RecordPage were deleted (still in git).
- Today + capture sheet (gap-only follow-ups, "Here's what I noted", Rough day, Log bleeding, toast);
  Timeline (List/Month, week groups, day sheet, period runs, entry/bleeding detail); Profile + Records;
  For my doctor (builder, A4 document model shared by preview/reader/Show on screen/PDF via
  expo-print); sign-in/onboarding re-skinned.
- Design-preview mode for reviewers: `npm run preview:web` (EXPO_PUBLIC_DESIGN_PREVIEW=1, signed in as
  Sam, seeded in-memory store, today = 2026-09-24). Never set it in EAS. Added react-dom,
  react-native-web, @expo/metro-runtime, expo-haptics, expo-keep-awake, @expo-google-fonts/inter.
- Reviews: round 1 UX 7 / visual 7 → round 2 8 / 8 → final pass (see
  `research_notes/Atossa app design research/local_review*`). Notable bugs found and fixed: closed
  Sheet layer swallowing the next tap; RN-web drops inline `pointerEvents: 'box-none'` (toast layer
  blocked taps for 3 s) — now only via StyleSheet.create; POP_TO_TOP double dispatch.
- Small decisions: selected SeverityRow = solid plum disc; When (period timing) and How long (free
  text) are separate fields; onboarding last-period no longer invents flow "Medium"; reminder copy
  now "If today's worth noting, I'm here. Two minutes is plenty."; welcome no longer shows the app
  icon (portrait with flowers is on the do-not-do list).
- OPEN for the user: Friends still computes and shares cycle phase (reviewers flag it as a
  prediction); the app icon; device check in Expo Go before any TestFlight build.
Verified: `tsc` clean, `expo export --platform ios` OK, web preview walked by reviewer agents.
NOT run in Expo Go on a device.

---

## 2026-09-25 — Expo Go warnings

First run in Expo Go (SDK 57) bundled and started; three warnings.
- Two from `expo-notifications`, printed at import time in Expo Go (the
  package registers a push-token listener as a side effect). The old
  `LogBox.ignoreLogs` block in `app/_layout.tsx` never worked: imports are
  hoisted above it, and LogBox doesn't filter the terminal. Replaced with
  `lib/expoGoWarnings.ts` (drops exactly those two messages, Expo Go only)
  loaded from a new entry `index.ts` (`package.json` main), which also
  loads `lib/crashGuard.ts` first.
- "Unable to get the view config … ExpoAppleAuthentication": Expo Go has
  no native view for Apple's button. `SocialAuthButtons` now hides the
  Apple button in Expo Go (Apple sign-in can't work there anyway).
tsc clean, iOS export builds from the new entry.

---

## 2026-09-25 — Upgrade to Expo SDK 57

The App Store Expo Go is SDK 57 only (my earlier "still supports SDK 54"
came from a May 2026 Expo post and was out of date), and older Expo Go
can't be installed on iOS. User chose to upgrade. Changes (uncommitted):
expo 54.0.37 → 57.0.25, React Native 0.81.5 → 0.86.3, React 19.1 → 19.2.3,
all expo-* to 57.x, gesture-handler 2.32, screens 4.26, safe-area 5.7,
svg 15.15, google-signin 16.1.5, TypeScript 6.0, @types/react 19.2.
Breaking changes handled: `android.edgeToEdgeEnabled` removed; splash
config moved into the `expo-splash-screen` plugin (with no props the
plugin now does nothing); `expo-font`/`expo-sharing`/`expo-status-bar`
plugins added as `expo install` asked; `MainTabBar` imports
`BottomTabBarProps` from `expo-router/tabs` (SDK 56 drops direct
`@react-navigation/*` imports); `eas update` needs `--environment`.
`fetch` is now `expo/fetch`, and `lib/api.ts` only uses standard calls.
Verified: tsc clean, expo-doctor 21/21, iOS export 3.4 MB Hermes bundle.
**Not run on a device yet.** Unknown whether RN 0.86 fixes the iOS 26
crash from build 22. The local gitignored `ios/` (1 GB) is a stale SDK 54
prebuild.

---

## 2026-09-25 — Test in Expo Go with plain `npx expo start`

User wants to test in Expo Go on their phone (App Store Expo Go still
supports SDK 54). Changes (uncommitted):
- **Removed `expo-dev-client`**: with it installed, `npx expo start`
  serves a development build and the QR code doesn't open in Expo Go. Only
  the `development` EAS profile used it (for Step D voice testing).
  Re-add it (`npx expo install expo-dev-client`) when voice needs a device
  test.
- **`lib/speechModule.ts`**: lazy-requires `expo-speech-recognition` (its
  import throws when the native module is missing, as in Expo Go, which
  broke the Chat tab). `useDictation`/`transcription` go through it; in
  Expo Go the mic reports "not available".
- **`.env` (gitignored)** gained `EXPO_PUBLIC_API_URL` = Render backend;
  without it the app called `localhost`, which the phone can't reach.
- In Expo Go only email sign-in works (Apple/Google need the real bundle).
tsc clean, expo-doctor 18/18, iOS export builds.

---

## 2026-09-25 — TestFlight build 22 crashes on launch (iOS 26.6.1)

User's crash log (`Atossa-2026-09-25-100618.ips`, build 22 = `b572995`):
SIGSEGV inside Hermes (`stringPrototypeSplit` → `resizeWithinCapacity`) on
the JS thread, while the TurboModule queue was in
`ObjCTurboModule::performVoidMethodInvocation` →
`convertNSExceptionToJSError`: a void native method raised an ObjC
exception and RN converted it on the wrong thread, corrupting the Hermes
heap. Known RN 0.81 / iOS 26 release-only bug (react-native#54859,
expo#44606), no upstream fix. Process lived 38 s — about a Render cold
start — so the trigger is probably right after the first backend reply.
Most likely thrower: `RCTExceptionsManager` reporting a *fatal JS error*
(release builds turn those into an NSException). **Not confirmed** — the
log doesn't name the module or the JS error.

Added (uncommitted): `lib/crashGuard.ts` (release-only global JS error
handler that keeps fatal errors in JS instead of passing them to native),
a root `ErrorBoundary` in `app/_layout.tsx`, and `ErrorScreen` in the kit,
which shows the error message with "Try again". If the theory is right, the
app stays open and shows the real error. tsc clean, iOS export builds.
User said **do not push to TestFlight** — nothing built or shipped.

**Narrowed (same day):** build 21 (`7402b3b`) opens on the same phone and
build 22 crashes before any screen, so the cause is in `7402b3b..b572995`.
Ruled out by diffing the two IPAs downloaded from EAS: Info.plist differs
only in the removed permission strings; no native module the JS asks for
is missing from build 22's binary (JS strings vs binary strings).
Remaining differences: Expo/Babel patch updates (expo 54.0.34→.37,
expo-router 6.0.23→.24, expo-font, expo-file-system, Babel 7.29.x), the
deleted hidden screens (release expo-router evaluates every route at
startup) and `cancelPredictedCycleReminders()` at module load. Next
step without a build: read the phone's live log (Console.app over USB),
where RN prints "Unhandled JS Exception: …" before it crashes.

---

## 2026-09-24 — Review of the new screens + one design system for every screen

**1. Review of Chat / Dashboard / For my doctor (static — no device).**
Fixed (commit `1a2c049`): fields hidden behind the keyboard on every
Dashboard/doctor page (`automaticallyAdjustKeyboardInsets` on `Screen`);
a late dictation result re-filling the box after Send (`useDictation`
now has `cancel()` and ignores results after it); saving empty "noted"
words; Chat replies not announced to VoiceOver; `savePeriodDays` losing
successful saves when one request failed (→ duplicate period-day rows on
retry; now `allSettled`); calendar month arrows silently dropping unsaved
edits and jumping to a future day; doctor page re-rendering every row per
keystroke in the notes box; "I was told: None saved." wording; header
initial from non-name display names; tab labels overflowing at the
largest text size.

**2. Old-design screens rebuilt on `components/atossa/kit.tsx`.**
Welcome, sign in, sign up, forgot password, onboarding, profile, edit
profile, settings, Friends, not-found and the loading screen. The kit
gained `TextField` props (keyboard types, `error`, `secret` with a
Show/Hide button), `SwitchRow`, `StepProgress`, `LoadingScreen`,
`SuccessNote`, and `Screen` `edges`. Pop-up `Alert`s replaced by inline
messages/confirm cards. `lib/authRouting.ts` is now the one place that
decides where a signed-in user goes (login previously skipped the name
step for users without a real name).

**Onboarding content changed, not just restyled** — the old copy broke the
MVP rules: welcome promised "Predict your next period & fertile window"
and "Emergency alerts for loved ones"; step 3's symptom picks were never
saved; step 4 offered period/ovulation/"unusual pattern" alerts that
don't exist; step 5's "invite a loved one" email was never sent. Now:
name (only if needed) → basics (cycle/period length, "I don't know" ok)
→ last period (saved as a `period_day` record for the Dashboard calendar
*and* `/cycles` for Friends) → daily reminder (the one reminder that
exists). Files renamed `basics.tsx`, `last-period.tsx`, `reminders.tsx`.
Profile lost the "coming soon" Connected accounts / Emergency contacts
pages, the non-working change-password form and the cycle "regularity"
badge; forgot-password now offers an email-support button. Edit profile
takes date of birth as Day/Month/Year boxes with validation.
**Dark mode removed** — the new design is light-only; the old toggle only
ever affected the old screens. (`profiles.dark_mode` column untouched.)

**Deleted:** `components/ui/{Button,Input,Card,Badge,LoadingSpinner}`,
`components/layout/*`, `components/tracking/SymptomChip`,
`constants/{colors,theme,typography,symptomTypes}`,
`contexts/ThemeContext`, `stores/uiStore`, the three placeholder profile
screens, onboarding steps 3 and 5; packages `@expo-google-fonts/fraunces`,
`react-native-calendars`, `react-native-reanimated`,
`react-native-worklets` (nothing imports them; reanimated is an optional
peer of expo-router). Splash and notification colours set to the new
palette (native change → needs a build).

**Verified:** `tsc` clean (typed routes regenerated by briefly starting
Metro), `expo-doctor` 18/18, iOS bundle builds: 1,706 modules / 3.76 MB
Hermes bundle (was 2,378 / 5.6 MB this morning). `node_modules` 401 MB.
**Not verified on a device** — needs the next build (native changes:
removed packages, splash colour).

---

## 2026-09-24 — EAS Update set up (save build credits)

User asked whether small TestFlight builds count toward the EAS build
limit (they do; 7 iOS builds used this month). Added `expo-updates`,
`updates.url`, `runtimeVersion: { policy: 'fingerprint' }` in
`app.config.ts`, and a `channel` per build profile in `eas.json`.
JS-only changes now ship with `eas update --channel production`; native
changes still need a build. Checked: the gitignored local `ios/` folder
gets a null hash in the fingerprint (so it does not make local updates
mismatch cloud builds); tsc clean, expo-doctor 18/18. Takes effect from
the first build that includes this commit — build 22 does not.

---

## 2026-09-24 — Whole-codebase cleanup: prediction code and old-version leftovers removed

**Asked:** test everything, remove what no longer matches the MVP, save
disk space. User decisions (asked first): remove *all* AI period
prediction (app, server, placeholder models, `training/`, period/ovulation
reminders) — it conflicts with the "no predictions" rule, and it stays in
git history if wanted for the ML portfolio; remove `/captures` but keep
its saved rows.

**Removed (app):** Expo starter `App.tsx`/`index.ts` (entry is
`expo-router/entry`), `supabase/functions/chat` (Gemini era),
`algorithms/ai*.ts`, `predict.ts`, `calendarDerive.ts`,
`healthRiskDetection.ts`, `assets/models/*.tflite` (never-trained stubs),
`metro.config.js` (only added `.tflite`), `stores/cycleStore.ts`,
`stores/alertStore.ts`, `lib/emergency.ts`, old `components/calendar`,
`education`, `alerts`, unused tracking/layout pieces, `constants/articles.ts`,
unused hooks, and unused types in `types/database.ts`. 23 npm packages the
app no longer imports (incl. `react-native-fast-tflite`, chart-kit,
bottom-sheet, expo-av/contacts/image-picker/sms/sensors, zod,
react-hook-form, ngrok) and the Info.plist strings/plugins for contacts,
photos, camera and motion, which nothing uses. `constants/config.ts` lost
the unused Supabase/AdMob fields. Four Expo patch updates installed.
**Kept on purpose:** Friends (uses `algorithms/cyclePhase*` and
`cyclePrediction.ts` for phase matching), Profile, onboarding's
`POST /cycles`, `lib/transcription.ts` (dictation).
`app/_layout.tsx` now calls `cancelPredictedCycleReminders()` at start so
devices that got "period coming"/"ovulation" reminders from older builds
have them cleared.

**Profile stats** read the new records store (Symptoms, Appointments,
Avg cycle) instead of the old `/cycles` and `/cycles/symptoms` data.

**Removed (backend):** `app/ml/` (NumPy predictor), `/cycles/prediction*`,
the `/cycles/symptoms*` endpoints, `/captures` router + schema, `numpy`
and `python-multipart` from requirements. Every ORM model stays (tables
and rows untouched; `alembic check` reports no schema drift).

**Verified:** `npx tsc --noEmit` clean; `expo-doctor` 18/18;
`expo export --platform ios` bundles (5.6 MB Hermes bundle). Backend
imports, `alembic check` clean, and a 37-check smoke test against a local
server + the real DB: register/login/refresh/bad-password, `/me` patches,
onboarding `/cycles`, all six record kinds CRUD, 422s, cross-user 404,
full Friends invite→accept→list, auth required on `/me` and `/chat`,
removed endpoints gone. Test users deleted afterwards (0 left).
**Not verified:** on a device — next TestFlight build. README rewritten
to match the current app.

**Disk:** the `ios/` folder (1 GB, gitignored, regenerated by EAS) and
global caches (~/.npm 3.9 GB, CocoaPods 0.9 GB, ~/.expo 0.3 GB, simulator
data 11 GB) were *not* deleted — the permission check blocked it; commands
handed to the user. `node_modules` went 497 MB → 431 MB.

---

## 2026-09-24 — Deleted the old hidden screens

User asked to delete the screens the redesign had only hidden: the
Analyse and People tabs (`app/(tabs)/analysis`, `community`), and the old
`chat/capture.tsx`, `chat/period-log.tsx` and `chat/cycle-data.tsx`. Also
removed what only they used: `components/cycle/*` and
`components/ui/EmptyState.tsx`. Kept: Profile (still reached from the
header avatar, incl. Friends), `lib/transcription.ts` (used by
`hooks/useDictation.ts`), and all backend endpoints (`/captures`,
`/cycles`, `/connections` untouched; onboarding still writes `/cycles`).
Verified: `npx tsc --noEmit` clean, `expo export --platform ios` bundles.
Not in TestFlight build 21 (queued before this change).

**`/chat` decision:** user chose to keep the `/chat` LLM endpoint deployed
but unused (nothing in the app calls it, so no chat text reaches Groq) —
kept for a possible AI feature later, rather than deleted.

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

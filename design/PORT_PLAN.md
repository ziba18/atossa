# Port the Lovable redesign into the Expo app (started 2026-10-01)

User request (2026-10-01): take what is built in Lovable so far, implement it in this local
Expo codebase, then keep building here (Lovable is out of credits) with design/review agents
until the redesign is finished.

## Sources of truth
- Visual + UX spec: `reports/Atossa app design research.md` lines 47–200 ("Warm Paper, Deep Ink").
- Lovable code snapshot (web React + Tailwind, commit 65c85a04): `design/lovable-reference/`
  (`AtossaApp.tsx` = Today, capture sheet, follow-ups, noted card, Log bleeding, doctor page,
  Profile; `TimelineStage2.tsx`; `RecordsStage2.tsx`; `styles.css` = exact tokens).
  It is a REFERENCE, not code to copy verbatim — it is web/Tailwind and has known bugs.
- Known bugs in the Lovable build that must NOT be ported (fix them here instead):
  `research_notes/Atossa app design research/stage2a_fix_message.md` (items 1–11) and the
  §5 leftovers in `stage2b_doctor_message.md`.
- Doctor page (never built in Lovable): `research_notes/Atossa app design research/stage2b_doctor_message.md`.
- Product rules: never name a condition, give likelihoods, suggest causes/treatments; never
  predict (no rings, "days until", fertile windows); never label values against thresholds;
  never imply causation; no streaks/guilt/praise; no emoji, mascots, flowers, paywalls.
  Only Sam's own typed/spoken words are shown in quotes or the serif.

## Constraints
- Expo SDK 57 / RN 0.86, must run in App Store Expo Go → no new native modules beyond what
  Expo Go ships (expo-haptics, expo-print, expo-sharing, react-native-svg, expo-linear-gradient OK).
- Do NOT open the iOS Simulator. Verify with `npx tsc --noEmit`, `npx expo export --platform ios`
  (then delete `dist/`), and the web preview (below) in Chrome.
- No `eas build`, `eas update`, `git push`. Don't commit unless the user asks.
- Working tree already has the uncommitted SDK 57 upgrade — don't revert or reformat those files.
- Disk is tight: delete `dist/`, `.expo/web` caches you create.
- Backend `/records` stores `data` as free-form JSON (≤ size cap), so new fields need no migration.

## Phases
0. Foundation: tokens (`constants/atossaUI.ts`), Inter + Instrument Serif fonts, new kit
   components, extended record types, design-preview mode (seed "Sam" data, no login) and an
   Expo web preview for reviewers.
1. Today tab + capture sheet (speak/type → gap follow-ups → "Here's what I noted" → save), Rough
   day, Log bleeding sheet, appointment card, latest note, toast.
2. Timeline: List (filters, week groups, EntryCards) · Month (calendar, DaySheet) · entry detail.
3. Profile + Records (medicines / appointments / health history), Clear sample data (preview only).
4. For my doctor: builder + A4 document preview + Share PDF / Print / Show on screen (expo-print).
5. Review loop: UX + graphic-design reviewer agents walk the web preview in Chrome → fixes.
6. Stage 3 polish: sign-in/onboarding re-skin, empty states, motion/haptics, final review.

## Status
(update as phases complete)

### Phase 0 — Foundation: DONE (2026-10-01)
Reference for every later agent: **`design/KIT.md`** (tokens, components, rules, preview mode, file ownership).
- Lovable files saved verbatim to `design/lovable-reference/` (styles.css, TimelineStage2.tsx,
  RecordsStage2.tsx, roadmap.md); `design/` excluded from `tsconfig.json`.
- Tokens: `constants/atossaUI.ts` rewritten (palette, severity ramp + `severityColor`, type scale,
  space, radii, heights, shadows via `boxShadow`, motion). Legacy `UI.*` keys kept, mapped to the new palette.
- Fonts: Inter 400/500/600 + Instrument Serif **Italic** loaded in `app/_layout.tsx`; Work Sans removed (package uninstalled).
- Icons: absolute 1.75 stroke at any size; added pen-line, calendar-days, chevron-down/up, share-2,
  printer, monitor, lock, trash-2, sun, list.
- Kit: `components/atossa/kit.tsx` re-exports `components/atossa/kit-parts/*` — Txt/Quote, ScreenLarge,
  HeaderAvatar, IconButton, Card, PressableCard, Button, Chip, ChipGroup, AddFieldChip, SegmentedControl,
  DatePill, DayChooser, SeverityRow, SeverityTag, Sheet, ConfirmCard, toast (`showToast`/`dismissToast`/
  `ToastHost`), BackChevron, SectionTitle, NotedRow, FactLine, GlyphLine, EmptyState, InlineError,
  SafetyLine + restyled legacy exports. `lib/haptics.ts` (no-op on web). `expo-haptics` installed.
- Shared `components/atossa/LogBleedingSheet.tsx` built (status required, nothing pre-selected, optional flow, date control, toast).
- Data: optional new fields on `SymptomData`/`PeriodDayData`/`MedicineData`; `lib/records/format.ts`
  (dates, ranges, approximate dates, strength, `noteCount`, bleeding status); `mondayOf` + preview-aware `todayKey()`.
- Preview mode: `EXPO_PUBLIC_DESIGN_PREVIEW=1` → signed in as Sam, in-memory seeded store, today = 2026-09-24,
  `clearSampleData()` / `restoreSampleData()`. Web: `react-dom`, `react-native-web`, `@expo/metro-runtime`
  installed; `npm run preview:web`. Web guards for secure-store, Google sign-in, notifications.
- Navigation: tabs = Today / Timeline / For my doctor (+ hidden profile); placeholder screens; new MainTabBar;
  post-login → `/(tabs)/today`. Old chat/dashboard/report routes and `Charts.tsx` deleted (code in git HEAD).
- Verified: `npx tsc --noEmit` clean; `npx expo export --platform ios` OK; web preview serves (index + bundle 200)
  and a headless-Chrome smoke test booted to /today as Sam, opened Log bleeding, saved Spotting (toast shown),
  used the date chooser, switched tabs and opened Profile with no runtime errors.

Left for later phases / known gaps:
- Profile screen still the old layout (Phase 3) — needs the preview-only "Clear sample data" button.
- `lib/records/summary.ts` only made tolerant of new fields; Phase 4 reworks it to use `format.ts` + `noteCount`.
- `components/atossa/Calendar.tsx` (sparkle loop animation — banned) and `DateChoice.tsx`/`RecordPage.tsx`
  remain for reference; Timeline/Records should replace them.
- Seed appointment "Specialist clinic" is on preview-today (24 Sep); there is no upcoming appointment in the seed,
  so Today's appointment card will show its "add one" state unless Phase 1 decides otherwise.
- Not run in Expo Go on a device (no simulator by rule) — check on device before any TestFlight.

### Phases 1–4 — RUNNING in parallel (started 2026-10-01, after usage reset)
Lead added shared contracts first: `lib/captureStore.ts` (openCapture), `lib/records/fields.ts`
(answer lists), and the "Route + shared-contract map" section in `design/KIT.md`.
Agents: Today+capture · Timeline · Profile+Records · For my doctor (file ownership per KIT.md).
After all four: lead integrates (tsc, iOS export, web preview boot), then Phase 5 review loop.

### Phases 1–4 — DONE (2026-10-01)
All four built; whole-project `tsc` clean; `expo export --platform ios` OK; web preview boots to Today as Sam.
Lead integration: tab switches land on the tab root (MainTabBar), removed unused DateChoice/RecordPage.
Agent notes to revisit: doctor "Since last appointment" range label shortened to "Last visit"; PDF is 2 pages
with seed data; fonts not embedded in PDF (system fallback); Friends screen still shows cycle phase
(ask user); unsaved record edits discarded without asking.
### Phase 5 — review round 1 running: UX reviewer → `research_notes/Atossa app design research/local_review1_ux.md`,
then graphic-design reviewer.
Review round 1 DONE: UX 7/10 (`local_review1_ux.md`, 1C/6H/15M/9L), visual 7/10 (`local_review1_visual.md`, 0C/5H/18M/8L).
Fix round 1 RUNNING: 4 lanes (kit+Today/capture · Timeline · Profile/Records · Doctor), common brief in scratchpad
(lead decisions: Friends left for user; selected SeverityRow = solid plum; When vs How long split).
NEXT: integrate (tsc, iOS export) → review round 2 → Stage 3 polish (auth/onboarding re-skin, final review).
Fix round 1 DONE (all 4 lanes + follow-ups). tsc clean, iOS export OK (3.6 MB hbc), web preview up. expo-keep-awake installed.
Notable: dead-tap root cause = closed Sheet's invisible layer; RN-web ScreenLarge scrollRef null (worked around in Timeline revealConfirm).
RUNNING: review round 2 (combined UX+visual → `local_review2.md`) ∥ Stage 3a auth/onboarding re-skin (no Chrome).
Stage 3a (auth/onboarding re-skin) DONE; lead fixed onboarding invented flow + reminder copy; Calendar.tsx deleted.
Review round 2 DONE → `local_review2.md`: UX 8/10, visual 8/10; round-1 items 56 pass/4 partial/1 fail/1 pending; new N1–N22 (0C/1H/9M/12L).
Fix round 2 RUNNING: 3 lanes (kit+Today/capture · Timeline+Records · Doctor). NEXT: integrate → final review → wrap-up for user
(Friends decision; device check in Expo Go before any TestFlight; commit when user asks).
Fix round 2 DONE. Final review → `local_review3_final.md`: UX 9/10, visual 9/10, 26/26 pass, no regressions.
Final polish DONE (period-day notes, centred toast, one "latest note" order, today's appointment under Coming up,
non-wrapping ranges). tsc clean, iOS export OK (3.7 MB). Web preview stopped (restart: `npm run preview:web`).
REDESIGN COMPLETE in code (2026-10-02), uncommitted. OPEN for user: Friends cycle phase decision; app icon;
device check in Expo Go (voice, haptics, keyboard, share sheet, real PDF/print, 320 pt tap targets) before TestFlight;
commit when asked.

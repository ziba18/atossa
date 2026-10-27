# Atossa kit — reference for Phase 1–4 agents

"Warm Paper, Deep Ink". Spec: `reports/Atossa app design research.md` lines 47–200. Lovable
snapshot (reference only, has known bugs): `design/lovable-reference/`. Bugs not to port:
`research_notes/Atossa app design research/stage2a_fix_message.md` + §5 of `stage2b_doctor_message.md`.

**Import UI only from `components/atossa/kit`** and tokens only from `constants/atossaUI`.
No raw hex, font names or magic numbers in screens.

## Hard rules
- **Serif** (`Txt variant="hero" | "quote"`, `Quote`) ONLY for: Sam's own typed/spoken words,
  the Today hero prompt, the summary title. Never for chip labels, system text, quick logs.
- **Plum = action only** (buttons, mic, links, selection, selected tab). **Clay = bleeding only**
  (calendar fill, 4 px card edge `edge="clay"`, droplet icon). **saved/error = system status only**,
  never describing a body. Severity = the single-hue ramp, **always with the digit**.
- **No `Alert.alert`** — use `ConfirmCard` in-page. **No 700 weight** (Inter 400/500/600 only; never
  pass `fontWeight`; the serif never takes a weight).
- Cards: white, hairline, radius 20, soft two-layer `shadows.card` (owner approved 2026-10-20); hero keeps its own shadow.
- Dates only via `lib/records/format.ts`; "today" only via `todayKey()` (preview pins it).
  Counts of notes only via `noteCount()`.
- Product rules: never name a condition, give likelihoods, causes or treatments; no predictions,
  threshold labels ("heavy" as a judgement, "irregular"), causation ("linked to"), streaks, praise,
  guilt, emoji. The safety line is static, never content-triggered.
- Icons: `Icon` sizes 20/24/32 only; stroke is absolute 1.75 by default — don't pass `strokeWidth`.
- **Selection** = plumTint + 2 px plum ring (chips, segments) — **except the SeverityRow**, whose
  selected disc is SOLID plum with a white 600 digit (lead decision, review 1 V1: it is the primary input).
- **Text hierarchy** (review 1 V4/V5/V10): in-card row label = `caption`; its value = `body` ink
  (grey label, ink content); every form/question field label = `FieldLabel` (17/600 ink, " · Optional"
  inline, hint under); group header over cards (week headers) = `Txt variant="groupLabel"` (15/600 ink2,
  32 above, 8 below); dates/meta on cards = `caption` (GlyphLine) and facts = `secondary`.
- **One "add" treatment** (V16): header "+" = `AddButton` (plain plum plus glyph, 44 hit, unfilled).
  Never the filled plum disc. Hide it while an EmptyState shows its own primary. Empty fields in a
  card = `AddFieldChip`.
- Sheet X is ink (as iOS); every other interactive glyph (BackChevron, month chevrons) is plum.
- Sam's words on screen go through `Quote` (curls apostrophes for display). Serif system copy uses
  `’` and `…`, never `'` / `...` (or wrap it in `curly()`).
- Haptics: Chip/ChipGroup/SegmentedControl/SeverityRow/DayChooser already fire `selection`.
  Call `haptics.light()` on record start/stop, `haptics.success()` on save / PDF created
  (`lib/haptics.ts`). Nothing on errors.
- Hit targets ≥ 44. Chips and the tab bar cap `maxFontSizeMultiplier` at 1.6; everything else scales.
- **`pointerEvents: 'box-none' | 'box-only'` only inside `StyleSheet.create`**, never inline (`style={[…, { pointerEvents: 'box-none' }]}`)
  or as the deprecated prop. RN-web compiles box-none to classes only for static styles; inline it becomes invalid CSS
  and the overlay swallows every tap (review 2, N1: the toast layer blocked all taps for 3 s after each save).
  Inline `'none'` / `'auto'` are fine.
- Must run in Expo Go (SDK 57): no new native modules. Web must keep booting (preview).

## Tokens (`constants/atossaUI.ts`)
| Export | Values |
|---|---|
| `colors` | canvas `#F7F3EE` · surface `#FFF` · sunken `#EFE9E1` · hairline `#E2DAD0` · borderStrong `#8F867C` · ink `#1F1B18` · ink2 `#5A534D` · ink3 `#756C64` (not on sunken — use ink2) · plum `#4A2C4F` · plumPressed `#3A2140` · plumTint `#EFE6EF` · clay `#A6452E` · clayTint `#F3DED6` · saved `#2E6A4F` / savedTint `#E2EEE6` · error `#A12A2A` / errorTint `#F6E0DE` · scrim · tabBar |
| `severityRamp`, `severityStep(n)`, `severityColor(n)` | 0–2,3–4,5–6,7–8,9–10 → `{bg, fg}` (fg ink on steps 0–1, white on 2–4) |
| `type` (`Txt` variants) | largeTitle 34/41 600 −0.17 · hero 30/36 serif · title 24/30 600 · quote 20/28 serif · headline 17/24 600 · body 17/24 · secondary 15/20 ink2 · caption 13/18 500 +0.26 ink3 · numeral 44/48 500 tabular · tab 11/13 500 · **fieldLabel** 17/24 600 ink · **groupLabel** 15/20 600 ink2 |
| `fonts` | regular/medium/semibold = Inter 400/500/600, serif = `InstrumentSerif_400Regular_Italic` |
| `space` | xxs 4 · xs 8 · sm 12 · md 16 · lg 20 · xl 24 · xxl 32 · xxxl 40 · huge 56 |
| `layout` | gutter 20 · maxContentWidth 600 |
| `radii` | input 14 · card 20 · sheet 28 · pill 999 |
| `heights` | primary 56 · secondary 48 · chip 44 · addChip 36 · segmented 36 · datePill 36 · minHit 44 · tabBar 52 · toast 48 · **toastClearance 80** (ScreenLarge's scroll bottom padding, so a toast never covers the last action — UX #30) |
| `shadows` | hero (y2 blur16 ink 6%) · sheet · toast · thumb (segmented thumb only) — kit-internal except hero |
| `motion` | fast 200 · base 240 · sheet 260 · toastMs 3000 |
| `UI` | legacy aggregate with old key names mapped to the new palette — for old screens only |

## Components (`components/atossa/kit`)
| Component | Props (key) | Notes |
|---|---|---|
| `Txt` | `variant`, `color`, Text props | Legacy variants (`display`, `h2`, `bodyBold`, `small`…) still map, don't use them in new code |
| `Quote` | `children: string`, `numberOfLines` | Serif 20/28 in curly quotes — Sam's words only. Straight `'` shown as `’` (display only) |
| `curly(text)` | — | `'`→`’`, `...`→`…` for display |
| `FieldLabel` | `label`, `optional?`, `hint?`, `nativeID?` | THE field/question label: 17/600 ink, " · Optional" inline 15 ink2, hint below, 12 to the control. Use in every form and sheet (not for NotedRow labels) |
| `ScreenLarge` | `title`, `subtitle?`, `right?`, `back?: {label,onPress?}`, `scroll?`, `scrollRef?`, `footer?`, `contentStyle?` | Safe-area top, canvas, large title, gutter 20, max 600. Subtitle sits 8 under title (Today greeting). Content starts 24 below |
| `HeaderAvatar` | — | 44 initial circle (sunken, ink2 initial, hairline) → `/(tabs)/profile`. Top-right on every tab (Timeline: `AddButton` left of it, gap 8) |
| `IconButton` | `icon`, `label`, `onPress`, `color?`, `size?`, `filled?` (deprecated) | 44×44, ink glyph |
| `AddButton` | `label`, `onPress` | The one header "+" (plum glyph, unfilled) |
| `BackChevron` | `label` (previous screen's title), `onPress?` | "‹ Medicines", plum, 44 hit |
| `SectionTitle` | `title`, `right?` | title 24/30, 12 below |
| `Card` | `tone?` (`default`/`sunken`/`selected`/`error`/`hero`), `edge?: 'clay'`, `onLayout?` | White, hairline, r20, p20 |
| `PressableCard` | `onPress`, `chevron?`, `edge?`, `accessibilityLabel` | Card + chevron-right ink3 20, pressed = canvas |
| `HeroNumber` | `big?`, `line`, `sub`, `onPress?` | Today's one big number: 48 pt numeral in a plum-tint rounded tile (min 76 pt, not aria-hidden: the numeral is the content) + headline + secondary; a PressableCard when `onPress` is given. States follow app-blueprint §3.3: on the appointment day the numeral is the notes ready (0 included), 1–60 days it is days, beyond that weeks |
| `MicButton` `invite` | `invite?` (72 size) | Idle ring breathes out 3 × 1.2 s on arrival then rests; never under Reduce Motion; recording keeps its own loop |
| `QuickTile` | `label`, `icon`, `onPress` | Icon in a plum-tint circle + label; two across (flexBasis 48%); Today quick topics |
| `Button` | `label`, `onPress`, `variant` (`primary` 56 / `secondary` 48 / `text` 44 / `destructive` 44 red text / `destructiveOutline` 48 error outline — ConfirmCard's confirm), `icon?`, `disabled?`, `loading?`, `align?: 'start'`, `small?` (text: 15/500 label) | Disabled primary = sunken + ink2. One primary per screen/sheet. Never stack two full-width secondaries under a primary: use one row of two `text` buttons (V13) |
| `Chip` | `label`, `selected`, `onPress`, `ghost?` | 44 pill; selected plumTint + 2px plum + plum text (weight stays 500, no reflow). Ghost = same outline, ink2 text. Emits aria-checked/aria-pressed on web |
| `ChipGroup` | `options`, `mode: 'single'|'multi'`, `value`, `onChange`, `allowDeselect?` (single), `exclusive?` (multi), `ghosts?`, `scroll?`, `bleed?`, `fadeColor?` | Not sure / It varies / Skip render as ghost and are exclusive in multi mode by default. `scroll` rows auto-scroll the selected chip into view; `scroll bleed` = edge-to-edge row with 24 pt right fade (use for every chip scroller, e.g. Timeline filters) |
| `AddFieldChip` | `label` ("Add where"), `onPress` | Dashed, plum 15/500, 36 visual / 44 hit |
| `SegmentedControl` | `options`, `value`, `onChange` | 36 tall pill, sunken track, white selected thumb with hairline + micro-shadow |
| `DatePill` | `value` (date key), `onPress`, `label?` | "Today ▾" / "Yesterday ▾" / "Wed 24 Sep ▾" |
| `DayChooser` | `value`, `onChange`, `max?` (default today), `min?` | Inline month grid, no future days, today ring |
| `SeverityRow` | `value: number|null`, `onChange(n|null)`, `label?` (shown as FieldLabel), `showLabel?` | 44 discs. Narrow: 0–5 edge to edge, 6–10 centred under it; ≥ 484 pt wide: one row 0–10. Selected = SOLID plum + white digit. Hit ≥ 44 on every platform (at 320 the cell widens to 44 with negative margins; no hitSlop). Radio a11y "7 out of 10" + aria-checked, re-tap clears, captions "0 = none" / "10 = worst" under the first/last disc. Two rows for Usually / At worst |
| `SeverityTag` | `value`, `suffix?`, `style?` | Display-only ramp pill + digit (28 tall). Put the worst value at the start of a card's fact line. Words go INSIDE the pill via `suffix="/10 at worst"` (N7); the screen-reader label includes them ("9 out of 10 at worst") |
| `Sheet` | `visible`, `onClose`, `title?`, `titleIcon?: {name,color}`, `header?` (sticky), `footer?` (sticky, e.g. Save), `full?`, `scroll?`, `scrollRef?` | RN Modal, r28 top, grabber + header swipe-down, X 20, scrim tap, Android back, keyboard avoiding, fade under Reduce Motion, dismisses toast on open. Hairline appears under the sticky header once the body scrolls. Closing releases focus/keyboard and unmounts at once on web; `scrollRef` lets a multi-step sheet `scrollTo({y:0})` per step. Closing from an async Save (then `showToast`) is safe for every caller — the round-2 dead tap (N1) was the toast layer, see the pointerEvents rule |
| `ConfirmCard` | `title`, `message?`, `actions` (≤3: `{label,onPress,variant}`), `tone?: 'destructive'`, `onLayout?` | Replaces Alert.alert. Scroll it into view with `onLayout` + `scrollRef`. `tone="destructive"` (N21): white card + error hairline, ONE row — the action with variant `destructive` (or legacy `primary`) renders as a 48 `destructiveOutline` button, the others (Cancel/Keep) as text buttons beside it. Pass Delete first, Cancel second. Neutral tone: stacked, variants as given |
| `showToast(msg)` / `dismissToast()` / `ToastHost` | — | One toast (host mounted in `app/_layout.tsx`), savedTint + faint saved edge + its own float shadow, check-circle, r14, full width up to 560 centred under the content column (same as ScreenLarge, so iPad/wide web too), above tab bar, 3 s, new replaces old, tap to dismiss. Only the toast itself takes touches (its full-screen layer is box-none). Copy: "Saved. 13 notes ready for your GP." |
| `NotedRow` | `label`, `quote?`, `value?`, `onPress?`, `addLabel?`, `first?` | Caption label / serif quote / **body ink** tidy value / chevron. Empty + `addLabel` → AddFieldChip |
| `FactLine` | `parts[]`, `numberOfLines?` | secondary ink2 joined " · " |
| `GlyphLine` | `icon`, `text`, `clay?`, `variant?` (`caption` default / `secondary`) | Entry-card top line (glyph inline with date), caption meta |
| `EmptyState` | `message`, `action?`, `icon?` (32 ink3), `fill?` | Calm one-liner + optional primary. `fill` centres it in the remaining space (parent needs flexGrow) |
| `InlineError` | `message`, `onRetry?` | System errors only |
| `SafetyLine` / `SAFETY_TEXT` | — | "If you feel very unwell or you're worried, contact your GP, NHS 111 or 999." Profile + foot of summary builder |
| `TextField` | `label`, `value`, `onChangeText`, `optional?`, `hint?`, `error?`, `placeholder?`, `multiline?`, `secret?` … | Label is the kit FieldLabel; `optional` shows " · Optional" inline (same as FieldLabel / RecordDateField); placeholder ink2 |
| `SwitchRow` | `label`, `description?`, `value`, `onChange` | Label + Toggle |
| `Toggle` | `value`, `onChange`, `label`, `disabled?` | THE switch: plum on / border-strong off track, white thumb on every platform (no RN-web teal). Never use a bare RN `Switch` |
| Legacy: `Screen`, `PageTitle`, `BigButton`, `BackButton`, `RecordRow`, `ConfirmDelete`, `Section`, `SectionHeading`, `StepProgress`, `LoadingScreen`, `ErrorScreen`, `SuccessNote`, `FutureDateMessage` | | Restyled for auth/onboarding/profile sub-screens. Don't use in new screens |

Shared screens/components already built:
- `components/atossa/LogBleedingSheet.tsx` — `visible`, `onClose`, `date?` (preset, e.g. DaySheet day),
  `onSaved?`. Status Started today / Still going / Ended / Spotting (none pre-selected for a new day;
  an already-logged day opens with its values), optional flow None–Heavy (no default), DatePill +
  DayChooser, Save disabled until a status is chosen, saves via `savePeriodDays`, success haptic + toast.
- `components/atossa/MainTabBar.tsx` — Today (sun) · Timeline (list) · For my doctor (file-text). Every tab press lands on the
  tab's root with ONE mechanism (N2): if the tab's stack isn't at its `index` root, the bar `preventDefault`s the `tabPress`
  (so the native stack's own pop-to-top doesn't also fire) and RESETs the stack; otherwise it leaves the stack alone.
- `components/ui/Icon.tsx` — Lucide set incl. mic, square, pen-line, droplet, calendar, calendar-days,
  pill, plus, x, check, check-circle, chevron-left/right/down/up, file-text, share-2, printer, monitor,
  lock, trash-2, sun, user, list, house, stethoscope, alert-circle.
- Old Calendar.tsx / DateChoice.tsx / RecordPage.tsx are deleted (code in git). `lib/records/summary.ts` is the doctor document model.

## Data (`types/records.ts`, `lib/records/format.ts`)
New fields are all optional; old saved records must keep rendering.
- `SymptomData`: `words` (Sam's verbatim words, '' for quick logs), `where`, `typical?`, `worst?`,
  legacy `score?` (= worst), `strengthText?` ('It varies' | 'Not sure'), `zones?`, `whereText?` (her own
  "where" words or Not sure / It varies, beyond the zones), `impacts?`, `when?`,
  `tried?` (capture prefills it from her own "Tried / I took / I used …" clause, verbatim), `source?` ('voice' | 'typed' |
  'quick'), `tag?` (starter chip, never displayed), **`createdAt?`** (ISO; when the note was written — capture + Rough day set
  it via `noteStamp(date)` ONLY for a note about today; back-dated notes have none), `duration`,
  `stopped: boolean | null`, `stoppedWords`.
  **When vs How long (lead decision, UX #4):** `when` = period timing (WHEN_OPTIONS chip, Not sure /
  It varies, or her own timing phrase); `duration` = "How long" (her words, e.g. "Since Tuesday").
  Two separate rows everywhere (labels "When" and "How long"); editing one never clears the other.
  Read them with `formatWhen(s)` / `formatDuration(s)` (they move a legacy "Since Tuesday" out of `when`). **Writers**: set `worst` AND `score` (same value) so
  older builds still read it; set `stopped = realImpacts.length > 0`. Rough day = `source: 'quick'`,
  `words: ''`.
- `PeriodDayData`: `status?` ('started' | 'ongoing' | 'ended' | 'spotting'), `isStart`, `isEnd`
  (keep in sync with status), `flow?` (no default), `note`. `MedicineData.dose?`.
- `format.ts`: `formatDay` ("Wed 24 Sep", year added when not this year), `formatShortDate`,
  `formatRelativeDay` (Today/Yesterday/…), `formatRecordDate` ("Around April 2019" / "Around 2019" /
  "Thu 24 Sep"), `formatRecordDateInline` ("around April 2019"), `formatRange` ("11–24 Sep 2026" with
  `'always'`, "27 Jul–2 Aug", collapses identical), `weekLabel` (This week / Last week / range),
  `worstOf`, `typicalOf`, `peakOf`, `formatStrength` ("6/10 usually · 9/10 at worst", "It varies",
  quick → "8/10", '' when nothing; non-breaking spaces inside each fact), `realImpacts`, `gotInTheWay`,
  `formatWhere` (zones + whereText), `formatWhen`, `formatDuration`, `splitTiming`, `isEscapeValue`,
  `labelEscape(field, v)` ("Where: it varies"), `firstLine`,
  `joinFacts`, `symptomFacts` (escape answers carry their field name: "Where: it varies · How strong:
  not sure"), **`noteCount(symptoms, {from?, to?})`**, `notesLabel`,
  `bleedingStatus`, `BLEEDING_STATUS_LABEL`, `bleedingFacts`,
  **`formatRecordRange(start, sp, end?, ep, openEnd?, year?)`** (N20 — same rule as the doctor page: two exact dates →
  compact "24 Jun–24 Sep 2026"; an approximate side or open end → spaced " – ": "Around June 2015 – still taking"),
  **`noteStamp(dateKey)`** (createdAt for a note saved now; `todayKey()`'s date + the clock, so preview gets a same-day
  time), **`formatTimeOfDay(iso)`** ("15:10"), **`noteWrittenAt(rec)`** (`data.createdAt`, else the record's createdAt when it
  falls on the note's own day, else '' — use it for "· 15:10" and same-day ordering).
- Spotting never carries a `flow`: LogBleedingSheet hides Flow for Spotting and clears it (N10).
- `lib/records/dates.ts`: `todayKey()` (the only "today"), `addDays`, `diffDays`, `mondayOf`,
  `parseKey`, `toKey`, `daysInMonth`, `firstWeekdayOffset`, `MONTH_NAMES`, `WEEKDAY_LETTERS`.
- Store `stores/recordsStore.ts`: `records.{symptom, period_day, appointment, medicine, history,
  doctor_note}`, `create/update/remove`, `savePeriodDays`, `deletePeriodDay`, `saveDoctorNote`,
  and preview-only `clearSampleData()` / `restoreSampleData()` (no-ops outside preview).

## Design-preview mode (reviewers; no login, no network)
`EXPO_PUBLIC_DESIGN_PREVIEW=1` (flag in `lib/preview/flag.ts`, `IS_PREVIEW`):
- `hooks/useAuth.ts` signs in as **Sam** immediately → `app/index.tsx` routes to `/(tabs)/today`.
- `recordsStore` uses an in-memory backend seeded from `lib/preview/seed.ts` (Sam's 8 symptom notes
  11–24 Sep 2026, 3 periods Jun–Aug, 4 appointments, 3 medicines, 5 history items — ported from
  the Lovable `initial*` arrays). create/update/remove work locally; reload resets.
- `todayKey()` returns **2026-09-24** in preview.
- Profile agent: show a "Clear sample data" text button at the very bottom of Profile only when
  `IS_PREVIEW` (and "Restore sample data" after clearing).
- Never set this env var in EAS / production.

Run the web preview (Chrome, phone width via DevTools device toolbar at 390×844 / 320):
```
npm run preview:web          # = EXPO_PUBLIC_DESIGN_PREVIEW=1 expo start --web --port 8081
```
Web guards: secure-store → localStorage on web (`lib/api.ts`), Google sign-in stub on web,
notifications skipped on web, speech recognition reports unsupported on web
(`lib/transcription.ts isVoiceCaptureSupported()` is false on web) → capture must show
"Voice isn't available here, so type instead. Your words are saved the same way."

Verify: `npx tsc --noEmit`; `npx expo export --platform ios --output-dir /tmp/x && rm -rf /tmp/x`;
web preview. Never open the iOS Simulator.

## File ownership (parallel agents — stay in your lane; ask before editing shared files)
| Phase | Owns |
|---|---|
| 1 Today + capture | `app/(tabs)/today/**`, `components/atossa/capture/**` (capture sheet, MicButton, Waveform, follow-ups, BodyZonePicker, NotedCard, RoughDay, AppointmentCard…) |
| 2 Timeline | `app/(tabs)/timeline/**`, `components/atossa/timeline/**` (EntryCard, MonthCalendar, DaySheet, entry detail) |
| 3 Profile + Records | `app/(tabs)/profile/**`, `components/atossa/records/**` |
| 4 For my doctor | `app/(tabs)/doctor/**`, `components/atossa/doctor/**`, `lib/records/summary.ts` |
| Shared (Phase 0 owner; additive changes only, note them in PORT_PLAN Status) | `constants/atossaUI.ts`, `components/atossa/kit*.tsx`, `components/atossa/kit-parts/**`, `components/ui/Icon.tsx`, `components/atossa/LogBleedingSheet.tsx`, `components/atossa/MainTabBar.tsx`, `lib/records/format.ts`, `lib/records/dates.ts`, `types/records.ts`, `stores/recordsStore.ts`, `lib/preview/**` |

Cross-tab navigation: entry details are owned by Timeline (`/(tabs)/timeline/...`); records
(medicine/appointment/history) by Profile (`/(tabs)/profile/records/...`). Pass a `from` param so
the BackChevron names the screen it came from.

## Route + shared-contract map (fixed — all Phase 1–4 agents link to these)
- Capture sheet: `lib/captureStore.ts` → `openCapture({date?, tag?, mode?, startRecording?})`. The sheet
  component (`components/atossa/capture/CaptureSheet.tsx`, Phase 1) is mounted ONCE in
  `app/(tabs)/_layout.tsx` (Phase 1 adds that one line). Everyone else just calls `openCapture`.
- Answer lists: `lib/records/fields.ts` (BODY_ZONES + BODY_ZONE_LABELS (chip label "Bottom / when opening
  bowels", stored value stays "Bottom"), WHEN_OPTIONS, IMPACT_OPTIONS, ESCAPE_ANSWERS, STARTER_CHIPS).
- Symptom editors shared by the noted card and entry detail: Phase 1 builds
  `components/atossa/capture/StrengthEditor.tsx` (Usually + At worst SeverityRows, It varies / Not sure)
  and `components/atossa/capture/ZoneEditor.tsx` (multi-select BODY_ZONES; pass `text` + `onTextChange` to
  also offer "Somewhere else" free text and Not sure / It varies — saved to `whereText`; choosing an
  escape clears the zones via `onChange([])`). Phase 2 imports them;
  until they exist Phase 2 may build against the kit directly and switch when they land.
- Routes:
  - `/(tabs)/today`
  - `/(tabs)/timeline` (List · Month)
  - `/(tabs)/timeline/entry/[id]?from=<Label>` — symptom entry detail (Phase 2)
  - `/(tabs)/timeline/bleeding/[date]?from=<Label>` — bleeding day detail (Phase 2)
  - `/(tabs)/timeline/record/[kind]/[id]?from=Timeline` — appointment/medicine/history detail opened
    from Timeline. Phase 3 builds the screen component `components/atossa/records/RecordDetail.tsx`
    AND this thin route file, so back returns to Timeline.
  - `/(tabs)/profile` · `/(tabs)/profile/records/[kind]` (kind = medicines | appointments | history) ·
    `/(tabs)/profile/records/[kind]/[id]` (id or `new`; back label = the list name)
  - `/(tabs)/doctor` · `/(tabs)/doctor/show` (Show on screen)
  - Today's latest-note card → `/(tabs)/timeline/entry/[id]?from=Today`; appointment card
    "Preview summary" → `/(tabs)/doctor`.
- `from` param = the visible title of the screen you came from; BackChevron shows it and `router.back()`
  returns there (fallback: navigate to that tab's root if there is no history).

## Additions (design-redesign, 2026-10-27)
- **Appointment card on the Timeline list:** one line on a `plumTint` card ("Specialist clinic · Thu 24 Sep", date kept together with non-breaking spaces), calendar glyph, no headline. Notes stay white cards, so an appointment never reads as one more note.
- **Week header summary:** "3 notes · worst 9/10" (caption, right of the hairline). Worst only when a note gave a number.
- **Text link rows ("See your patterns", "See the patterns behind this"):** `Button variant="text" small`, wrapped with `marginLeft: -space.xs` so the label lines up with the card edge. They open Timeline on Patterns (`useTimelineSession.setMode('patterns')`).
- **My period card (Today):** white card, headline "My period"; states empty (Choose the day + "I'm not sure" = 14-day snooze), picking (DayChooser + Save), filled ("Last period started Fri 18 Sep 2026", Log a new start, See it on the Month view). No prediction, no cycle day, no phase.
- **Welcome illustration:** the brand waveform at 48 pt resting on a 148 pt white pill outlined in plum (a voice becoming a line of text). Hidden on phones under 700 pt high.
- **Hero for an appointment more than 60 days away:** the date, not a week count (numeral = day of month, line = "April 2027 · your appointment"; 320 chip "Appointment on 14 April").
- **Onboarding is 3 steps** (name, basics, reminders); `ONBOARDING_STEPS = 3`.

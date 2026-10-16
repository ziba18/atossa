# Local build: review 3 (final verification)

Reviewer: senior product + visual designer. Date: 2026-10-02.
Build: `mvp-symptom-capture` working tree, web preview http://localhost:8081 (design-preview, Sam, today = Thu 24 Sep 2026).
Judged against: `local_review2.md` (N1–N22, round-2 partials), `review_brief.md` hard rules, `design/KIT.md`.

**Test conditions / limits.** Only the pre-existing Atossa tab was usable, and Chrome reported it as `document.visibilityState = hidden` throughout. Hidden tabs pause rAF, smooth scrolling and ResizeObserver, so:
- animated `scrollTo` / `scrollToEnd` checks were unreliable (marked untested where they matter);
- the 320 px iframe check of SeverityRow ran before `onLayout`, so the 44 pt widening could only be verified in code.
Taps were real clicks where coordinates were reliable; elsewhere RN-web pointer events were dispatched on the element (same responder path). Share PDF / Print were not fired. Console: no errors or warnings during the whole session (the round-2 POP_TO_TOP warning is gone).

---

## 1. Verification table

**Totals: 26 Pass · 0 Partial · 0 Fail · 1 Pass-in-code (live check blocked) · Friends pending.**

### N1–N22

| # | Result | Evidence |
|---|---|---|
| N1 dead tap after Log bleeding Save | **Pass** | From Today "My period": Save, then a chip tap in the same batch (< 100 ms), and the capture sheet opened. From the DaySheet: Log bleeding → Spotting → Save, then an immediate tap on day 17, and the DaySheet for Thu 17 Sep opened. The root cause (toast layer `box-none` inline) is fixed in `kit-parts/toast.tsx`. |
| N2 re-tap active tab on a detail | **Pass** | Period run screen → tap Timeline, which lands on `/timeline` with the list. The console is clean, with no POP_TO_TOP and no LogBox. |
| N3 doctor preview thumbnail | **Pass** | The card is 560 × 422 (capped), with no inner scroller (only the 3 page scrollers exist). It has a bottom fade and the caption "About 2 pages · tap to read it". Tapping it opens the "Your summary" reader. Sections now follow straight after. |
| N4 spotting vs bleeding on the GP page | **Pass** | Spotting on 22 and 24 Sep is drawn with a dashed clay underline. The key reads "▬ = bleeding logged. ┄ = spotting logged." The caption reads "…none of those were bleeding days. Spotting logged on 2 days." Periods logged ends "Spotting logged: 22 Sep 2026, 24 Sep 2026". |
| N5 future appointment | **Pass** | Added "GP surgery, Dr Lee", Fri 9 Oct. The document shows Appointments › **Coming up** › "Fri 9 Oct 2026 · GP surgery, Dr Lee · What it's for: Talk about the pain", and the rest sit under **Earlier**. |
| N6 newest note quoted | **Pass** | The new typed note "Sharp cramps low on the left…" is the first quote, above the 15:10 seed note. |
| N7 severity line | **Pass** | The pill reads "7/10 at worst" with the words inside it, followed by "Lower tummy left · 4/10 usually" on the same line. Today's latest-note card uses the same SeverityTag. |
| N8 period run | **Pass** | One grouped card with a single clay edge and rows "Fri 24 Jul / Period started · Medium", with hairlines and chevrons. |
| N9 inline editor below the fold | **Pass** | Tried (the last row) in the noted card scrolled up so that the field and Done were both visible, with a hairline under the sticky header. How long in the entry detail opened fully in view. |
| N10 spotting keeps the flow | **Pass** | LogBleedingSheet: Started + Medium → Spotting hides Flow, and the result saved as "Spotting" only. BleedingDetail (22 Aug, Heavy) → Spotting hides Flow as well. |
| N11 bleeding card inset | **Pass** | The period card text starts at the same x (502) as the symptom cards. |
| N12 time on new notes | **Pass** | The typed note shows "Thu 24 Sep · 09:59" and the Rough-day quick log shows "Thu 24 Sep · 10:04". |
| N13 period grouped by start week | **Pass** | "24–29 Jul" sits under "20–26 Jul", and "21–26 Aug" under "17–23 Aug". |
| N14 Tried prefill | **Pass** | "…Tried a hot water bottle" prefilled Tried verbatim. |
| N15 Show on screen top bar | **Pass** | The bar is white with a hairline once scrolled, so content no longer runs under Done. The meta still carries the current year, but it no longer leaves an orphan. |
| N16 heat-strip details | **Pass** | The cells have gaps (8 and 9 on 23–24 Sep don't touch). Underlines sit under their own row. The reader strip uses about 85% of the width. |
| N17 records lists grouped | **Pass** | Appointments is one inset-grouped card. |
| N18 Record detail Save | **Pass** | `aria-disabled=true` with no icon until edited. After an edit it saves with the toast "Appointment saved." |
| N19 doctor empty state | **Pass** | After clearing, only "Your summary" shows: "Nothing to share yet…" plus Add a note. Share, Print and Show are disabled on a sunken background. |
| N20 range punctuation | **Pass** | "Around June 2015 – around June 2016", "Around June 2015 – still taking", "24 Jun–24 Sep 2026". |
| N21 ConfirmCard hierarchy | **Pass** | A white card with an error hairline and one row: a red outline "Delete" button plus a plum text "Cancel". This holds for both the entry and the record. |
| N22 appointment-day card | **Pass** | Today shows "Appointment today · Specialist clinic · Today · 9 notes ready". |

### Round-2 partials

| # | Result | Evidence |
|---|---|---|
| UX #5 first tap after closing a sheet | **Pass** | See N1. Both paths work, and X, capture save and delete all return taps at once. |
| UX #20 a11y / 320 hit | **Pass in code, not live-tested at 320** | The section toggles are `input role=switch` (checked state native). The SeverityRow Pressable widens to `cell + 2·slop` with negative margins (`kit-parts/severity.tsx:80`). The 320 iframe measured the pre-layout fallback (40 px) because ResizeObserver is paused in the hidden tab. **Re-check on a device / visible tab.** |
| UX #27 consistency | **Pass** | New notes have times, the title is "Note", and Delete / Cancel are the same everywhere. |
| V11 card fact line | **Pass** | See N7. Weekly group headers are present. |
| UX #30 toast covers last control | **Pass (layout)** | ScreenLarge keeps 80 pt of clearance, and Profile's "Clear / Restore sample data" ends about 95 px above the tab bar. |

### The four specific checks from the brief
- **Taps right after saving in Log bleeding:** pass on both paths.
- **Re-tapping the active tab on a detail:** no error.
- **Doctor preview:** a fixed thumbnail.
- **GP document:** spotting is separate, upcoming appointments sit under "Coming up", and the newest note is quoted.

**UX #1 Friends: pending the user's decision.** Profile still reads "Share only your cycle phase with people you invite".

---

## 2. Regression walk (core loop)

All of these steps worked:
- **Capture:** Today → Type instead → typed note → Continue → four follow-ups (each opens at the top, with "1–4 of up to 4").
- **Noted card:** When changed to "Only around my period" kept How long "Since Tuesday" (and the reverse in the entry detail: How long → "About a week" kept When).
- **Save:** "Looks right, save" → toast "Saved. 9 notes ready for your GP."
- **Timeline:** the List shows the new card with time and pill. Month shows the spotting hatch on 22 and 24 with greyed future days. The DaySheet for 17 Sep shows a "15:10" card plus Add a note and Log bleeding.
- **Entry detail:** edit (How long), then delete → ConfirmCard → "Note deleted." and back on the list.
- **Profile records:** add an appointment (future date shows only What it's for / Anything else), edit it (Save enables only when dirty), and delete it from Timeline → "Appointment deleted."
- **Clear sample data:** every empty state is calm. Profile shows "None", Timeline shows an EmptyState with the + hidden, For my doctor shows the empty card with disabled actions, and Today shows the add-appointment prompt. A Rough-day quick log in the empty state saved with a time.
- **Restore sample data:** it restores, and the Clear button returns.
- **For my doctor:** the agenda field, the range chips with count, the thumbnail opening the reader, Sections toggles, and Show on screen (large type, Done pill, hairline bar).

**Regressions: none found.** **Hard rules:** no breaches.
- No condition names, likelihoods, causes or treatments in system copy. "Fibroids" appears only inside Sam's "I was told" history.
- No predictions. Month future days are greyed only.
- No threshold labels. "Heavy" appears only as her chosen flow value.
- No causation, streaks, praise or emoji.
- The safety line is static.

**Untested here:** whether the record-detail ConfirmCard auto-scrolls into view. It uses animated `scrollToEnd`, which does not run in a hidden tab (a manual smooth `scrollTo` also stayed at 0). It passed in round 2.

---

## 3. Remaining issues (prioritised, with exact fixes)

1. **Decision · Friends (UX #1).** This is the only hard-rule exposure left. Either remove the row and route, or reword it and limit it to logged facts. Pending the user.
2. **Medium · Bleeding detail › the period-day note is invisible but printed.**
   - **Problem:** 22 Aug carries the note "Had to change every hour", and the GP document quotes it. However, `timeline/BleedingDetail.tsx` (and `LogBleedingSheet`) offer no note field, so Sam can't see, edit or delete words that go to her doctor.
   - **Fix:** add an optional "Anything else · Optional" `TextField` bound to `PeriodDayData.note` in both. Show the note in BleedingDetail as a `Quote`, and on the period-run row as a caption.
3. **Low–Medium · Toast on wide screens / iPad (`supportsTablet: true`).**
   - **Problem:** `kit-parts/toast.tsx` sets `left: 20, right: 20, maxWidth: 560`. With absolute left/right, `alignSelf` is ignored, so on a wide window the toast is pinned to the far-left edge, outside the content column (seen at 1440 px).
   - **Fix:** wrap the toast in an absolute full-width row with `alignItems: 'center'` and give the toast `width: '100%', maxWidth: 560`. Or compute `left = max(20, (screenW − 600)/2 + 20)`.
4. **Low · "Latest" ordering differs between surfaces (most visible in preview).**
   - **Problem:** Today's "Your latest note" picked the 15:10 seed note, while Timeline and the GP document put the 09:59 new note first. Each surface sorts differently (time of day vs creation).
   - **Fix:** use one comparator, date → `noteWrittenAt` → record `createdAt`, in `TodayCards` LatestNoteCard, `timeline/feed.ts` and `summary.ts pickQuotes`. Put it in `format.ts` as `compareNotesNewestFirst`.
5. **Low · GP document › today's appointment is listed under "Earlier".**
   - **Problem:** the Specialist clinic (24 Sep = today, the visit being prepared for) is listed under "Earlier", and the date formats differ: "Fri 9 Oct 2026" vs "24 Sep 2026".
   - **Fix:** in `summary.ts`, put appointments with `date >= todayKey()` under "Coming up" (label today's "Today"). Use `formatDay` for both groups.
6. **Low · Show on screen / reader › a range breaks after its en dash.**
   - **Problem:** "at worst 6–/9/10" wraps after the dash.
   - **Fix:** join range values with U+2011 / U+2060 (word joiner) around the en dash in `formatStrength` / the doc fact line.
7. **Low · Tried row reads twice.**
   - **Problem:** the row shows label "Tried" plus the quote "Tried a hot water bottle".
   - **Fix:** keep the words verbatim (rule). Optionally label the row "What I tried", as the document does ("What I've tried").

---

## 4. Scores and verdict

| | R1 | R2 | **R3** |
|---|---|---|---|
| UX | 7 | 8 | **9 / 10** |
| Visual | 7 | 8 | **9 / 10** |

**Verdict: the design is App-Store ready on the web preview, apart from one item: the Friends decision.**
- The core loop (capture → noted card → Timeline → For my doctor) is calm, consistent and fast, with no dead taps or navigation errors left.
- The GP document now reports faithfully: spotting is separate, future visits sit under Coming up, and the newest words are quoted.
- Item 2 (period-day note) should be fixed before release, because it puts words in front of a GP that Sam can't see in the app.

## 5. Must be checked on a real iPhone (Expo Go SDK 57 / TestFlight)

- **Voice capture:** permission prompts, live transcript, the failure copy, and stop/start haptics.
- **Haptics:** selection on chips and the severity row, and success on save / PDF.
- **Keyboard:** the capture text field, the inline editors (N9) with the keyboard up, and the sheet's keyboard avoidance.
- **Sheets:** swipe-to-dismiss, the grabber, and Android back (if shipped).
- **Share PDF:** the share sheet, and the real PDF render (`PAGE_TYPE` sizes, the strip SVG, dashed spotting underlines in B/W print), plus AirPrint.
- **N1 on native:** the first tap after a Log bleeding Save (the root cause was web-specific, but confirm).
- **SeverityRow at 320 / small phones:** 44 pt targets (UX #20), plus Dynamic Type at the largest sizes (chips cap at 1.6×).
- **VoiceOver:** radio "7 out of 10", switch states, and the SeverityTag label "9 out of 10 at worst".
- **ConfirmCard auto-scroll:** on long record forms (animated `scrollToEnd`).
- **iPad layout:** the toast position (item 3) and the content max-width.

# Local build: UX review 1 (React Native / Expo web preview)

Reviewer: senior product designer (iOS health). Date: 2026-10-01.
Build: `mvp-symptom-capture` working tree, served by `npm run preview:web` at http://localhost:8081 (design-preview mode, Sam, "today" = Thu 24 Sep 2026).
Spec: "Recommended direction" in `reports/Atossa app design research.md` (lines 47–200), `design/KIT.md`, and the hard rules in `review_brief.md`.
Screenshots: `local_review1_screens/` (110 files, `NN_description.jpg`).

**How I tested.** I used the app as Sam in my own Chrome tab. Chrome would not go narrower than 500 CSS px, so screenshots are 500×594. For 320 and 390 px I loaded the app in same-origin iframes and measured it with JS (`scrollWidth`, `getBoundingClientRect`, computed styles). I went through every flow in the brief:
- **Capture:** the typed sample note, a vague note, all four starter chips, Rough day, Not sure / It varies / Skip, the "something else" field, "That's all for now", an edit on every noted-card row, the date pill, Fix something, Add more, save and toast, and closing with unsaved text.
- **Timeline:** List with every filter and every card type, entry, bleeding and record details, edits and deletes. Month with prev/next, the day sheet, adding a note for a day, logging bleeding and spotting.
- **Profile records:** add, edit and delete for medicines, appointments and history.
- **Sample data:** Clear and Restore, and every empty state.
- **For my doctor:** every control except actually firing Share and Print.

The console showed **no errors or warnings** on any screen, only the Expo "Running application" log.

---

## 1. Overall score: **7 / 10**

**Verdict: close, but not yet App-Store-featured quality.** This is a big step up from the Lovable prototype (Stage 1: 5/10, Stage 2a: 6/10). The visual system is now consistent and calm:
- warm canvas, hairline white cards at radius 20 and 44 px pill chips;
- the serif used only for Sam's words, the hero and the summary title;
- clay used only for bleeding, and severity always shown as the plum ramp with the digit.

The core loop works and is quick. A typed note becomes follow-ups and then "Here's what I noted", and saving shows the toast "Saved. 10 notes ready for your GP." Follow-ups really are gap-based now. The sample note "sharp pain low down on the left since Tuesday, had to leave work" pre-filled Where, When and Got in the way of, so the app asked only about strength. I did not find one Stage 1 or Stage 2a bug that has come back (see §6).

What stops it being featured quality is a set of **trust and polish failures in the places that matter most**:
- The GP summary silently drops all but the 5 newest notes.
- The "full size" document preview is unreadable (6–8.5 px type).
- Editing "When" silently erases a duration Sam gave.
- On web, the first tap after any sheet closes is swallowed (reproduced 6 times).
- The Timeline tab can reopen a stale "This note isn't here any more" screen.
- One inherited screen (Friends) breaks the hard "no prediction" rule.

**Hard product rules.** There is **one Critical breach**: Profile › Friends computes and shares a **cycle phase** ("Luteal phase · day 22") from an average cycle length. That is a prediction (see fix #1). I scanned all rendered text for condition names, diagnos/likely/probab/predict/forecast/fertile/ovulat, streak, irregular/abnormal, severe/moderate/mild, caused by/linked to/trigger/risk, missed, average and praise. **The only hit was "phase" (Friends).** "Fibroids" appears only in Sam's own "I was told" entries, which is acceptable. The safety line is static, and it appears in Profile and at the foot of For my doctor.

---

## 2. Per screen / state

### Today: **8/10** (01–05, 38, 96, 98, 106)
**What works**
- One clear hero with the serif prompt, a 72 px plum mic, "Type instead" (44 px) and four 44 px starter chips.
- Rough day is a non-scrolling two-row SeverityRow (70×48 cells at 500 px wide) with "0 = none" and "10 = worst". The selected state is plum tint with a plum ring.
- Saving a Rough day writes **"Rough day · 7/10" in Inter, not a fake quote**.
- The appointment card ("Specialist clinic · Thu 24 Sep · 9 notes ready", then "Preview summary") updates its count immediately.
- The latest-note card shows Sam's words in serif and the tidy facts in ink-2.
- With no data, "Got an appointment coming up? Add it…" opens a short sheet over Today (who/where plus date, no past days). That is exactly what the spec asks for.
- The page never scrolls sideways at 320, 390 or 500.

**Problems**
- The "My period", "Something new" and "Just a quick note" chips sometimes need two taps. The first tap after a sheet closes is lost (fix #5).
- The Rough day **Save** button looks almost the same enabled and disabled. Both are white outline pills; only the text and border colour change.
- "GP surgery · Fri 9 Oct · **0 notes ready**" is awkward empty copy.
- The chip row is cut off at the right edge ("Just a quic…") with no fade.
- At 320 the severity cells are **40 px wide** (hit area), under the 44 minimum. KIT says ≥ 46.

### Capture, step 1 (speak/type): **8/10** (06–08, 24, 30, 32)
**What works**
- On web, tapping **Speak** keeps Type selected and shows "Voice isn't available here, so type instead. Your words are saved the same way." That is the correct fallback.
- The text box is left-aligned and autofocused.
- Continue is disabled (sunken + ink-2) until there is text.
- Starter chips no longer pre-type their label and no longer change the sheet title.
- "Just a quick note" skips the questions and goes straight to the noted card with "+ Add" chips.
- "Note for Tue 22 Sep" shows when the sheet is opened from a day.

**Problems**
- **Add more** puts the caret at position 0 of the existing text (`selectionStart 0/82`), so new typing goes in front of Sam's words.
- The first tap on Continue was ignored twice (fix #5).
- The textarea shows the browser's blue focus ring (web only, but it is off-palette).

### Capture, step 2 (follow-ups): **7/10** (09, 20–23, 26–28)
**What works**
- The questions are gap-based.
- The progress label reads "2 of up to 4", never a percentage.
- "Why I'm asking: GPs usually ask this…" sits directly under the question.
- Not sure, It varies and Skip are ghost chips and advance the flow. "That's all for now" saves straight away with a toast.
- Usually and At worst are two separate SeverityRows.
- Where and Got in the way of are multi-select with Continue.
- On a back-dated note the question says "that day", not "today".
- Skip leaves the field empty. I checked this in the entry detail: "When · + Add when".

**Problems**
- **The scroll position is kept between questions.** After an escape chip or Continue, the next question opens scrolled by 87 px, so its heading and "Why I'm asking" are hidden (20, 21, 27).
- "Type or say something else" sits *below* Continue. Typing there while a chip is still selected ("At other times too") is ambiguous: the typed text silently replaces the chip.
- The first attempt shows "A little more detail" with no count. After Fix something it shows "1 of up to 4". This is consistent but noticeable.

### Capture, step 3 ("Here's what I noted"): **7/10** (10–19, 33, 34)
**What works**
- Sam's words appear in quotes and serif; everything else is Inter ink-2.
- The editors are the right ones:
  - strength: two SeverityRows plus It varies / Not sure;
  - Where: zone chips (multi);
  - Got in the way of: chips (multi);
  - words: a textarea with Done.
- The date pill opens an inline DayChooser limited to 14 days back, with no future days. "Yesterday ▾" then flows through to the questions ("that day").
- Actions are "Looks right, save" (primary), "Fix something" and "Add more".

**Problems**
- **Editing When destroys data.** The note's "Since Tuesday" (a duration) shows as a custom value. Tapping the "At other times too" chip **silently replaces it** (15, 16). The When field mixes two clinical questions, *timing relative to the period* and *how long it's been going on*.
- **No "Tried" row** in the capture noted card, although the spec lists it and the entry detail has it.
- **The Where editor has no free text and no Not sure.** "bad headache" or "rash on my arms" cannot be given a place, because only the 7 pelvic zones are offered (34).
- **Fix something** re-runs all 4 questions, starting mid-scroll (20). Every row is already tappable, so this adds a long detour.
- The ghost chips (It varies / Not sure) use a hairline border (1.38:1) and ink-2 text. They read as disabled.

### Save + toast: **9/10** (04, 25, 29, 37, 54, 57, 73)
- The toast sits at the bottom above the tab bar in the saved tint, auto-dismisses after about 3 s and is replaced by the next one. The copy is right: "Saved. 10 notes ready for your GP.", "Saved. Bleeding logged for Tue 22 Sep.", "Note deleted.", "Medicine saved."
- Minor: on short pages the toast covers the last control. For example it covered "Restore sample data" (94).

### My period → Log bleeding: **8/10** (35–37, 62, 63)
- The sheet opens over Today. Started today / Still going / Ended / Spotting have **no default**, flow is optional, and Save is disabled until a status is picked.
- The date pill is preset when the sheet is opened from a day. Reopening a logged day pre-fills its values.
- Spotting is now its own status and draws a hatch.
- Minor: the success toast says "Bleeding logged" for spotting too, and there is no "Remove" for a day logged by mistake here (only in the bleeding detail).

### Timeline, List: **8/10** (43–48, 57, 100, 101, 103)
**What works**
- The type glyph sits inline with the date.
- Sam's words are serif and clamped to 2 lines (and still 2 lines at 320).
- Bleeding cards have a visible **4 px clay edge**.
- Approximate dates stay approximate ("Around April 2019"). Week headers across months are correct ("27 Jul–2 Aug"), and older entries are grouped by month ("June 2015").
- Filters keep their choice when you return from a detail.
- Each filter has a calm empty line ("No bleeding logged yet.").

**Problems**
- **Escape answers lose their labels on cards.** "feeling rubbish today" shows "It varies · Not sure", and nobody can tell that means Where = It varies and Strength = Not sure. The same string reaches the doctor document's fact line.
- Every period day is its own card, so a 6-day period is 6 cards (about 18 cards for 3 periods). It reads as noise next to the notes.
- The selected filter chip is not scrolled into view ("Medicines" stays clipped).
- New notes show no time, while seed notes show "· 15:10". This is inconsistent.
- The bleeding card's content is inset 4 px more than other cards because of the edge.

### Timeline, Month and DaySheet: **8/10** (58–66, 102, 110)
**What works**
- Clay fill for bleeding, a plum dot for notes (also on clay days) and a today ring; no predictions.
- The day aria-labels are excellent ("Thu 24 Sep 2026, today, bleeding logged, 3 notes").
- The descriptive line ("Bleeding logged on 1 day this month. Spotting logged on 1 day.") is hidden for empty months.
- The DaySheet is positioned correctly, and "Add a note for this day" presets the capture date.

**Problems**
- The spotting hatch runs through the numeral ("22" is hard to read, see 110).
- Future days look exactly like past days but do nothing when tapped.
- Every card in the DaySheet repeats "Thu 24 Sep" under a "Thu 24 Sep" title.
- "Log bleeding" on a day that is already logged should read "Edit bleeding".
- Appointments (for example 8 Oct) are not marked on the calendar.

### Entry, bleeding and record details: **7/10** (39–42, 49–56, 74–80)
**What works**
- The symptom entry detail now uses NotedRows with the same editors as capture, plus Tried, with Cancel and Done per row.
- Bleeding detail: Save is disabled until something changes.
- Record forms use a custom en-GB picker (Exact day / Around → year chips + month chips) with **no defaults**. Save explains what is missing ("Add a name and when you started to save.").
- Back labels are correct everywhere I checked: ‹ Today, ‹ Timeline, ‹ Medicines, ‹ Appointments, ‹ Health history, ‹ Profile.

**Problems**
- **Delete confirm cards open half hidden behind the tab bar.** Only the title and message are visible, and Delete / Cancel need a manual scroll (56, 75).
- **The year chips don't scroll to the selected year.** Cortisone "2019" opens showing 2026–2022 (50).
- **The add-appointment form (Profile) is retrospective-only**: "Why I went", "I was told", "Tests or prescriptions", "What happens next". That doesn't fit a *future* appointment, and Today's sheet already does this better (77).
- Choosing Around inserts a summary line ("Around 2023") above the chips. The layout jumps about 32 px, and my next tap landed on the wrong control (80).
- Patterns are inconsistent:
  - Confirm buttons say "Cancel" in one card and "Keep it" in another.
  - "Delete entry" is left-aligned text in one place and centred with a trash icon in another.
  - Edits auto-save per row in the symptom detail but use an explicit Save in the bleeding and record details.
- The page title duplicates the date pill ("Thu 24 Sep" / "Today ▾").

### Profile and Records: **6/10** (67–80, 95, 105, 109)
**What works**
- Records show "3 saved" / "None yet" with chevrons. Lists are their own screens with an Add button and useful date lines.
- The safety line and Clear / Restore sample data are present.

**Problems**
- **Friends shares a computed cycle phase** (Critical, fix #1). In preview it is also stuck on "Loading…" forever.
- **Health history rows lead with the category** ("Test or scan", "Told to me by a doctor"), and the "I was told" text is not shown. Two "Test or scan · Around …" rows can only be told apart by date, and the new "MRI was clear" item shows no content at all (78).
- Reminders: the off-state Switch track is hairline `#E2DAD0` on white (1.38:1), so "off" is nearly invisible (109).
- "Restore sample data" disappears once any record is added after clearing (preview only, 105).

### For my doctor: **6.5/10** (81–93, 104, 107)
**What works**
- The structure matches the spec: appointment card, visit-type chips, a Last visit / 3 months / 6 months segmented control with "24 Mar–24 Sep 2026 · 11 notes", an agenda field, a live white A4 preview, section switches, the safety line, and Share PDF / Print / Show on screen.
- The preview updates live with visit type, agenda, range and section switches.
- The **sensitive "Sex & intimacy" section** appears only when there is data. It is locked and off by default, and when on it shows only "Sex · 1 day". Sex is never leaked into "What it got in the way of".
- The heat-strip uses the severity ramp with digits, a clay-tint band and a clay underline for bleeding. Its caption is descriptive ("Notes were logged on 8 of 93 days; 1 of those was a bleeding day.").
- The footer reads "Patient-reported via Atossa · not clinically verified · … · 11 entries".
- **Data integrity is good.** A capture's values match exactly across the noted card, the Timeline card, the entry detail, Today's latest note and the document:
  - "Lower tummy left, Lower back · 5/10 usually · 8/10 at worst · mostly in the mornings";
  - "6/10 usually · 9/10 at worst";
  - Tried "Paracetamol, didn't help".

  Note counts agree everywhere: 12 → 11 after a delete on Today, the range line and the footer. Quick logs are kept out of "Symptoms in my words".

**Problems**
- **"Symptoms in my words" shows only the 5 newest notes**, with no "N more" line (`MAX_QUOTES = 5` in `lib/records/summary.ts`). In the default range 6 of Sam's 10 worded notes are silently missing. Appointments and history *do* say "1 earlier appointment saved in Atossa."
- **The "full size" preview is not full size.** Effective type is 6.2–8.5 px at a 500 px viewport, so smaller still at 390, and the web has no pinch-zoom (88, 89).
- **Empty state:** with 0 notes the page still shows a near-empty document and an enabled **Share PDF** (104).
- **Show on screen** keeps the tab bar and isn't a full-screen, hand-across-the-desk view (92).
- **The sticky share bar is about 136 px.** With the tab bar it covers about 40% of a 594 px viewport. At 320 "Show on screen" wraps onto two lines and its icon shrinks (107).
- **The section switches have teal thumbs** (`rgb(0,150,136)`, the RN-web default) on plum tracks. That is off-palette (90).
- "What I'd like from today" is the wrong copy when the appointment is "Next appointment · Fri 9 Oct".
- The agenda field is sunken with an ink-3 placeholder (4.26:1, which KIT itself flags).
- "Last visit" resolves to **1 Mar 2020–24 Sep 2026** (6.5 years) when the last visit was long ago. The heat-strip quietly shows only the last 93 days.
- "About 2 A4 pages", while the spec aims for one page.

### Empty states: **6/10** (94–104)
- Today, Records and Timeline filters are calm and correct.
- The Month view is blank with no message, which is acceptable.
- Timeline All with only a future appointment shows no "Nothing here yet…" line.
- For my doctor has no empty state (see above).

---

## 3. Fix list (for a React Native engineer)

> File paths come from the ownership table in `design/KIT.md` and from reading the code.

### Critical

1. **Critical · Profile › Friends.** `app/(tabs)/profile/friends.tsx` calls `computeCycleMath` with `average_cycle_length` and shows "{Phase} phase · day N" and "You're both in the … phase". That infers and shares a cycle phase, which is a prediction and breaks the hard rules. It also reads the legacy `/cycles` logs, not the `period_day` records.
   **Fix:** Remove the Friends row from `app/(tabs)/profile/index.tsx` and the route, or gate it behind a flag that is off. If it ever comes back, share only *logged* facts ("Period logged today"), never a phase or cycle day.

### High

2. **High · For my doctor › document.** `buildDoctorSummary` keeps the first `MAX_QUOTES = 5` worded notes, newest first, and drops the rest silently.
   **Fix:** In `lib/records/summary.ts`, add `more: "N more notes saved in Atossa."` (same pattern as appointments and history) and render it in `components/atossa/doctor/DocumentView.tsx`. Consider choosing quotes for coverage (highest worst score, then newest, at most 1 per day) rather than newest only. The footer's "11 entries" must stay accurate.

3. **High · For my doctor › full-size preview.** The "tap to see it full size" sheet renders the same scaled page (6–8.5 px text).
   **Fix:** In `components/atossa/doctor/DocumentPreview.tsx`, render `DocumentView` unscaled at the sheet width, so body text is at least 13 px, inside a vertical ScrollView. On native, wrap it in a `ScrollView` with `maximumZoomScale={3}` so pinch-zoom works. Keep the scaled card only for the inline thumbnail.

4. **High · Capture noted card and entry detail › When.** One `when` string holds both the period-timing chip and free text. Choosing a chip silently overwrites "Since Tuesday".
   **Fix:** Split the field into **When** (Only around my period / At other times too / All the time / Not sure / It varies) and **How long** (`duration`, free text, which already exists in `SymptomData`). Prefill `duration` from phrases like "since Tuesday" in `components/atossa/capture/infer.ts`. Show both rows in `NotedCard.tsx` and `components/atossa/timeline/EntryDetail.tsx`, and never let one chip clear the other value.

5. **High · Global › dead first tap after a sheet closes (web, reproduced 6×).** After any `Sheet` closes (Discard, Save, X, Escape), the next tap or scroll on the page is ignored. It happened on chips, a calendar day and the month chevron. It looks like a responder or focus lock left by the RN `Modal` on web.
   **Fix:** In `components/atossa/kit-parts/Sheet.tsx`, return focus and release the responder on dismiss (`onDismiss` → `Keyboard.dismiss()`, then blur `document.activeElement` on web), and unmount the Modal after the exit animation. Verify on an iOS device: if it happens there too, it is a blocker.

6. **High · Timeline tab › stale nested screen.** After a note opened from Timeline (or Today) is deleted or the data is cleared, tapping the **Timeline** tab reopens `/timeline/entry/<id>?from=Today`. It shows "This note isn't here any more" with "‹ Today", and re-tapping the tab does not pop to root.
   **Fix:** In `components/atossa/MainTabBar.tsx`, when the target tab is already focused, call `navigation.dispatch(StackActions.popToTop())` on that tab's stack. When switching tabs, use `router.navigate('/(tabs)/timeline')` with a reset, so the tab always lands on its root. Also make `EntryDetail` call `router.back()` automatically when the record no longer exists.

7. **High · For my doctor › empty state.** With 0 notes the page shows an empty document, "0 entries" and an enabled Share PDF.
   **Fix:** In `app/(tabs)/doctor/index.tsx`, when `noteCount(range) === 0` and nothing else is included, show `EmptyState` ("Nothing to share yet. Notes you add will appear here, in your words.") with a primary "Add a note" button (`openCapture()`), and disable Share PDF, Print and Show on screen.

### Medium

8. **Medium · Capture › follow-ups.** The ScrollView keeps its offset between questions, so the next question's heading is hidden.
   **Fix:** In `CaptureSheet.tsx`, keep a ref to the Sheet's ScrollView and call `scrollTo({ y: 0, animated: false })` whenever `stage` or `qIndex` changes. `Sheet` needs to expose `scrollRef`.

9. **Medium · Capture noted card › missing Tried.**
   **Fix:** Add a Tried `NotedRow` (quote style, "+ Add what you tried") to `NotedCard.tsx`, the same as `EntryDetail`.

10. **Medium · Capture noted card and entry detail › Where.** Only the 7 pelvic zones are offered, with no free text or Not sure.
    **Fix:** In `components/atossa/capture/ZoneEditor.tsx`, always show "Somewhere else" (a text input saved to `whereText`) plus Not sure / It varies ghost chips, as the follow-up already does.

11. **Medium · Capture › Fix something.** It replays all 4 questions.
    **Fix:** Make "Fix something" scroll to the card and open the first filled row's editor (or just say "Tap any row to change it"). Keep the follow-up replay only for Add more.

12. **Medium · Timeline cards and document › escape answers.** The fact line shows "It varies · Not sure" with no field names.
    **Fix:** In `symptomFacts` (`lib/records/format.ts`), add the field name for escape values: "Where: it varies · Strength: not sure". Use the same in `summary.ts`.

13. **Medium · Entry and record details › delete confirm.** The `ConfirmCard` opens below the fold, behind the tab bar.
    **Fix:** In `EntryDetail.tsx`, `BleedingDetail.tsx` and `RecordDetail.tsx`, pass `onLayout` and call `scrollRef.current?.scrollToEnd()` (or `scrollTo(y − 120)`), so the whole card including both buttons is visible.

14. **Medium · Record forms › year chips.** The selected year isn't scrolled into view.
    **Fix:** In `components/atossa/records/RecordDateField.tsx`, on mount and on change, `scrollTo` the horizontal year list so the selected chip is centred.

15. **Medium · Switches.** In `components/atossa/doctor/SectionToggles.tsx` the `Switch` has no thumb colour, so it shows RN-web teal. `SwitchRow` (`kit-parts/legacy.tsx`) uses `false: colors.hairline`, so the off track is invisible.
    **Fix:** Use `SwitchRow`, or pass `thumbColor={colors.surface}`, `activeThumbColor={colors.surface}` (web) and `trackColor={{ true: colors.plum, false: colors.borderStrong }}` everywhere.

16. **Medium · For my doctor › Show on screen.** The tab bar stays visible.
    **Fix:** Present `app/(tabs)/doctor/show.tsx` as a full-screen modal (`presentation: 'fullScreenModal'`, outside the tabs layout). Use a large close button and keep the screen awake.

17. **Medium · For my doctor › share bar.** The sticky bar plus the tab bar take about 40% of short screens, and at 320 "Show on screen" wraps.
    **Fix:** Use a single-row footer: Share PDF (primary, flex 1) plus two 48 px icon buttons (Print, Show on screen) with accessibility labels. Or make the bar non-sticky and place it after the preview.

18. **Medium · Profile › Add appointment.** The form shows retrospective fields for a future date.
    **Fix:** In `RecordDetail.tsx`, hide "I was told / Tests or prescriptions / What happens next" when the date is in the future. Show them, under "After the appointment", once the date has passed.

19. **Medium · Health history list.**
    **Fix:** In `components/atossa/records/RecordsList.tsx`, the row subtitle should show the first non-empty of told / done / result ("Test or scan · Around March 2023 · MRI was clear").

20. **Medium · Accessibility.** On web, `accessibilityState={{checked/selected}}` produces no `aria-checked` or `aria-selected` for SeverityRow radios, chips, filter radios or switches. At 320 the SeverityRow hit area is 40 px wide.
    **Fix:** Also pass `aria-checked` / `aria-selected` (RN 0.86 supports `aria-*` props) in `kit-parts/severity.tsx` and `controls.tsx`. Give each cell a `hitSlop` of at least 2, or reduce the gap, so the hit area is ≥ 44. Verify with VoiceOver on device.

21. **Medium · For my doctor › copy and range.**
    **Fix:**
    - Label the agenda "What I'd like from this appointment" unless the appointment is today.
    - Make the agenda input white with a border-strong outline, like the other text fields (the ink-3 placeholder on sunken fails contrast).
    - When "Last visit" spans more than 6 months, show "Since your last appointment (Mar 2020) · showing the last 6 months", and use 6 months as the range.

22. **Medium · Capture › Add more.**
    **Fix:** In `CaptureSheet.tsx`, after switching to the capture stage, set the selection to the end (`typeRef.current?.setSelection?.(len, len)`, or `selection={{start: len, end: len}}` once).

### Low

23. **Low · Rough day Save.** Enabled and disabled look alike.
    **Fix:** When a number is selected, make Save the primary (plum) button. While disabled, keep it sunken + ink-2.

24. **Low · Today appointment card.**
    **Fix:** "GP surgery · Fri 9 Oct · No notes yet" instead of "0 notes ready".

25. **Low · Month.**
    **Fix:**
    - Put a solid white disc behind the numeral on spotting days, so the hatch never crosses the digit.
    - Draw future days in ink-3 with no press state.
    - Rename the DaySheet "Log bleeding" to "Edit bleeding" when the day is logged.
    - Hide the per-card date inside a DaySheet.

26. **Low · Timeline list.**
    **Fix:**
    - Merge consecutive period days into one bleeding card ("Period · 21–26 Aug · Medium, Heavy") that opens a list of the days.
    - Scroll the selected filter chip into view.
    - Add a 24 px right-edge fade on chip scrollers, including the Today starter chips.

27. **Low · Consistency.**
    **Fix:**
    - Use one confirm vocabulary (Delete / Cancel).
    - Use one Delete-entry style (text button with trash icon, left-aligned).
    - Show the time on new notes as well, or on none.
    - Remove the duplicate date title in the entry detail (title "Note", date pill below).

28. **Low · Record date fields.**
    **Fix:** Reserve the space for the "Around 2023" summary line, so selecting a chip does not shift the layout.

29. **Low · Body zones.**
    **Fix:** Rename "Bottom" to "Bottom / when opening bowels" (spec wording).

30. **Low · Toast.**
    **Fix:** Add bottom content padding equal to the toast height while it is visible, or accept this as-is (it auto-dismisses after 3 s).

31. **Low · Preview only.**
    **Fix:**
    - Base "Restore sample data" on a "cleared" flag, not on `totalRecords > 0`.
    - Friends: show an error after a timeout instead of an endless "Loading…" (moot if #1 removes it).

---

## 4. Top 5 changes that would most raise perceived quality

1. **Make the GP document complete and readable (#2, #3, #7).** List the missing notes with a "N more" line, make the full-size view truly legible, and give the page a real empty state. The document is the product's promise.
2. **Never lose what Sam said (#4, #10, #9, #12).** Keep When and How long separate, allow any body area, capture Tried in the flow, and label escape answers. Trust is the brand.
3. **Fix the navigation glitches (#5, #6, #8).** Remove the swallowed first tap, the stale Timeline screen, and the follow-up that opens scrolled past its question. These make a calm app feel broken.
4. **Remove Friends cycle-phase sharing (#1).** It is the only hard-rule breach and it is reachable from Profile.
5. **Polish the doctor screen's chrome (#15, #16, #17, #21).** Use plum/white switches, a full-screen Show on screen, a slimmer share bar and the right agenda copy, so the screen matches the quality of the document.

---

## 5. Untested (web preview limits)

- Voice capture: the recording, waveform, timer and transcript stream. The web correctly falls back to typing.
- Haptics (selection, light, success).
- The real keyboard: keyboard avoidance in sheets, return-key behaviour, and the soft keyboard covering the "something else" field or Continue.
- The iOS share sheet, PDF generation, the printed or exported A4 layout, the footer on every page, B/W print legibility, and the Print dialog. I checked only the button state: Share PDF is enabled and Print and Show on screen are present.
- Swipe-down to dismiss sheets, the Android back button, iOS edge-swipe back.
- Dynamic Type at the largest sizes, VoiceOver order and labels on device, Reduce Motion.
- Real network: save-error InlineErrors, backend persistence, Friends API.
- Whether the "first tap swallowed after a sheet closes" bug (#5) also happens on iOS.
- Notification and reminder delivery.

## 6. Stage 1 and Stage 2a bugs: did any come back?

None came back. Each of the following was checked and is fixed:

| Old bug | Status now |
|---|---|
| Sheet X does nothing | X, Escape and scrim close; "Keep this note?" appears in-page |
| Pill radius on cards | Cards are radius 20 |
| 0–10 row overflows | Two rows; fits at 320 |
| Fake quotes ("Quick pain score", chip prefixes) | Gone |
| Default "No" answer | Gone |
| "It varies" dropped | Kept |
| Single-select zones | Multi-select |
| Toast at top / too narrow | Bottom, full width minus gutters |
| Missing clay edge | Present |
| Spotting not drawn / relabelled | Hatch drawn; Spotting is its own status |
| DaySheet off-screen | Positioned correctly |
| Dead taps on appointment / medicine cards | They open |
| Records nested under Profile, stray "0" counts | Own screens; counts correct |
| Native mm/dd selects, pre-selected defaults | Custom en-GB picker; no defaults |
| Made-up exact days for approximate dates | Approximate dates stay approximate |
| Cross-month week headers | Correct ("27 Jul–2 Aug") |
| Profile unreachable from Timeline | Reachable |
| No Clear sample data | Present |
| "Bleeding logged on 0 days" | Hidden |
| Wrong back labels | Correct |

Two items are only *partly* fixed:
- The selected filter chip is still not scrolled into view.
- SeverityRow hit width is 40 px at 320, where 44 is required.

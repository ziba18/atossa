# Stage 1 redesign: UX review

Reviewer: senior product designer (health / iOS). Date: 2026-09-29.
Prototype: https://id-preview--b0b66a36-69d0-4fd8-93eb-5a9f0a3a2ccd.lovable.app
Spec: "Recommended direction" in `reports/Atossa app design research.md`.
Screenshots: `stage1_screens/` (50 files, listed at the end).

**How I tested.** I used the app as Sam in Chrome. I did a full voice capture (record, stop, two follow-ups, edit a row, save), a typed capture, all four starter chips, a Rough day save, the toast, Profile, every Timeline sub-page, the calendar, and For my doctor. Chrome's window would not shrink below **500 CSS px wide**, so every screenshot is at 500×594. Where I say "at 390", the number is worked out from measured sizes. I measured type, radii, colours and tap targets read-only with JS.

---

## 1. Overall score: **5 / 10**

**Verdict.** No, this would not pass as an App Store-featured health app yet. The *tokens* are mostly right, and that is real progress over the last version. Inter 34/600 titles, Instrument Serif Italic 30/36 for the hero, the warm canvas, plum used as the action colour, a 72 px mic, 44 px chips and 20 px hairline cards with no shadow are all there, and Today's top half looks calm and grown-up. The *components and behaviour* fail it:

- The pill radius leaks onto card-sized buttons. Cards turn into ovals, and one calendar becomes a circle.
- The 0–10 rows are cut off at phone width.
- The capture sheet's close button does nothing, so Sam cannot back out.
- The app puts words in Sam's mouth. System text such as "Quick pain score" and "6 usually, 9 at worst" is shown in quotes, in the serif reserved for the user's own words, and is carried into the GP summary.
- One form answer defaults to "No".

Timeline and For my doctor are still the old dashboard with new colours (stat tiles, all-plum bars, accordions), which is expected for Stage 2. They still share the radius and weight bugs.

The good news is that the core Today → capture → noted → save loop is fast. A voice note takes about 40 s and a Rough day log takes 2 taps, so it clears the 60-second target. Most fixes are component-level, not a rethink.

**Hard product rules:** I found **no Critical breach**. Nothing names a condition, predicts, labels against a threshold or implies causation, and there are no streaks, praise, emoji or paywalls. "Fibroids" appears only inside Sam's own seed history entries, and "Cycle length 28 days" is a raw value, not a label. Two items come close and are listed as High (#4, #5), because they make the GP document untrue.

---

## 2. Per screen / state

### Today: **6/10** (01, 02, 03, 16, 30–32, 50)
**What works**
- The large title, the greeting and one hero with a serif prompt give a clear single primary action.
- The mic is exactly 72×72, plum, with "Tap to talk" under it. "Type instead" is 44 px tall.
- The chips are 44 px pills with a strong outline. Cards use radius 20 with a hairline border and no shadow.
- There are no stat tiles, rings or streaks.

**Problems**
- The **Rough day row overflows**. Eleven 44 px circles plus 10 px gaps need about 564 px, but the card is 418 px wide at 500 (about 310 at 390). 8, 9 and 10 are hidden behind a scrollbar with no hint, and those are exactly the numbers a rough day needs (02, 03).
- There is no anchor text for 0 and 10.
- The **Latest note card is a stadium/oval**. Its radius measures 1.67e7 px (pill) because it is a `<button>` that inherits the button radius. "YOUR LATEST NOTE" collides with the curved border on the left (02, 32). It also uses border-strong instead of hairline.
- After a Rough day save, the Latest note shows **"Quick pain score"** in quotes and in serif, as if Sam said it (32). She did not, and nothing on the Rough day card says the number means pain.
- The appointment card says "Got an appointment coming up? Add it…" even though a Specialist clinic appointment exists on 24 Sep. "Add appointment" then jumps to the **Timeline** tab and a retrospective form ("Why I went / I was told"), with "Back to Timeline" (50).
- The main column overflows by 20 px (`scrollWidth 480` in a 460 column, from the `-mx-5` chip row), so the page can be dragged sideways (03).
- The disabled Save button is plum at 50% opacity with white text, about 2.6:1. It reads as a broken button, not an unavailable one.
- Body text is 18 px; the spec says 17.
- The chip row is cut off at the edge with no fade, so "Just a quic…" looks like a bug rather than a scroller.

### Capture: Speak step: **6/10** (04–07)
**What works**
- The prompt and "Say it however it comes. Messy is fine." are right.
- Recording is tap to start and tap to stop, with a plum waveform, a timer and a round Stop button.
- The live transcript is editable.

**Problems**
- **"Tap to talk" on Today does not record.** It opens a sheet where Sam has to tap a second mic. A hurting user taps twice to start.
- The transcript sits **below the fold** at 594 px tall. While recording, Sam cannot see her words without scrolling (05).
- The transcript text is **right-aligned** inside the textarea (06, 07). That is hard to read and edit, and it is inconsistent with Type mode, which is left-aligned.
- After stopping, the button says "Tap to start" again. It is unclear whether that replaces or appends.
- The sheet header (grabber, X, Speak/Type) scrolls away with the content (07).

### Capture: Follow-ups: **5/10** (08–11, 19–22)
**What works**
- There is a progress label ("1 of up to 2"), and the question is in plain language.
- "Not sure", "It varies" and "Skip" are present, along with a free-text field and mic.
- The body-zone labels are good NHS-plain ("Lower tummy left", "When opening bowels").
- "That's all for now" is visible.

**Problems**
- **The questions are not gap-based.** The voice note said "low down on the left since Tuesday", but Where and When were not filled. The typed note said "had to leave work", but Atossa still asked the same strength question. Every capture gets the same questions.
- **Answers are lost.** Tapping "It varies" on strength left How strong as "+ Add" on the noted card (21).
- The 0–10 rows are clipped at 8, as on Today (08, 09).
- "Got in the way of" and "Where do you feel it?" are **single-select** and advance on the first tap, so Sam cannot pick Work *and* Sleep, or two body zones.
- "Why I'm asking" sits **under the Continue button**, away from the question it explains (08).
- The selected number uses a **solid plum fill**. The spec says selection is plum-tint, and plum means "act here".
- The hover tint sticks on chips and cards ("Skip" and "It varies" look pre-selected in 11 and 20). On touch this becomes a sticky false selection.
- The X is half cut off at the top when the sheet scrolls (20).

### Capture: "Here's what I noted": **5/10** (12–15, 21, 23)
**What works**
- The two-tone rows (small grey label, then content) are right.
- "+ Add" chips for empty fields, not errors.
- A date control is present.
- "Looks right, save" is the clear primary action.

**Problems**
- The **serif quote style is applied to things Sam never said**: "6 usually, 9 at worst" and "Work or study" (13). The spec reserves quotes and serif for her exact phrase.
- The tidy value under her words is the filler text "In your own words".
- Values repeat three times while editing: the quote, the tidy line and the input (15).
- Editing "How strong" opens a **free-text box** instead of the SeverityRow (23). Editing Where opens a text box instead of the zone chips.
- Pressing Enter does not commit an edit, and there is no Done button.
- **"Fix something" is missing.** "Add more" just returns to the last question with no selection shown (22).
- On this step, "That's all for now" duplicates Save and in fact only shows this card again. The spec says it saves.
- The date picker is a native `<select>` with only 3 options (Today, Yesterday, 22 Sep).
- The title is two lines of serif with the "Today" control squeezed beside it.

### Save + toast: **5/10** (16, 24, 31)
- The copy is right: "Saved. 10 notes ready for your GP."
- The toast is a generic white Sonner card at the **top**. It covers the page title and avatar, and inside the sheet it **covers the X button**.
- In my session it did not auto-dismiss for about 60 s. That may be a pause-on-hover side effect of automation, but check it on device.
- There is no settle-into-tab motion and no Saved (green) system tint.

### Starter chips: **4/10** (24, 25, 28, 29)
- "Pain today", "Something new" and "Just a quick note" open Type mode with **the chip label pre-typed into Sam's words** ("Pain today: ").
- Continue is enabled with only that prefix, so the saved "user quote" would be the app's own label.
- The chip label also becomes the **sheet title in serif** ("Pain today"). That is a fourth serif use.
- **"My period" leaves Today and jumps to Timeline › Calendar** (25). That is a different tab and a different mental model, with "Back to Timeline" as the exit.
- The chips open Type rather than Speak, although voice is the headline feature.

### Rough day: **6/10** (30, 31)
- It takes 2 taps and about 5 s. The selected state is clear, and Save becomes enabled.
- It suffers from the row overflow, has no scale anchors, and writes the fake quote "Quick pain score" (see Today).

### Timeline (Stage 2 structure, re-skinned): **3/10** (35–41)
- It shows a **4-tile stat grid** ("9 Symptoms saved / 6 days / 9 out of 10 Highest pain score"). That is on the Do-not-do list.
- The **pain chart uses all-plum bars** on a categorical x-axis (entries, not days). That breaks "plum = action only" and the severity-ramp rule.
- The symptom list rows, the Medicines and Health history summary rows, the appointment rows and the **Cycle calendar card** are pill-radius. The calendar becomes a **circle**, with "31" and "Period logged: 21–26 Aug" crossing the border (39, 40).
- Appointment rows have plum-tint icon tiles, and Medicines and History have tinted icon circles. The spec says no coloured icon circles.
- Dates are 700 weight ("23 September 2026 · 8/10"), and 700 appears throughout.
- "Example information for testing." is visible in the product.
- There is no List/Month switch, no filters and no "+" to capture (all Stage 2).

### Calendar (Stage 2): **4/10** (25–27)
- Bleeding days use a clay fill, which is correct, but they carry a speckle texture (40).
- There are no plum dots on note days.
- The date numerals are bold 700.
- Start/End of period are full-width outlined pills.
- The "Past cycles" cards are pills.
- The month shown on Timeline is August while the current month is September.

### Timeline sub-pages (Stage 2): **4/10** (33, 34, 42–44)
- The **Symptom entry form defaults "Did it stop me doing things?" to No** (34). That invents an answer and feeds the "days stopped me" counts.
- "How bad it was, 0 to 10" is a text input.
- Labels are bold 700.
- "Back to Timeline" is a 56 px outlined pill button, not an iOS back chevron.
- The appointment date is **US format (09/24/2026)** in a UK app (44).
- Medicines show "Around April 2019 – Around April 2019".
- "Delete entry" uses the error red, which is correct for a destructive system action.

### For my doctor (Stage 2): **4/10** (45–48)
**What works**
- "Your summary" in serif.
- The static safety line is present.
- "This page only repeats information entered in Atossa".

**Problems**
- It is an accordion wall of 8 sections.
- There is no visit type, range or agenda step, and no document preview.
- It shows empty labels ("Where:", "How long:") for the Rough day entry.
- It shows "Most recent appointment: I was told: None saved."
- The button reads "Share / PDF" with a slash.
- "Quick pain score" appears under **"Symptoms in my words"**.

### Profile: **3/10** (49)
- It has a name card and the safety line, and nothing else. There is no Records section.
- "Back to Today" appears even when Profile was opened from For my doctor.
- The avatar is still shown on Profile itself, and no tab is selected.

### Empty states
I could not reach any empty state, because the seed data fills every list. Ask for a "clear seed data" toggle so the empty Timeline and empty doctor-summary copy can be reviewed.

---

## 3. Fix list (paste-ready)

1. **High · Capture sheet.** The close X does nothing. Escape and dragging the grabber don't close the sheet either. This happens with or without text, in 5 of 5 tries, so Sam can only leave by saving or reloading.
   **Fix:** "Make the capture sheet's X always close it. If there is unsaved text, show an in-page confirm card ('Keep this note?' with Save it / Discard), never `window.confirm`. Also close it on Escape and on a downward drag of the grabber. Keep the header (grabber, X, Speak/Type, progress) sticky at the top of the sheet so it never scrolls away."

2. **High · Global component.** Card-sized buttons inherit the pill radius (measured `border-radius: 1.67e7px`). The Today Latest note, Timeline symptom rows, Cycle calendar card (renders as a circle), Past cycles, Medicines and Health history rows, and Appointment rows all become ovals, and their text collides with the curve.
   **Fix:** "Split the Button styles from tappable cards. Any pressable element wider than 200 px or containing more than one line of content uses the Card style: radius 20, 1 px hairline #E2DAD0, white, no shadow. Only buttons and chips use radius 999. Audit every `<button>` wrapping a card."

3. **High · Today Rough day, follow-up strength rows, day editor.** The 0–10 row needs about 564 px but gets 418 at 500 wide and about 310 at 390. 8, 9 and 10 are hidden behind a horizontal scrollbar.
   **Fix:** "Replace the scrolling 0–10 row with a non-scrolling SeverityRow. Use two rows (0–5 on the first, 6–10 on the second), each cell at least 44×44 with 8 px gaps, filling the width. Add anchor captions under it: '0 = none' at the left and '10 = worst' at the right, in 13 px ink-3."

4. **High · Rough day save, noted card, Latest note, doctor summary.** System-generated text is shown and stored as Sam's own quoted words: "Quick pain score", "6 usually, 9 at worst", "Work or study", and the chip prefixes "Pain today: ". It appears in quotes, in the serif, in the 'My own words' field and under 'Symptoms in my words' in the GP summary.
   **Fix:** "Only text Sam typed or said may go in the words field and be shown in quotes or Instrument Serif. A Rough day save stores no words: show it as 'Rough day · 7/10' in Inter with no quotes, and leave it out of 'Symptoms in my words'. On the noted card, chip or number answers show only as the tidy value in Inter ink-2, with no quote line. Starter chips must not pre-type text; pass the chip as a hidden tag instead."

5. **High · Symptom entry form.** "Did it stop me doing things?" is pre-selected to No, which invents an answer that feeds the 'days stopped me' counts.
   **Fix:** "No default selection on any yes/no or scale question. Unanswered stays unanswered and is left out of counts and the summary."

6. **High · Follow-ups.** The questions are not gap-based and answers get dropped. Where and When were stated in the transcript but not filled. Every note gets the same questions. "It varies" and "Not sure" answers vanish from the noted card. Body zone and "Got in the way of" are single-select.
   **Fix:** "Ask only about fields still empty after reading the transcript. Until extraction exists, at least keyword-match the obvious phrases ('left', 'since Tuesday', 'work', 'period'). Save 'It varies' and 'Not sure' as values and show them on the noted card. Make body zones and 'Got in the way of' multi-select, with a Continue button."

7. **High · Timeline (visual-system violations to fix now even before the Stage 2 rebuild).** It has a 4-tile stat grid, an all-plum pain bar chart, pill-shaped rows, tinted icon tiles and 700 weights.
   **Fix:** "Remove the four stat tiles. Colour pain bars with the severity ramp (#E4D6E6 → #3E2144 by value), with the number above each bar, on a true date axis. Drop the per-row tinted icon tiles; use a plain 20 px Lucide glyph in ink. Replace every 700 weight with 600."

8. **Medium · Today hero mic.** "Tap to talk" opens a sheet that needs a second tap to record.
   **Fix:** "Tapping the Today mic opens the sheet and starts recording immediately. Show the waveform and timer at once, and fire the light haptic."

9. **Medium · Speak step.** The live transcript is below the fold while recording, right-aligned, and the stopped state says "Tap to start" again.
   **Fix:** "Put the transcript directly under the prompt, above the mic. Make it left-aligned Inter 17/24 in ink, on plum-tint #EFE6EF with radius 14, visible without scrolling at 390×844. After Stop, relabel the button 'Add more by voice' and append to the transcript."

10. **Medium · Follow-up layout.** "Why I'm asking" is below Continue; selected numbers are a solid plum fill; hover tints stick on touch.
    **Fix:** "Place 'Why I'm asking' directly under the question in 13/18 ink-3. Selected chips and numbers use plum-tint #EFE6EF, a 1.5 px plum border and plum text, not a solid plum fill. Apply hover styles only under `@media (hover: hover)`."

11. **Medium · Noted card.** "In your own words" is filler; edits use free text for strength and where; Enter doesn't commit; "Fix something" is missing; "That's all for now" doesn't save.
    **Fix:** "Remove the 'In your own words' line. Editing How strong opens the SeverityRow (typical/worst), and Where opens the zone chips. Add a Done button to inline edits and commit on Enter. Actions: 'Looks right, save' (primary), 'Fix something' and 'Add more' (secondary). Remove 'That's all for now' from this step. On earlier steps, 'That's all for now' saves immediately and shows the toast. Replace the native date select with 'Today ▾', which opens a 14-day picker."

12. **Medium · Toast.** It sits at the top over the page title and the sheet's X, and was seen persisting for about 60 s.
    **Fix:** "Show the Saved toast at the bottom, above the tab bar. Auto-dismiss after 3 s, swipe to dismiss, with no pause-on-hover on touch devices. Use the saved tint #E2EEE6 with #2E6A4F text and a check icon. The toast must never overlap a sheet's controls."

13. **Medium · Starter chips.** They open Type, pre-type the label, and "My period" jumps to Timeline › Calendar.
    **Fix:** "'Pain today', 'Something new' and 'Just a quick note' open the capture sheet in **Speak** mode, keep the normal prompt as the title, and pass the chip as a hidden tag that decides the first follow-up. 'My period' opens a small 'Log bleeding' sheet over Today (Started today / Still going / Ended, flow None–Heavy, save) without leaving the tab."

14. **Medium · Today appointment card.** It ignores the existing 24 Sep appointment, and "Add appointment" jumps to Timeline with a retrospective form.
    **Fix:** "If an upcoming or today appointment exists, show 'Specialist clinic · Thu 24 Sep · 10 notes ready' with 'Preview summary'. 'Add appointment' opens a sheet over Today asking only who or where and the date, then returns to Today."

15. **Medium · Layout.** The Today main column overflows by 20 px (scrollWidth 480 in 460), so the page drags sideways.
    **Fix:** "Contain the chip scroller (`-mx-5`) inside an `overflow-x: clip` wrapper so the document never scrolls horizontally at 320–430 px. Add a 24 px right-edge fade on the chip row."

16. **Medium · Disabled buttons.** Plum at 50% opacity with white text is about 2.6:1 and reads as broken.
    **Fix:** "Disabled primary buttons are sunken #EFE9E1 with ink-2 #5A534D text, not faded plum."

17. **Medium · Serif discipline.** The serif is used for chip-titled sheets ("Pain today", "Something new") and non-user quotes.
    **Fix:** "Instrument Serif Italic only for Sam's exact words, the Today hero prompt and the summary title. Capture sheet titles for chips reuse the hero prompt."

18. **Medium · Dates.** Native date inputs show US format (09/24/2026).
    **Fix:** "Display every date as 'Thu 24 Sep 2026' (en-GB) and use a custom picker, not the browser mm/dd/yyyy input."

19. **Medium · Prototype load.** The first tap after load is ignored for about 3–4 s (mic, chips, rough-day numbers), and the console shows a React hydration-mismatch error. This is prototype-only, but it makes review sessions feel broken.
    **Fix:** "Render the Today screen client-only, or fix the hydration mismatch, so the first tap works."

20. **Medium · Accessibility.** Number buttons are announced as "7" with no context.
    **Fix:** "Give severity buttons `aria-label='7 out of 10'` and the group `role='radiogroup'` with a label. Give the selected tab `aria-current='page'`."

21. **Low · Today.** "YOUR LATEST NOTE · 24 SEPT 2026" is an all-caps eyebrow.
    **Fix:** "Use sentence-case caption 13/18 500 ink-3: 'Your latest note · Wed 24 Sep'."

22. **Low · Timeline and Profile back buttons.** "Back to Timeline" and "Back to Today" are 56 px outlined pills, and Profile says "Back to Today" even when opened from another tab.
    **Fix:** "Use an iOS-style back chevron with the previous screen's title in the top-left, 44 px target, text-only plum. Go back to where the user came from."

23. **Low · Seed and test copy.** "Example information for testing." is visible, and dates repeat ("Around April 2019 – Around April 2019").
    **Fix:** "Hide the test footer outside dev. Collapse same-start-and-end dates to 'Around April 2019'."

24. **Low · Summary.** It shows empty labels ("Where:", "How long:"), "I was told: None saved.", and "Share / PDF".
    **Fix:** "Omit empty fields and empty sections. Label the button 'Share PDF'." (Structure is Stage 2.)

25. **Low · Type scale.** Body text is 18 px, and labels and dates use 700.
    **Fix:** "Body text is Inter 17/24 400; no 700 anywhere; headings 600."

---

## 4. Top 5 changes that would most raise perceived quality

1. **Kill the pill-on-cards bug (#2).** Oval cards and a circular calendar are the single most amateur-looking thing in the build, and they appear on every tab.
2. **Make severity rows fit without scrolling (#3).** A hidden "10" on a pain scale is both a bug and a trust problem.
3. **Protect Sam's words (#4, #5).** Only her words in quotes and serif, no invented answers or defaults. That is the product's promise to the GP.
4. **Make capture feel instant and escapable (#1, #8, #9).** One tap starts recording, the transcript is visible, and X always works.
5. **Strip Timeline's dashboard DNA now (#7).** Remove the stat tiles and plum bars and use the severity ramp, so the whole app reads as one calm system even before the Stage 2 rebuild.

---

## Screenshots saved (`stage1_screens/`)

00_today_wide_viewport, 01_today_top, 02_today_bottom_roughday_latestnote, 03_today_page_horizontal_overflow, 04_capture_speak_idle, 05_capture_recording, 06_capture_recording_transcript, 07_capture_stopped_transcript_header_scrolled_away, 08_capture_followup1_strength, 09_capture_followup1_row_clipped, 10_capture_followup1_selected, 11_capture_followup2_got_in_way, 12_noted_card_top, 13_noted_card_actions, 14_noted_edit_where, 15_noted_edit_where_filled, 16_saved_toast_today, 17_capture_type_empty, 18_capture_type_filled, 19_typed_followup_same_questions, 20_followup_where_zones_hover_state, 21_noted_card_it_varies_dropped, 22_add_more_loops_back, 23_noted_edit_strength_freetext, 24_chip_pain_today_prefill_toast_over_close, 25_chip_my_period_jumps_to_calendar, 26_calendar_day_editor, 27_calendar_past_cycles_pill_cards, 28_chip_something_new, 29_chip_quick_note, 30_roughday_selected, 31_roughday_saved_toast, 32_latest_note_quick_pain_score_fake_quote, 33_symptom_entry_old_form, 34_symptom_entry_default_no, 35_timeline_top_stat_tiles, 36_timeline_pain_chart_plum_bars, 37_timeline_stopped_bars, 38_timeline_symptom_list_pill_cards, 39_timeline_cycle_card_oval, 40_timeline_cycle_circle_overflow_appointments, 41_timeline_medicines_history_cards, 42_medicines_page, 43_health_history_page, 44_appointment_form_us_date, 45_for_my_doctor_top, 46_for_my_doctor_at_a_glance, 47_for_my_doctor_accordions, 48_for_my_doctor_share_safety, 49_profile, 50_today_add_appointment_jumps_to_timeline_form (all .jpg; 00 was taken before the window narrowed and shows the desktop width).

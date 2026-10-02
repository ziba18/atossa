Stage 1 fixes. Two reviewers (UX + graphic design) walked every screen at phone width. Please fix all of the following. Keep everything in the project knowledge rules (no condition names, predictions, threshold labels, causation, streaks, emoji). Timeline and For my doctor get rebuilt in Stage 2, so for those only apply the GLOBAL fixes in sections A and B, not structural changes.

## A. Global design system (do these first; they fix most screens at once)

1. Cards vs buttons. Card-sized buttons inherit the pill radius (measured border-radius 1.67e7px), so the Today "Latest note" card, Timeline symptom rows, the Cycle calendar card (renders as a circle), Past cycles, Medicines, Health history and Appointment rows are ovals with text hitting the curve. Make a separate tappable-card style: any pressable element wider than 200 px or with more than one line of content is radius 20, 1 px hairline #E2DAD0, white, no shadow. Only buttons and chips are radius 999. Allowed radii in the whole app: 14, 20, 28, 999. Audit every <button> that wraps a card.
2. Icons. Every Lucide icon renders 16×16 because the Button's `[&_svg]:size-4` overrides size classes. Remove that override. Sizes: tab bar 24, row/inline 20, mic and stop glyphs 32 in the 72 px button. Stroke 1.75 everywhere with absoluteStrokeWidth.
3. Exact colour tokens. Define every colour as the exact spec hex in :root CSS variables (not oklch approximations): canvas #F7F3EE, hairline #E2DAD0, border-strong #8F867C, ink-2 #5A534D, ink-3 #756C64, plum #4A2C4F, plum-tint #EFE6EF, clay #A6452E (must stay visibly browner than error #A12A2A), sunken #EFE9E1, saved tint #E2EEE6 / text #2E6A4F. Bleeding days: flat clay fill, remove the speckle texture.
4. Type tokens, used app-wide and nothing else: large-title 34/41 600 −0.17px; hero 30/36 serif; title 24/30 600; quote 20/28 serif; headline 17/24 600; body 17/24 400; secondary 15/20 400; caption 13/18 500 +0.26px; numeral 44/48 500 tabular; tab 11/13 500. No 700 weight anywhere (headings 600). Set explicit line-heights (no inherited 1.5). Buttons line-height 1 in a fixed height. Remove every `uppercase` eyebrow ("YOUR LATEST NOTE", "A LITTLE MORE DETAIL", "NAME") → sentence-case caption.
5. Serif. Instrument Serif Italic is used ONLY for (a) Sam's exact words, (b) the Today hero prompt, (c) the summary title. Always font-weight 400, italic, font-synthesis: none (it is currently weight 500 → fake bold, blurry). Not for "Here's what I noted", not for chip-titled sheets ("Pain today"), not for app-generated text.
6. Button sizes: primary 56 px, secondary 48 px, text buttons 44 px hit area, everywhere. MicButton 72 px on Today and in the sheet. Disabled primary = sunken #EFE9E1 fill with ink-2 text (not faded plum).
7. Selection style. A selected chip or number is plum-tint #EFE6EF with a 2 px plum ring and plum 600 text — same for every value, never a solid plum fill. The severity ramp (#E4D6E6 · #C3A6C7 · #9A729F · #6E4775 · #3E2144) is only for DISPLAYING saved values, always with the digit. Hover styles only inside @media (hover: hover) (they currently stick on touch and look like selections).
8. Toast: bottom of the screen above the tab bar, never covering a sheet's controls. Auto-dismiss after 3 s, swipe to dismiss, no pause-on-hover on touch. Background #E2EEE6, text #2E6A4F 15/20 500, check-circle 20 icon, radius 14, no border, shadow 0 2 16 rgba(31,27,24,.06), 20 px from screen edges.
9. Tab bar: icons 24; unselected icon+label ink-3 #756C64, selected plum #4A2C4F; label 11/13 500; icon→label gap 4; aria-current="page" on the selected tab.
10. Tap affordance: any tappable row/card ends with a 20 px chevron-right in ink-3. Remove per-row pencil icons. No tinted icon tiles/circles anywhere — plain 20 px Lucide glyph in ink.
11. "+ Add" chips vs fact tags. AddFieldChip: 36 px visual / 44 px hit, transparent, 1 px dashed border-strong, plum 15/500 text naming the field ("+ Add where"). Non-interactive fact tags under a quote: no fill, no border, secondary 15/20 ink-2 joined with " · " (e.g. "Lower tummy, left · 9/10").
12. Dates: one en-GB formatter. "Wed 24 Sep" within the current year, "Wed 24 Sep 2025" otherwise, ranges "11–24 Sep 2026". "Sep", never "Sept". No browser mm/dd/yyyy inputs anywhere — use a custom picker. Collapse identical start/end ("Around April 2019 – Around April 2019" → "Around April 2019").
13. Layout: the document must never scroll horizontally at 320–430 px (Today currently overflows by 20 px from the -mx-5 chip row). Wrap the chip scroller in overflow-x: clip and add a 24 px right-edge fade. text-wrap: balance on the hero prompt, sheet titles and card titles.
14. Back navigation: replace the 56 px "Back to Timeline"/"Back to Today" pill buttons with an iOS-style top-left back chevron + previous screen's title, 44 px target, plum text. Go back to where the user actually came from.
15. Accessibility: severity buttons aria-label="7 out of 10", the group role="radiogroup" with a label.
16. Fix the React hydration mismatch (console error) so the first tap after load works (it is currently ignored for 3–4 s).
17. Hide "Example information for testing." from the UI.

## B. Severity row (Today Rough day, follow-ups, day editor)
18. The 0–10 row needs ~564 px but gets ~310 at 390 wide, so 8, 9 and 10 are hidden behind a scrollbar. Replace with a non-scrolling SeverityRow: two rows (0–5, 6–10), each cell ≥44×44, 8 px gaps, filling the width. Captions underneath: "0 = none" left, "10 = worst" right, 13/18 ink-3.

## C. Sam's words are sacred (product rule)
19. Only text Sam typed or said goes in the words field and is shown in quotes or the serif. Currently "Quick pain score", "6 usually, 9 at worst", "Work or study", "In your own words" and the chip prefix "Pain today: " are shown and stored as her words, and leak into "Symptoms in my words" on the doctor page.
   - A Rough day save stores no words: show it as "Rough day · 7/10" in Inter, no quotes, and leave it out of "Symptoms in my words".
   - On the noted card, chip/number answers show only as the tidy value in Inter ink-2, with no quote line. Remove the "In your own words" filler.
   - Starter chips never pre-type text; pass the chip as a hidden tag.
20. No default answer on any yes/no or scale question (the Symptom entry form pre-selects "No" for "Did it stop me doing things?"). Unanswered stays unanswered and is excluded from counts and the summary.

## D. Today screen
21. Hero card: white base with a top-to-bottom gradient from rgba(74,44,79,0.04) to transparent, 1 px #E2DAD0 border, radius 20, shadow 0 2 16 rgba(31,27,24,0.06). Padding 32 top / 24 sides / 24 bottom. Gaps prompt→mic 24, mic→"Tap to talk" 8, →"Type instead" 4. (Currently flat cool grey #F7F5F7.)
22. Vertical rhythm on an 8-pt grid: title→greeting 8, greeting→hero 24, hero→starter chips 16, then 24 between every card. Card padding 20 everywhere. Body text 17 (currently 18).
23. Tapping the Today mic opens the sheet AND starts recording immediately (waveform + timer at once). No second tap.
24. Starter chips: "Pain today", "Something new", "Just a quick note" open the sheet in Speak mode with the normal hero prompt as title, chip passed as a hidden tag that picks the first follow-up. "My period" opens a small "Log bleeding" sheet over Today (Started today / Still going / Ended; flow None–Heavy; Save) — it must not jump to Timeline.
25. Appointment card: if an upcoming or today appointment exists, show "Specialist clinic · Thu 24 Sep · 10 notes ready" with "Preview summary". Otherwise "Add appointment" opens a sheet over Today asking only who/where and the date, then returns to Today (not the Timeline retrospective form).
26. Latest note card: tappable-card style (fix A1), hairline border, caption "Your latest note · Wed 24 Sep" in sentence case.

## E. Capture sheet
27. The X does nothing (nor Escape, nor dragging the grabber) — Sam can't leave without saving. Make X always close. If there is unsaved text, show an in-page confirm card ("Keep this note?" — Save it / Discard), never window.confirm. Also close on Escape and on a downward drag of the grabber. The header (grabber, X, Speak/Type, progress) is sticky and never scrolls away.
28. Speak step: transcript directly under the prompt, above the mic, visible without scrolling at 390×844. Transcript box: plum-tint #EFE6EF, no border, radius 14, padding 16, Inter 17/24 ink, LEFT-aligned (currently right-aligned). After Stop, the button reads "Add more by voice" and appends to the transcript.
29. Follow-ups:
   - Ask only about fields still empty after reading the transcript. Until real extraction exists, keyword-match obvious phrases ("left/right", "since Tuesday"/days, "work", "sleep", "period") to pre-fill and skip those questions.
   - Save "It varies" and "Not sure" as values and show them on the noted card (currently dropped).
   - Body zones and "Got in the way of" are multi-select with a Continue button (currently advance on first tap).
   - "Why I'm asking" sits directly under the question, 13/18 ink-3 (currently below Continue).
   - Escape chips (Not sure / It varies / Skip) are ghost chips: no border, ink-2 15/500, 44 px, separated from the answers by 16 px.
   - Text input and its mic both 52 px tall, top-aligned, 8 px apart; input radius 14, sunken fill, 1 px border-strong.
   - "That's all for now" saves immediately and shows the toast.
30. "Here's what I noted":
   - Title in Inter 24/30 600; "Tap anything to fix it." below in 15/20 ink-2; the date control on its own row as a 36 px pill "Today ▾" opening a 14-day picker (not a native select with 3 options).
   - Each row tappable (chevron, fix A10). Editing How strong opens the SeverityRow (typical / worst); editing Where opens the zone chips. Inline edits have a Done button and commit on Enter. Values are never shown three times while editing.
   - Actions: "Looks right, save" (primary), "Fix something" and "Add more" (secondary). Remove "That's all for now" from this step.

## F. Small items for Timeline / doctor / Profile (only these until Stage 2)
31. Timeline: remove the four stat tiles; pain bars use the severity ramp by value with the digit above each bar on a true date axis (not all-plum).
32. Doctor page: omit empty fields and sections (no "Where:" with nothing after it, no "I was told: None saved."); button label "Share PDF"; summary title serif 30/36 400 with the date range beneath in secondary 15/20 ink-2.
33. Profile: no avatar on the Profile screen itself; back goes to the screen it was opened from.

When finished, list which numbered items you did and anything you couldn't do.

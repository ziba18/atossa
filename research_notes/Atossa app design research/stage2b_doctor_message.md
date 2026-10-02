Stage 2b: rebuild the For my doctor tab as a summary builder with a real one-page document preview. Keep the project knowledge rules and Stage 1 design system exactly. Nothing in the summary may name a condition, interpret, compare against thresholds, imply causes, or suggest treatment — it only repeats what Sam entered, in her words, with raw values.

## 1. Builder (one scrolling screen, large title "For my doctor")
- Intro in body ink-2: "This is what you told Atossa, in your words. Choose what to include."
- **"What's this appointment for?"** — single-select chips: First time talking about this · Follow-up · Seeing a specialist · Other. Nothing pre-selected. If an upcoming appointment exists, show it above as a small card ("Specialist clinic · Thu 24 Sep") — it sets the "since last appointment" range.
- **Range** — segmented control: Since last appointment · 3 months · 6 months (default: Since last appointment if one exists, else 3 months).
- **"What I'd like from today"** — a 2-line textarea (radius 14, sunken) with a mic button, hint "What's the one thing you want your GP to take away?". Text is Sam's words (shown in serif on the document).
- **Preview** — the actual A4 page as a white document card at reduced scale (radius 14, soft shadow 0 2 16 rgba(31,27,24,.06)), max width fits the screen, tappable to open full size.
- **Sections** list under the preview: each section a row with a switch (plum when on). Sensitive sections (Sex & intimacy, Mood, Eating) are OFF by default with a small lock glyph and the caption "Off unless you turn it on for this summary". Toggling updates the preview immediately.
- Bottom action bar (sticky above the tab bar): **Share PDF** (primary 56), then **Print** and **Show on screen** (secondary 48, side by side).
- Static safety line at the foot: "If you feel very unwell or you're worried, contact your GP, NHS 111 or 999." (never content-triggered).
- Remove the old accordions, "At a glance" card and "Save notes".

## 2. The document (one A4 page, white, ink, Inter + Instrument Serif; plum only in the heat-strip; no other colour except clay-tint for bleeding)
In this order (NICE-ish, omit any section or field with no data — never print empty labels):
1. Header: "Your summary" in serif 30/36 400 (on the document: "Symptom summary — Sam"), range "14 Jul – 29 Sep 2026", visit type, generated date.
2. **What I'd like from today** — Sam's words in serif, if given.
3. **Symptoms in my words** — up to 5 most recent quotes (serif, with date). Only text Sam said or typed; never Rough day or chip answers.
4. **How often and how strong** — FrequencyBars: one horizontal bar per symptom with direct label and count ("Pelvic pain · 9 of 30 days"), plus "usually 6/10, at worst 9/10" from saved values only. Below, the **HeatStrip**: days along the x-axis, logged bleeding days as a clay-tint band behind, one row of severity-ramp cells per symptom with the digit inside each cell. Caption descriptive only, e.g. "Pelvic pain was logged on 9 of 30 days; 7 of those were bleeding days." No "linked to", trend arrows, averages as scores.
5. **Periods logged** — start/end dates and lengths as raw values, flow as entered. No "irregular/heavy" labels, no predictions.
6. **What it got in the way of** — counts per item ("Work · 4 days"). "Not sure"/"Skip" excluded.
7. **What I've tried** — medicines and other things with dates and "What I noticed" in Sam's words.
8. **Appointments** — most recent by date, with "I was told:" only if entered.
9. **Health history** — items with "Around" dates.
10. Sensitive sections only if switched on.
- Footer on the page: "Patient-reported via Atossa · not clinically verified · 14 Jul–29 Sep 2026 · 23 entries".

## 3. Show on screen
Full-screen, large type (body 22/30, headings 28), high contrast ink on white, same content as the document, X to close. Meant to be handed across the desk.

## 4. Share / Print
In the prototype, Share PDF and Print can open the browser print dialog for the document only (print CSS: A4, no app chrome) — that is fine. No server upload.

## 5. Small leftovers from Stage 2a (fix in the same pass)
12. Remember List/Month (and the filter) for the session.
13. Put the type glyph inline with the date on the card's top line.
14. Add a gap between "Add a note for this day" and "Log bleeding" in the DaySheet.
15. Hide "Bleeding logged on 0 days".
16. Scroll the selected filter chip into view.
17. Scroll the delete confirm card into view.
18. Rough day shows "8/10", not "8/10 at worst".
19. The follow-up for a back-dated note shouldn't say "today".
20. Calendar aria-labels should mention note/bleeding.
21. Use one date-range format on the doctor page.

When finished, list which sections you did and anything you couldn't do. Update roadmap.md.

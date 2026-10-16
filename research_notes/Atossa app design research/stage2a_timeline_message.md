Stage 2a: rebuild the Timeline tab and add Records to Profile. Keep everything in the project knowledge rules and the Stage 1 design system exactly (tokens, type scale, radii 14/20/28/999, hairline cards with no shadow, Lucide 1.75, serif only for Sam's words / Today hero / summary title, plum = action only, clay = logged bleeding only, severity ramp always with the digit). Do not change Today or the capture sheet except where stated.

## 1. Structure
- Large title "Timeline". Top-right: a 44 px "+" (plum) that opens the existing capture sheet.
- Under the title, a segmented control: **List · Month** (sunken track, white selected segment, 15/500, 36 px tall). Remember the last choice for the session.
- Remove everything from the old dashboard: stat tiles, the separate pain chart section, the "My symptoms" / Cycle calendar / Appointments / Medicines / Health history cards and their sub-pages as separate destinations. Their data becomes entries in the feed (below) or Records in Profile (section 4).

## 2. List view
- Filter chips in one horizontally scrolling row (track scrolls, page never does): **All · Symptoms · Bleeding · Appointments · Medicines**. Single-select, selected = plum-tint + 2 px plum ring.
- Reverse-chronological feed grouped by week. Week header (headline 17/24 600, ink): "This week", "Last week", then ranges "8–14 Sep". Missing weeks are simply absent — no "nothing logged" rows, no gaps, no red.
- **EntryCard** (tappable card, radius 20, hairline, white, chevron-right 20 ink-3 at the right):
  - Top line: type glyph 20 (mic = voice note, pen = typed note, droplet = bleeding — the only clay icon, calendar = appointment, pill = medicine) + "Wed 24 Sep · 14:10" in secondary 15/20 ink-2.
  - Symptom note: Sam's first line of words in quote style (serif 20/28, max 2 lines, ellipsis). If the note has no words (e.g. Rough day), show "Rough day" in headline Inter instead — never a quote.
  - Fact tags beneath in secondary ink-2 joined with " · " (e.g. "Lower tummy, left · 6/10 usually · 9/10 at worst"). Omit anything empty.
  - Bleeding entry: 4 px clay left edge on the card, text "Period started" / "Period · day 3" / "Spotting" / "Period ended" + flow if given. No predictions, no cycle-day counts into the future.
  - Appointment: "Specialist clinic" headline, date, and "I was told:" line only if Sam entered something.
  - Medicine: name + "Started around April 2019" (collapse identical start/end).
- Tapping an entry opens a full-screen **entry detail** with an iOS back chevron "Timeline", showing every saved field as NotedRows (same component as "Here's what I noted"), each editable in place with the same editors (SeverityRow, zone chips, text). A text-style "Delete entry" at the bottom in error red, confirmed with an in-page card (never window.confirm).
- A small severity mini-strip above the feed is NOT wanted; no charts in List.

## 3. Month view
- "Log a period" secondary button (48 px) at the top, opening the same Log bleeding sheet as Today.
- Month header "September 2026" (title 24/30 600) with prev/next chevrons (44 px). Opens on the current month.
- Calendar grid: weekday initials (caption ink-3), day numbers 15/400 tabular on bare canvas.
  - Logged bleeding day: 36 px solid clay circle, white numeral.
  - Logged spotting: 36 px clay hatched outline (1.5 px), clay numeral.
  - Day with any note: 4 px plum dot below the number (in addition to the clay if both).
  - Today: 1.5 px ink ring.
  - No predicted days, no fertile window, no "days until", no streak chain; empty days are plain.
- Tapping a day opens a bottom **DaySheet** (radius 28 top, grabber, X): "Wed 24 Sep" title, that day's EntryCards, and "Add a note for this day" (opens capture with the date preset) + "Log bleeding" text buttons.
- Under the calendar, a descriptive-only line in secondary ink-2, e.g. "Bleeding logged on 5 days this month." No averages, no cycle-length judgements, no "irregular", no trend arrows.

## 4. Profile → Records
- Profile gets a "Records" section (title 24/30) with three tappable rows: **Medicines**, **Appointments**, **Health history**, each with a count in ink-3 and a chevron.
- Each opens a list screen (back chevron "Profile") of tappable cards plus an "Add" secondary button. Forms use the custom en-GB date picker (allow future dates for appointments, "Around" month/year option for history and medicines), and no defaults pre-selected. Fields: Medicine — name, dose (optional), started, stopped (optional), "What I noticed" (Sam's words). Appointment — who/where, date, "Why I went", "I was told" (Sam's words). Health history — what, when (around), notes.
- Records still appear as entries in the Timeline feed (Appointments and Medicines filters).
- Keep the static safety line at the foot of Profile.

## 5. Empty states (add a dev-only "Clear sample data" text button at the very bottom of Profile so these can be reviewed; reloading restores the seed)
- Timeline List empty: "Nothing here yet. Your notes will line up here by date." + "Add a note" primary.
- Filter with no matches: "No appointments yet." (etc.) in secondary ink-2. No guilt copy.
- Month with nothing logged: calendar shows plainly, no message needed.

## 6. Navigation
- Today's "My period" chip and Log bleeding keep working over Today. Today's appointment card "Preview summary" still goes to For my doctor. Anything that used to link into the old Timeline sub-pages now goes to the matching entry detail or Profile → Records screen, with a correct back label.

## 7. Stage 1 leftovers (fix in the same pass)
- **"Usually" strength is lost after save.** The noted card shows 6 usually / 9 at worst, but the Latest note, Timeline, doctor page and entry editor show only 9/10. Store both values (typical and worst, each nullable) on the entry, show both everywhere ("6/10 usually · 9/10 at worst"), and the entry editor shows two SeverityRows (Usually / At worst).
- **Toast over sheets.** If a sheet opens while a toast is visible, dismiss the toast immediately. Toast width = screen width minus 20 px each side (it is 318 px now).
- **Back navigation.** Every detail screen's back label names the screen it was actually opened from, and back returns there (an appointment opened from Timeline currently goes back to the Appointments list; detail pages always say "Timeline").
- **Today spacing.** Large title → greeting gap 8 px (it is ~21).
- **SeverityRow at 320 px.** Cells still overlap by ~3 px; let cells shrink below 44 visual width but keep a 44 px hit area, never overlap.
- **Icons.** absoluteStrokeWidth so all icons draw a 1.75 px stroke at 20/24/32.

When finished, list which sections you did and anything you couldn't do. Update roadmap.md.

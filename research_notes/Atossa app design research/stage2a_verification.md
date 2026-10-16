# Stage 2a (Timeline + Profile Records): verification (Lovable commit 65c85a04)

Checked on 2026-10-01 against the live preview `id-preview--b0b66a36-…lovable.app`. As in earlier rounds, the app ran in a same-origin iframe at **390 px** wide (also tested at 320 and 430), because Chrome won't go narrower. This round the iframe was 585 px tall, because the browser window could not be made taller. Measurements come from `getComputedStyle` / `getBoundingClientRect`. I also cross-checked one important bug (dead taps on appointment and medicine cards) at full desktop width with no iframe, and read the commit's `RecordsStage2.tsx` to explain what I saw. Screenshots are in `stage2a_screens/` (01–32).

The app clock is fixed at **Thu 24 Sep 2026 14:10**. "Today", "This week" and new entries all use that date, not the real date.

**Result: 17 Pass · 14 Partial · 8 Fail** (39 checks)

## 1. Structure

| # | Item | Result | Evidence |
|---|---|---|---|
| 1.1 | Large title, 44 px plum "+" opens capture | **Partial** | "Timeline" is 34/41/600. "+" is 44×44, plum `#4A2C4F`, aria "Add a note", and opens the capture sheet ✓ (01). **But the Profile avatar is still rendered at the same spot, under the "+"** (`elementFromPoint` returns "Add a note"). Profile can't be reached from Timeline. |
| 1.2 | Segmented List · Month | **Partial** | Sunken track `#EFE9E1` 36 px, white selected segment, 15/500 ✓. **The choice is not remembered:** select Month, go to Today, come back, and it shows List again. |
| 1.3 | Old dashboard removed | **Pass** | No stat tiles, pain chart, or My symptoms / Cycle calendar / Medicines / Health history cards on Timeline. |

## 2. List view

| # | Item | Result | Evidence |
|---|---|---|---|
| 2.1 | Filter chips | **Pass** | All · Symptoms · Bleeding · Appointments · Medicines. Single-select, `aria-pressed`, plum-tint + 2 px plum ring, 44 px. The track scrolls (568 vs 350) and the page never does. Each filter returns the right set. Minor: the selected chip isn't scrolled into view, so "Appointments" stays clipped while selected (03). |
| 2.2 | Week grouping | **Partial** | "This week", "Last week" and "7–13 Sep" are 17/24/600 ink ✓, and missing weeks are simply absent ✓. **Headers that cross a month boundary are wrong:** "27–2 Aug", "29–5 Jul", "30–6 May", "24–1 Mar" (they should read "27 Jul–2 Aug" and so on). **Weeks in other years have no year:** "24–1 Mar" is 2020 and "1–7 Jun" is 2015 (02, 03). A future appointment adds a "19–25 Oct" group above "This week" (32). |
| 2.3 | EntryCard anatomy | **Partial** | Radius 20, 1 px hairline, white, no shadow, 20 px chevron in ink-3 ✓. The quote is Instrument Serif italic 20/28 ink with a 2-line clamp ✓. The date is 15/20 ink-2 ✓. **The type glyph is a left column centred on the whole card, not on the top line next to the date** (01). |
| 2.4 | Rough day is not a quote | **Pass** | "Rough day" is headline Inter 17/600, not serif (11). Minor: the Timeline says "8/10 at worst" but the Latest note says "8/10". A single rough-day number isn't a "worst" value, so "8/10" is right. |
| 2.5 | Bleeding: clay edge | **Fail** | The card has `border-l-4 border-l-bleeding`, but the unlayered `.tappable-card { border: 1px solid var(--hairline) }` overrides it, so the computed left border is **1 px hairline**. There is no clay edge on any bleeding card (02). Text and flow are fine. "Period · day 3" is never used (it says "Period"), which is acceptable. |
| 2.6 | Appointment / medicine cards | **Partial** | Appointment: "Hospital clinic" headline, date, and "I was told:" only when entered ✓. Medicine: **"Started around april 2019" has a lowercase month** (04). **Approximate dates get a made-up exact day:** the medicine card is dated "Mon 1 Apr 2019" and "Hospital clinic" is "Sun 1 Mar 2020", while the doctor page says "Around March 2020". Birth control has a different stop date (Around June 2016), but the card leaves it out. |
| 2.7 | Empty fact tags omitted | **Pass** | Notes with no Where show only the score. Nothing shows "undefined" or an empty " · ". |
| 2.8 | Entry detail | **Fail** | **Tapping an appointment or medicine card does nothing.** The onClick runs, but no screen opens. I reproduced this at full desktop width without the iframe. **Tapping a bleeding card opens the DaySheet, not an entry detail**, and when the list is scrolled that sheet is off-screen (see 3.5) (07, 08). The symptom entry detail is still **the old form**, not NotedRows: native day/month/year selects (years 1900–2100, so a symptom can be future-dated), a free-text "Where" field instead of zone chips, and **one "How bad it was" row** (05, 13). |
| 2.9 | No charts in List | **Pass** | No mini-strip and no chart. |
| 2.10 | Delete confirm | **Pass** | An in-page card ("Delete this symptom entry? This cannot be undone." Cancel / Delete). `window.confirm` was never called (06). Minor: "Delete entry" is an outlined button, not a text button. The card opens below the fold and isn't scrolled into view. |
| 2.11 | Back label / target | **Pass** | Opened from Timeline: "‹ Timeline" returns to the List. Opened from the Today latest note: "‹ Today" returns to Today (30). Minor: the tab bar highlights Timeline while the label says Today. |

## 3. Month view

| # | Item | Result | Evidence |
|---|---|---|---|
| 3.1 | Log a period | **Partial** | 48 px white secondary button that opens the Log bleeding sheet ✓ (20). **The sheet has no date control and no "Spotting" option.** "Still going" + flow "Light" was saved as **"Spotting · Light"** (22). The app is renaming what Sam chose. |
| 3.2 | Header and navigation | **Pass** | "September 2026" 24/30/600, 44 px prev/next, opens on the current (app) month. Weekday initials are 13/18 ink-3. |
| 3.3 | Clay fill / plum dot / today ring | **Pass** | A bleeding day is a 36 px clay `#A6452E` circle with a white numeral (16). A note day has a 4 px plum dot, also on clay days (19). Today has a 1.5 px ink ring (15). Digits are 15/400 tabular. There are no predictions or streaks. Minor: the day buttons' aria-labels ("Fri 11 Sep") don't say that the day has a note or bleeding. |
| 3.4 | Spotting hatch | **Fail** | The cell gets class `spotting-day`, but **no CSS rule exists for it**, so nothing is drawn. 24 Sep shows only the today ring (21). Spotting can also only be created through the relabelling in 3.1. |
| 3.5 | DaySheet | **Partial** | Grabber, X, radius 28, "Sat 22 Aug" title, that day's EntryCards ✓ (17). **Layout bug:** the `.animate-enter` wrapper keeps `transform: matrix(1,0,0,1,0,0)` and `filter: blur(0)`, so the "fixed" sheet is positioned against the page instead of the screen. It isn't full width (sits inside the 20 px gutters), its scrim doesn't cover the tab bar, and **when the list is scrolled it opens off-screen** (dialog at y −2556; 07, 08). **"Add a note for this day" and "Log bleeding" run together** with no gap. |
| 3.6 | "Add a note for this day" presets the date | **Pass** | The capture sheet opened, and the noted card showed "Sat 22 Aug" (18). The saved note put a plum dot on 22 Aug (19). Minor: the follow-up still asks "Did it get in the way of anything **today**?" |
| 3.7 | Descriptive line | **Partial** | "Bleeding logged on 6 days this month." is descriptive, 15/20 ink-2 ✓. It also shows "…on 0 days" for empty months (the spec says no message is needed). **After logging spotting it says "1 day", but no day is marked** (21). |

## 4. Profile → Records

| # | Item | Result | Evidence |
|---|---|---|---|
| 4.1 | Records section | **Pass** | "Records" 24/30/600. Medicines 3 / Appointments 4 / Health history 5, with counts 15 px ink-3 and chevrons (23). |
| 4.2 | List screens | **Partial** | The "Add" secondary button is 48 px ✓. **The list renders inside the Profile page**, so there are two back links and two large titles ("‹ Today / Profile / ‹ Profile / Medicines") (24). **Every row shows a "0" count.** `Row` is reused with `count={0}`. Rows have no date or subtitle, so Health history shows "Test or scan" twice with no way to tell them apart (28). |
| 4.3 | Forms: custom en-GB picker, no defaults | **Fail** | Still **three native `<select>`s** (years 2100–1900). **Defaults are pre-selected:** "Exact date" is highlighted and the selects show **24 Sep 2026** for Started *and* the optional Stopped. Health history pre-selects "Around". The shown date isn't actually set, so with Name filled **Save stays disabled until you tap the already-highlighted "Exact date"** (26). Health history "Notes" joins three stored fields (told/done/result), and editing it wipes `told` and `done`. |
| 4.4 | Future appointment dates | **Pass** | "GP surgery, 24 Oct 2026" saved (27). It appears in the feed and on the doctor page as "Upcoming". |
| 4.5 | Back labels | **Fail** | An existing record's detail says **"‹ Profile" but returns to the Medicines / Appointments / Health history list** (25). A new record correctly says "‹ Medicines". The appointment-from-Timeline case can't be tested because those taps are dead (2.8). |
| 4.6 | Records appear in the feed | **Pass** | Appointments and Medicines filters list them, including the new GP surgery. |
| 4.7 | Safety line | **Pass** | The static NHS 111 / 999 line is at the foot of Profile. |

## 5. Empty states

| # | Item | Result | Evidence |
|---|---|---|---|
| 5.1 | "Clear sample data" + empty states | **Fail** | **There is no "Clear sample data" button anywhere** (not in the DOM or in `RecordsStage2.tsx`), so the empty List, the no-match filter and the empty Month can't be reviewed (23). An empty month shows "Bleeding logged on 0 days this month." |

## 6. Navigation

| # | Item | Result | Evidence |
|---|---|---|---|
| 6.1 | Today "My period" | **Pass** | Opens Log bleeding over Today (full-screen dialog, y 0, h 585). |
| 6.2 | Preview summary | **Pass** | Goes to For my doctor. |
| 6.3 | Latest note | **Pass** | Opens the entry detail with "‹ Today", and back returns to Today. |
| 6.4 | Old sub-page links → entry detail / Records | **Partial** | Symptom links work. There is no way to reach an appointment or medicine detail from Timeline (2.8). |

## 7. Stage 1 leftovers

| # | Item | Result | Evidence |
|---|---|---|---|
| 7.1 | Usually + worst kept | **Partial** | A note saved with 6 / 9 shows "6/10 usually · 9/10 at worst" on the **Latest note** (31), the **Timeline** card (12) and the **doctor page** (14) ✓. **The entry editor still has one "How bad it was" row with only 9 selected** (13). |
| 7.2 | Toast | **Partial** | Opening a sheet while a toast is visible removes it (~0.6 s exit fade) ✓ (10). One toast at a time ✓. **The toast is still 318 px wide** (`li` x 20, w 318; the `ol` is 350) (09). At 390 it also covers the starter-chip row. |
| 7.3 | Back navigation | **Partial** | Timeline → symptom → back and Today → symptom → back are correct. Records detail is wrong (4.5). Appointments and medicines from Timeline can't be opened. |
| 7.4 | Title → greeting 8 px | **Fail** | h1 bottom 70.5, greeting top 92: **still 21.5 px.** |
| 7.5 | SeverityRow at 320 | **Partial** | No overlap now: columns 33 px, gap 8, last cell inside the row ✓. **But the cells are 33×44 vertical pills, not circles, and the hit area is 33 px wide** (spec: 44 px hit area, shrink only the visual) (29). |
| 7.6 | Icons 1.75 px drawn | **Fail** | Every icon still has `width="24"` plus a `size-5` / `size-8` class and `stroke-width="1.75"`. `absoluteStrokeWidth` (only passed in Records) computes from the `size` prop, not the CSS class, so it does nothing. The mic still draws **2.33 px** and the 20 px icons **1.46 px**. |

## Product rules

**Pass.** I scanned Today, the Timeline list (All), Month, Profile and Records, and the doctor page with all 8 sections expanded, for condition names, diagnos/likely/probab/predict/forecast, fertile/ovulat, streak/"in a row", irregular/abnormal/normal range, severe/moderate/mild, caused by/linked to/trigger/risk, "missed", "average"/"typical" and emoji: **no hits.** "Heavy" appears only as Sam's chosen flow. "Fibroids" appears only in Sam's own "I was told" text. Two soft concerns:

- Turning "Still going + Light" into **"Spotting"** relabels Sam's input (3.1).
- "Lower tummy right" is still inferred from "on the right side" (carried over from Stage 1).

## Width checks (320 / 390 / 430)

`scrollWidth == clientWidth` on Today, the Timeline list, Month, Profile and the capture sheet at all three widths. Month cells are 40×56 at 320, so the 36 px circles fit. The capture sheet is full width at 320.

## Visual-design notes

- **The List reads well.** Serif quotes against Inter metadata, the hairline cards and the quiet week headers give the calm, editorial feel the brief asks for. But the **missing clay edge** means the bleeding cards look the same as every other card apart from the small droplet. That edge was the List's main visual signal, so it should come first.
- **The glyph column** pushes the text 58 px in and centres the icon on the card, so it reads as a list-row avatar, not a type marker. Putting it inline with the date (20 px, 8 px gap) gives the text back 30 px and matches the spec.
- **The Month view is the strongest new screen.** The clay circles, the single plum dot and the today ring are clear and calm. The DaySheet positioning bug is the only thing that spoils it.
- **The entry detail and Records forms are below the Stage 1 bar.** The beige native selects, plain text inputs and stacked headline labels look like a settings form. They contradict the "Here's what I noted" card the user has just seen. Records nested under the Profile header (two titles, two back links) looks like a bug.
- **The Records list rows** show only a title and a stray "0". A date line ("Around April 2019 · still taking" / "Thu 24 Sep") would make them useful.
- **Mixed date formats on the doctor page:** "11–24 Sep 2026" vs "Sat 22 Aug – Thu 24 Sep". Minor; fold into 2b.

## Regressions

1. **Appointment and medicine entries can no longer be opened from Timeline** (in Stage 1 they opened, just with the wrong back target).
2. **Sheets opened from inside Timeline content (DaySheet, bleeding entry) are positioned against the page, not the screen**, because of the `animate-enter` transform/filter. They can open off-screen.
3. **Profile is unreachable from Timeline** (the avatar is under the "+").
4. **Timeline cards show made-up exact days for approximate dates** ("Mon 1 Apr 2019" for "Around April 2019").

## Paste-ready follow-up for Lovable

> Stage 2a is a good base. The List typography, the Month calendar and the "6 usually · 9 at worst" fix are right. Please fix these before Stage 2b. Keep all project rules (no condition names, predictions, threshold labels, causation, streaks, emoji).
>
> 1. **Dead taps (important).** Tapping an Appointment or Medicine card in Timeline does nothing. Open its record detail with "‹ Timeline" as the back label, and make back return to Timeline. Tapping a bleeding card should open a bleeding entry detail (status, flow, date, Delete), not the DaySheet.
> 2. **Sheets positioned wrong (important).** `.animate-enter` keeps `transform`/`filter` after the animation, so `position: fixed` sheets inside it are placed against the page. The DaySheet opens off-screen when the list is scrolled, isn't full width, and its scrim doesn't cover the tab bar. Portal all sheets to `document.body`, or end the animation with `transform: none; filter: none`.
> 3. **Clay edge (important).** `.tappable-card { border: 1px solid … }` overrides `border-l-4 border-l-bleeding`. Bleeding cards need a visible 4 px clay left edge (use an inset `::before` bar or put the rule in the components layer).
> 4. **Spotting.** `.spotting-day` has no CSS, so no hatch is drawn. Add the 1.5 px clay hatched outline with a clay numeral. Add an explicit **"Spotting"** status to Log bleeding, and stop turning "Still going + Light" into "Spotting". Give Log bleeding a date control, preset from the DaySheet day when opened there.
> 5. **Entry detail = NotedRows.** Replace the old form with the NotedRow layout and the same editors as the noted card: **two SeverityRows (Usually / At worst)**, zone chips for Where, the "Today ▾" date control (no future dates for symptoms), and a text-style red "Delete entry".
> 6. **Records forms.** Use the custom en-GB date picker. **Nothing pre-selected:** no highlighted "Exact date"/"Around", and no 24 Sep shown until Sam picks. Today the shown date isn't set and Save stays disabled. Keep Health history's told / done / result as separate fields (editing "Notes" currently wipes two of them).
> 7. **Records screens.** Render the list and detail as their own screens, not under the Profile header (there are two titles and two back links now). Remove the stray "0" on each row and add a date line instead ("Around April 2019", "Thu 24 Sep"). An existing record's back label must say the list it came from ("‹ Medicines"); it says "‹ Profile" now.
> 8. **Dates in the feed.** Approximate dates must stay approximate: "Around April 2019", not "Mon 1 Apr 2019". Capitalise months ("Started around April 2019"). Show the stop date when it differs. Week headers that cross a month must read "27 Jul–2 Aug", and add the year for other years ("24 Feb–1 Mar 2020").
> 9. **"Clear sample data"** text button at the very bottom of Profile (missing), so the empty states can be reviewed.
> 10. **Still open from Stage 1:** title→greeting gap is 21.5 px (needs 8). The toast is 318 px wide (needs `calc(100vw - 40px)` = 350 at 390). Icons: `absoluteStrokeWidth` only works with the `size` prop, so pass `size={20|24|32}` instead of `size-5` classes so every icon draws 1.75 px. SeverityRow at 320: keep the 44 px hit area and draw a 32–36 px circle inside it (now 33×44 pills).
>
> Minor (fold into 2b):
> 11. Remove the Profile avatar hidden under the Timeline "+".
> 12. Remember List/Month (and the filter) for the session.
> 13. Put the type glyph inline with the date on the card's top line.
> 14. Add a gap between "Add a note for this day" and "Log bleeding" in the DaySheet.
> 15. Hide "Bleeding logged on 0 days".
> 16. Scroll the selected filter chip into view.
> 17. Scroll the delete confirm card into view.
> 18. Rough day shows "8/10", not "8/10 at worst".
> 19. The follow-up for a back-dated note shouldn't say "today".
> 20. Calendar aria-labels should mention note/bleeding.
> 21. Use one date-range format on the doctor page.

## Scores

- **Timeline: 5 / 10.** The List typography, filters, Rough day handling, the "usually/worst" display and the Month calendar's fill/dot/ring are good. It is held back by dead taps on two entry types, sheets placed off-screen, the missing clay edge and spotting hatch, wrong cross-month headers, and an entry detail that is still the old form.
- **Profile / Records: 4 / 10.** The Records section, counts, fields, future dates and feed integration work. The list and form screens are nested under Profile, every row shows "0", forms use native selects with pre-selected defaults that block Save, back labels are wrong, Health history notes lose data, and the "Clear sample data" button is missing.
- **Overall app: 6 / 10** (Stage 1 was 8). Today and capture are still solid, and both strength values now survive everywhere except the editor. The new tab is functionally incomplete and has introduced regressions.

**Recommendation:** send items 1–10 as a separate fix message before Stage 2b. Items 1–4 are blocking: entries that can't be opened, sheets off-screen, and missing bleeding/spotting signals. Stage 2b (the doctor page) depends on the same entry and record data. Fold items 11–21 into 2b.

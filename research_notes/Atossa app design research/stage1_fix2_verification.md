# Stage 1 follow-up fixes: verification (Lovable commit f53cc8d3)

Checked on 2026-10-01 against the live preview `id-preview--b0b66a36-…lovable.app` after a hard reload. Like last time, the app ran in a same-origin iframe at **390×844** (also tested at 320 and 430), because Chrome won't go narrower. Measurements come from `getComputedStyle` / `getBoundingClientRect`. Screenshots are in `stage1_fix2_screens/` (01–20).

**Harness note:** the tab again reported `visibilityState = hidden`. To get around this, I overrode `document.hidden` / `visibilityState` inside the iframe so that Sonner's timers would run. With that override, the toast auto-dismissed between 3.2 s and 4.2 s after a save (polled at about 1 s intervals), so I count the 3 s auto-dismiss as working. I could not verify swipe-down: the drag tool took about 4 s, longer than the toast lasts, and synthetic pointer events don't trigger Sonner's swipe.

**Result: 11 Pass · 7 Partial · 0 Fail**

| # | Item | Result | Evidence |
|---|------|--------|----------|
| 1 | Strength / Where editing | **Partial** | On the noted card, tapping How strong now opens two SeverityRows (Usually / At worst) with nothing pre-selected, plus It varies / Not sure / Done (screen 10). Choosing 6 and 9 shows "6/10 usually · 9/10 at worst" on the card (11). Where opens multi-select zone chips with aria-pressed, and "Lower tummy left · Lower back" saved correctly (12). Values are no longer corrupted. **However, the "usually" value is dropped after saving:** the Latest note, the Timeline row, the doctor page and the entry editor all show only **9/10**, and the entry editor has a single "How bad it was" row with 9 selected (13, 18, 19). |
| 2 | Unanswered stays empty | **Pass** | A note saved with every follow-up skipped shows "+ Add strength" on the card (04). It has no score on the Latest note, the Timeline row or the doctor page (09), no bar on the chart, and is not counted in "15 saved scores" or the "3 to 9" range. Nothing is pre-selected in the entry editor. Log bleeding has nothing pre-selected, Save is disabled until a status is picked, and Flow is labelled "(optional)" (15). |
| 3 | Starter chip row scrolls | **Pass** | `.chip-track` has `overflow-x: auto`, `scrollbar-width: none` and a 24 px right fade; scrollWidth 573 > clientWidth 350. Scrolled to the end, "Just a quick note" is fully visible (01). At 320, 390 and 430, `scrollWidth == clientWidth` on all three tabs. |
| 4 | Toast | **Partial** | One toast at a time: two saves in a row replaced the toast instead of stacking ✓. The 3 s auto-dismiss works ✓ (see harness note). **Still 318 px wide** (x 20 → right gap 52). **It still overlaps an open sheet:** if a sheet opens within 3 s of a save, the toast sits on top (z-index 999999999) over the sheet's textarea (14, 16). It is neither deferred nor moved above the action area. On Today it also covers the Rough day Save button (717–773 vs toast 702–757). Swipe-down: not verifiable. |
| 5 | It varies / Not sure | **Pass** | "It varies" shows in the How strong row and as "Thu 24 Sep · It varies" on the doctor page. "Not sure" for "Got in the way of" is not listed or counted under "What stopped me doing things" (still 6). Minor: the Timeline row for that note shows just "Thu 24 Sep", without "It varies". |
| 6 | No "Mentioned in my words" | **Pass** | When is shown as a "+ Add when" chip. The doctor page leaves out the How long line for notes with no When (09). The phrase appears nowhere. |
| 7 | One note count | **Pass** | Toast, appointment card and doctor page agree at every check: 9/9/9, 10/10, 16/16/16, 18/18/18. The Timeline "N saved entries" matches too. |
| 8 | Keep this note? card | **Pass** | Save it / Discard / **Keep editing** (02). Keep editing, X on the card and Escape on the card all return to the note with the text intact (03). |
| 9 | Hero card | **Partial** | The background is now `#FFFFFF` under the plum gradient ✓. **Title→greeting is still 21.5 px** (h1 bottom 71, greeting top 92; spec 8). |
| 10 | SeverityRow layout | **Partial** | Both rows are `grid grid-cols-6 gap-2` and the columns now line up (same x in both rows at every width) ✓. The cells are a fixed `size-11` (44 px), not 1fr. **At 320 the overlap is still 3 px:** each column is 33 px but each cell is 44 px. The spec can't be met as written at 320: 6×44 + 5×8 = 304 px, but the row only has 238 px. |
| 11 | Button heights | **Pass** | Follow-up Continue 56 ✓. Doctor "Save notes" 48 (secondary, white) ✓, "Share PDF" 56. |
| 12 | Icons | **Partial** | The sheet close X is now 20 ✓. Every icon still has `stroke-width="1.75"` at every size, with no absoluteStrokeWidth and no `vector-effect`. As a result, the 32 px mic draws a 2.33 px stroke and the 20 px icons draw 1.46 px. The recording stop icon is `stroke-width 2` at 32 px, which draws 2.67 px. |
| 13 | +Add chip | **Pass** | The dashed span is 36 px high inside a 44 px parent; 15 px plum. |
| 14 | Back navigation | **Partial** | Profile now has the back link above the title (y28 vs title y72) ✓ (07). A symptom entry opened from Timeline returns to Timeline ✓. **Still wrong elsewhere:** an appointment opened from Timeline ("Thu 24 Sep Specialist clinic") goes back to the **Appointments list**, not Timeline (06). On the medicine and health-history detail pages the label always says "Timeline", but back goes to the Medicines / Health history list. |
| 15 | Dates | **Pass** | The doctor page shows "Around April 2019" (collapsed). The appointment year select runs from 2100 to 1900, so future years can be picked. Three native `<select>`s remain; the brief allows these until the forms are rebuilt. A 201-option year list is clumsy. |
| 16 | Type tokens Timeline / doctor | **Partial** | The items named in the brief are all fixed: section headings 24/30, "Your saved answers" 15/20, week labels 17/24, chart date labels 13/18. The doctor page is fully on-token. **Off-token sizes still on the Timeline:** "Cycle" 24/32, "August 2026" 20/28, "Period logged: 21–26 Aug" 18/28, "Open calendar" 16/24, calendar day digits 13/13, and the Medicines / Health history counts at 30/36/500. |
| 17 | Timeline chart date axis | **Pass** | 14 grid columns for 11–24 Sep, one per day, with empty days left empty. Eight entries on 24 Sep are grouped into thin bars inside that day's slot (17). Bars use the ramp. |
| 18 | Small fixes | **Pass** | Most recent appointment is "Thu 24 Sep" ✓. The Rough day Latest note reads "Rough day · 7/10" with no duplicate tag ✓. A single question has no counter (20) ✓. Switching Speak→Type and "Type instead" both focus the textarea ✓. "When opening bowels" is gone from Where ✓. Log bleeding / Flow options have aria-pressed ✓. "Started today" makes the doctor page show "Latest period: Started Thu 24 Sep" ✓. |

## Regression spot-checks

| Check | Result |
|---|---|
| Card radii | Pass. Only 20 / 14 / 999 are used app-wide, plus one 14/14/0/0. |
| Mic auto-record | Pass. One tap opens the sheet already recording ("0:01 · Tap to stop"). |
| X / Escape close | Pass. With no text the sheet closes at once. With text you get the Keep card, and X/Escape on the card go back. |
| Follow-ups skip known fields | Pass. "sharp pain low down on the left since Tuesday, had to leave work" asks only for strength. |
| Rough day no quote | Pass. "Rough day · 7/10" in Inter, not listed in "Symptoms in my words". |
| Serif usage | Pass. Instrument Serif is used only on the hero prompt, Sam's quote on the Latest note, and "Your summary". |
| Tab bar | Pass. |
| No horizontal page scroll 320/390/430 | Pass on all three tabs. |
| Product rules | Pass. I scanned all three tabs, with every doctor section expanded, for condition names, "diagnos", "likely", "probab", "predict", "streak", "severe / mild / moderate", "normal range", "caused by", "risk", "fertile", "ovulat" and emoji: no hits. ("Fibroids" appears only inside Sam's own "I was told" records.) |
| **New regression: chart values hidden** | The value digits above the bars are now `sr-only`, so there are no visible numbers and no y-axis. The bar heights can't be read (05, 17). |

## Other issues found

- **Where is inferred beyond Sam's words.** "Sharp twinges on the right side" pre-filled Where as "Lower tummy right". In the other direction, "Achy and heavy feeling in my legs" skipped the Where question but left Where empty ("+ Add where").
- On the doctor page, the heading "Symptoms in my words (10)" wraps, so the count drops onto its own line at 390.

## Paste-ready follow-up for Lovable

> Stage 1 is close. Please fix these. Keep the project rules (no condition names, predictions, threshold labels, causation, streaks, emoji).
>
> 1. **Keep both strength values (important).** The noted card saves "6/10 usually · 9/10 at worst", but after saving only "9/10" appears on the Latest note, the Timeline row, the doctor page and the entry editor (which has a single "How bad it was" row). Store `usual` and `worst` separately. Show "6 usually · 9 at worst" in all of those places. Give the entry editor the same two SeverityRows. Chart, ranges and counts should use `worst`.
> 2. **Toast over sheets (important).** If a sheet opens while a toast is showing, dismiss the toast (or hide it until the sheet closes). It currently sits over the sheet's textarea. Make it 350 px wide at 390 (left and right 20 px, `--width: calc(100vw - 40px)`). Also keep it off the Rough day Save button: dismiss it when the user taps Save again, or offset it above that card's button.
> 3. **Back navigation.** An appointment opened from Timeline must go back to Timeline (it goes to the Appointments list). On the Medicine, Health history and Appointment detail pages, the back label must name the actual previous screen (it always says "Timeline").
> 4. **Chart values.** Show the value digit above each bar again (caption 13/18, ink-2). It is `sr-only` now, so the bars have no readable values. For grouped days, show the day's highest value above the group.
> 5. **Hero rhythm.** Title→greeting gap must be 8 px (it is 21.5).
>
> Minor (can fold into Stage 2):
> 6. Icons: use `absoluteStrokeWidth` (1.75 px at 20/24/32; the stop icon too).
> 7. SeverityRow at 320: 6×44 + gaps doesn't fit in 238 px. Below 360 px wide, use `gap: 4px` with 1fr columns and a 36 px visual circle inside a 44 px hit area, so nothing overlaps.
> 8. Timeline off-token sizes: "Cycle" 24/30, "August 2026" 17/24/600, "Period logged" 17/24, "Open calendar" 15/20, calendar digits 13/18, Medicines / Health history counts on the type scale (24/30).
> 9. Show "It varies" on the Timeline row too. Don't turn "right side" into "Lower tummy right": only pre-fill Where with the words Sam used, and if a follow-up is skipped because Where was mentioned, pre-fill it.
> 10. Replace the native date selects with the custom picker when those forms are rebuilt.

## Overall score: **8 / 10** for Stage 1 (Today + capture) (was 7 / 10)

Both blockers from last round are fixed. Unanswered strength now stays empty everywhere, and editing How strong uses real SeverityRows, so the GP summary no longer shows wrong numbers. Where has proper chips, the chip row scrolls, counts agree, and the Keep-this-note card, Log bleeding defaults, the date axis and most small fixes are done. What keeps it from 9: the "usually" value is lost after saving (a half-captured answer, though not a wrong one), the toast can still sit on an open sheet and is the wrong width, and the chart has lost its visible values. Items 1, 2 and 3 are worth fixing before or at the very start of Stage 2. The rest can be folded into Stage 2.

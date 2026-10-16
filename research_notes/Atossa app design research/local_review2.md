# Local build: review 2 (combined UX + visual)

Reviewer: senior product + visual designer (iOS health). Date: 2026-10-02.
Build: `mvp-symptom-capture` working tree, web preview at http://localhost:8081 (design-preview mode, Sam, today = Thu 24 Sep 2026).
Spec: "Warm Paper, Deep Ink" (`reports/Atossa app design research.md` lines 47–200), `design/KIT.md`, `review_brief.md`, plus the round-1 reviews `local_review1_ux.md` (1–31) and `local_review1_visual.md` (V1–V31).
Screenshots: `local_review2_screens/` (58 files, `NN_description.jpg`).

**How I tested.** I used a visible Chrome tab (the window can't go below 500 × 589 CSS px). For 390 and 320 I loaded routes in same-origin iframes and measured them with JS. I checked visibility (`document.visibilityState = visible`) before testing scroll and tap behaviour. I went through every flow in the brief:
- **Capture:** typed note with a duration, a vague note, escape chips, "That's all for now", Rough day and the starter chips.
- **Noted card and entry detail:** edits to every row, including When and How long.
- **Timeline:** List, filters, the period run screen, bleeding detail edit and delete, entry delete, Month, DaySheet, and logging spotting and bleeding from a day.
- **Profile and records:** grouped Profile, Appointments add (future date), the discard guard, Medicine edit and delete confirm, and the Health history list.
- **Clear sample data:** every empty state.
- **For my doctor:** range chips including Since last appointment, the agenda, the preview thumbnail and reader, toggles, Show on screen, and the disabled states.

I did not fire Share or Print.

**Lead decisions respected:**
- UX #1 (Friends) is pending the user's decision.
- The solid plum selected SeverityRow is intentional.
- When and How long are separate fields.

---

## 1. Scores and verdict

| | Round 1 | Round 2 |
|---|---|---|
| UX | 7 / 10 | **8 / 10** |
| Visual | 7 / 10 | **8 / 10** |

**Verdict: it now reads as a professional, calm health app and is close to featured quality, but it is not there yet.** The fix round landed almost everything:
- **Severity:** the selected disc is solid plum, the grid is edge-aligned with 44 pt discs, and Timeline cards carry a severity tag.
- **Text and layout:** there is one FieldLabel system, values are in ink, Profile is inset-grouped, the segmented control is a pill, and the headers have a quiet "+".
- **Capture:** When and How long are kept separately, the Where editor takes free text, the noted card has a Tried row, and follow-ups always open at the top.
- **GP document:** it now includes a "4 more notes" line, a legible reader sheet, a B/W-safe bleeding underline with a key, definition-row visits, and a real empty state.
- **Navigation:** tab switches land on the tab root.

What still stops it being featured quality:
- **A dead first tap returns after saving bleeding.** It happens after saving from Log bleeding, wherever the sheet was opened.
- **The "thumbnail" is the whole document.** For my doctor renders the entire 2-page document inline, inside its own nested scroll.
- **The GP page has some data-fidelity slips:**
  - spotting is reported as bleeding;
  - a future appointment is labelled "Why I went";
  - the newest note isn't quoted.
- **Friends still offers cycle-phase sharing.** This is pending the user's decision.

**Hard product rules.** I read the text on every screen:
- no condition names, likelihoods, causes or treatments;
- no predictions (Month shows future days greyed, with no forecasts);
- no threshold labels, causation, streaks, praise or emoji.

"Heavy" appears only as a flow value Sam chose. "Fibroids" appears only in her "I was told" records. The only open item is Friends: "Share only your cycle phase with people you invite" (UX #1, pending). The safety line is static, in Profile and at the foot of For my doctor. The console showed no errors apart from the new POP_TO_TOP warning (N2).

---

## 2. Round-1 verification

**Totals: 56 Pass · 4 Partial · 1 Fail · 1 Pending** (UX 26 / 3 / 1 / 1; visual 30 / 1 / 0).

### The four specific checks

| Check | Result | Evidence |
|---|---|---|
| First tap after closing a sheet works | **Partial** | It works after X, Escape, capture save and "That's all for now" (05, 14). It **fails 3 of 3 times** after **Save in Log bleeding**, opened from the DaySheet or from Today "My period". A tap on a day or chip within about 1.5 s of saving does nothing; the second tap works (28). After 4.5 s it works. `elementFromPoint` returns the correct day button, so no overlay is in the way: it is a lost press, not a hit-test problem. See N1. |
| Delete ConfirmCards scroll into view | **Pass** | The entry (16), bleeding (24) and record (41) cards show title, message, Delete and Cancel fully above the tab bar. |
| Timeline tab resets to the list | **Pass, with a regression** | Today → Timeline lands on `/timeline` even when an entry was open. Re-tapping Timeline on an entry pops to the list, but it logs "The action 'POP_TO_TOP' was not handled by any navigator", which in dev raises a full-screen LogBox that blocks every tap (19). See N2. |
| Deleted notes don't reopen | **Pass** | Delete from an entry opened from Today returns to Today with "Note deleted." (17). The Timeline tab then shows the list. Browser back does not resurrect the note. |

### UX 1–31

| # | Item | Result | Evidence / note |
|---|---|---|---|
| 1 | Friends cycle phase | **Pending** | Still on Profile: "Share only your cycle phase with people you invite". Awaiting the user's decision. |
| 2 | Summary drops notes | Pass | "4 more notes in my words, saved in Atossa." |
| 3 | Full-size preview unreadable | Pass | The reader sheet renders unscaled: body 15/21, quotes 17/23 (46). |
| 4 | When overwrote duration | Pass | "since Tuesday" was inferred into How long. Changing When to "Only around my period" kept "Since Tuesday" in the noted card, the entry detail and the document (11, 15). |
| 5 | Dead first tap | **Partial** | See above and N1. |
| 6 | Stale Timeline screen | Pass | See above. Regression N2. |
| 7 | Doctor empty state | Pass | "Nothing to share yet…" with Add a note. Share, Print and Show are `aria-disabled` (55). |
| 8 | Follow-up scroll offset | Pass | Every question opens at the top, with the heading and "Why I'm asking" visible (07). |
| 9 | No Tried row | Pass | The Tried row is present. Text typed without pressing Done is still saved (13, 15). |
| 10 | Where editor | Pass | "Somewhere else" text plus Not sure / It varies; saved as "Lower tummy left · my hips" (12). |
| 11 | Fix something replays | Pass (code) | `CaptureSheet.fixSomething` opens the first filled row. Not exercised live. |
| 12 | Escape labels | Pass | The card reads "Where: it varies" (33). |
| 13 | Confirm below fold | Pass | See above. |
| 14 | Year chip scroll | Pass | Cortisone "2019" is centred (40). |
| 15 | Switch colours | Pass | Plum track, white thumb (48). |
| 16 | Show on screen tab bar | Pass | Full screen with a Done pill and no tab bar (49). |
| 17 | Share bar height / wrap | Pass | One row at 390 and 320: Share PDF (160 × 56) plus two 48 icon buttons. |
| 18 | Future appointment form | Pass | A future date shows "What it's for" / "Anything else" only (36). |
| 19 | Health history rows | Pass | e.g. "Around March 2023 · …" content subtitles (39). |
| 20 | a11y states / 320 hit | **Partial** | Radios and chips emit `aria-checked`. At 320 the severity cells measure 40 px wide on web; `hitSlop` exists but only applies on native. The section switches' `role=switch` wrapper has no `aria-checked` (the inner input is checked). |
| 21 | Doctor copy and range | Pass | The agenda says "What I'd like from today" only on appointment day, otherwise "…from this appointment". It is now a white bordered field. Since last appointment shows "(around March 2020) · showing the last 6 months" (47). |
| 22 | Add more caret | Pass (code) | `setSelection(len, len)` in CaptureSheet. Not exercised live. |
| 23 | Rough day Save | Pass | Sunken when disabled; plum primary once a number is chosen (02). |
| 24 | "0 notes ready" | Pass (code) | Shows "No notes yet". |
| 25 | Month polish | Pass | The spotting hatch has a white disc behind the numeral (28). Future days are ink-3. "Edit bleeding" appears on a logged day. The DaySheet cards show only the time (29). |
| 26 | Timeline list | Pass | Periods merge into one card ("21–26 Aug · 6 days · Medium, Heavy"). The selected filter scrolls into view (20). Both chip scrollers have right fades. |
| 27 | Consistency | **Partial** | Delete / Cancel are used everywhere, the Delete style is the same everywhere, and the entry title is now "Note". **New notes still have no time**, while seed notes show "· 15:10". |
| 28 | Around layout jump | Pass | The summary line is always reserved ("Not set yet" / "Choose a day" / value). |
| 29 | Bottom zone label | Pass | "Bottom / when opening bowels". |
| 30 | Toast covers last control | **Fail** (low; accepted as-is in round 1) | It still covers "Restore sample data" for 3 s (52). |
| 31 | Restore flag | Pass (code) | Uses `sampleCleared`, not a record count. A live retest was invalidated by a reload. |

### Visual V1–V31

| # | Result | Evidence / note |
|---|---|---|
| V1 | Pass | 44 discs. Selected = solid plum with a white 600 digit (02). |
| V2 | Pass | `PAGE_TYPE`: body 10.5/14.5, head 12/16, quote 12/16, meta 9, strip 8.5/9, footer 8. |
| V3 | Pass | The tint band is gone. A continuous clay underline per run plus a key "▬ = bleeding logged" (45). Caveat: spotting is drawn the same way (N4). |
| V4 | Pass | NotedRow value is 17/24 ink (09). |
| V5 | Pass | FieldLabel 17/600 ink everywhere I sampled ("Date", "What's happening?", "Flow · Optional", "Usually", "At worst", "Who or where"). |
| V6 | Pass | The wash goes plum-tint → canvas → transparent over the top 40%. It reads warm. |
| V7 | Pass | "Tap to talk" 17/600 ink; "Type instead" 15/500 plum. |
| V8 | Pass | Row 1 runs edge to edge; row 2 (5 discs) is centred. The captions sit under the first and last discs. |
| V9 | Pass | Pill track; white thumb with a hairline and a 0 1 2 shadow. |
| V10 | Pass | Week header 15/20 600 ink-2. |
| V11 | **Partial** | The GlyphLine is now 13/500 ink-3 and a SeverityTag leads the fact line. But "at worst" is left dangling after the pill and wraps ("[9/10] at worst · Across my lower / belly…"). Weekly grouping was not done. See N7. |
| V12 | Pass | "8/10 at worst" never breaks internally. |
| V13 | Pass | Primary plus one row of two text buttons (11). |
| V14 | Pass | A hairline appears under the sticky header on scroll (08). |
| V15 | Pass | Filters bleed to the edge with a fade. |
| V16 | Pass | One plain plum "+". It is hidden in the Timeline empty state (54). |
| V17 | Pass | Inset-grouped Profile with glyphs, counts and Sign out as a row (34). |
| V18 | Pass | Profile opened from Timeline keeps Timeline tinted. |
| V19 | Pass | Large: title 34 serif, head 20/26, quote 26/34. |
| V20 | Pass | Empty weeks collapse ("No entries 5–18 Aug") (51). |
| V21 | Pass | Definition rows per visit (44). |
| V22 | Pass | See UX #17. |
| V23 | Pass | Clay droplet in the Log bleeding title and under the Bleeding detail title (04, 23). |
| V24 | Pass | "What's", "happening…", and curly apostrophes in quotes. |
| V25 | Pass | Chip label weight is fixed at 500. |
| V26 | Pass | Clay capsules join runs, broken at week boundaries (26). |
| V27 | Pass | Plum month chevrons, ink sheet X. |
| V28 | Pass | Saved-tint toast with a 1 px saved/20% border and its own float shadow. |
| V29 | Pass | At 390: "What's been going on / with your body?" (56). |
| V30 | Pass | Icon plus centred message plus one primary (54). |
| V31 | Pass | The avatar is sunken with an ink-2 initial. |

---

## 3. New issues (fix list)

Counts: **Critical 0 · High 1 · Medium 9 · Low 12.** File ownership follows `design/KIT.md`.

### High

**N1. High · Log bleeding (Today "My period", DaySheet "Log bleeding", Timeline "Log a period") › first tap after Save is lost.**
- **Problem:** reproduced 3 of 3 times at a 1.5 s delay; a tap at 4.5 s works. Closing with X, and saving a capture, do not have the bug. `LogBleedingSheet.save()` awaits `savePeriodDays`, then calls `onClose()` and `showToast()` while the Save button is still the active press responder. On web, `Sheet` unmounts the Modal synchronously on close, so RN-web's responder system is left holding a removed node, and the next press only clears it. Sam taps a day or chip and nothing happens.
- **Fix:** in `components/atossa/LogBleedingSheet.tsx`, close on the next frame: `requestAnimationFrame(() => { onClose(); showToast(...); })`. Do the same wherever a Sheet closes from inside an async onPress (audit `RecordDetail` sheets, Today's add-appointment sheet). Or, in `components/atossa/kit-parts/Sheet.tsx`, defer the web unmount: `setTimeout(() => setMounted(false), 0)` after `releaseFocus()`.
- **Verify:** Save → tap a calendar day within 1 s → the DaySheet opens. Check on an iOS device too.

### Medium

**N2. Medium · Tab bar › re-tapping the active tab while a detail is open logs "POP_TO_TOP was not handled".**
- **Problem:** the stack pops correctly, but in dev the error raises a full-screen LogBox that eats every tap until it is dismissed (19). `MainTabBar` emits `tabPress`, and the nested native stack already pops to top on `tabPress`. Then `resetToRoot()` dispatches a RESET, or a second pop runs against an empty stack.
- **Fix:** in `components/atossa/MainTabBar.tsx`, call `resetToRoot()` only when `!isCurrent` (switching tabs). When the tab is current, rely on the stack's own `tabPress` pop-to-top, or call `event.preventDefault()` and do the reset yourself. Do one or the other, never both.

**N3. Medium · For my doctor › the preview "thumbnail" is the whole document in a nested scroll.**
- **Problem:** the card is 871 px tall at 390 and 1,135 px at 500. It renders all 2 pages at 0.47–0.77 scale (6–9 px text) inside its own ScrollView (scrollHeight 1,485 / 869) inside the page scroll. That makes a scroll trap, and Sections are pushed about 900 px down (43, 58).
- **Fix:** in `components/atossa/doctor/DocumentPreview.tsx`, render a fixed-height A4 crop of page 1:
  - `height = width × 1.414`, capped at 420;
  - `overflow: hidden` and `pointerEvents="none"` on the content, with no inner ScrollView;
  - a 48 px white→transparent fade at the bottom, and a caption under the card: "About 2 pages · tap to read it".
  
  The tap opens the existing reader sheet. Keep the hero shadow.

**N4. Medium · GP document › spotting is reported as bleeding.**
- **Problem:** with spotting on 8, 17 and 24 Sep, the page strip draws the same clay underline under those days, and the caption says "Notes were logged on 8 of 93 days; 3 of those were bleeding days." The in-app calendar distinguishes spotting (hatch), but the GP page doesn't.
- **Fix:** in `lib/records/summary.ts` (`stripSvg`, caption) and `components/atossa/doctor/HeatStrip.tsx`:
  - draw spotting as a 1.5 pt dashed clay underline, and add "┄ = spotting logged" to the key;
  - make the caption count them separately: "…; 1 was a bleeding day and 2 were spotting days."

**N5. Medium · GP document › future appointment shown as past.**
- **Problem:** the document reads "9 Oct 2026 · GP surgery · Why I went: Talk about the pain", although the range ends 24 Sep and the visit hasn't happened.
- **Fix:** in `summary.ts` / `DocumentView.tsx`:
  - exclude appointments after `todayKey()` from "Appointments", or show them in a one-line "Next appointment: Fri 9 Oct · GP surgery · What it's for: …";
  - use the label "What it's for" (not "Why I went") whenever the date is today or in the future.

**N6. Medium · GP document › the newest worded note is not quoted.**
- **Problem:** "bad headache this evening" (Thu 24 Sep, typed, no time) went into the "4 more notes" count, while older seed notes were quoted. `pickQuotes` says the newest note is always first. The new note has no time, so it probably sorts behind "Thu 24 Sep · 15:10".
- **Fix:** in `lib/records/summary.ts` `pickQuotes`, sort by `created_at`/record timestamp (falling back to date + time). Store a time on every new note (see N12).

**N7. Medium · Timeline cards › the severity line reads broken.**
- **Problem:** "[9/10] at worst · Across my lower belly and down my / legs". The "at worst" sits outside the pill and wraps under it (18, 57). A quick log shows the pill alone, and Today's latest-note card shows plain "7/10" for the same record.
- **Fix:** in `components/atossa/timeline/EntryCard.tsx`, render `SeverityTag value={worst} suffix=" at worst"` so the words sit inside the pill, then the facts on the same baseline (`FactLine` with `numberOfLines={2}`). Use the same SeverityTag in Today's `LatestNoteCard` (`components/atossa/capture/TodayCards.tsx`).

**N8. Medium · Timeline › period run screen is a wall of cards.**
- **Problem:** six bordered cards, each with its own clay edge, droplet and chevron (22). It is the noisiest screen in the app.
- **Fix:** in `components/atossa/timeline/PeriodRun.tsx`, show one white card with the clay edge once, and 56 pt rows "Fri 21 Aug · Started · Medium" with hairline dividers inset by 20 and a chevron per row. Use the same grouped pattern as Profile (`records/GroupedRows.tsx`).

**N9. Medium · Noted card and entry detail › the inline editor opens below the fold.**
- **Problem:** tapping When or Tried near the bottom expands the editor off-screen. Only the top chip row or the field top is visible (10, 13), and Sam has to scroll to find Done.
- **Fix:** in `components/atossa/capture/NotedCard.tsx` and `components/atossa/timeline/EntryDetail.tsx`, on row open measure the row (`onLayout`) and scroll the sheet or page so the row's top sits 16 pt below the sticky header (`scrollRef.scrollTo({y: rowY − 16})`).

**N10. Medium · Bleeding › switching to Spotting keeps the old flow.**
- **Problem:** today was logged "Started · Medium" and then changed to Spotting. It saved "Spotting · Medium" (32), which contradicts itself and flows into the GP page.
- **Fix:** in `LogBleedingSheet.tsx` and `timeline/BleedingDetail.tsx`, clear `flow` when the status changes to `spotting` (and hide the Flow group for spotting, or offer only None / Light).

### Low

**N11. Low · Timeline list › bleeding card inset.**
- **Problem:** the content starts at x 45, not 41, because of the 4 px edge (21).
- **Fix:** in `EntryCard`, subtract the edge width from the left padding when `edge="clay"`. This was also noted in UX round 1.

**N12. Low · New notes have no time.**
- **Problem:** typed notes and quick logs show only "Thu 24 Sep", while seed notes show "· 15:10" (UX #27 leftover).
- **Fix:** capture writers (`CaptureSheet`, Rough day) save the time, and EntryCard/GlyphLine show it.

**N13. Low · Timeline list › a period is grouped under the week it ends.**
- **Problem:** "21–26 Aug" sits under "24–30 Aug".
- **Fix:** in `components/atossa/timeline/feed.ts`, group period runs by their start date.

**N14. Low · Capture › "Tried …" in Sam's words isn't prefilled.**
- **Problem:** "…Tried a hot water bottle" left Tried empty.
- **Fix:** in `components/atossa/capture/infer.ts`, prefill `tried` from a `tried|took|used …` clause (her words, verbatim).

**N15. Low · Show on screen › content runs under the floating Done pill.**
- **Problem:** content scrolls under the Done pill with no backing, and the meta wraps an orphan year ("Wed 23 Sep / 2026") (50).
- **Fix:** in `app/(tabs)/doctor/show.tsx`, give the top bar a canvas/white background with a hairline on scroll. In large mode, drop the year when it is the current year, or put a non-breaking space between "Sep" and the year.

**N16. Low · Heat-strip details.**
- **Problem:**
  - On the page strip, adjacent high cells crowd ("8" and "9" touch at 23–24 Sep) (45).
  - In large mode, an empty row's final-day underline sits directly above the next row's cell, so it reads as belonging to that cell (51).
  - The large strip uses about 330 of 460 px.
- **Fix:** in `HeatStrip.tsx`:
  - inset cells by 1 px per side;
  - draw underlines inside their own row box (below the cells);
  - stretch large-mode columns to the full width.

**N17. Low · Records lists don't match Profile.**
- **Problem:** Medicines, Appointments and Health history are still one bordered card per item (35, 39).
- **Fix:** in `components/atossa/records/RecordsList.tsx`, use `GroupedRows` (one inset-grouped card).

**N18. Low · Record detail Save.**
- **Problem:** it is always enabled and carries a check icon. Bleeding detail Save is disabled until something changes and has no icon.
- **Fix:** in `RecordDetail.tsx`, drop the icon and disable Save until the form is dirty.

**N19. Low · Doctor empty state.**
- **Problem:** visit type, range and agenda still show above "Nothing to share yet". The disabled Print and Show buttons look the same as enabled ones.
- **Fix:** in `app/(tabs)/doctor/index.tsx`, hide steps 1–3 when the range has 0 entries. In the share bar, render disabled icon buttons with an ink-3 glyph on sunken.

**N20. Low · Range punctuation.**
- **Problem:** "Around June 2015–around June 2016" vs "Around June 2015 – still taking".
- **Fix:** in `format.ts`, use one rule: spaced en dash whenever either side has more than one word.

**N21. Low · ConfirmCard hierarchy.**
- **Problem:** the destructive "Delete" is a plain red text link while "Cancel" is the outlined button, so Cancel reads as the main action, and the whole card is error-tinted (16).
- **Fix:** in the kit `ConfirmCard`:
  - a white card with an `error` hairline;
  - "Delete" as a 48 pt outline button in error red;
  - "Cancel" as a text button beside it;
  - keep both in one row.

**N22. Low · Today › appointment card on appointment day.**
- **Problem:** it reads "Next appointment · Specialist clinic · Thu 24 Sep" when the appointment is today.
- **Fix:** in `AppointmentCard.tsx`, use "Appointment today", matching For my doctor's header.

---

## 4. Top 5 remaining

1. **Decide Friends (UX #1).** It is the only hard-rule exposure left. Either remove it or limit it to logged facts.
2. **Kill the last dead tap (N1) and the POP_TO_TOP double dispatch (N2).** Both make a calm app feel broken right after Sam does the thing it asks her to do.
3. **Make the doctor preview a real thumbnail (N3).** A fixed page-1 crop that opens the reader, with no nested scroll.
4. **GP-page data fidelity (N4, N5, N6, N10).** Distinguish spotting, don't present future visits as past, always quote the newest note, and don't let spotting carry a flow. The document is the product's promise.
5. **Card polish on Timeline (N7, N8, N9, N12).** Put "at worst" inside the severity pill, group the period run into one card, scroll inline editors into view, and add times on new notes.

---

## 5. Untested / limits

- I did not exercise Fix something or the Add more caret live; I verified them in code.
- I did not complete a live re-test of #31: navigating reloaded the app and re-seeded the data. I verified it in code.
- Share PDF, Print, the PDF/print rendering, voice capture, haptics, the keyboard, swipe-to-dismiss, VoiceOver and Dynamic Type are not testable in the web preview.
- Viewport: the window minimum is 500 × 589. I checked 390 and 320 in iframes for horizontal overflow (none at page level), the hero rag, the share bar and SeverityRow geometry.
- I used the pre-existing Atossa tab in the MCP group (`1584914827`) for the visible-tab checks, because new tabs opened hidden behind it. I left it open.

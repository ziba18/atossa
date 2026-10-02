# Local build: visual design review 1 (React Native / Expo web preview)

Reviewer: senior graphic / visual designer (iOS health). Date: 2026-10-01.
Build: `mvp-symptom-capture` working tree, `npm run preview:web` at http://localhost:8081 (design preview, Sam, today = Thu 24 Sep 2026).
Spec: "Warm Paper, Deep Ink" (`reports/Atossa app design research.md` lines 47–200), `design/KIT.md`, `review_brief.md`.
This is a companion to `local_review1_ux.md`. **I do not repeat its findings.** Where I agree with one, I cite it as "UX #n". Everything below is visual craft that review did not cover.
Screenshots: `local_review1_screens/v01–v33_*.jpg`. v01–v20 were taken at a 500 px viewport. v21–v33 were taken in a same-origin 390 × 640 iframe, because Chrome would not size the window below 500.

**How I measured.** I read computed styles with JS (read-only): font family, size, line height and colour; box radii, borders, shadows and padding; SVG stroke widths; and `font-variant-numeric`. Contrast ratios are WCAG 2.x values computed from the token hexes. I tagged web-only artefacts as such. Two are excluded:
- The tab bar's 2 px top border is web-only. `StyleSheet.hairlineWidth * 2` is 0.67 pt on a 3× iPhone.
- The blue textarea focus ring is web-only and already UX #3 of capture.

---

## 1. Overall visual score: **7 / 10**

**Verdict: disciplined and calm, but not yet "featured".** The system is applied with real rigour:
- **Type:** one face family. Inter 400/500/600 with no 700 anywhere, and tabular numerals on every number I sampled. Instrument Serif appears only in Sam's quotes, the Today hero and the summary title.
- **Shape and colour:** hairline white cards at radius 20, with shadows only on the hero and the document. Clay is used only for bleeding. Lucide icons render at an absolute 1.75 px stroke at every size (24 → 1.75, 20 → 2.1 × 20/24, 32 → 1.3125 × 32/24).
- **Feel:** nothing shouts, nothing is pink, and nothing is gamified.

What separates it from Apple Health, Oura or Granola is **hierarchy and finish, not rule-breaking**:
- Too many things share the same grey 13–15 px styles, so labels, values, dates and facts flatten into one tone.
- The most important input in the product, the 0–10 severity choice, has the weakest selected state in the app.
- Field labels come in five different styles.
- Lists are walls of identically weighted bordered cards.
- The GP document's print type is too small, and its section heads are barely bigger than its body. Its heat-strip's bleeding band is indistinguishable from low-severity cells in black-and-white print.

None of this needs a new direction. It needs about 30 small, mostly token-level changes.

**Hard rules:** I found no new breach (Friends is UX #1). One spec tension is noted in V31: the avatar uses plum-tint, the selection colour.

---

## 2. Per screen / state

| Screen / state | Score | What works | Problems (fix #) |
|---|---|---|---|
| **Today** (v01, v29, v30) | 7.5 | One hero with a 30/36 serif prompt and a 72 pt plum mic. Consistent 24 pt card rhythm (370→386→454→766→904). The chip row now bleeds to the edge with a 32 px fade. | Hero wash reads cool grey (V6). "Type instead" outweighs "Tap to talk" (V7). The severity grid is ragged and inset (V8). Facts wrap with an orphan (V12). |
| **Capture: type** (v02) | 7 | Clear title/helper pair (24/600 + 15 ink-2). Disabled Continue is sunken. | The segmented control nearly vanishes on canvas (V9). Straight apostrophe and "..." (V24). |
| **Capture: follow-ups** (v03, v04) | 6.5 | "Why I'm asking" sits right under the question. Ghost chips are distinct. | Weak selected severity (V1). "Usually"/"At worst" group labels have the same style as the captions (V5). The sticky header clips glyphs (V14). Chips reflow on select (V25). |
| **Noted card** (v05, v06) | 7 | Granola-style rows. The serif quote is used correctly. Dividers are inset to the padding. | Grey label over grey value (V4). A stack of three pill buttons (V13). |
| **Toast** | 7 | Saved tint, check icon, r14. | Low separation from the canvas (V28). |
| **Log bleeding** (v07) | 7 | Clean chip groups. Save is disabled until a status is chosen. | No clay identity (V23). Label styles differ from other sheets (V5). |
| **Timeline list** (v08–v11) | 7 | 4 px clay edge, inline glyphs, 2-line serif clamp. | Week headers have the same style as card titles (V10). Date and facts share one style, and there is no severity visual (V11). Hard-clipped filters (V15). Heavy "+" disc (V16). |
| **Timeline month + day sheet** (v12–v14) | 7.5 | Calm grid, a 1.5 px ink today ring, solid clay discs, no predictions. | A period reads as 6 separate discs (V26). Chevron colour rule (V27). |
| **Entry / bleeding detail** (v15, v16) | 6.5 | The same NotedRows as capture. AddFieldChip is dashed. | Three label styles on one screen (V5). No bleeding glyph (V23). Straight apostrophes in quotes (V24). |
| **Profile + records** (v17–v20) | 6 | Calm copy, the safety line, good list subtitles. | Six single-row cards (V17). No tab selected (V18). Add affordances are inconsistent (V16). "Optional" appears in 3 placements (V5). |
| **For my doctor builder** (v21–v25) | 6.5 | A real white A4 card with the hero shadow. Clear step order. | "Show on screen" wraps **at 390**, not only at 320 (V22). Teal switch thumbs (UX #15). The agenda field is sunken (UX #21). |
| **Document preview (as a clinical one-pager)** (v23, v24, v28) | 6 | Good title (22 pt serif), a ruled header, provenance footer, the ramp always with a digit. | Print type is too small and flat (V2). The heat-strip fails B/W print (V3). Appointments and history are run-on paragraphs (V21). |
| **Show on screen** (v26, v27) | 6 | White, large, serif quotes at 24. | Headings outshout content (V19). Strip rows are mostly empty (V20). The tab bar is visible (UX #16). |
| **Empty states** (v30–v33) | 6.5 | Calm one-liners. Doctor sharing is disabled at 0 notes. | Timeline shows two plum primaries for one action, and the message is top-hung (V16, V30). |

---

## 3. Fix list

Severity counts: **Critical 0 · High 5 · Medium 18 · Low 8**. File ownership follows `design/KIT.md`.

### High

**V1. High · Severity selection (Rough day, follow-ups, StrengthEditor).**
- **Problem:** the selected disc is plum-tint `#EFE6EF` on white (1.15:1), with a 2 px plum ring and a plum 600 digit. At arm's length "3 selected" and "3 unselected" look nearly the same (v03). It is also a 36 px disc floating in a 70–77 px column, smaller than every other control (44 chip, 48/56 button). This is the product's single most important input.
- **Fix** in `components/atossa/kit-parts/severity.tsx`:
  - Raise `DOT` from 36 to 44.
  - Make `dotSelected` `{ backgroundColor: colors.plum, borderColor: colors.plum, borderWidth: 0 }` and `digitSelected` `{ color: colors.surface, fontFamily: fonts.semibold }`. Plum = selection/action, so this stays within the rules.
  - Keep pressed = sunken.
  - Unselected stays white with a border-strong outline.

**V2. High · GP document print type scale.**
- **Problem:** on the 595 pt page, body is 9.5 pt, meta 8 pt, strip labels 7.5 pt, strip digits 8.5 pt and the footer 7.5 pt. Section heads are 10 pt/600, only 1.05× the body, so sections don't separate when a GP skims. These are in `SIZES.page` in `components/atossa/doctor/DocumentView.tsx`, and in the PDF CSS in `lib/records/summary.ts` (lines 584–605: body 9.5pt, h2 10pt, .meta 8pt, tfoot 7.5pt) plus `stripSvg` (7.5 / 8.5).
- **Fix:** in both places, use:

  | Element | Change to |
  |---|---|
  | body | 10.5/14.5 |
  | quote | 12/16 |
  | meta | 9/12 |
  | head | 12/16, 600 |
  | space above section rules | 14 pt |
  | strip labels | 8.5 |
  | strip digits | 9 |
  | footer | 8 |

  Keep ink-2 for meta. Win the space back with V21 (definition rows) and the UX #2 "N more" line, not by shrinking type.

**V3. High · Heat-strip in black-and-white print.**
- **Problem:** the bleeding band fills clay-tint `#F3DED6` (relative luminance 0.76). Severity step 1 `#E4D6E6` is 0.70, so the two are **1.07:1 apart in greyscale**: a printed band and a 0–2 cell are indistinguishable. The band is also the largest mass in the strip, with 1–2 px white seams between days (v23, v27), while the data cells are small.
- **Fix** in `components/atossa/doctor/HeatStrip.tsx` and `summary.ts stripSvg`:
  - Remove the clay-tint `Rect`.
  - Mark bleeding only with the clay underline. Make it 3 pt (4 pt in large mode) and continuous across consecutive bleeding days: draw one rect per run, not per day.
  - Add a tiny inline key under the strip: a 10 × 3 clay bar plus "bleeding logged".
  - Alternatively, use a 45° hatch pattern (`<pattern>`) in clay at 40%. Hatching survives B/W; a flat tint does not.

**V4. High · Label/value hierarchy in NotedRow (noted card, entry detail).**
- **Problem:** the label is 13/18 500 ink-3 `#756C64` and the tidy value is 15/20 400 ink-2 `#5A534D`. Both are grey and close in size, so Sam's answers recede and the card reads as metadata (v05). Granola's rule is grey label, *ink* content.
- **Fix** in `components/atossa/kit-parts/layout.tsx` (`NotedRow`): set the value to `variant="body"` (17/24, ink). Keep labels as caption ink-3, and keep 4 pt between label and value. FactLine on Timeline cards stays 15 ink-2 (see V11).

**V5. High · Field-label system (five styles for one job).**
- **Problem:** measured styles:

  | Label | Style |
  |---|---|
  | "Date", "Usually", "At worst" | 13/500 ink-3 |
  | "Type or say something else" | 15/500 ink |
  | "What's happening?", "Name", "Range", "Stopped" | 17/600 ink |
  | "Flow (optional)" | 17/600 + 15/400 inline |

  "Optional" also appears under the label (Dose), right-aligned (Stopped) and in brackets (Flow) (v07, v15, v20). Inside the follow-up, the group labels "Usually" / "At worst" share the style of the "0 = none" captions and "Why I'm asking", so the two severity groups run together.
- **Fix:**
  - Add `FieldLabel({label, optional?, hint?})` to `components/atossa/kit-parts/controls.tsx`: label 17/24 600 ink, optional rendered inline as " · Optional" in 15/400 ink-2, hint below in 15/20 ink-2, then 12 pt to the control.
  - Use it in `LogBleedingSheet.tsx`, `timeline/BleedingDetail.tsx`, `records/RecordDetail.tsx`, `capture/FollowUp.tsx` and `StrengthEditor.tsx` (Usually / At worst), `doctor/AgendaField.tsx` and `app/(tabs)/doctor/index.tsx`.
  - Leave caption style for in-card row labels (NotedRow) and scale captions only.
  - Leave 32 pt between field groups.

### Medium

**V6. Medium · Today hero wash.**
- **Problem:** `WASH = plum 0A → transparent` sits *inside* the white card. 4% plum over white is ≈ `#F8F7F8`, which is cooler than the canvas `#F7F3EE`, so the hero reads as a cold grey card on warm paper (v01). The spec says "plum-to-canvas gradient behind the Today hero".
- **Fix** in `components/atossa/capture/TodayCards.tsx`: blend the wash toward the warm canvas instead (`[colors.plumTint + '66', colors.surface]`, top 40% only), or drop it and rely on the hero shadow. Do not let the card get cooler than the canvas.

**V7. Medium · Hero hierarchy and padding.**
- **Problem:** "Tap to talk" (the primary action's label) is 15/500 ink, while the secondary "Type instead" is 17/600 plum and visually louder. Hero padding is 32/24/20 (top/sides/bottom), which looks bottom-heavy, with the link 20 pt from the edge.
- **Fix** in `TodayCards.tsx`:
  - "Tap to talk" → headline 17/600 ink, 12 pt under the mic.
  - "Type instead" → `Button variant="text"` with a 15/500 plum label, 4 pt above it.
  - Padding 32/24/28.

**V8. Medium · Severity grid geometry.**
- **Problem:** 0–5 / 6–10 sits on 6 columns, so row 2 has an empty sixth cell (ragged right). The first disc's edge is at x 58 while the card text starts at x 41, a 17 pt optical inset (v03).
- **Fix** in `severity.tsx`:
  - With 44 discs (V1), lay out with `justifyContent: 'space-between'` so disc 0 and disc 5 touch the content edges.
  - Centre row 2 (5 discs) under row 1, or use 11 columns on widths of 420 and up.
  - Put "0 = none" / "10 = worst" directly under the first and last discs.

**V9. Medium · SegmentedControl.**
- **Problem:** it is the only rounded-rectangle control (radius 14/11) in an all-pill system. On canvas sheets the sunken track `#EFE9E1` vs `#F7F3EE` is 1.08:1, and the white thumb on sunken is 1.17:1 with no border or shadow, so List/Month and Speak/Type barely read as a control (v02, v08).
- **Fix** in `components/atossa/kit-parts/controls.tsx` (`segTrack`, `seg`):
  - `borderRadius: radii.pill` on both.
  - Thumb gets `borderWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline` plus `boxShadow: '0 1px 2px rgba(31,27,24,0.10)'` (the one allowed micro-shadow, as on iOS).
  - Unselected label stays 15/500 ink-2.

**V10. Medium · Timeline week headers.**
- **Problem:** "This week" / "7–13 Sep" are 17/24 600 ink, identical to card titles such as "Specialist clinic", so headers don't group.
- **Fix** in `app/(tabs)/timeline/index.tsx` / `components/atossa/timeline/feed.ts` render: header = 15/20 600 ink-2, 32 pt above and 8 pt below (12 pt between cards stays).

**V11. Medium · EntryCard internal hierarchy.**
- **Problem:** the top line "Thu 24 Sep · 15:10" and the fact line "Lower belly · 8/10 at worst" are both 15/20 ink-2, so the quote sits between two equal grey lines. The strongest data point (worst score) has no visual anchor, which makes the feed a uniform wall (v09).
- **Fix** in `components/atossa/timeline/EntryCard.tsx`:
  - GlyphLine text → caption 13/18 500 ink-3.
  - Render the worst value as `SeverityTag` (ramp pill + digit, already in the kit) at the start of the fact line, and drop "x/10 at worst" from the text.
  - Optional, bigger win: group each week into **one** card with hairline inset dividers (Apple Health / Bearable pattern). This removes about 70% of the border noise.

**V12. Medium · Orphan wraps in fact lines.**
- **Problem:** "…down my legs · 9/10 at / worst" (Today latest note, Timeline card, v01, v09).
- **Fix** in `lib/records/format.ts` (`formatStrength`, `joinFacts`): join the words of each fact with ` ` so "9/10 at worst" and "at worst 6–9/10" never break internally.

**V13. Medium · Noted-card actions.**
- **Problem:** a 56 primary plus two full-width 48 outline pills make about 190 pt of stacked buttons (v06). It is heavy, and the two secondaries look as important as the primary.
- **Fix** in `components/atossa/capture/NotedCard.tsx`: keep "Looks right, save" (primary), then one row of two `variant="text"` buttons, "Fix something" · "Add more" (plum, 44 pt), with 8 pt between the rows.

**V14. Medium · Sticky sheet header edge.**
- **Problem:** in CaptureSheet, content scrolls under the sticky header ("A little more detail · 1 of up to 2" / X) with no separator. Clipped glyph tops of the question and the card's side borders show at the cut (v04, v06). This complements UX #8.
- **Fix** in `components/atossa/kit-parts/Sheet.tsx`: track `onScroll`, and when `y > 0` show a hairline bottom border on the header (canvas background, 160 ms fade).

**V15. Medium · Horizontal chip scrollers.**
- **Problem:** Today's starter chips bleed to the screen edge with a 32 px fade. Timeline filters are clipped hard at the 20 pt gutter ("Me|", v10).
- **Fix** in `components/atossa/timeline/FilterChips.tsx`: use the same pattern as Today (`marginHorizontal: -layout.gutter`, `contentContainerStyle={{ paddingHorizontal: layout.gutter }}`, right fade). Consider moving the fade into `ChipGroup scroll` in the kit, so it is shared.

**V16. Medium · Add affordances.**
- **Problem:** there are three different "add" treatments:
  - Timeline uses a filled 44 plum disc, the heaviest object on the screen, sitting beside the plum-tint avatar as two competing circles (v08).
  - Medicines uses a "+ Add" outline pill (v19).
  - Timeline's empty state shows the "+" disc *and* a 56 "Add a note" primary (v33).
- **Fix:**
  - Make the header add an `IconButton` with a plain plum `plus` glyph at 24, unfilled (`filled` false), in Timeline and every records list. Change `app/(tabs)/timeline/index.tsx` and `components/atossa/records/RecordsList.tsx`.
  - Hide the header "+" while the empty state shows its own primary.

**V17. Medium · Profile layout.**
- **Problem:** six single-row bordered cards (account, 3 records, 2 settings) with 16 pt gaps, plus a full-width outline "Sign out". It reads as a template, not iOS (v17, v18).
- **Fix** in `app/(tabs)/profile/index.tsx`:
  - One inset-grouped card per section, with 56 pt rows and hairline dividers inset by 52 pt.
  - A leading 20 pt ink Lucide glyph on each row (pill, calendar, file-text, bell, users).
  - Trailing count ("3") in ink-3 plus a chevron.
  - Sign out as a plain row in the last group (ink text, no outline).

**V18. Medium · Tab bar on Profile.**
- **Problem:** on `/profile` every tab label is ink-3, so the user appears to be nowhere (v17).
- **Fix** in `components/atossa/MainTabBar.tsx`: tint the tab named by the `from` param (default Today) while Profile and its records are focused.

**V19. Medium · Show on screen type scale.**
- **Problem:** `SIZES.large` has head 28/34 600 against title 34 serif and quotes 24 serif. Section names ("How often and how strong", which wraps to 2 lines) outshout Sam's words, and meta at 18 wraps to 3 lines (v26, v27).
- **Fix** in `DocumentView.tsx`: large = head 20/26 600, quote 26/34, body 20/28, meta 17/24 ink-2, title 34/41. Keep the ink rule under the title.

**V20. Medium · Large heat-strip.**
- **Problem:** with 7-day rows, 93 days make 14 rows, most of them empty baselines ("10 Jul", "3 Aug" with nothing), so the data sits far below the fold (v27).
- **Fix** in `HeatStrip.tsx` (`large`): render only weeks that contain a note or bleeding. Collapse runs of empty weeks into one ink-3 line ("No entries 3–16 Aug"), and use the continuous band from V3.

**V21. Medium · Document: appointments and history are run-on paragraphs.**
- **Problem:** "Why I went: … · I was told: … · Tests or prescriptions: … · What happens next: …" wraps as one justified-looking paragraph per visit, which is unscannable (v24).
- **Fix** in `DocumentView.tsx` + `summary.ts` HTML: per item, a bold 10.5 pt heading line ("Around March 2020 · Hospital clinic"), then a two-column definition list (label column 84 pt, ink-2, 9 pt; value 10.5 pt), one fact per row, 6 pt between items.

**V22. Medium · Share bar at 390 too.**
- **Problem:** UX #17 reported "Show on screen" wrapping at 320. **It already wraps at 390** (v21): two lines with a shrunken icon in a 48 pt pill.
- **Fix:** raise UX #17's priority. Use a single-row footer: Share PDF (flex 1) plus two 48 pt icon buttons.

**V23. Medium · Bleeding identity missing on its own surfaces.**
- **Problem:** the Log bleeding sheet and the bleeding detail page have no droplet and no clay (v07, v15). Clay appears only in the list and the calendar.
- **Fix:** add a 20 pt clay `droplet` before the sheet title in `components/atossa/LogBleedingSheet.tsx`, and a `GlyphLine` with `clay` under the title in `components/atossa/timeline/BleedingDetail.tsx`. Clay icon = bleeding, so this stays within the rules.

### Low

**V24. Low · Typographic punctuation.**
- **Problem:** the hero and capture prompts use a straight `'` (U+0027). In Instrument Serif Italic it renders as a vertical tick. The doctor screen uses `’` ("What’s"), so the app is inconsistent. The placeholder uses "..." rather than "…". Sam's quotes inside the curly-quoted `Quote` keep straight apostrophes ("couldn't", v16).
- **Fix:**
  - `TodayCards.tsx` line 27 and `CaptureSheet.tsx` `PROMPT` → `What’s`.
  - Placeholder → `…`.
  - In `Quote` (`kit-parts/Txt.tsx`), display `children.replace(/'/g, '’')`. This is render-only; the stored words are unchanged.

**V25. Low · Chip selection reflow.**
- **Problem:** selecting a chip changes weight 500 → 600, so neighbours shift 1–3 px ("Still going" moved 191 → 193).
- **Fix** in `controls.tsx`: keep 500 for selected chips and rely on the tint and ring, or reserve width with a hidden 600 copy.

**V26. Low · Month: a period as separate discs.**
- **Problem:** six consecutive clay discs (v13) read as six events, not one span. The numerals on clay are 15/400 white.
- **Fix** in `components/atossa/timeline/MonthCalendar.tsx`: join consecutive bleeding days with a clay capsule (36 pt tall, square inner edges, rounded at run ends, wrapping at week boundaries). Use numerals 15/600 white.

**V27. Low · Interactive icon colour.**
- **Problem:** the spec says "ink, or plum when interactive", but the month chevrons and the sheet X are ink `#1F1B18` while BackChevron is plum.
- **Fix:** make the month prev/next chevrons plum (`MonthCalendar.tsx`). Keep the sheet X ink, as iOS does, and record that exception in KIT.md.

**V28. Low · Toast separation.**
- **Problem:** saved-tint `#E2EEE6` on canvas is about 1.1:1, with only the 6% hero shadow, so it reads like an inline banner fused with the card behind it.
- **Fix** in `components/atossa/kit-parts/toast.tsx`: `boxShadow: '0 6px 24px rgba(31,27,24,0.12)'` plus `borderWidth: 1, borderColor: colors.saved + '33'`.

**V29. Low · Hero prompt rag at 390.**
- **Problem:** the prompt breaks as "What’s been going on with / your body?" (v29), a long line followed by a short one.
- **Fix:** when the content width is below 400, render it as two lines, "What’s been going on / with your body?".

**V30. Low · Empty Timeline composition.**
- **Problem:** the message is top-hung, with about 60% empty canvas below it (v33).
- **Fix** in `EmptyState` (`kit-parts/layout.tsx`): optional `icon` (32 pt ink-3), vertically centred in the remaining space (`flex: 1, justifyContent: 'center'`, paddingBottom 80).

**V31. Low · Avatar colour.**
- **Problem:** HeaderAvatar fills plum-tint, the selection colour, beside the plum "+".
- **Fix** in `kit-parts/layout.tsx` `HeaderAvatar`: sunken background with an ink-2 600 initial and a hairline border, so the only plum in the header is the action.

---

## 4. Top 5 changes that would most raise perceived quality

1. **Make severity unmistakable (V1, V8, V11).** A solid plum selected disc at 44 pt on an edge-aligned grid, and a ramp SeverityTag on every Timeline card. Severity is the product's core data, and it should be the most crafted control.
2. **Fix the GP page as a printed artefact (V2, V3, V21).** Raise the type to 10.5 pt body with 12 pt heads, replace the clay-tint band with a continuous clay underline or hatch that survives B/W, and lay visits out as definition rows. Pair this with UX #2 and #3.
3. **One text hierarchy (V4, V5, V10, V11).** Values in ink at body size, one FieldLabel style, and week headers distinct from card titles. This single pass removes most of the "everything is grey 15 px" flatness.
4. **Calm the chrome (V13, V16, V17, V9).** No stacked outline buttons, one quiet "add" glyph, inset-grouped Profile rows, and a visible pill segmented control. This is what makes iOS apps feel native rather than templated.
5. **Warm, finished details (V6, V7, V24, V14, V28).** A warm hero wash, the hero labels the right way round, curly apostrophes in the serif, a hairline under sticky headers, and a toast that floats. Each is under 10 lines of code, and together they are the "premium" layer.

---

## 5. Notes and limits

- My first pass ran at 500 px. The doctor screens and empty states were checked in a 390 px iframe, because the browser window later stopped resizing.
- iOS-specific rendering was not seen: SF-style font hinting, real `boxShadow` on RN 0.86 iOS, dashed borders on rounded views, and Switch tinting (UX #15). Re-check V9's micro-shadow and V3's hatch pattern on a device build.
- I did not print or export a PDF (the Print dialog was not triggered). V2 and V3 are based on the HTML/CSS in `lib/records/summary.ts` and the on-screen DocumentView, which mirror each other.
- After Clear sample data, For my doctor at 0 notes shows "Nothing saved in this range yet." with Share PDF, Print and Show on screen disabled (v31, v32). That looks like UX #7 is at least partly fixed in this tree.

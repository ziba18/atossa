# Stage 1 redesign: visual design review

Reviewer: senior graphic / visual designer (iOS health). Date: 2026-10-01.
Prototype: https://id-preview--b0b66a36-69d0-4fd8-93eb-5a9f0a3a2ccd.lovable.app
Spec: "Warm Paper, Deep Ink" (`reports/Atossa app design research.md`, lines 47–200).
Read alongside `stage1_review_ux.md`. I don't repeat its findings; "UX #n" points to its fix list.

**How I tested.** I did a live run in Chrome at 500 CSS px wide (Chrome won't go narrower): Today, then voice capture, two follow-ups, the noted card, save and toast, then each tab. I measured computed styles read-only with JS, converted every colour to hex, and worked out contrast. I also used the UX reviewer's screenshots 01–49. My own captures are `stage1_screens/v01–v05`.

---

## 1. Overall score: **5 / 10**

**Verdict.** It is not App Store-featured yet, but it is closer visually than behaviourally. The bones are right. The canvas is warm. Inter 34/600 is the large title and Instrument Serif Italic 30/36 is the hero prompt. Plum is mostly kept for action, cards are hairline with no shadow, and text contrast is good everywhere (ink-3 is 5.5:1 on canvas and 5.0:1 on sunken). What makes it look unfinished is a set of rendering-level defects:

- **Every icon renders at 16 px.** A shadcn rule overrides the size classes. A 16 px mic glyph floats in a 72 px button, and the tab bar icons are tiny.
- **The serif is faux-bolded.** It is set at weight 500 with font synthesis on, and it is used for an extra title.
- **There are two type scales.** Today follows the spec (13/15/17). Timeline and For my doctor use 14/16/18/30.
- **The hero card is a cool lavender-grey slab** (#F7F5F7) on warm paper.
- **Heights and gaps drift.** Primary buttons are 48 or 56, the mic is 72 or 88, and section gaps are 15/28/16/16.
- **The default Sonner toast** has radius 8, a cool grey border and a black shadow.

Next to Apple Health, Oura or Stardust, the gap is polish and consistency, not direction. About half the fixes below are one token or one CSS rule. I agree with the UX reviewer that the pill-on-cards bug (UX #2) is the single most damaging visual defect.

---

## 2. Per screen / state

### Today: **6/10** (01, 02, 16, 30, v04, v05)
**What works:**
- The large title and greeting are typeset to spec.
- The serif prompt is the screen's one voice, which is calm and editorial.
- The chips are clean 44 px pills with a 1 px border-strong.

**Problems:**
- The **mic glyph is 16 px in a 72 px button** (22% fill; iOS norm is ~40%). The button reads as an empty plum disc.
- The **hero fill #F7F5F7** is a cool grey-violet against the warm canvas #F9F4EE (1.01:1). It looks like a dirty patch, not a "4% plum wash".
- Section gaps are **15 / 28 / 16 / 16 px** (hero→chips→rough day→appointment→latest), so the page has no rhythm.
- The Rough day **Save is 48 px**; every other primary is 56.
- The Latest note mixes pill-shaped **non-interactive fact tags** (sunken fill, 13 px) that look the same as the tappable "+ Add" chips elsewhere.

### Capture: Speak: **6/10** (04, 05)
**What works:**
- The sheet has a 28 px top radius and grabber.
- The segmented control looks native.
- The waveform uses 3 px rounded plum bars, which is tasteful.

**Problems:**
- The **mic is 88 px here but 72 on Today**, and both glyphs (mic, stop square) are 16 px.
- The segment labels are 14 px, which is off-scale.
- The transcript well is #F0E2F2, pinker than plum-tint #EFE6EF, and has a border-strong outline. It reads as a pink chat bubble, not an input.
- The timer is 18/500, which is off-scale. Use 17 tabular.

### Capture: Follow-ups: **5/10** (08, 11, v01)
**What works:**
- The 24/30/600 question is a good size.
- The eyebrow and progress line work as a pair.

**Problems:**
- The **selected number uses an off-spec per-value shade** (6 = #5D3965, 9 = #36163C; the spec ramp says 5–6 = #9A729F, 9–10 = #3E2144) with a 1 px ink ring. Selection and severity are being mixed (see UX #10).
- The text input is 56 px tall but the mic beside it is 52, so their bottoms miss by 4 px. The input is a pill; the spec says inputs use radius 14.
- "Not sure / It varies / Skip" have the same weight as real answers, so the escape hatches compete with the content.
- Continue is 48 px here and 56 on the Speak step.
- The eyebrow is all caps with no tracking.

### Capture: "Here's what I noted": **5/10** (12, 13, v02)
**What works:**
- The two-tone rows and dividers.
- The 20 px card.
- The 24 px gap to the action stack.

**Problems:**
- The **title is set in the serif** (28/36). That is a fourth serif use and a second, off-size serif style. It wraps to two lines beside a native `<select>`.
- The **quotes render at weight 500 with synthetic bolding**. They are visibly heavier and blurrier than the hero (v02).
- The rows are tappable but have **no affordance** (no chevron).
- The "+ Add" chip is **33 px tall**.
- The secondary button is 56 px; the spec says 48.

### Save toast: **3/10** (16, v03)
- It is an unstyled Sonner default: **radius 8** (the exact "template" radius the spec bans), a #EDEDED cool-grey border, a black 10% shadow, 13 px text, a 16 px gutter and no icon. It is the only off-palette object on the screen. (Position and timing: UX #12.)

### Tab bar: **5/10** (v05)
- It is a near-opaque white bar with a hairline top border and a 24 px backdrop blur, which is correct.
- The **icons are 16 px; the spec says 24**.
- The selected state is plum #43224B against unselected ink-2 #514740. That is only **1.48:1** apart at the same weight, so the active tab is hard to see at a glance.

### Timeline (global-system notes only): **3/10** (35, 36, 39)
- It uses its own type scale: 14/600 ×38, 16/400, 18/600, and 30/500 stat numbers. The spec Numeral is 44/500.
- **Calendar cells use radius 10**, which is not in the scale. Every non-bleeding day is a filled sunken tile, so the month becomes a beige brick wall. The spec says missing days are blank.
- **Clay renders #94240E**, not #A6452E. It is darker and redder, and drifts toward error red #A12A2A. It also carries a speckle texture.
- There are pencil icons on 9 rows, plus plum-tint and sunken icon tiles.

### For my doctor (global notes only): **4/10** (45)
- "Your summary" is **serif 34 px**; the spec says 30/36.
- The 14 px date line above it is off-scale.
- The date format is "11 September 2026", which differs from Today's "24 Sept 2026" and the form's "09/24/2026".

### Profile: **4/10** (49)
- It is visually clean.
- The uppercase "NAME" eyebrow repeats the all-caps pattern.
- The back pill is covered by UX #22.

---

## 3. Fix list (paste-ready)

1. **High · Global icons.** Every Lucide icon renders at 16×16. The `size-6`/`size-8` classes are overridden by the Button's `[&_svg]:size-4`. The result is a 16 px glyph in the 72 px and 88 px mic, a 16 px stop square, and 16 px tab icons.
   **Fix:** "Remove the `[&_svg]:size-4` override from the Button variants (or add `!size-*`). Icon sizes: tab bar 24, row/inline 20, mic and stop glyphs 32 inside the 72 px button. Stroke 1.75 everywhere; use `absoluteStrokeWidth` so the 32 px mic doesn't get a heavier line."

2. **High · Global serif rendering.** Instrument Serif quotes are set at `font-weight: 500` with `font-synthesis: weight style small-caps`. Only the 400 italic face is loaded, so the browser fakes bold: the strokes thicken and blur (v02).
   **Fix:** "Every Instrument Serif element is `font-weight: 400; font-style: italic; font-synthesis: none`. Never give the serif a weight class."

3. **High · Global type scale.** Today uses 13/15/17/24/34. Timeline and For my doctor use 14, 16, 18, 20 and 30, plus 14/600 for 38 labels. The capture sheet uses 14 (segments) and 18 (timer). The serif appears at 20, 28, 30 and 34.
   **Fix:** "Define these type tokens and use only them, app-wide: large-title 34/41 600 −0.17px; hero 30/36 serif; title 24/30 600; quote 20/28 serif; headline 17/24 600; body 17/24 400; secondary 15/20 400; caption 13/18 500 +0.26px; numeral 44/48 500 tabular; tab 11/13 500. Map 18→17, 16→17 (body) or 15 (secondary), 14→15 or 13, 20 Inter→17 headline, stat 30→44. Segmented control labels 15/500."

4. **High · Today hero card.** The fill is flat #F7F5F7 (cool grey-violet, 1.01:1 against the warm canvas), with 28/20 padding. It looks grey and dull, not like a warm hero.
   **Fix:** "Hero card: white #FFFFFF base with a top-to-bottom gradient from 4% plum (#4A2C4F at 0.04) to transparent, a 1 px #E2DAD0 border, radius 20, and shadow 0 2 16 rgba(31,27,24,0.06). Padding 32 top / 24 sides / 24 bottom. Gaps: prompt→mic 24, mic→'Tap to talk' 8, →'Type instead' 4."

5. **High · Noted card title.** "Here's what I noted. Tap anything to fix it." is set in serif 28/36 over two lines, squeezed beside a native select. The serif is reserved for Sam's words, the Today prompt and the summary title.
   **Fix:** "Title 'Here's what I noted' in Inter 24/30 600. Below it, 'Tap anything to fix it.' in 15/20 ink-2. Put the date control on its own row under that, as a 36 px pill 'Today ▾' (15/500, 1 px border-strong, chevron-down 16)."

6. **Medium · Global button and mic sizes.** Primary buttons are 48 px (Rough day Save, follow-up Continue) or 56 px (Speak Continue, 'Looks right, save'). The secondary 'Add more' is 56. The mic is 72 on Today and 88 in the sheet.
   **Fix:** "Primary 56 px, secondary 48 px, text buttons 44 px hit area, on every screen. MicButton is 72 px in both places."

7. **Medium · Global palette tokens.** The rendered colours are oklch approximations that miss the spec:

   | Token | Rendered | Spec |
   |---|---|---|
   | canvas | #F9F4EE | #F7F3EE |
   | hairline | #E1D6CB | #E2DAD0 |
   | border-strong | #8D8075 | #8F867C |
   | ink-2 | #514740 | #5A534D |
   | ink-3 | #6E6057 | #756C64 |
   | plum | #43224B | #4A2C4F |
   | plum-tint | #F0E2F2 | #EFE6EF |
   | clay | #94240E | #A6452E |

   Clay is the worst: it now sits close to the error red. The app and the PDF must share exact values.
   **Fix:** "Define every colour token as the exact hex from the spec palette table in `:root` CSS variables (not oklch conversions). Clay #A6452E must stay visibly browner than error #A12A2A. Remove the speckle texture from bleeding days: flat clay fill only."

8. **Medium · Severity selection (adds to UX #10).** Selected numbers get a per-value shade that is not on the ramp (6 = #5D3965, 9 = #36163C), with a 1 px ink ring.
   **Fix:** "In inputs, a selected number is plum-tint #EFE6EF with a 2 px plum #4A2C4F ring and plum 600 text. Use the same style for every value. Use the severity ramp (#E4D6E6 · #C3A6C7 · #9A729F · #6E4775 · #3E2144) only for displaying saved values (heat-strip, Latest note tag), always with the digit."

9. **Medium · Today vertical rhythm.** The gaps between blocks are 15, 28, 16 and 16 px. Greeting→hero is 21.
   **Fix:** "Use 8-pt spacing: title→greeting 8, greeting→hero 24, hero→starter chips 16, then 24 between every card. Card padding 20 everywhere."

10. **Medium · Tab bar.** The icons are 16 px. Selected (#43224B) and unselected (#514740) differ by only 1.48:1 at the same weight.
    **Fix:** "Tab icons 24 px, stroke 1.75. Unselected icon and label ink-3 #756C64; selected icon and label plum #4A2C4F. Keep label 11/13 500, icon-to-label gap 4, bar 49 pt plus safe area. Add `aria-current='page'`."

11. **Medium · Toast styling (position and timing are UX #12).** The Sonner defaults are radius 8, border #EDEDED, shadow rgba(0,0,0,.1) 0 4 12, 13 px text and a 16 px inset.
    **Fix:** "Toast: background #E2EEE6, text #2E6A4F 15/20 500, lucide check-circle 20 left, radius 14, no border, shadow 0 2 16 rgba(31,27,24,.06), inset 20 px from the screen edges."

12. **Medium · Tap affordance.** The noted-card rows are tappable but show nothing that says so. Timeline does the opposite and puts a pencil on every one of 9 rows.
    **Fix:** "Any tappable row or card ends with a 20 px chevron-right in ink-3, vertically centred. Remove the per-row pencil icons; the whole row is the target."

13. **Medium · Add chips vs fact tags.** "+ Add" is 33 px tall, with a sunken fill and plum text. The Latest note's non-interactive fact tags use the same sunken pill, so passive and active elements look alike.
    **Fix:** "AddFieldChip: 36 px visual / 44 px hit area, transparent, 1 px dashed border-strong, plum 15/500 text with the field name ('+ Add where'). Fact tags under a quote: no fill, no border, secondary 15/20 ink-2 joined with ' · ' (e.g. 'Lower tummy, left · 9/10')."

14. **Medium · Timeline and calendar (fix globally now, before the Stage 2 rebuild).** Calendar cells use radius 10 and every day is a filled sunken tile. The stat numerals are 30/500. Icons sit in plum-tint and sunken tiles.
    **Fix:** "Calendar: day numbers 15/400 tabular in ink on the bare canvas with no tile. Bleeding days get a 36 px clay circle with white numerals. Note days get a 4 px plum dot below the number. Today gets a 1.5 px ink ring. Radii in the app are only 14, 20, 28 or 999. Remove all icon tiles (see UX #7)."

15. **Low · Follow-up input row.** The input is 56 px and the mic is 52 px, so their bottoms misalign by 4 px. The input uses a pill radius.
    **Fix:** "Input and its mic button both 52 px tall, top-aligned, 8 px apart. Input radius 14, fill sunken #EFE9E1, 1 px border-strong."

16. **Low · Escape chips.** "Not sure / It varies / Skip" look exactly like the answer chips.
    **Fix:** "Separate them from the answers by 16 px. Style them as ghost chips: no border, ink-2 15/500 text, 44 px height."

17. **Low · Transcript well.** The fill is #F0E2F2 (pink) with a border-strong outline.
    **Fix:** "Transcript box: plum-tint #EFE6EF, no border, radius 14, padding 16, text 17/24 ink, left-aligned (see UX #9)."

18. **Low · Tracking and eyebrows.** Letter-spacing is `normal` on the large title and the captions. All-caps eyebrows appear in "A LITTLE MORE DETAIL", "YOUR LATEST NOTE" and "NAME".
    **Fix:** "Large title −0.17px; captions +0.26px. Remove `uppercase` from every eyebrow and use sentence case (extends UX #21)."

19. **Low · Line heights.** Body text and buttons inherit 1.5× (17/25.5, 15/22.5, 13/18.57) instead of the token values.
    **Fix:** "Set explicit line-heights from the type tokens (17/24, 15/20, 13/18); buttons use line-height 1 inside a fixed height."

20. **Low · Headline wrapping.** The hero prompt needs about 420 px at 30 px. At 390 the inner width is 310, so it breaks unevenly. Other headings can orphan a word too.
    **Fix:** "`text-wrap: balance` on the hero prompt, sheet titles and card titles."

21. **Low · Date formats.** At least four formats are in use: "24 Sept 2026", "11 September 2026", "09/24/2026" and "Today".
    **Fix:** "One en-GB formatter: 'Wed 24 Sep' within the current year, 'Wed 24 Sep 2025' otherwise, and ranges as '11–24 Sep 2026'. Use 'Sep', not 'Sept'."

22. **Low · Summary title.** "Your summary" is serif 34 px under a 14 px date line.
    **Fix:** "Summary title is serif 30/36 400. The date range goes beneath it as secondary 15/20 ink-2."

---

## 4. Top 5 changes that would most raise perceived quality

1. **Fix icon sizing (#1).** It is one CSS rule, and it fixes the most "unfinished" look in the build: a 24 px tab bar and a mic glyph that fills its button.
2. **Clean up the serif (#2, #5, plus UX #4 and #17).** Set it at 400 with no synthetic bold, and use it only for Sam's words, the hero and the summary title. That is what makes the editorial direction look deliberate.
3. **Use one type and spacing system across all tabs (#3, #6, #9).** Today and the other tabs currently look like two different apps.
4. **Rebuild the hero card (#4).** Use white with a 4% plum wash and a soft shadow, a properly sized mic and 32/24 padding. It is the first thing anyone sees.
5. **Use exact tokens and one component vocabulary (#7, #8, #11, #13).** That means the spec hexes (especially clay), one selection style, a toast on the palette, and a clear split between tags and buttons. Do this together with UX #2 (pill-on-cards).

---

## Screenshots added (`stage1_screens/`)
- `v01_followup_selected_fill_tiny_icons.jpg`: off-ramp selected fill, 16 px icons
- `v02_noted_quote_faux_bold_serif.jpg`: synthetic-bold serif quote
- `v03_toast_default_sonner_radius8.jpg`: default toast
- `v04_hero_16px_mic_glyph_cool_fill.jpg`: hero fill and 16 px mic glyph
- `v05_tabbar_16px_icons_weak_selected.jpg`: tab bar

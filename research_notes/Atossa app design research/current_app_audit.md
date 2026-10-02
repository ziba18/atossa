# Audit of the current Atossa design (Lovable prototype, 2026-09-29)

Observed in the live Lovable preview at phone width; the Expo app mirrors it (tokens in `constants/atossaUI.ts`).

## Visual system today
- Background cream `#fef9f4`, text `#241c17`, primary salmon `#f6b0a6`, deep red `#8f3830`, mint `#d8f2e6`, sky blue `#d5f0ff`, bleeding red `#8a000e`. Radius 8. Min tap 56. Body 18px.
- Type: Instrument Serif (display, 38px) + Work Sans (body, heavy use of 700 bold).
- Three unrelated pastel accents (salmon, mint, sky) are used interchangeably: the selected tab pill is mint on Chat, sky blue on Dashboard; stat tiles are pink / blue / mint / white with no meaning behind the colour.
- Header: "A" avatar circle + "Atossa" wordmark + a date ("24 Sep") on the right that has no purpose.

## Chat tab
- Title "Chat" + subtitle, then "Atossa" in red small caps and a plain paragraph greeting. No bubbles, no avatar, no quick replies, no progress. ~60% of the screen is empty cream.
- Composer: bordered box with a grey mic square and a salmon return-arrow button. Voice is secondary even though speaking is the product's core promise.
- Flow is 4 fixed questions asked one after another in text; the user can't see how many questions remain or what will be saved until the end.

## Dashboard tab
- "Dashboard / A history of what you reported to Atossa."
- 2x2 grid of pastel stat tiles in heavy bold: "8 Symptoms saved", "6 days Last period", "6 days Days it stopped me doing things", "9 out of 10 Highest pain score". Tiles compete equally; nothing says what matters today.
- Then a long single scroll of sections separated by rules: Pain over time (line chart, deep red), "Days that stopped me doing things, by week" (near-black bars), My symptoms list, Cycle calendar, Appointments, Medicines, Health history. It is a data dump, not a home screen; there's no primary action.

## For my doctor tab
- Date range in red, "For my doctor" serif title, "Information entered in Atossa."
- "At a glance (6)" accordion opens into one flat pale-blue block of label/value pairs (Symptoms, Latest period, Medicines and treatments tried, Saved records, Most recent appointment — label truncated, "I was told: None saved."). Then collapsed accordions: Symptoms in my words (8), etc.
- Doesn't look like a clinical document; no preview of what the doctor actually receives; Share/PDF is at the bottom.

## Overall problems
1. No clear primary job per screen, and no home: the app opens on an empty chat.
2. Colour has no semantics; pastels read as "template", not clinical-trust.
3. Serif display + heavy bold grotesk clash; everything is bold so nothing stands out.
4. Dense flat lists and accordions instead of cards with hierarchy.
5. Voice (the differentiator) is hidden in a small grey button.
6. Doctor output doesn't look like something a GP would respect.

# Premium Health/Wellness App Visual Design (2025–2026): A Visual-System Playbook for Atossa

Scope note: researched 2026-09-29 using about 20 search/fetch calls. The sources vary a lot in quality. Primary sources are the Instrument case study, Oura's blog, the It's Nice That piece on Headspace, Apple's ADA pages and a Midi press release. Some token values (hex codes, font sizes) come from third-party sites that reverse-engineered them from live pages, and they are marked as such. Several named apps (Function Health, Levels, Eight Sleep, Maven, Superpower, Tia, Evernow, Calm, Flo, Clue) returned **no usable primary design documentation** in this pass. They are listed under Gaps, not described from memory.

---

## 1. What makes health UI look "premium, trustworthy, calm"? (color, type pairing, density, data-viz)

### Takeaway
The current premium health look has four parts. The type is a restrained grotesk for UI and data, sometimes with a serif (often italic) used sparingly for emphasis. The palette is warm off-white or sand neutrals plus one strong brand color. Color is semantic, never decorative. Information is layered with progressive disclosure: one or three big numbers first, trends on tap, raw data deeper down. Oura is the clearest reference for Atossa: warm sandstone neutrals, Akkurat grotesk, Editorial New serif italic for emphasis, and nature-toned accents (slate, olive, mustard, brown).

### Cited Findings
**Oura (redesign by Instrument; app launched with Oura Ring 4)**
- The redesign cut five tabs (Home, Readiness, Sleep, Activity, Resilience) down to three: **Today, Vitals, My Health**. — [Oura blog](https://ouraring.com/blog/new-app-design/)
- Instrument describes a "semantic color system" in which "dynamic color cues direct attention" to priority information. The typography was refined for "quick comprehension and emotional resonance". The stated goal was a "lighter, faster, and more grounded" experience. — [Instrument case study](https://www.instrument.com/work/oura-app)
- Instrument's data-viz framework has three tiers: (1) at-a-glance rings, bars and color cues; (2) mid-level focused metrics and short-term patterns; (3) exploratory, interactive long-term trends across weeks, months and years. Principles: "progressive disclosure" and "balance utility and expression". — [Instrument](https://www.instrument.com/work/oura-app)
- Post-launch metrics reported by Instrument: Today-tab CTR 42% (+7 pts), D5 stickiness 80% (+1 pt). — [Instrument](https://www.instrument.com/work/oura-app)
- Oura web tokens (**reverse-engineered from ouraring.com via getComputedStyle, 2026-09-26, desktop only, not official**). Fonts: **Editorial New** (200/300) for headings, **Akkurat LL** (300/400) for body. Warm neutrals: Cream `#f7f1e8`, Cream-100 `#eee6dc`, Sandstone-100 `#fefaef`, Sandstone-450 `#e6ded3`, Sandstone Ink `#4a4741`, Gray-350 `#a8a5a0`, Gray-450 `#5a5958`, Border `#ececec`, Canvas `#ffffff`, Foreground `#000000`. "Nature" accents: Slate `#27455c` / `#1b3449`, Olive `#5c6f5d`, Mustard `#af751b`, Brown `#715956`, Red `#d22c15`. Action blue `#2a72de` (hover `#2056a6`). Pill radius `9999px`. — [oh-my-design.kr Oura tokens](https://oh-my-design.kr/design-systems/oura)
- Another reverse-engineered system describes Oura's type as AkkuratLL body at 16/24 px, a 96 px weight-500 hero with negative tracking, and "a single phrase in each heading flips to Editorial New serif italic" as a brand signature. Its 22 color tokens are grouped into ink, sandstone-canvas, hairline, brand-voltage and accent. — [shadcn.io Oura design system](https://www.shadcn.io/design/oura) (third-party, marketing-site based)

**Whoop**
- Whoop's color system is "intentionally narrow": green means readiness/recovery (67%+), yellow means in-between, red means strain or low recovery (<33%). "There are no arbitrary accent colors. Every hue carries meaning." — [925 Studios Whoop breakdown](https://www.925studios.co/blog/whoop-design-breakdown)
- Core brand palette: Cod Gray `#0B0B0B`, White `#FFFFFF`, Red `#FF0100`. — [Mobbin Whoop palette](https://mobbin.com/colors/brand/whoop) (via search summary)
- The primary metric is oversized (about 72 pt for the Recovery score) with small supporting text. Three data tiers: Tier 1 is three numbers only, Tier 2 is week-over-week line charts and stacked bars, Tier 3 is raw 30-day HRV/RHR etc. Each tier sits on its own screen instead of in nested accordions ("each tile is a doorway, not a destination"). — [925 Studios](https://www.925studios.co/blog/whoop-design-breakdown)
- In 2025 Whoop redesigned Home into a single scrolling view with Sleep/Recovery/Strain on top, then My Day / My Plan / My Dashboard, and added a separate Health tab. — [Whoop, The Locker](https://www.whoop.com/us/en/thelocker/the-all-new-whoop-home-screen/)
- An official brand guidelines PDF exists. — [WHOOP Brand & Design Guidelines](https://developer.whoop.com/assets/files/WHOOP%20-%20Brand%20&%20Design%20Guidelines-bdea3554e94b4ea09e68695b1e8dc8e7.pdf) (not fetched)

**Headspace (2024 rebrand)**
- Colophon Foundry made a custom typeface, a "Headspace-ified" **Aperçu**, chosen to "flex from playful to clinical". — [It's Nice That](https://www.itsnicethat.com/articles/italic-studio-headspace-graphic-design-project-250424)
- It kept the signature orange and added a supporting palette for a wider emotional range and **better accessibility contrast**. Headspace positioned this against mental health's "dreary sea of blues and greys". Italic Studio did design support; Order made the guidelines on Standards. The illustration now shows faces with stress, sadness and contentment, not only smiles, and realistic photography was added for coaching. — [It's Nice That](https://www.itsnicethat.com/articles/italic-studio-headspace-graphic-design-project-250424); [Italic Studio](https://italic-studio.com/projects/headspace-rebrand/)
- Reverse-engineered tokens: warm cream background `#f9f4f2`, Headspace Blue `#0061ef` reserved for primary CTAs. — [oh-my-design.kr Headspace](https://oh-my-design.kr/design-systems/headspace) (via search summary, not official)

### Inferences
- **Warm off-white plus a single strong action color is the current premium default** (Oura `#f7f1e8` with blue `#2a72de`; Headspace `#f9f4f2` with blue `#0061ef`). Atossa's cream is therefore not the problem. The problems are probably (a) salmon pink + mint as *two competing decorative accents*, (b) a serif used for all headings instead of sparingly, and (c) no semantic color logic.
- The serif-plus-grotesk pairing only reads as premium when the grotesk carries almost all the UI and the serif is rare: one phrase, one hero, often italic (Oura's approach).
- Premium density comes from a low count of big numbers per screen, with depth one tap away (Oura's three tiers, Whoop's three tiers). For Atossa, "For my doctor" can be tier 3. The dashboard should show 1–3 headline facts only.

### Gaps
- No official Oura or Whoop mobile-app spacing, radius or shadow specs were found. The token sites measured websites, not the apps.
- Calm, Eight Sleep, Levels, Function Health and Superpower: no primary design documentation was found in this pass. The only Function Health item found is a designer's Dribbble shot about a "refined brand identity system" with CD Aaron McGuire ([Dribbble](https://dribbble.com/shots/25907046-Function-Health)), with no specs.

---

## 2. Femtech design trends 2025–2026: moving away from pink

### Takeaway
The sector is openly moving away from "shrink it and pink it". The clearest current example is Midi Health's August 2026 rebrand, which swapped soft pastels for bold typography and high-contrast color to signal serious, longitudinal *care* rather than "wellness". The replacements are functional or semantic color and broader, more grown-up palettes: plums and purples (Natural Cycles, Stardust), earth and nature tones (Oura-style), or high contrast (Midi).

### Cited Findings
- Midi Health (menopause, now expanding to women's primary care, including PCOS support) unveiled a new identity in **August 2026**: "a departure from the softer aesthetic often associated with women's health", with "bold typography and high-contrast color". Agency and specific fonts/colors are not given in the coverage. — [Femtech Insider](https://femtechinsider.com/midi-health-expands-beyond-menopause-care-with-new-brand-identity/); [BusinessWire release](https://www.businesswire.com/news/home/20260818502492/en/Midi-Health-Unveils-Bold-New-Brand-Identity-Laying-the-Foundation-for-Next-Chapter-of-Business-Growth); [Inc.](https://www.inc.com/cristina-montemayor/midi-health-unveils-its-third-reinvention-and-a-bigger-mission/91402959)
- Industry commentary criticizes "Blush pink palettes, delicate typography, flowing curves" and "shrink it and pink it". It recommends color for **functional clarity** (signal function, not gender), expanded palettes, and letting users adjust color. — [Winsome Marketing, "Beyond Pink"](https://winsomemarketing.com/womens-health-marketing/beyond-pink-design-guidelines-for-femtech-brands-that-respect-identity-diversity) (marketing-agency blog, opinion)
- One trend blog says the category is moving "away from soft wellness language and toward care infrastructure, trusted data handling, visual explanation… condition-specific products". — [mean.ceo FemTech Trends](https://blog.mean.ceo/femtech-trends-may-2026/) (low-authority blog; treat as opinion)
- Natural Cycles: purple is a longstanding brand color, carried into its October 2025 NC° Band wearable and the NC° Perimenopause mode. — [The Flow Space](https://www.theflowspace.com/physical-health/prevention-longevity/natural-cycles-nc-band-hormonal-health-3007176/)
- Stardust uses a dark purple background with bright colors, custom flat and "quirky" icons, and a circular lunar-phase cycle ring on the dashboard. — [Fueled](https://fueled.com/blog/stardust-period-tracker/); [Hypebae](https://hypebae.com/2020/11/stardust-period-tracker-horoscope-astronomy-astrology-mobile-apps-menstrual-care-cycle); [screensdesign showcase](https://screensdesign.com/showcase/stardust-period-pregnancy)
- Hims & Hers: the original identity came from Gin Lane (2017). MOUTHWASH Studio later turned it into a motion system. Stine Nielsen designed the Hers identity (soft colors, refined type). — [MOUTHWASH Studio](https://mouthwash.studio/project/hims-and-hers/); [Stine Nielsen](https://stinenielsen.com/hers); [The Marketing Factor](https://www.themarketingfactor.tv/content/how-hims-hers-is-humanizing-healthcare-design)

### Inferences
- For a *clinical-adjacent* product ("GP-ready summary"), Midi's direction (bold, high-contrast, no pastels) is the closest strategic analogue. Atossa should look like a care tool, not a lifestyle tracker.
- Candidate primary hues that avoid the pink cliché and fit a calm clinical tone. These are my proposals, *not sourced brand values*:
  - **Deep plum / aubergine** e.g. `#3B2340` (ink) with a lighter `#6B4A73`. Links to the purple heritage of NC and Stardust without pink.
  - **Deep green / olive** e.g. `#2F4A3A` or Oura's olive `#5c6f5d`. Reads as calm, natural and medical-adjacent.
  - **Terracotta / clay** e.g. `#B5573A`. Warm and human, but use it *only* as a single accent, since it sits close to salmon.
  - **Slate/ink blue** e.g. Oura slate `#27455c` for text and the primary action. The strongest "trust" signal.
- Recommended structure: warm off-white canvas (about `#F7F3EE`), near-black warm ink (about `#1F1B18`), one brand hue (plum or deep green), and a *separate* semantic set (e.g. severity scale) that is never reused decoratively.

### Gaps
- **Clue brand refresh**: no primary source was found. One search result pointed to a different company (Clue Software, a law-enforcement vendor). The Creative Review article on Clue's app design is paywalled (it names senior art director Marta Pucci). — [Creative Review](https://www.creativereview.co.uk/design-clue-inclusive-period-tracking-app/)
- **Flo 2024–25 redesign**: no press or case study was found. Searches only returned unrelated "Flo. Marketing" rebrands and portfolio concepts.
- **Natural Cycles rebrand agency or typeface**: not found.
- Tia, Evernow and Maven Clinic: not researched successfully (no results within budget).
- No It's Nice That, Brand New or Fast Company coverage of femtech rebrands was found in this pass beyond Headspace (not femtech).

---

## 3. Dark vs light, gradients, glass / Liquid Glass, illustration vs photo

### Takeaway
Light, warm, opaque content surfaces are the norm for trust-oriented health apps. Dark UI is the choice for high-frequency metric apps checked at night (Whoop, Stardust's cosmic theme). Liquid Glass belongs **only to the navigation/control layer**, never to medical data. Illustration trends toward emotional range and realism (Headspace), and photography is used for "real care" signals.

### Cited Findings
- Whoop's dark UI rationale: data-heavy apps checked early morning or late night benefit because "high-contrast data points pop against black" and eye strain goes down. — [925 Studios](https://www.925studios.co/blog/whoop-design-breakdown)
- iOS 26 Liquid Glass: "Glass belongs to your controls and navigation… not to the content itself". For health apps, "keep your content view backgrounds opaque". A glass nav bar "becomes a clinical risk when your scrollable content is the data itself". — [Mindbowser RN health guide](https://www.mindbowser.com/ios-26-liquid-glass-react-native-health-app-guide/); [LearnUI iOS 26 guidelines](https://www.learnui.design/blog/ios-design-guidelines-templates.html)
- The Mindbowser RN tab-bar suggestion is a near-opaque fallback: `backgroundColor: 'rgba(255,255,255,0.92)'`, `borderTopColor: 'rgba(0,0,0,0.08)'`, dark `rgba(28,28,30,0.92)`. — [Mindbowser](https://www.mindbowser.com/ios-26-liquid-glass-react-native-health-app-guide/)
- Liquid Glass accessibility trade-offs (usability vs legibility) are discussed. — [let's dev blog](https://letsdev.de/en/blog/ios-26-in-detail-liquid-glass-ui-between-usability-and-accessibility.php) (not fetched)
- Headspace's illustration now covers the full emotional range, with photography added for coaching. — [It's Nice That](https://www.itsnicethat.com/articles/italic-studio-headspace-graphic-design-project-250424)

### Inferences
- Atossa's content should be light mode first, with opaque cards and warm off-white. Dark mode was removed from the app (per repo CLAUDE.md). If it is reintroduced, use a warm near-black (not pure `#000`).
- Avoid decorative gradients behind symptom text. If a gradient is used at all, make it a very subtle warm-neutral wash on the onboarding and hero screens only.
- For imagery, abstract organic shapes or restrained illustration beat stock photos of women (a femtech cliché). No anatomy illustrations, because they drift toward diagnostic implication.

### Gaps
- Whether `expo-glass-effect` (Expo's Liquid Glass view) is available and stable in SDK 57 was not verified in this pass. Check the Expo docs before relying on it.
- Calm and Eight Sleep dark-theme specifics were not sourced.

---

## 4. Tab bar, headers, large titles, sheets, segmented controls (iOS 18–26)

### Takeaway
In iOS 26 the tab bar is a floating, inset Liquid Glass capsule. Large titles are 34 pt bold and collapse to 17 pt semibold. Modal sheets dismiss by swipe or X. Premium health apps also cut tab counts to three (Oura), which fits Atossa's three tabs.

### Cited Findings
- iOS 26 tab bar: a floating, centered pill inset **21 pt** left, right and bottom; labels 11 pt SF Pro; selected state uses the brand/accent color; Liquid Glass background; hides when the keyboard or a modal appears; search can be a separate circular "island". — [LearnUI](https://www.learnui.design/blog/ios-design-guidelines-templates.html); [Donny Wals](https://www.donnywals.com/exploring-tab-bars-on-ios-26-with-liquid-glass/)
- Type sizes: large title 34 pt bold (left-aligned) → collapsed 17 pt semibold (centered); body 17 pt regular; secondary 15 pt; captions 13 pt; tab labels 11 pt. Minimum touch target **44×44 pt**. — [LearnUI](https://www.learnui.design/blog/ios-design-guidelines-templates.html)
- Sheets: dismiss via X or swipe down, with the content behind them dimmed. — [LearnUI](https://www.learnui.design/blog/ios-design-guidelines-templates.html)
- Oura: 3 tabs (Today, Vitals, My Health). — [Oura blog](https://ouraring.com/blog/new-app-design/). Whoop: single-scroll Home plus a Health tab. — [Whoop](https://www.whoop.com/us/en/thelocker/the-all-new-whoop-home-screen/)

### Inferences
- Atossa's current "mint selected-tab pill" is a custom tab bar that competes with iOS's native look. Better options: native tab bar behavior (icon + 11 pt label, brand-color tint on the selected item, no colored pill), or a floating inset capsule that echoes iOS 26 with a near-opaque surface.
- Use large-title headers (34 pt → 17 pt collapse) on the Dashboard and For-my-doctor tabs. Put the doctor summary preview and export in a bottom sheet. Use a segmented control for time ranges (e.g. 7d / 30d / cycle) on the dashboard.

### Gaps
- Exact iOS 26 segmented-control and card corner-radius values were not found (LearnUI did not give them). Apple's HIG pages were not fetched directly.

---

## 5. Accessibility as a professional signal

### Takeaway
Top brands now treat contrast and accessible color as part of the brand system (Headspace revised its palette for contrast). Supporting Dynamic Type up to the largest sizes and meeting 44 pt targets is baseline for "looks like Apple-grade quality".

### Cited Findings
- Headspace's 2024 palette was revised to be "more mindful of accessibility in terms of contrast and colour combinations". — [It's Nice That](https://www.itsnicethat.com/articles/italic-studio-headspace-graphic-design-project-250424)
- Test layouts at maximum Dynamic Type size and with iOS 26 Accessibility Reader and VoiceOver. — [Mindbowser](https://www.mindbowser.com/ios-26-liquid-glass-react-native-health-app-guide/)
- 44×44 pt minimum touch targets. — [LearnUI](https://www.learnui.design/blog/ios-design-guidelines-templates.html)
- Whoop's color semantics are learned once and reused everywhere, and color always carries meaning. — [925 Studios](https://www.925studios.co/blog/whoop-design-breakdown)

### Inferences
- Target WCAG AA (4.5:1 body, 3:1 large text and UI) against the off-white canvas. Salmon pink on cream very likely fails AA for text, which may be part of why it feels cheap. Deep plum, green or slate on off-white passes easily.
- Never encode severity by color alone. Pair it with labels or numbers. This also suits a doctor-facing export that may be printed in black and white.
- In RN, keep `allowFontScaling` on and set `maxFontSizeMultiplier` (about 1.6–2.0) on dense chips only.

### Gaps
- No health-specific accessibility audit data (e.g. which femtech apps pass AA) was found.

---

## 6. Open-source fonts (Google Fonts / Expo) that evoke these brands, and a concrete system for Atossa

### Takeaway
The premium brands use proprietary faces (Oura: Akkurat LL + Editorial New; Headspace: custom Aperçu). Close free substitutes on Google Fonts, all installable through `@expo-google-fonts/*`: a clean grotesk for UI (Inter, Inter Tight, Geist, Hanken Grotesk, DM Sans) plus a high-contrast editorial serif for rare emphasis (Instrument Serif, Newsreader, Source Serif 4).

### Cited Findings
- The proprietary brand fonts are "not publicly distributed" (Oura). — [oh-my-design.kr](https://oh-my-design.kr/design-systems/oura)
- Headspace's type is a custom Aperçu variant. — [It's Nice That](https://www.itsnicethat.com/articles/italic-studio-headspace-graphic-design-project-250424)
- Free alternatives (availability on Google Fonts): [Inter](https://fonts.google.com/specimen/Inter), [Inter Tight](https://fonts.google.com/specimen/Inter+Tight), [Geist](https://fonts.google.com/specimen/Geist), [Hanken Grotesk](https://fonts.google.com/specimen/Hanken+Grotesk), [DM Sans](https://fonts.google.com/specimen/DM+Sans), [Instrument Serif](https://fonts.google.com/specimen/Instrument+Serif) (regular + italic only), [Newsreader](https://fonts.google.com/specimen/Newsreader), [Source Serif 4](https://fonts.google.com/specimen/Source+Serif+4)

### Inferences: proposed Atossa visual system (synthesized; values are recommendations, not sourced from any brand)
**Type**
- UI/body: **Inter** (closest to Akkurat's neutral, precise feel; excellent tabular figures for data) or **Hanken Grotesk** (warmer). Scale mapped to the iOS text styles: 34/41 bold large title, 28/34 semibold title, 22/28 semibold section, 17/24 body, 15/20 secondary, 13/18 caption, 11/13 tab label. Tracking about −0.5% on 28+ sizes.
- Emphasis serif: **Instrument Serif Italic**, used *only* for one phrase per screen hero (the Oura pattern) or the summary title. The app previously used Fraunces everywhere, which is the opposite pattern.

**Palette (light)**
- Canvas `#F7F3EE` · Surface/card `#FFFFFF` · Sunken `#EFE9E1` · Hairline `#E4DDD3`
- Ink `#1F1B18` · Ink-secondary `#5A544E` · Ink-tertiary `#8C857D`
- Brand option A (plum): `#4A2C4F` primary, `#EDE4EE` tint. Option B (deep green): `#2F4A3A` primary, `#E3ECE5` tint.
- Semantic severity scale (not decorative): `#6B8F71` mild, `#C29A3B` moderate, `#B5573A` severe, always paired with text labels.

**Shape and space**
- 4-pt grid; spacing 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40; screen gutter 20 pt.
- Radii: cards 20, inputs and chips 12, buttons full pill (Oura uses pill `9999px`), sheets 28 top corners.
- Cards: white on warm canvas with a hairline border *or* a very soft shadow (y 1–2, blur 8–16, black at 4–6%), never both heavy. No colored card fills except the one brand tint.

**Iconography**
- SF Symbols-style line icons (1.5–2 pt stroke, rounded caps), e.g. Lucide or Phosphor (regular weight), one weight throughout. Avoid emoji and cutesy uterus/flower motifs.

**Chat**
- Replace plain text chat with distinct bubbles: user bubbles in brand tint, assistant replies as unboxed text on the canvas with a small avatar mark. Answer chips should be pills (44 pt min height). Show a structured "captured so far" card that builds up as the user answers, which links chat to the summary.

**Data viz**
- Oura/Whoop three tiers: Dashboard shows 1–3 headline facts. Tapping opens week/cycle trend (bars/dots). The For-my-doctor tab is the full, print-like structured summary.
- Tabular numerals; no chart junk; one hue per series.

**Motion and haptics**
- Spring transitions that keep spatial context (Whoop). Short (200–300 ms) ease-out fades for content.
- `expo-haptics`: `selectionAsync` on chip toggles and segmented changes, `impactAsync(Light)` on save, `notificationAsync(Success)` when the summary is generated. Respect Reduce Motion.

### Gaps
- None of the font substitutions are endorsed by the brands. They are visual-similarity judgments.
- No sourced haptics patterns from any of the named apps were found. The haptic mapping above follows general iOS convention, not a documented brand practice.
- Apple Design Award health examples: 2026 winner **Harvee** (Social Impact; Apple Watch stress and recovery with a friendly avatar, on-device models), finalist **The Outsiders: Athlete Tracker** (Interaction; praised for "beautiful data visualization" of a readiness score) — [Apple ADA 2026](https://developer.apple.com/design/awards/). 2025 finalists included **Evolve** (LGBTQ+ wellness: breathing, affirmations, journaling) — [Apple ADA 2025](https://developer.apple.com/design/awards/2025/). No women's-health app appeared among 2025–2026 winners or finalists, and 2023–2024 were not checked. Visual specs of these apps were not researched.

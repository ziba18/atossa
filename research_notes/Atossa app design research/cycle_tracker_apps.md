# UI/UX of leading period, cycle and fertility tracking apps (2025–2026)

Research date: 2026-09-29. Scope: Flo, Clue, Stardust, Natural Cycles, Apple Health Cycle Tracking, Oura Cycle Insights, Inito, Oova, Mira, Stix, Hormona.

Method note: many primary design sources were blocked or unavailable to the fetch tool: Medium (Flo Health's design-system and main-screen posts returned 403), NYT Wirecutter (blocked), Clue support (403), and the appitysnacks Clue redesign critique (private). Hex codes and typeface names are mostly **not** publicly documented, so most visual-system questions remain gaps. Anything drawn from the researcher's background knowledge and not verified this session is labelled **[unverified]** and appears only under Inferences.

---

## 1. Visual system of each app (palette, type, illustration, cards, whitespace, motion)

### Takeaway
Only a few visual facts can be sourced. Clue's signature red is #E13336. Clue's 2022 relaunch made tracking icons "more colorful" and "people-friendly". Natural Cycles uses purple as its brand colour and keeps red and green for fertility status only. Stardust is fully "cosmic/astrological" with animated constellations. Apple Health uses a strict shape-plus-colour code. Hormona is described as using "soothing colors". No source gave typeface names.

### Cited Findings
- **Clue:** signature brand red **#E13336** is used throughout the interface — [Clue relaunch article (Dec 2022)](https://helloclue.com/articles/how-to-use-clue/clue-period-tracking-relaunched-and-newly-designed)
- **Clue:** the Dec 2022 relaunch made tracking icons "more colorful, with a people-friendly design", with a "fresh, sleek, seamless design" and "completely redesigned screens", while keeping "the same straightforward, factual approach that's synonymous with the Clue app" — [Clue relaunch article](https://helloclue.com/articles/how-to-use-clue/clue-period-tracking-relaunched-and-newly-designed)
- **Clue:** brand assets (logo, colours, fonts) are listed on Brandfetch and logotyp.us, but the search snippets did not expose the font names — [Brandfetch](https://brandfetch.com/helloclue.com); [logotyp.us](https://logotyp.us/logo/clue/)
- **Natural Cycles:** in a (non-official) redesign concept, purple is the brand colour. The data-input screen is fully purple, and other views use purple so they do not dilute the red/green day signal — [Gu Jian, Medium redesign concept](https://medium.com/@lifebygu/natural-cycles-redesign-808256934fa6) (via search snippet; concept, not the shipped app)
- **Natural Cycles (shipped app):** Today view shows a green circle with the text "Not fertile" on green days and a red circle with "Use Protection" on red days. In the Calendar, red days are visually connected so colour-blind users can tell them apart — [Natural Cycles Help: Red and Green Days](https://help.naturalcycles.com/hc/en-us/articles/360003339574-What-are-Red-and-Green-Days) (via search snippet)
- **Stardust:** "cosmic theme" with "astrological aesthetic". There is an interactive zodiac picker with animated constellations in onboarding, and standard UI components get a "thematic redesign" throughout — [ScreensDesign Stardust breakdown](https://screensdesign.com/showcase/stardust-period-pregnancy)
- **Stardust:** "the main dashboard is visually rich"; the target user is "interested in astrology, mindfulness, and holistic wellness" — [ScreensDesign / search summary](https://screensdesign.com/showcase/stardust-period-pregnancy)
- **Apple Health:** shape and colour code: solid red circles = logged period; red-striped circles = predicted period; light-blue oval = predicted 6-day fertile window; light-purple oval = retrospective ovulation estimate (Watch Series 8+); light/dark green = pregnancy/due date; purple dots = days with other logged info — [Apple Support 120356](https://support.apple.com/en-us/120356)
- **Hormona:** "thoughtfully designed UI with soothing colors"; "medical grounding and thoughtful design"; gendered language criticised as limiting inclusivity — [SheRanked Hormona review (search snippet)](https://www.sheranked.com/app-reviews/hormona-)
- **Inito:** the chart tab plots all four hormones (E3G, LH, PdG, FSH) on one colour-coded chart that updates with each test — [Inito blog: How to read your chart](https://blog.inito.com/how-to-read-your-inito-chart-a-beginners-guide/)
- **Oova:** described as "clean, modern", "professional and healthcare-focused"; no palette given — [Oova app page](https://www.oova.life/app)
- **Flo:** operates a formal design system (Flo Health "Design system Part 1: Stepping stone"); the article itself could not be fetched — [Medium, Flo Health UK](https://medium.com/flo-health/flo-design-system-part-1-1eb8b731a48c)

### Inferences
- There are two visual families. **Warm lifestyle/consumer** apps (Flo, Stardust, Hormona) use soft gradients, illustration and themed art. **Clinical/data** apps (Clue, Natural Cycles, Apple Health, Oura, Inito, Mira, Oova) use a restrained palette where colour carries meaning (red = bleeding, blue/purple = fertile). For a GP-ready, no-diagnosis tool, the clinical family is the closer model.
- Apple's convention of solid = logged, striped/hatched = predicted, and dots = other data is reusable. Atossa does not predict, so it can use only the "logged" and "dot" states. That keeps it visibly honest.
- [unverified] From memory: Flo's app is dominated by pink/coral tones on white with rounded cards; Clue uses lots of white space, a red/terracotta accent and a geometric sans; Oura uses a dark, near-black UI with muted accents. A designer should confirm these from current App Store screenshots or Mobbin.

### Gaps
- No verifiable hex values except Clue #E13336. No typeface names for any app. Mobbin (login-walled) and the Flo design-system posts (403) would be the next sources to check.
- No sourced data on motion design, except Stardust's animated constellations and Flo's "tap and hold" gesture (see onboarding).
- Stix: no design information found at all.

---

## 2. Home / Today screen: hero element and what is above the fold

### Takeaway
Every mainstream tracker leads with **cycle status**: a ring or circle and the day or phase, plus days until the period. The primary action is a "log" button, with content cards below. Stardust maps the ring to moon phases. Oura puts the cycle day and a temperature-trend graph on its Home tab. Hormone-test apps (Inito, Mira, Oova) put the latest test result and chart first.

### Cited Findings
- **Flo:** the dashboard is "clear and action-oriented, immediately showing the user their current cycle status and providing quick access to log symptoms or explore curated content". Multiple "Daily insights" cards sit below — [ScreensDesign Flo breakdown](https://screensdesign.com/showcase/flo-period-pregnancy-tracker)
- **Flo:** logging starts from a "+" button on the main screen. Logged symptoms then show on the main screen for that date — [Flo Help: Logging your symptoms](https://help.flo.health/hc/en-us/articles/4406826542740-Logging-your-symptoms)
- **Flo:** Flo published a dedicated post on evolving the main screen with "cycle widgets" (Part 2); the content was not retrievable — [Medium, Flo Health UK](https://medium.com/flo-health/how-we-evolved-and-enriched-the-main-screen-of-the-flo-app-part-2-cycle-widgets-b73d5ccb948d)
- **Flo (older):** agency Neuron replaced Flo's "virtual assistant chat experience" for reports with a dashboard, to make information "more accessible and easier to digest". The case study says active users grew from 33M to 43M — [Neuron case study](https://www.neuronux.com/flo) (via search snippet; circa 2022, older)
- **Stardust:** the main dashboard has a circular cycle visualisation mapped to moon phases, with an interactive scrubber to explore the month. Detail sections are split into "Mind" and "Body" — [ScreensDesign Stardust](https://screensdesign.com/showcase/stardust-period-pregnancy)
- **Oura:** the Home tab shows a body-temperature-trend graph, current cycle day, the latest temperature difference from baseline, estimated next period start, and a "dynamic calendar button" — [Oura Pulse blog](https://ouraring.com/blog/oura-cycle-insights/) (search snippet)
- **Natural Cycles:** the Today view hero is a single coloured circle (green "Not fertile" / red "Use Protection") — [NC Help](https://help.naturalcycles.com/hc/en-us/articles/360003339574-What-are-Red-and-Green-Days)
- **Hormona:** shows "hormonal fluctuations on the main screen" (a hormone curve), but "this experience differs for those with irregular cycles" — [Hormona product page](https://www.hormona.io/products/hormona-cycle-app)
- **Apple Health:** a horizontal swipeable timeline of days is the hero. Selecting a day and tapping categories below it logs data — [Apple Support: Log menstrual cycle info](https://support.apple.com/en-my/guide/iphone/iph51a822b18/ios) (search snippet)

### Inferences
- The ring/day-number hero exists because those apps sell prediction. Atossa must not predict, so its hero should be something else: "what you've told us / last captured", or a single large "Describe how you feel" voice/text entry. A ring that implies phases or days-until would carry prediction into the design.
- Hormona's note that its curve "differs" for irregular cycles, together with PCOS criticism of prediction (section 8), suggests that cycle-phase heroes alienate the PCOS/endo audience.

### Gaps
- No sourced description of Clue's current (2025–26) home screen layout. [unverified] From memory, it is a large cycle ring with the day number in the centre and segments for period, fertile window and PMS.
- Nothing sourced for Mira's or Inito's home screen composition beyond "calendar, hormone charts, scores, daily status" ([Mira App Store](https://apps.apple.com/us/app/mira-fertility-cycle-tracker/id1434970941) via snippet).

---

## 3. Logging flow (taps, chips/grids/sliders, categories, sheets vs full screens)

### Takeaway
The dominant pattern is **"+" → a grid of icon chips grouped by category → multi-select → Apply/Done**. Flo has 16 trackers with 50+ options (70+ with Premium). Clue has 200+ options in reorderable categories. Stardust adds an intensity slider panel per symptom. Apple Health is timeline → category → options → Done.

### Cited Findings
- **Flo:** tap "+" on the main screen, "select all symptoms or events that you're experiencing, and tap Apply the Symptoms". There are 16 trackers with more than 50 symptoms/events, and multiple symptoms can be picked per tracker. Tracker visibility is customised via "More parameters" at the bottom of the screen — [Flo Help](https://help.flo.health/hc/en-us/articles/4406826542740-Logging-your-symptoms)
- **Flo:** the App Store lists "70+" symptom and mood options; Premium unlocks tracking of 70+ symptoms — [Flo App Store](https://apps.apple.com/us/app/flo-cycle-period-tracker/id1038369065); [Flo help: Premium](https://help.flo.health/hc/en-us/articles/360042141812-What-is-included-in-Flo-Premium)
- **Flo:** logged symptoms feed "stories and dialogs that are relevant to how you're feeling", so logging triggers content — [Flo Help](https://help.flo.health/hc/en-us/articles/4406826542740-Logging-your-symptoms)
- **Clue:** 200+ trackable symptoms (cramps, PMS, mood, energy, skin, sleep, discharge…) — [Clue App Store](https://apps.apple.com/us/app/clue-period-ovulation-tracker/id657189652)
- **Clue:** the 2022 relaunch added categories 'Leisure', 'PMS' and 'Spotting' ("not all bleeding is period bleeding"), plus 40+ new "evidence-based" options, e.g. Pain → Migraine, Headache — [Clue relaunch](https://helloclue.com/articles/how-to-use-clue/clue-period-tracking-relaunched-and-newly-designed)
- **Clue:** users can add, delete and rearrange tracking categories — [Clue Support](https://support.helloclue.com/hc/en-us/articles/214434586-How-do-I-add-delete-or-rearrange-my-tracking-categories)
- **Stardust:** symptom logging is an icon tap that opens an intensity slider panel — [ScreensDesign Stardust](https://screensdesign.com/showcase/stardust-period-pregnancy)
- **Apple Health:** "swipe the timeline to select a day, tap a category (below Other Data), supply the information, then tap Done". Categories: flow, symptoms, spotting, BBT, and cycle factors (pregnancy, lactation, contraception) — [Apple Support guide](https://support.apple.com/guide/iphone/log-menstrual-cycle-information-iph51a822b18/ios); [Apple Support 120356](https://support.apple.com/en-us/120356)
- **Oova:** logging of symptoms such as "mood, sleep, energy" alongside strip-scan results; tests are captured with the phone camera — [Oova app page](https://www.oova.life/app)

### Inferences
- The minimum-tap pattern is roughly 3 taps (+ → chip → Apply). This is the bar a structured confirmation step in Atossa should aim to match after voice/text capture: show extracted symptoms as pre-selected chips the user can deselect or add to, then one "Save".
- Clue's "not all bleeding is period bleeding" framing and its user-reorderable categories fit PCOS/endo well: irregular bleeding and pain need their own categories.
- Stardust's intensity slider (severity per symptom) gives the severity dimension a GP needs; flat chip lists do not capture it.
- [unverified] From memory, Flo and Clue open logging in a full-screen scroll of categories rather than a bottom sheet. Confirm on-device.

### Gaps
- No exact tap counts from a usability source; no evidence on whether each app uses a bottom sheet or a full screen.

---

## 4. Calendar and chart patterns; how history is shown

### Takeaway
Calendars mark each day with a colour or shape (logged vs predicted). Charts appear in hormone-test apps (a multi-line hormone chart) and in Oura (temperature trend). Flo and Clue keep history in "Graphs & Reports" and "Analysis" areas, which are increasingly Premium.

### Cited Findings
- **Apple Health:** calendar/timeline marks listed in section 1; a "Cycle History" list with Export PDF — [Apple Support 120356](https://support.apple.com/en-us/120356)
- **Natural Cycles:** red days are connected in the calendar, for colour-blind accessibility — [NC Help](https://help.naturalcycles.com/hc/en-us/articles/360003339574-What-are-Red-and-Green-Days)
- **Stardust:** uses a moon-phase calendar instead of a standard grid — [ScreensDesign Stardust](https://screensdesign.com/showcase/stardust-period-pregnancy)
- **Flo:** history is viewed by picking a date in the calendar; iOS "Menu → Graphs & Reports" tracks logged symptoms over time — [Flo Help](https://help.flo.health/hc/en-us/articles/4406826542740-Logging-your-symptoms); [Flo Help: Analyzing cycles](https://help.flo.health/hc/en-us/articles/4407228784276-Analyzing-your-cycles-and-symptoms)
- **Clue:** Calendar view, Cycle View and an Analysis tab with cycle averages. Clue Plus adds period-flow analysis, BBT charts and "complete cycle overviews" — [Clue relaunch](https://helloclue.com/articles/how-to-use-clue/clue-period-tracking-relaunched-and-newly-designed); [Clue Support: What's in Clue Plus (snippet)](https://support.helloclue.com/hc/en-us/articles/15007279508637-What-s-included-in-Clue-Plus)
- **Oura:** temperature-deviation graph; as of the Nov 2025 update, 12 months of forward period/fertile predictions and a shorter time to first estimate (from 60 nights to the next cycle start) — [Oura blog: update](https://ouraring.com/blog/oura-cycle-insights-update/) (snippet)
- **Inito:** one colour-coded chart with four hormone lines, updating per test — [Inito blog](https://blog.inito.com/how-to-read-your-inito-chart-a-beginners-guide/)
- **Mira:** calendar marks period, ovulation and testing days; a chart shows all test results plus the fertile window; a reviewer preferred how it "broke down each hormone trend visually over time" — [Mira App Store](https://apps.apple.com/us/app/mira-fertility-cycle-tracker/id1434970941); [Mira: reading charts](https://shop.miracare.com/blogs/resources/read-mira-charts-with-mira-app); [Heyyliv review](https://www.heyyliv.blog/post/an-honest-review-of-the-mira-fertility-tracker)

### Inferences
- A GP-useful history view for Atossa is closer to Clue's doctor report than to a cycle ring: a **symptom × day heat-grid** or a timeline of captured entries with severity. A small-multiples strip per symptom (days on the x axis, severity as dot size or opacity) would show frequency without implying any cause.

### Gaps
- No sourced screenshots or descriptions of Flo's current graph visuals.

---

## 5. Onboarding (steps, questions, tone, progress, paywall)

### Takeaway
Consumer leaders run **long quiz-style onboardings that end in a soft paywall with a free trial**. Flo has about 55 steps (~3 min 20 s) with micro-reinforcement, a "tap and hold" commitment gesture, a partner invite, then a 14-day trial with a "gift" discount. Stardust has 12 steps (zodiac picker) and then a 7-day trial. ScreensDesign flags long onboarding as a drop-off risk.

### Cited Findings
- **Flo:** 55 onboarding steps, about 3 min 20 s, "asking dozens of questions to build a personalized profile", with "instant feedback" and "micro-reinforcements that validate the user's input". A "tap and hold" gesture creates "psychological commitment before the paywall". A "Flo for Partners" invite is part of setup — [ScreensDesign Flo](https://screensdesign.com/showcase/flo-period-pregnancy-tracker)
- **Flo paywall:** comes right after the onboarding quiz. Soft paywall with a 14-day free-trial toggle and the yearly plan as the primary option; scrolling shows monthly and family plans. A special "gift" offers 33% off yearly — [ScreensDesign Flo](https://screensdesign.com/showcase/flo-period-pregnancy-tracker). Metrics claimed there: about 2.25M monthly installs and about $9M monthly revenue (third-party estimate) — [ScreensDesign apps page](https://screensdesign.com/apps/flo-period-pregnancy-tracker)
- **Stardust:** 12 onboarding steps with a paywall at the end of the quiz: soft, 7-day trial, annual plan highlighted with a "64% discount", monthly also offered, and a visual timeline of when the trial ends to build trust — [ScreensDesign Stardust](https://screensdesign.com/showcase/stardust-period-pregnancy)
- **Stardust:** "the onboarding flow is quite long, with numerous questions and permission requests… could also be a point of drop-off for users seeking immediate utility" — [ScreensDesign summary](https://screensdesign.com/showcase/stardust-period-pregnancy)

### Inferences
- For Atossa (free, no paywall, no prediction), a short onboarding is a real point of difference. The trust patterns are worth copying without the dark patterns: Stardust's trial-timeline transparency, and Flo's "validate each answer" micro-feedback.
- Flo's "tap and hold to commit" gesture and the "gift" discount are the manipulative pieces that reviewers dislike (section 8). Avoid them.

### Gaps
- Exact onboarding question lists and progress-indicator style (bar vs dots) were not retrievable for any app.
- Clue, Natural Cycles, Oura, Inito, Mira, Oova, Hormona: no sourced onboarding breakdown.

---

## 6. Navigation (tab count, tab names)

### Takeaway
Tab bars were poorly documented in accessible sources. Sourced items: Flo has an "Insights" tab with articles/videos plus a "Secret Chats" community area; Clue has Calendar, Cycle View and Analysis areas; Oura puts cycle content on its Home tab; Stardust splits content into Mind/Body; Inito has a "chart" tab.

### Cited Findings
- **Flo:** a dedicated "Insights" tab with articles and videos; "Secret Chats" community; chatbot "guided self-assessments" for conditions like endometriosis — [ScreensDesign Flo](https://screensdesign.com/showcase/flo-period-pregnancy-tracker)
- **Clue:** Calendar View, Cycle View and Analysis tab are named in the relaunch notes — [Clue relaunch](https://helloclue.com/articles/how-to-use-clue/clue-period-tracking-relaunched-and-newly-designed)
- **Oura:** cycle data lives on the Home tab (no dedicated cycle tab mentioned) — [Oura blog](https://ouraring.com/blog/oura-cycle-insights/)
- **Inito:** a "chart" tab — [Inito blog](https://blog.inito.com/how-to-read-your-inito-chart-a-beginners-guide/)
- **Stardust:** "Mind" and "Body" sections — [ScreensDesign Stardust](https://screensdesign.com/showcase/stardust-period-pregnancy)

### Inferences
- [unverified] From memory: Flo has 4 bottom tabs (Today, Insights/Content, Messages/Secret Chats, Partner/Profile), and Clue has about 4 (Cycle/Home, Calendar, Analysis, Learn/Profile). Verify on current builds.
- Atossa's current 3 tabs (Chat, Dashboard, For my doctor) are in line with the category norm of 3–5.

### Gaps
- No authoritative current tab names for Flo, Clue, NC, Mira, Oova, Hormona or Stix.

---

## 7. Tone of voice, microcopy, empty states

### Takeaway
Tones split into **factual/science** (Clue's "straightforward, factual approach"; NC's blunt "Not fertile" / "Use Protection"), **empathetic/validating** (Flo's micro-reinforcements; Hormona's "confident and peace of mind", "less lonely") and **mystical/narrative** (Stardust's "Daily Decodes"). No empty-state examples were found.

### Cited Findings
- **Clue:** "the same straightforward, factual approach that's synonymous with the Clue app" — [Clue relaunch](https://helloclue.com/articles/how-to-use-clue/clue-period-tracking-relaunched-and-newly-designed)
- **Natural Cycles:** status microcopy "Not fertile" / "Use Protection" — [NC Help](https://help.naturalcycles.com/hc/en-us/articles/360003339574-What-are-Red-and-Green-Days)
- **Stardust:** "Daily Decodes" deliver hormonal insights in a narrative style — [ScreensDesign Stardust](https://screensdesign.com/showcase/stardust-period-pregnancy)
- **Hormona:** testimonials describe feeling "confident and peace of mind" and "less lonely"; the app "tell[s] me that I'm probably going to feel a certain way" — [Hormona](https://www.hormona.io/products/hormona-cycle-app)
- **Oova:** "Receive insights in the Oova app each day. Seamlessly track your progress and share data with your doctor." — [Oova app page](https://www.oova.life/app)
- **Apple Health:** clinical, neutral framing: a "cycle deviation" is detected for irregular, infrequent or prolonged periods or persistent spotting over the prior 6 months, with the option to export a PDF for a provider — [Apple Support 120356](https://support.apple.com/en-us/120356)

### Inferences
- Apple's "deviation" framing is the closest precedent for Atossa: it notes a pattern and sends the user to a provider without naming a condition. Even that goes a step further than Atossa's rules allow (it is an alert), so Atossa should only restate what the user logged.
- A voice that suits Atossa: Clue-like factual, warmed with Flo-style validation of each entry ("Got it — noted for your summary"), with no mysticism and no predictions.

### Gaps
- No sourced empty-state copy for any app.

---

## 8. What reviewers, Reddit and critics praise and hate

### Takeaway
The complaints are consistent: **paywall creep and upsell pop-ups** (Flo, Clue, Stardust), **redesigns that removed customisation** (Clue 2022), **predictions that fail on irregular (PCOS) cycles**, **privacy/data concerns**, **slow or glitchy performance** (Stardust), and **gendered language** (Hormona). Praise goes to beautiful design (Stardust), comprehensiveness, customisation (Clue), and pattern-spotting that helped someone get a diagnosis from a doctor (Flo).

### Cited Findings
- **Flo complaints:** "every so many minutes...it prompts me to purchase"; features moved behind a paywall that were "previously available to everyone without purchase" — [Flo App Store reviews](https://apps.apple.com/us/app/flo-cycle-period-tracker/id1038369065)
- **Flo praise:** a reviewer credits Flo's pattern recognition with prompting a doctor visit that led to a PCOS diagnosis — [Flo App Store](https://apps.apple.com/us/app/flo-cycle-period-tracker/id1038369065)
- **Flo privacy:** offers "Anonymous Mode" and cites dual ISO 27001 certification — [Flo App Store](https://apps.apple.com/us/app/flo-cycle-period-tracker/id1038369065)
- **Flo and PCOS:** calendar-based prediction trained on regular cycles "struggle[s] with PCOS" (the source claims 18% accuracy for irregular cycles), and educational articles are increasingly behind the Premium paywall — [Go Go Gaia blog](https://www.go-go-gaia.com/blog/best-pcos-tracking-app.html) (competitor's blog; treat the stat with caution)
- **Flo Premium symptom checker:** claims to show "how closely you match common symptoms of conditions like PCOS and endometriosis" via a 5-minute self-assessment to share with a doctor — [Flo help: Premium](https://help.flo.health/hc/en-us/articles/360042141812-What-is-included-in-Flo-Premium). (Relevant contrast: this is exactly the kind of condition-naming Atossa must avoid.)
- **Clue complaints:** "It was a great app I can't figure out why they changed all of it" (the redesign removed customisation); frequent premium pop-ups on the free tier; predictions poor until months of data exist; no birth-event reporting — [Clue App Store](https://apps.apple.com/us/app/clue-period-ovulation-tracker/id657189652)
- **Clue praise:** "It's lovely again and has lots of customization options"; "a staple in my own health/self care journey" — [Clue App Store](https://apps.apple.com/us/app/clue-period-ovulation-tracker/id657189652)
- **Clue privacy:** the App Store privacy label shows health, location, contact and identifier data linked to identity, and tracking across apps, despite GDPR positioning — [Clue App Store](https://apps.apple.com/us/app/clue-period-ovulation-tracker/id657189652)
- **Clue pricing:** Clue Plus costs $9.99/month or $39.99/year — [Clue App Store](https://apps.apple.com/us/app/clue-period-ovulation-tracker/id657189652)
- **Stardust:** praised for aesthetics, content and partner sharing. Criticised for "increasing reliance on paywalls for features previously available for free", slow loading and glitches, and for being "high in emotional engagement but falls short in clinical depth, inclusivity, and technical stability" — [Stardust App Store reviews](https://apps.apple.com/us/app/stardust-period-tracker/id1495829322?see-all=reviews&platform=iphone); [SheRanked (snippet)](https://www.sheranked.com/app-reviews/stardust-); Mozilla also ran a privacy review — [Mozilla Foundation](https://www.mozillafoundation.org/en/nothing-personal/stardust-privacy-review/)
- **Hormona:** gendered language may limit inclusivity for trans and nonbinary users — [SheRanked (snippet)](https://www.sheranked.com/app-reviews/hormona-)
- **Mira:** a reviewer enjoyed entering data, "unlike other period tracking apps" — [Mira App Store / reviews (snippet)](https://apps.apple.com/us/app/mira-fertility-cycle-tracker/id1434970941)
- **Privacy-first alternatives praised:** Euki ("the period tracker that doesn't track you"; free, no paywalls, gender-inclusive); Period app (no accounts, no ads); drip (free, open source) — [Euki](https://eukiapp.org/); [period-app.com](https://period-app.com/); [AlternativeTo](https://alternativeto.net/software/flo-period-and-ovulation-tracker)

### Inferences
- Atossa's positioning (free, no prediction, no condition-naming, doctor-first) answers the main complaints directly. The design should make those promises visible: no upsell surfaces at all, and a plain privacy statement near the capture input.
- "Pink cliché" criticism is not directly sourced here, but the praised privacy-first apps and Clue's factual brand suggest a neutral, non-pink palette signals seriousness.

### Gaps
- Direct Reddit threads (r/PCOS, r/endometriosis, r/Periods) did not surface in search; the PCOS criticism above comes from blog aggregators. No Verge, Wired or Wirecutter text was retrievable (Wirecutter was blocked).

---

## 9. Doctor report / export features and their contents

### Takeaway
**Flo** has a Premium, iOS-only "Report for a Doctor" covering 6 months of cycles and symptoms. **Clue** has a doctor's report (via Clue Plus) summarising the last 6 completed cycles. **Apple Health** has a free Export PDF of 12 months of cycle history. **Oova** offers "HIPAA-compliant provider-ready reports". All are cycle-centric. None turns free-text descriptions into a structured narrative, and that is Atossa's gap to fill.

### Cited Findings
- **Flo:** Premium "personalized doctor's report (iOS only)" of "the last six months of your cycle and symptom history", highlighting patterns — [Flo Help: Premium](https://help.flo.health/hc/en-us/articles/360042141812-What-is-included-in-Flo-Premium)
- **Flo:** path Menu → Graphs & Reports → Report for a Doctor; includes "information about your last cycles, symptoms patterns, and most frequently logged symptoms"; can be shared or printed; iOS only — [Flo Help: Analyzing cycles](https://help.flo.health/hc/en-us/articles/4407228784276-Analyzing-your-cycles-and-symptoms) (search snippet)
- **Flo:** bundles symptom-pattern and cycle-length reports "into one ready-made summary to share with your doctor" — [Flo Premium page](https://flo.health/flo-premium)
- **Flo for clinicians:** runs a med.flo.health site framing patient symptom tracking as making appointments more effective — [med.flo.health](https://med.flo.health/articles/how-to-harness-patient-symptom-tracking-for-more-effective-care)
- **Clue:** "Clue Plus and Doctor's Report are premium features"; a support article exists titled "I can't create a report for my doctor. Why?" — [Clue Support (snippet)](https://support.helloclue.com/hc/en-us/articles/15007279508637-What-s-included-in-Clue-Plus)
- **Clue report contents:** summarises the six most recently completed cycles, with cycle statistics, medications, health conditions and a visual overview of tracked data; excluded cycles are left out of the graph and stats, and cycles over 60 days are left out of the graph but kept in stats — **low-confidence**: this came from a search-engine summary that mixed Clue with open-source GitHub projects building "Clue-like" exports ([example issue](https://github.com/wjdavis5/lunarlog/issues/154)); not verified against Clue's own docs.
- **Apple Health:** Cycle History → Export PDF produces a PDF of the last 12 months of cycle history, or a single cycle, to share via the share sheet. It is free — [Apple Support 120356](https://support.apple.com/en-us/120356)
- **Apple Health gap:** third-party apps (vitalina, HealthSave) exist specifically to export symptom data to clinician-formatted PDFs, which implies the built-in PDF is cycle-centric — [vitalina: cycle tracking export](https://vitalina.app/export/cycle-tracking); [vitalina: symptoms](https://vitalina.app/export/symptoms)
- **Oova:** "HIPAA compliant provider-ready reports that can be exported directly from the app" — [Oova app page](https://www.oova.life/app)

### Inferences
- Common report pattern: header (date range) → cycle stats table (start date, cycle length, period length) → symptom frequency (most-logged list or heat-grid) → meds/conditions → chart. Atossa's "For my doctor" summary could keep the tabular and heat-grid parts. It should add what none of these have: the user's own words (quoted), onset, duration, severity, impact on daily life, and what they want to ask. It must omit Flo-style "matches PCOS" scoring.
- Paywalling the doctor report (Flo, Clue) is a known pain point, and Apple's is free. A free report is a differentiator for Atossa.

### Gaps
- No verified primary-source description of Clue's report layout, and no sample PDF of any app's report was retrievable. Mira, Inito, Natural Cycles and Hormona doctor-export features were not found.

---

## Coverage summary for the report writer
- Strong sourcing: Flo (onboarding, paywall, logging, doctor report, reviews), Apple Health (visual code, export), Stardust (onboarding, dashboard, logging, critiques), Clue (relaunch, categories, reviews, pricing).
- Thin sourcing: Natural Cycles, Oura, Inito, Mira, Oova, Hormona (feature-level only, little visual detail).
- No information: **Stix** (no design, app or UX details found for it); typefaces for all apps; hex values except Clue #E13336.

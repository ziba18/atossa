# UI/UX Design of Chronic-Illness & Symptom-Tracking Apps (Endo/PCOS focus), 2025-2026

Scope note: about 20 search/fetch calls. The sources were mostly vendor pages, App Store listings, review sites and peer-reviewed papers. Reddit threads did not show up in search (site-restricted searches returned App Store pages instead), so the user voice below comes from App Store reviews and press reviews. Pixel-level details (exact colours, font names, PDF page layouts) were almost never published. Anything not backed by a source is labelled as inference or listed under Gaps.

## 1. Home screen & daily check-in design (speed, input types, pain scales, body maps)

### Takeaway
The apps people keep using make the daily check-in a few taps long: one or two headline ratings, then optional chips. They let users hide categories and log more than once a day. Endo-specific apps are converging on a 0-10 pelvic pain rating plus a pelvic body map with named regions (pelvis, lower back/sacrum, legs/sciatica, shoulder/diaphragm, pain with sex). The consistent failure mode is a check-in that takes more than 10 minutes.

### Cited Findings
- Bearable pitches logging "Mood, Emotions, Sleep, Symptoms, & Energy Levels with just a few taps each day", explicitly for users with brain fog and fatigue. — [Bearable](https://bearable.app/)
- Bearable lets users hide categories at first and track only the most important things: "you can also initially hide those categories and track the most important stuff first." — [App Store reviews](https://apps.apple.com/us/app/bearable-symptom-tracker/id1482581097?see-all=reviews)
- Bearable complaint: "super complex and takes a lot of time to setup and then to do your check in two to three times a day". A review site reports some users spending "more than 10 minutes" per entry because there are "too many options". — [App Store reviews](https://apps.apple.com/us/app/bearable-symptom-tracker/id1482581097?see-all=reviews); [ChoosingTherapy](https://www.choosingtherapy.com/bearable-app-review/)
- Bearable logs by time of day (morning / midday / evening). Users praise that they can log several times a day, but complain that onset time only has "6 hour blocks" of precision. — [App Store reviews](https://apps.apple.com/us/app/bearable-symptom-tracker/id1482581097?see-all=reviews)
- Bearable supports custom symptoms, factors and medications "using your own preferred terms and even using emojis". — [Bearable](https://bearable.app/)
- Flaredown was built around "one easy check-in a day", with daily symptom ratings, user-defined symptoms, and automatic weather capture. — [Flaredown press](https://flaredown.com/press.html); [CareClinic vs Flaredown](https://careclinic.io/careclinic-vs-flaredown/)
- Visible uses scheduled morning, evening and monthly check-ins. The morning check-in uses the phone camera to measure HRV and resting heart rate and produces a "Morning Stability" score. The app logs sleep quality, symptom severity, emotional/social exertion, meds and infections. — [Visible How it works](https://www.makevisible.com/how-it-works); [Morning Stability](https://www.makevisible.com/blog/introducing-the-morning-stability-score)
- Visible's redesigned Today page has one hero element: a coloured arc that fills with PacePoints (e.g. "3.0 out of 14"), with a moving marker showing an even pace. Heart rate sits below as a zone-coloured line. The stated principles are "clarity and simplicity". A quoted user: "On bad brain fog days, I don't have the energy to interpret lots of information. I can glance once and immediately understand where I am." — [Visible blog](https://www.makevisible.com/blog/introducing-updated-today-page)
- Guava: from the Home tab, tap "Symptoms", search, and pick one or more (custom symptoms allowed). Free users have no limit on how many symptoms they log. — [Guava Symptom Tracking](https://guavahealth.com/article/tracking-and-visualizing-symptoms-in-guava); [Guava search summary](https://guavahealth.com/prepare-for-visits)
- The "Endometriosis Tracker" app records pelvic pain 1-10 with body location, lower back/sacral pressure, leg pain/sciatica, referred shoulder/diaphragm pain, and pain with intercourse. — [Endometriosis Tracker, App Store](https://apps.apple.com/us/app/endometriosis-tracker/id6743563939)
- Endolog (endo tracker) uses a "pelvic body map to show exactly where pain happens". Newer generic pain apps (Pain Journal, Pain Pilot, PainMap) market "tap where it hurts, show your doctor" body maps. — [Endolog](https://apps.apple.com/us/app/endolog-endometriosis-tracker/id6756697164); [Pain Journal](https://pain-journal.app/); [Pain Pilot](https://mypainpilot.app/)
- Phendo (Columbia, built by participatory design with endo patients through focus groups, interviews, surveys and content analysis) tracks: a functional assessment of the day, activities of daily living that were hard, menstruation, diet, supplements, exercise, hormonal treatments, sexual activity/dyspareunia, and a daily journal. — [Phendo arXiv paper](https://arxiv.org/html/1811.03431v1); [NYP](https://www.nyp.org/advances/article/womens-health/patient-driven-app-provides-key-data-to-advance-endometriosis-research)
- In a 3-month test, a reviewer found Flutter (endo) the "most detailed", but the breadth of logging became cumbersome and she skipped days. — [Endometriosis.net](https://endometriosis.net/living/apps)
- Apple Health's symptom logging (Cycle Tracking and general Symptoms, 25 general symptom types) stores a severity level for each entry. Apple has no native way to hand a symptom series to a clinician, so third-party tools such as Vitalina export PDFs with a severity chart per symptom plus a log table. — [Vitalina](https://vitalina.app/export/symptoms)

### Inferences
- A pattern to copy for Atossa: one required headline question on a single screen (e.g. a "How is today?" 0-10 or 5-step scale, large tap targets, no slider). Then an optional "Where?" pelvic map with 5-6 named, tappable zones (not freehand drawing), plus optional chips. Voice/free text stays the main capture path, and structured fields are derived afterwards rather than demanded first.
- Chips beat sliders when people are fatigued. Sliders need fine motor control and produce false precision. The endo apps with the best reception use discrete scales (1-10 buttons or none/mild/moderate/severe), and Apple Health uses discrete severity levels too. (Inference: I found no head-to-head study.)
- The endo body-map regions seen in the market (pelvis L/C/R, lower back/sacrum, legs, shoulder/diaphragm, pain with sex, bowel/bladder) are a good default zone list. None of them names a condition.

### Gaps
- Exact scale anchors for Bearable (mood 5-point? symptom none/mild/moderate/severe?), Flaredown (believed to be 0-4, not confirmed) and Visible's symptom scale were not found in fetched pages.
- No sourced detail on the Flutter Care, Nerva, Mahana, Endometrics, Endo.App or QENDO check-in UIs. Nerva and Mahana are gut-directed hypnotherapy/CBT programmes rather than trackers (from training knowledge, not verified here).
- No academic comparison of faces vs numeric vs VAS scales in mobile endo apps was retrieved.

## 2. Information architecture for many record types without clutter

### Takeaway
The cleaner apps separate *logging* (Home/Today) from *looking back* (Insights/Trends) and *records/admin* (Records/More/Profile). Admin-type data (medications, conditions, allergies, appointments) lives in a records area. The daily screen does not show it.

### Cited Findings
- Bearable's tabs: Home (logging), Insights (data), More (settings/export). — [ChoosingTherapy](https://www.choosingtherapy.com/bearable-app-review/)
- Guava splits Home (symptom logging and metrics) from a Records tab (medical records: meds, conditions, allergies) and an "events" area on the profile where visit prep is started. — [Guava visit prep announcement](https://guavahealth.com/news/visit-prep-summary-announcement)
- Visible keeps the Today page to a single glanceable instrument plus check-in entry points. Other features (breathing, check-ins) stay "in their original positions" so users don't have to relearn navigation. — [Visible blog](https://www.makevisible.com/blog/introducing-updated-today-page)
- CareClinic organises by "Care Plans" per condition, with meds, symptoms, and a health diary. It is widely seen as feature-heavy. — [CareClinic features](https://careclinic.io/features/); [Care plans](https://careclinic.io/my-careplans/)
- Cognitive-accessibility guidance: keep information architecture stable and predictable so users "can easily access the needed tool" without relearning. — [Smashing Magazine 2026](https://www.smashingmagazine.com/2026/07/designing-distressed-users-mental-health-apps-ui/)

### Inferences
- For Atossa, a 3-area model: **Today** (capture: voice/text, plus a one-tap "how is today"), **Timeline** (a chronological feed of entries, periods and appointments, with filter chips instead of separate pages), and **For my doctor** (the summary builder). Medicines and appointments become entry *types* in the timeline, not their own dashboard sections. Today's Dashboard, which mixes charts, calendar, symptoms, appointments, meds and history, is the "everything on one page" anti-pattern the reviews warn about.
- Tab names people recognise: Today/Home, Insights/Trends, Records/History, Report/Visit prep.

### Gaps
- No published IA diagrams for Flutter Care, QENDO or Allara were found.

## 3. Visualising trends and correlations without implying causes

### Takeaway
Correlation grids (Bearable) are popular but criticised for showing no numbers, which invites misleading conclusions. Apps that openly promise "cause and effect" (Endometriosis Diary) are exactly the framing Atossa must avoid. Safe patterns: time-series of severity, calendar heatmaps, cycle overlays, and "frequency/prevalence" counts.

### Cited Findings
- Bearable offers "30+ reports", "identify correlations", "find patterns", symptom prevalence, and weekly/monthly trends. Its marketing says "how your habits... improve & worsen your health", which is causal framing. — [Bearable](https://bearable.app/)
- A Bearable user notes the correlation grid lacks numerical values, "potentially leading to misleading conclusions". — [App Store reviews](https://apps.apple.com/us/app/bearable-symptom-tracker/id1482581097?see-all=reviews)
- Bearable's weekly report shows the week's average mood/symptom scores, sleep and energy scores, and how often each factor was selected. — [ChoosingTherapy](https://www.choosingtherapy.com/bearable-app-review/)
- Endometriosis Diary advertises forecasting and "cause and effect relationship" detection. — [Endometriosis.net](https://endometriosis.net/living/apps)
- Guava visit prep compares "symptoms, lifestyle, cycle, meds, and more on easy-to-digest graphs". — [Guava](https://guavahealth.com/news/visit-prep-summary-announcement)
- A 2025 JMIR review lists "correlation grids showing activity impacts on symptoms" as a common feature of the good-quality endo apps. — [JMIR 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC11845897/)

### Inferences
- Atossa-safe framing: purely descriptive copy. For example: "Pelvic pain was logged on 9 of 30 days; 7 of those were during bleeding days." Avoid "linked to", "caused by", "triggers" and "forecast". Show counts and dates, never scores or probabilities. A cycle-aligned strip chart (days on the x-axis, bleeding band shaded, severity dots) shows co-occurrence visually and leaves the interpretation to the GP.

### Gaps
- No sourced examples of apps that explicitly design against causal inference.

## 4. Doctor report / export design

### Takeaway
The strongest pattern is Guava's visit-type-specific **one-page** summary. It pulls in symptoms with onset date and average severity, adds relevant meds/conditions/allergies, graphs, and the patient's own questions. Bearable only exports CSV, which is weak for a GP.

### Cited Findings
- Guava Visit Prep: choose a visit type (New Symptoms, Annual, Follow-up, New Specialist, Other). The summary then pulls in logged symptoms with **onset date and average severity**, "Assessments & Requests", user questions plus suggested common questions, comparative graphs, and meds/conditions/allergies from records. Guava describes it as a one-page summary tailored to the appointment type. — [Guava announcement](https://guavahealth.com/news/visit-prep-summary-announcement); [Guava prepare for visits](https://guavahealth.com/prepare-for-visits)
- Guava also has a separate Symptom Report PDF (Home → Symptoms "All" → list icon) and an AI "Auto Prep". — [Guava symptoms article](https://guavahealth.com/article/tracking-and-visualizing-symptoms-in-guava); [Auto Prep](https://guavahealth.com/news/enhancing-doctor-visits-guava-ai-powered-auto-prep)
- Bearable exports as CSV only, with a date range of 3 months, 6 months or all time. (A user review mentions a printable view.) — [ChoosingTherapy](https://www.choosingtherapy.com/bearable-app-review/); [App Store reviews](https://apps.apple.com/us/app/bearable-symptom-tracker/id1482581097?see-all=reviews)
- CareClinic: PDF reports for any date range with charts, treatment timelines, symptom charts and "correlation analysis". Can be shared read-only with the care team. — [CareClinic](https://careclinic.io/)
- Manage My Pain: reports "created by doctors for doctors", easy to print. Report insights are limited to 30 days unless paid. — [Manage My Pain](https://managemypainapp.com/)
- Phendo: downloadable graphs and reports "in a structured, visual format" to share with providers. — [PMC Phendo](https://pmc.ncbi.nlm.nih.gov/articles/PMC13509437/)
- Endometriosis Journey: PDF summaries of pain trends, cycle charts and habits for a gynaecologist. — [Google Play](https://play.google.com/store/apps/details?id=endometriosis.journey&hl=en_US)
- Vitalina's Apple Health PDF: a severity chart per symptom plus a complete log table. — [Vitalina](https://vitalina.app/export/symptoms)

### Inferences
- Recommended Atossa layout: **page 1 fits on one A4 page for the GP**. Header with name/age, date range and "patient-reported, not a diagnosis". Top symptoms table: symptom, first noted, days logged, typical severity, pattern relative to period. A compact cycle strip chart. Current meds tried. "What I want to ask", 3 bullets. Optional page 2: a verbatim quotes appendix (the patient's own words, dated), which is Atossa's differentiator. Visit-type selection (Guava) is worth copying as "What is this appointment for?"

### Gaps
- I could not obtain actual sample PDFs/screenshots of Guava, Bearable, CareClinic or Visible reports to describe their visual layout (fonts, colour, section order beyond the above).

## 5. Visual system (colour, type, iconography, density)

### Takeaway
Little is published. What is published points to a calm, low-density, single-focal-element design ("glance once and understand"), muted palettes and readable type. A "bland" design lowers motivation, so calm must not mean generic.

### Cited Findings
- Visible: one hero visual (arc) per screen, colour used for state (zones), "calmer and simpler". — [Visible blog](https://www.makevisible.com/blog/introducing-updated-today-page)
- Bearable user: "the design... feels kinda bland", and says they would be "more encouraged to use it" with better design. — [App Store reviews](https://apps.apple.com/us/app/bearable-symptom-tracker/id1482581097?see-all=reviews)
- An endo reviewer disliked Endometriosis Diary's colour scheme and missed the "zen, modern vibe" of competitors. — [Endometriosis.net](https://endometriosis.net/living/apps)
- JMIR 2025: 73.7% of assessed endo apps scored well on visual design, and 84.2% on usability. The weak spots were "therapeutic alliance" (supportive language), at 47.4%, and persuasiveness, at 31.6%. — [JMIR 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC11845897/)
- Distressed-user guidance: 4.5:1 body contrast, 3:1 for UI elements. Muted earthy tones (soft greens, taupes). Avoid saturated or cheerful palettes and low-contrast minimalism. Legible type over trendy type. — [Smashing 2026](https://www.smashingmagazine.com/2026/07/designing-distressed-users-mental-health-apps-ui/)

### Inferences
- Atossa: a warm neutral base, one muted accent, and severity shown with a single-hue ramp (not traffic-light red/green, which reads as a judgement). A system font or a humanist sans at 17pt+ body. Large, sparse cards.

### Gaps
- No sourced colour/type specs for Flutter Care, QENDO, Allara, Hormona or Ovy.

## 6. What users praise and hate

### Takeaway
Praised: few taps, hiding unneeded categories, logging any time of day, printable reports, glanceable status. Hated: long setup, more than 10-minute check-ins, too many options, paywalled basics, bland design, correlation displays with no numbers.

### Cited Findings
- All quotes are in sections 1, 3 and 5 above. Bearable is rated 4.8 (about 4K ratings, iOS) and 4.7 (about 8.6K ratings, Play). — [ChoosingTherapy](https://www.choosingtherapy.com/bearable-app-review/)
- Paywall friction: Bearable premium is $34.99/yr and gates notes, passcode and routines. Manage My Pain limits insights to 30 days. — [ChoosingTherapy](https://www.choosingtherapy.com/bearable-app-review/); [Manage My Pain](https://managemypainapp.com/)
- Flutter's breadth led to skipped days. — [Endometriosis.net](https://endometriosis.net/living/apps)
- Forgiving streaks: streaks should not reset after one missed day, with shorter windows (e.g. 3 days). Missed days should be framed as normal. Never use visible "failure" records or confetti on bad days. — [Smashing 2026](https://www.smashingmagazine.com/2026/07/designing-distressed-users-mental-health-apps-ui/)
- PCOS apps (Cysterhood) centre on weight loss, meal plans and workouts, adding a habit tracker in 2025. PCOS-relevant symptoms to log: acne, energy, bloating, hair changes, mood, food. — [Cysterhood](https://www.pcosresources.com/cysterhood); [Go Go Gaia](https://www.go-go-gaia.com/blog/best-pcos-tracking-app.html)

### Inferences
- Atossa should not show streaks at all. At most show "entries this month". PCOS users are used to weight-centric apps, and a symptom-only, weight-neutral framing is a differentiator (inference).

### Gaps
- Reddit (r/endometriosis, r/PCOS, r/ChronicIllness, r/cfs) threads were not retrievable. First-hand complaints about flare-day modes and streak guilt are unsourced beyond App Store reviews.
- Nothing sourced on a "flare-day mode" in any named app.

## 7. Accessibility for fatigue, brain fog and pain

### Takeaway
Reduce the executive effort each check-in needs. That means linear, short flows, voice as a primary input, large targets with button fallbacks for gestures, user-controlled reminders, and glanceable single-focus screens.

### Cited Findings
- "Dense dashboards and multi-step check-ins require executive capacity—the very resource that... brain fog often reduce[s]." Simplify; let users control interruptions and reminders (W3C COGA). — [Pharma Marketing Network](https://www.pharma-mkting.com/articles/neuroinclusive-patient-app-ux-designing-every-mind/)
- Voice input as a primary path. Every gesture needs a visible button. Linear small steps. Predictable navigation. Minimum 24×24 targets (larger for unsteady hands). — [Smashing 2026](https://www.smashingmagazine.com/2026/07/designing-distressed-users-mental-health-apps-ui/)
- Visible's user quote on brain-fog days (glance once). — [Visible blog](https://www.makevisible.com/blog/introducing-updated-today-page)
- Users with cognitive impairment struggle to remember where tools are and benefit from simplified layouts and shortcuts. — [arXiv 2024, cancer survivors](https://arxiv.org/pdf/2410.22740)
- Visible states it "is not a medical device, and does not provide... diagnosis". This is a model for Atossa's disclaimer tone. — [Visible](https://www.makevisible.com/how-it-works)

### Inferences
- Atossa's voice-first capture already matches best practice. The missing pieces are a one-tap "rough day, just log it" path (single scale + mic), autosaved drafts, and Dynamic Type support. Aim for 44pt targets (Apple HIG), stricter than the 24px floor.

### Gaps
- No quantitative study found on logging completion time vs retention in endo/PCOS apps.
- Welltory, Allara, Ovy, Hormona and Apple Health Records UI specifics were not researched in depth, because of the tool-call budget.

# Conversational & Voice Symptom/Journal Capture UX, and "Logging Delight" (2025–2026)

Scope: copyable interaction patterns for turning free-form symptom descriptions (voice/text) into structured, GP-ready records for Atossa, plus patterns that make daily capture feel good without guilt. Researched 2026-09-29. Some requested sources (Healthily, Buoy, Babylon, Headspace/Calm check-ins, Otter, Mobbin screenshots) were not reached with citable primary sources in the tool budget — see Gaps under each question.

## 1. Chat vs guided card flow vs hybrid — how do the best apps structure a check-in?

### Takeaway
The evidence favours a **hybrid**: conversational framing and one-question-at-a-time pacing (which users prefer and find engaging), but with **tappable options, optional/skippable steps, and a fast "quick save" escape** (which keeps it quick). Pure open chat is slower and users drift into search-bar behaviour; pure forms feel "old-school". Rigid yes/no answers are a top complaint in symptom chatbots.

### Cited Findings
- Within-subject study (final N=206, MTurk) comparing a health-intake chatbot (Dokbot) to an online form (REDCap) on the same PRAPARE questionnaire: **69.9% preferred the chatbot** (p<0.001); NPS 24 vs 13; SUS not significantly different (69.7 vs 67.7); but chatbot was **slower: median 212.5 s vs 123.0 s**. Chatbot described as "intuitive" (131 mentions) and "interactive/engaging" (72); one participant liked "how it seemed as if it were progressing through questions without me having to click things". Form was praised as fast/familiar but called "old-school"/"bland". Authors recommend future comparisons against *modern one-question-at-a-time forms* to isolate the conversational advantage. — [Soni et al., PMC9606606](https://pmc.ncbi.nlm.nih.gov/articles/PMC9606606/)
- Ada presents hundreds of branching variables as "a calm, one-question-at-a-time chat flow"; users never see the decision tree; it adapts questions to previous answers and tries "to ask as few questions as possible to prevent fatigue". — [Idea Usher dev guide on Ada](https://ideausher.com/blog/app-like-ada-health-development/) (secondary source; the same page claims a 91% Ada completion rate in 2025 vs 74% industry average — **unverified, no primary source found**)
- Ada uses the chatbot-style interface for all data collection, from profile setup to symptom analysis. — [ScreensDesign showcase](https://screensdesign.com/showcase/ada-check-your-health)
- Study of chatbot symptom checkers (feature analysis of 11 apps, 500 reviews of Ada / K Health / Your.MD / Ask NHS, 10 interviews): users disliked **rigid input options** ("there has to be an option for 'at times' as a response"), confusing/illogical question order, and **no explanation of why a question is asked**; they liked **symptom tracking over time** ("Amazing to be able to track my symptoms for a couple of weeks"). Design recs: flexible input, simpler probing language, explain reasoning, support chronic conditions. — [You & Gui, PMC8075525](https://pmc.ncbi.nlm.nih.gov/articles/PMC8075525/)
- K Health: each conversation starts "with a two-way dialogue similar to the questions your doctor asks during your first diagnostic visit". — [iatroX clinician guide](https://www.iatrox.com/blog/k-health-review-uk-clinicians-ai-physician-mode-evidence); positioned as comparing you to "people like you". — [K Health blog](https://khealth.com/blog/about-k/people-like-you)
- NN/g (April 2026, ecommerce site chatbots): show capabilities concretely (vague "Ask me anything" failed); **offer suggested questions as clickable buttons, not text**; use progressive disclosure (expand/collapse) rather than new messages; **don't autoscroll** while streaming; enable save/share; **offer voice input** (a user: "please, please have a voice-to-text option...I would have actually shut this page off"). — [NN/g, 10 Guidelines for AI Chatbots](https://www.nngroup.com/articles/ai-chatbots-design-guidelines/)
- NN/g: users approach site chatbots like search bars — type as little as possible, want scannable answers; pleasantries lengthen responses; being transparent that it's a bot lets users calibrate. — [NN/g search summary of Less Chat, More Answer / chatbot articles](https://www.nngroup.com/articles/less-chat-more-answer/)
- Older NN/g finding (via secondary): chatbots guide users through simple linear flows and struggle when users deviate. — [Experientia summary of NN/g](https://blog.experientia.com/nielsen-norman-group-on-the-user-experience-of-chatbots/)
- How We Feel check-in: pick an emotion on a 2-axis Mood Meter (energy × pleasantness, 100+ labels), then **optional steps** (photo, voice memo/note, tags, exercise, sleep, weather). "All of the check-in steps are optional"; swipe left or tap arrow to advance; **tap-and-hold the arrow to quick-save and skip all remaining steps**. Rationale: "the more you can specify what's happening as you feel an emotion, the clearer you can be". — [How We Feel Substack, "Ch-Ch-Ch-Changes"](https://howwefeel.substack.com/p/ch-ch-ch-changes)
- Daylio: an entry in **two taps** (5-point mood + activity icons), icon-based and customisable; praised because people can log "even when they are at their worst and without being overwhelmed". — [IntuitionLabs](https://intuitionlabs.ai/software/telepsychiatry-digital-mental-health/mood-tracking-and-journaling/daylio); [Wikipedia](https://en.wikipedia.org/wiki/Daylio)
- Bearable (chronic illness): symptoms "with just a few taps with no typing needed"; custom symptoms/groups; everything on one customisable screen; built by people with health issues to work on days of "fatigue, pain, migraine or brain fog". — [Bearable](https://bearable.app/chronic-illness-symptom-tracker-app/); [App Store](https://apps.apple.com/us/app/bearable-symptom-tracker/id1482581097)
- Stoic: two fixed prompts (morning and evening) that "bookend the day without asking you to pick a topic". — [Stoic review](https://personaldevelopmentapps.com/stoic-review) / [getstoic.com](https://www.getstoic.com/)
- Symptom-tracking UX guidance: step-based flows with progress indicator and back nav; semantic grouping (Pain, Mood, Energy, Sleep); remember previous selections; one-handed use; clear "Done"; **preview selected inputs before submission** for doctor-ready outputs. — [INSAIM Design](https://www.insaim.design/healthtech-blog/symptom-tracking-in-health-apps-ux-ui-best-practices)
- Aggregator claims that "NN/g research" shows progressive disclosure raises completion 30–50% and each form field costs 4–7% completion — **could not verify these are NN/g numbers; treat as unreliable**. — [Callin.io](https://callin.io/chatbots-vs-forms/)

### Inferences
- For Atossa: keep a conversational *frame* (warm prompt, one thing at a time) but render answers as **chips/cards with an always-present free-text/voice field** ("Or tell me in your own words"). Replace fixed 4 questions with: open prompt first ("What's been going on?"), then only ask follow-ups for fields the extraction didn't fill (location, severity, timing, impact on day), each with chips + "skip" + "not sure / sometimes".
- Offer a How We Feel–style **quick save** (long-press / "That's all for now") so a 10-second log is always possible; depth is optional.
- Add a one-line "why we ask" under follow-ups (addresses the "lack of explanation" complaint) — phrased as "helps your GP see…" not clinical reasoning.
- Show 2–4 suggested starters as buttons on the empty chat state (NN/g #3/#4) to kill the "empty-looking chat" problem, e.g. "Pain today", "My period", "Something new", "Just a quick note".
- Don't autoscroll while a summary streams in.

### Gaps
- No primary Ada/K Health/Healthily/Buoy/Babylon screenshots or product-blog detail on chip styling, progress bars or "skip" wording was retrieved. Mobbin requires login; not accessed.
- The Dokbot study compared chat to a *classic* form, not a modern card-per-screen flow, so it doesn't settle chat vs cards.
- No sources on Headspace/Calm check-in flows were retrieved.

## 2. Voice capture UI: record button, live transcript, waveform, edit-before-save

### Takeaway
The 2025–26 convention is: mic/waveform icon beside the text field → tap to start (not hold) → live level waveform + timer + stop → transcript lands **in-line and editable** before saving. ChatGPT moved voice *into* the chat thread with a visible transcript because the full-screen orb hid text.

### Cited Findings
- On 25 Nov 2025 OpenAI shipped voice inside the existing chat: tap the waveform icon next to the text field; you see a live transcript and visuals in the thread. Previously "Advanced Voice Mode" opened a separate full-screen glowing orb with **no visible text** — if you missed something you had to exit to read it. Separate mode remains as a settings option. — [MacRumors](https://www.macrumors.com/2025/11/26/chatgpt-voice-mode-update-seamless-chat/); [Engadget](https://www.engadget.com/ai/now-you-can-use-chatgpt-voice-without-leaving-your-chat-195000538.html)
- Apple Journal (iOS 18): dedicated Record button; after recording, users are **prompted whether to generate a transcript**; Lock Screen widgets for one-tap audio recording, photo, State of Mind (very pleasant → very unpleasant). — [9to5Mac](https://9to5mac.com/heres-everything-new-in-the-journal-app-for-ios-18/); [AppleInsider](https://appleinsider.com/inside/ios-18/tips/how-to-use-search-and-other-new-features-in-the-ios-18-journal-app)
- Rosebud: voice journaling in 20+ languages with automatic transcription; "removes the barrier of typing". — [App Store](https://apps.apple.com/us/app/rosebud-ai-journal-diary/id6451135127); [Rosebud blog](https://www.rosebud.app/blog/best-journaling-app-2025-review)
- Mindsera: "Voice Mode" for on-the-go recording and "Call Mode" for back-and-forth coaching-style conversation. — [Mindsera 2026 comparison](https://mindsera.com/articles/the-7-best-ai-journaling-apps-in-2026-tested) (vendor-written)
- Practitioner patterns (low-authority developer sources): tap-to-start state shows red waveform + elapsed timer + stop; waveform tells users they're heard and when they've finished; then a "transcribing" state with streaming text; **the transcript must be editable** because no speech model is perfect. Press-and-hold (WhatsApp) is the alternative, with slide-to-cancel/lock. — [vory issue #82](https://github.com/matt0975/vory/issues/82); [VP0 Journal](https://vp0.com/blogs/whisper-voice-transcription-app-ui-swiftui); [Ako.native PR](https://github.com/meckurypro/Ako.native/pull/26)
- NN/g (2026) explicitly lists voice input as a chatbot guideline. — [NN/g](https://www.nngroup.com/articles/ai-chatbots-design-guidelines/)

### Inferences
- Atossa: put a large mic button as the **primary** action on the capture screen (text field secondary), tap-to-toggle (press-and-hold is hard with pain/fatigue and for long descriptions), live waveform + timer, and show the transcript in the thread as the user's own bubble, editable, before extraction runs.
- Offer "Keep my words" — store the raw transcript alongside structured fields so the GP summary can quote the user verbatim (the product's core value).
- Graceful fallback when speech recognition is unavailable (relevant: Expo Go lacks the native module).

### Gaps
- No NN/g or academic study specifically comparing tap vs hold recording, or live vs post-hoc transcript, was found. Otter's specific confirmation UI was not researched.

## 3. Showing structured extraction back for confirmation ("Here's what I noted")

### Takeaway
Best practice is human-in-the-loop: show the AI's structured interpretation **visibly distinguished from the user's own words**, traceable back to the source sentence, and editable field-by-field before saving. Granola is the clearest current example.

### Cited Findings
- Granola: user's own notes in black, **AI additions in gray** "so you always know what you wrote versus what the AI added"; enhanced notes are directly editable, or edit raw notes and re-enhance; can ask for changes in natural language; a **magnifying glass beside each note shows where in the transcript it came from**; inline citations jump to the transcript excerpt. "Your notes guide the AI rather than the other way around." — [Granola docs](https://docs.granola.ai/help-center/taking-notes/ai-enhanced-notes); [Granola help](https://www.granola.ai/docs/docs/101/afteryourmeeting/editing-your-enhanced-notes); [Intelligent Interfaces](https://intelligentinterfaces.substack.com/p/how-granola-enhances-note-taking)
- Symptom tracker guidance: "Preview before submission: show selected inputs for verification". — [INSAIM](https://www.insaim.design/healthtech-blog/symptom-tracking-in-health-apps-ux-ui-best-practices)
- Criticism of chat-first journaling (Rosebud): "your entries end up as transcripts of the AI's questions rather than your own thinking". — [Mindsera comparison](https://mindsera.com/articles/the-7-best-ai-journaling-apps-in-2026-tested)
- Symptom reports were **8% less suitable for urgency assessment** when participants believed they talked to an AI chatbot vs a human physician; recommendation to have the interface and prompts explicitly encourage rich, narrative descriptions. — [ResearchGate: "Reduced symptom reporting quality during human–chatbot versus human–physician interactions"](https://www.researchgate.net/publication/404343790_Reduced_symptom_reporting_quality_during_human-chatbot_versus_human-physician_interactions) (full text blocked; figures from search snippet only — verify before quoting)
- Google SymptomAI (July 2026, n=13,917): agents that actively asked structured history questions **significantly outperformed** a purely user-driven "Base" condition. (Note: SymptomAI ends in a differential diagnosis — the opposite of what Atossa may show; relevant only for the *question-asking* finding.) — [Google Research](https://research.google/blog/symptomai-towards-a-conversational-ai-agent-for-everyday-symptom-assessment/)

### Inferences
- Atossa "Here's what I noted" card: fields such as *Where / How it felt (in your words) / How strong / When & how long / What it got in the way of / Anything that helped*, each a tappable row to edit, with the **user's exact phrase quoted in the row** ("'like a hot knife, low down on the left'") and the tidy label in secondary/gray — Granola's two-tone rule.
- Unfilled fields shown as soft "Add?" chips, not errors. Buttons: "Looks right — save" (primary), "Fix something", "Add more".
- Never output interpretive fields (cause, condition, likelihood). The card mirrors, it doesn't interpret — this also fits the SymptomAI finding that structured follow-ups improve completeness without needing to give a verdict.
- Since people give thinner reports to bots, the opening prompt should explicitly invite narrative ("Describe it however it comes — messy is fine").

### Gaps
- No health-app-specific example of an editable extraction card was found with a primary source (Ada/K Health summaries are diagnostic reports, not confirmation cards). Otter's summary/action-item confirmation UI not researched.

## 4. Microcopy and tone for health capture — warm, not saccharine, never diagnostic

### Takeaway
Plain words, second person, brief; warmth via acknowledgement and no-pressure options, not effusive praise. Explain why you ask. Avoid anything that sounds like inference about a cause.

### Cited Findings
- NHS health writing: plain English (e.g. "being sick" rather than "vomiting", with the medical term in brackets if needed); check whether described symptoms (e.g. rashes) look the same on all skin tones. — [NHS A–Z of health writing](https://service-manual.nhs.uk/content/a-to-z-of-nhs-health-writing)
- Plain-language guidance: use "I", "we", "you"; avoid formal/complicated words. — [HSCNI plain English guidelines](https://engage.hscni.net/site/wp-content/uploads/2025/02/guidelines-for-communicating-clearly-using-plain-english-1.pdf); [ODPHP Health Literacy Online](https://odphp.health.gov/healthliteracyonline/create-actionable-content/write-plain-language)
- NN/g: pleasantries lengthen replies; users want concise, scannable answers. — [NN/g](https://www.nngroup.com/articles/less-chat-more-answer/)
- Finch is praised for being "compassionate rather than preachy"; warmth makes self-care feel doable for users with ADHD, anxiety or depression. — [Slate, Sept 2026](https://slate.com/technology/2026/09/finch-app-self-care-wellness-review.html); [HabitBox review](https://habitbox.app/blog/finch-app-review)
- Symptom checker users complained about unexplained, oddly-ordered questions (e.g. asked about alcohol right after reporting vomiting). — [PMC8075525](https://pmc.ncbi.nlm.nih.gov/articles/PMC8075525/)
- K Health frames outputs statistically ("people like you often have X") rather than clinically — an example of the diagnostic framing Atossa must avoid. — [iatroX](https://www.iatrox.com/blog/k-health-review-uk-clinicians-ai-physician-mode-evidence)

### Inferences (suggested copy patterns for Atossa)
- Openers: "What's been going on with your body?" / "Tell me in your own words — messy is fine."
- Acknowledge, don't evaluate: "Got it." / "Thanks — that's noted." Avoid "That sounds like…", "This could be…", "Common with…", "normal/abnormal".
- Why-we-ask: "Your GP often asks this, so it helps to have it ready."
- Skip: "Skip" / "Not sure" / "It varies" always present.
- Close: "Saved to your summary. You can add to it anytime." — no praise inflation.
- Avoid medical jargon in prompts; keep the user's phrasing in the record, add plain labels.

### Gaps
- No published style guide from Ada/Flo/Clue on non-diagnostic microcopy was retrieved.

## 5. Delight: animations, haptics, completion moments, streaks (and backlash)

### Takeaway
Gentle, non-punitive rewards (Finch, Rosebud's retroactive date fix) are the current direction; loss-aversion streaks (Duolingo) are effective but widely criticised as guilt machines — a poor fit for chronic-illness users whose bad days are when logging matters most.

### Cited Findings
- Duolingo streaks rely on loss aversion; users report opening the app sick, travelling or with family "just to keep the flame alive"; critics call it "weaponized" guilt. Streak freezes were added after broken streaks "devastated users"; since 2024 users can stack two. — [Jason Han, Medium](https://medium.com/@Jason-Han/the-architecture-of-guilt-how-duolingo-weaponized-negative-emotion-to-build-a-design-system-a1ea491e7813); [Apptitude teardown](https://apptitude.io/blog/how-duolingos-streak-mechanic-actually-works/); [Teyro: streak burnout](https://teyro.app/blog/duolingo-streak-burnout) (opinion pieces)
- Finch: "never pressures you or punishes you for missing a day"; the bird never dies; rainbow stones reward completion; "no punishing per-habit streak to lose". — [HabitBox](https://habitbox.app/blog/finch-app-review); [Slate](https://slate.com/technology/2026/09/finch-app-self-care-wellness-review.html); [Medium, Elora Indran](https://medium.com/illumination/a-dopamine-loop-that-nourishes-you-finch-is-my-favourite-self-care-app-right-now-151c05fefd2b)
- Rosebud: either a morning or evening entry counts toward the streak; "Don't worry if you miss a day; you can adjust your entry dates to maintain your streak." — [Rosebud help](https://help.rosebud.app/daily-journaling/streaks)
- Daylio uses streaks + achievements + notifications; Stoic uses streaks, badges, milestones; Apple Journal's Insights shows writing streaks and a calendar of entries. — [IntuitionLabs](https://intuitionlabs.ai/software/telepsychiatry-digital-mental-health/mood-tracking-and-journaling/daylio); [getstoic.com](https://www.getstoic.com/); [9to5Mac](https://9to5mac.com/heres-everything-new-in-the-journal-app-for-ios-18/)
- Daylio's "Year in Pixels" and monthly mood graph are signature payoff visualisations. — [IntuitionLabs](https://intuitionlabs.ai/software/telepsychiatry-digital-mental-health/mood-tracking-and-journaling/daylio)

### Inferences
- Atossa should use **accumulation, not streaks**: "12 notes ready for your GP" / a calendar dot-grid of logged days (Year-in-Pixels-lite) with no broken-chain visual. Missing days are neutral, not red.
- Completion moment: brief card-settle animation + light success haptic as the "noted" card files into the "For my doctor" summary — the payoff is visible progress toward the appointment, which is Atossa's real reward.
- Allow backdating ("This was yesterday") as Rosebud does — also clinically useful.
- Reminders: gentle and skippable; never shame copy.

### Gaps
- No primary/NN/g research on haptics or micro-animations in health logging was retrieved; no data on streak effects specifically in chronic-illness trackers. Headspace/Calm check-in completion moments not researched.

## 6. NN/g and research evidence on chatbots vs forms in healthcare

### Takeaway
Patients tend to *prefer* chat-style intake (engagement, perceived ease) even though it takes longer; but free-form chat alone yields thinner reports than structured questioning, and rigid chatbots frustrate. Evidence supports structured, adaptive questions within a conversational shell, with buttons and voice.

### Cited Findings
- Chatbot vs form: 69.9% prefer chatbot; NPS 24 vs 13; SUS n.s.; chatbot ~90 s slower (212.5 vs 123.0 s median); N=206 after cleaning from 391; only 4.9% over 60. — [PMC9606606](https://pmc.ncbi.nlm.nih.gov/articles/PMC9606606/)
- Symptom-checker user research: rigidity, confusing flow, lack of explanation are main pains; tracking over time is valued. — [PMC8075525](https://pmc.ncbi.nlm.nih.gov/articles/PMC8075525/)
- Structured agent-led history-taking beat user-driven free description (n=13,917). — [Google Research SymptomAI](https://research.google/blog/symptomai-towards-a-conversational-ai-agent-for-everyday-symptom-assessment/)
- Reports to perceived AI 8% less suitable for urgency assessment than to perceived physician. — [ResearchGate](https://www.researchgate.net/publication/404343790_Reduced_symptom_reporting_quality_during_human-chatbot_versus_human-physician_interactions) (snippet only)
- NN/g 2026: buttons for suggestions, concrete capability statements, voice input, no autoscroll, save/share. — [NN/g](https://www.nngroup.com/articles/ai-chatbots-design-guidelines/)
- Usability testing of a healthcare chatbot questioned whether conventional usability methods suffice for conversational UIs. — [ACM ECCE 2019](https://dl.acm.org/doi/fullHtml/10.1145/3335082.3335094)

### Inferences
- The "save/share" guideline maps directly to Atossa's "For my doctor" export — make the output of every capture visibly flow there.
- Speed matters: aim for a sub-60-second path (voice → confirm card → save), with chat depth optional.

### Gaps
- NN/g has no healthcare-specific chatbot-vs-form study that I found; its 2026 guidelines come from ecommerce sites. The ACM "Beyond Self-diagnosis" (TOCHI 2023) paper PDF was not machine-readable, so its findings on explanation/empathy in symptom-checker responses are not included.

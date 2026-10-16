# Atossa redesign — review brief

Live prototype (web, review at phone width ~390 px): https://id-preview--b0b66a36-69d0-4fd8-93eb-5a9f0a3a2ccd.lovable.app

Design spec to judge against: the "Recommended direction" section of
/Users/ziba/projects/atossa/reports/Atossa app design research.md (lines 47–200) —
palette with fixed colour meanings (plum = action only, clay = logged bleeding only,
severity = single plum ramp with number, green/red = system status only), Inter +
Instrument Serif Italic (serif only for user quotes, Today hero prompt, summary title),
radii 20/14/pill/28, hairline white cards without shadow, Lucide 1.75 icons, three tabs
Today · Timeline · For my doctor, capture as full-screen sheet, tone rules, and the
"Do not do" list.

Hard product rules (any breach = severity Critical): never name a condition, show
likelihood/match/risk, suggest causes or treatments; never predict (rings, "days until",
fertile windows); never label values against thresholds ("irregular", "heavy"); never
imply causation ("linked to", trend arrows); no streaks / guilt copy / praise for logging;
no paywalls, mascots, emoji, flowers.

Seed persona: Sam. The app is in-memory; reloading the page resets data, so it is fine to
add test entries.

## Output format for each reviewer
1. Overall score /10 and a one-paragraph verdict ("would this pass as a professional,
   App-Store-featured health app?").
2. Per screen/state (Today, capture sheet each step, Timeline and its sub-pages, calendar,
   For my doctor, Profile, toasts/empty states): score /10, what works, problems.
3. A numbered fix list, each item: Severity (Critical / High / Medium / Low), screen,
   what is wrong (concrete: element, measurement, colour, copy), and the exact fix to
   request — written so it can be pasted to the builder as an instruction.
4. Top 5 changes that would most raise perceived quality.

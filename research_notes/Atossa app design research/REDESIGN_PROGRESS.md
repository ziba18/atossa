# Atossa redesign — progress & handoff (started 2026-09-29)

User request: act as PM + UI specialist + graphic designer; deep research of related
apps; drive the Lovable prototype to a professional look & flow; use agentic UI and
graphic-design reviewers to judge every page interactively. User approved going ahead.

## Done
1. Deep research → `reports/Atossa app design research.md` (direction "Warm Paper,
   Deep Ink": 3 tabs Today · Timeline · For my doctor, capture as full-screen sheet,
   palette/type/components/tone/do-not-do). Notes in this folder.
2. Lovable project knowledge set with the permanent rules + visual system
   (project b0b66a36-69d0-4fd8-93eb-5a9f0a3a2ccd).
3. Stage 1 sent + approved by user + built (commit 7bdd5674, 2026-09-29 14:05):
   visual system, 3-tab nav, Today home, capture sheet. Known bug seen: "Your latest
   note" card renders as an oval (wrong radius).

## Paused 2026-09-29 15:31 — Claude session usage 86%, resets 17:30
- DONE: UI/UX review of Stage 1 → `stage1_review_ux.md` (score 5/10, 0 Critical, 7 High,
  25 paste-ready fixes) + 51 screenshots in `stage1_screens/`. High items: capture sheet
  can't close (X/Esc/grabber dead); tappable cards inherit pill radius → ovals/circles;
  0–10 rows clipped (8–10 hidden); system text shown as user quotes in serif ("Quick pain
  score", chip labels prefilled) and leaks into GP summary; symptom form pre-selects "No";
  follow-ups ignore transcript, drop "It varies", single-select zones/impact; Timeline
  still has stat tiles/700 weights. Note: Chrome can't go below 500 px wide.
- NEXT on resume: (a) graphic-design reviewer: review `stage1_screens/*.jpg` + live
  page, write `stage1_review_visual.md`; (b) merge both fix lists into ONE Lovable
  message (Stage 1 fixes), tell user to approve the plan; (c) quick re-check; (d) Stage 2.

## Resumed 2026-10-01 (usage 12% session / 3% week)
- Lovable unchanged since 7bdd5674. Graphic-design review done → `stage1_review_visual.md` (5/10, 22 fixes).
- Merged 33-item fix message `stage1_fix_message.md` SENT to Lovable (msg umsg_01m3vkqk29fnrbeem2b8b9s5az). Built: commit a03d9235 (~25 credits; Lovable claims all 33 done). Verified → `stage1_fix_verification.md`: 17 Pass / 14 Partial / 2 Fail, score 7/10; 18-point follow-up `stage1_followup_message.md` SENT (msg umsg_01m3vs4ygse2595e1kvqawtvmk). Built f53cc8d3 (12.5 credits). Verified → `stage1_fix2_verification.md`: 11 Pass / 7 Partial / 0 Fail, Stage 1 = 8/10, OK to move on. Stage 2 drafted as two messages: `stage2a_timeline_message.md` (incl. §7 Stage 1 leftovers) and `stage2b_doctor_message.md`. 2a SENT (msg umsg_01m3vvax3dfc4vc76whqzssbj9), built 65c85a04 (Lovable hit its session time limit before self-verifying; preview loads fine). Verified → `stage2a_verification.md`: 17 Pass/14 Partial/8 Fail, Timeline 5/10, Records 4/10, app 6/10. Fix message `stage2a_fix_message.md` (items 1–11) approved by user but NOT SENT — Lovable workspace out of credits (2026-10-01). Send it (add the line 'Please verify each item at 390 px width before finishing, prioritising items 1–5 if time runs short.') once credits are back; minor items 12–21 folded into stage2b message §5. NEXT: approve → verify → send 2b → verify → Stage 3. NEXT: follow-up fixes if needed → Stage 2.

## In progress
4. Stage 1 review loop: UI/UX reviewer (Chrome, saves screenshots to `stage1_screens/`,
   writes `stage1_review_ux.md`) → then graphic-design reviewer (reads screenshots +
   live page, writes `stage1_review_visual.md`) → merge fix lists → send one fix message
   to Lovable → user approves plan in Lovable editor → re-review quickly.

## Still to do
5. Stage 2 message: rebuild Timeline (List · Month segmented; week-grouped entry cards;
   filter chips All/Symptoms/Bleeding/Appointments/Medicines; month calendar dots +
   clay bleeding fill + spotting hatch, no predictions; medicines/appointments/history
   become entry types, editable from a "Records" section in Profile) and For my doctor
   (visit type chips → range segment → "What I'd like from today" field → A4 white
   document preview with section toggles, sensitive sections off by default → Share PDF
   / Print / Show on screen; NICE-ordered one page; heat-strip + frequency bars;
   provenance footer; static safety line). Spec: report lines 83–90, 137.
6. Review loop again (both reviewers) → fixes.
7. Stage 3: polish pass (motion, empty states, onboarding/sign-in screens re-skin,
   final full-app review by both reviewers).
8. Afterwards (ask user): port the approved design to the Expo app
   (`constants/atossaUI.ts`, `components/atossa/kit.tsx`, screens). Not started.

## Rules for continuing
- Every Lovable send pauses on a plan the USER must approve in the editor; don't send a
  second message before approval (it cancels the plan). Tell the user when approval is needed.
- Reviewers use Chrome at 390×844 one at a time (sequential, to avoid tab/window clashes).
- User is watching Claude usage: at ~90% save progress here and stop; resume after reset.


## 2026-10-01 — PIVOT: build locally (Lovable out of credits)
User asked to port what's built in Lovable into the Expo app and finish the redesign locally with design/review agents. Plan + status: `design/PORT_PLAN.md`. Lovable snapshot: `design/lovable-reference/`. Phase 0 (foundation) agent running.
- Phase 0 DONE (tsc clean, iOS export OK, web preview boots as Sam). Paused at usage limit. NEXT on resume: launch Phase 1–4 agents in parallel per `design/KIT.md` file ownership (Today+capture, Timeline incl. stage2a fixes, Profile/Records, Doctor per stage2b), then Phase 5 review loop.

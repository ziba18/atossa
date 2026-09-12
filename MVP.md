# Atossa MVP

Three features, in this order. The real product (turning how someone
describes their symptoms into a structured, GP-ready summary) does not
exist yet — this file tracks building it.

## 0. Period Log

**Status:** In progress — new page added 2026-09-12 at explicit user
request, alongside (not blocking) Feature 1. This reuses the existing
pre-pivot cycle-tracking backend (`/cycles`) and `LogEntrySheet`, not
new infrastructure.

A dedicated calendar page (`app/(tabs)/chat/period-log.tsx`) showing a
continuous, linear scroll of months (not swiped/paged) from 12 months
back through the current month. Tapping any day opens the existing log
sheet to mark period flow for that day, so a period can be logged
retroactively on whatever day it started, not just today.

**Acceptance criteria:**

- Calendar scrolls continuously across months, no per-month paging.
- Tapping any past or present day opens the log sheet for that date.
- Logged period days are visually distinct from unlogged days.
- Reachable from the chat tab's multimodal strip ("Period Log" card).
- Logging a period day shows a randomized encouraging confirmation with
  a pop-in reveal animation (not a fake delay).
- A "days logged this period" progress row appears when the most
  recent period is shorter than the user's typical length.

## 0.1. Friends — invite-only cycle phase matching

**Status:** Done (2026-09-12), backend verified end-to-end via curl;
frontend type-checks but not yet visually verified live (blocked on
the same simulator/Expo Go issues as Feature 1 Step D — see
WORKLOG.md).

User asked for friends to be able to see each other's cycles and
"match" them, and to "come together locally." Scoped down deliberately
(user confirmed): invite-only mutual connections (no public/stranger
discovery), phase-timing only shared — never flow, symptoms, or notes
— and no geolocation at all for this pass. Reused the pre-existing,
never-wired-up `ConnectedAccount` model (in `backend/app/models/
social.py`, originally scaffolded for a different partner/parent
monitoring concept) rather than building a parallel Friendship model.

**Acceptance criteria:**

- Inviting someone by email creates a pending, one-directional
  invite; only they can accept or decline it.
- Once accepted, both people can see each other's current cycle phase
  and day — never raw flow/symptom/notes data (enforced server-side:
  the `/connections/friends` response schema only has period_start/
  period_end/period_length fields, nothing else can leak through it).
- When two friends are in the same phase, that's called out explicitly
  ("You're both in your luteal phase").
- No public counts, discovery feed, or growth mechanics anywhere —
  just a private list of the people you've actually connected with.
- Either side can remove a connection at any time.

## 1. Symptom Story → Summary

**Status:** In progress — building the capture layer (voice/text input,
transcription, persistence). The summary step itself (structured
GP-facing output + suggested next step) has not been started.

Step E, partial (2026-09-12): stripped the fake `AI_RESPONSE` /
"Sage is analysing…" animation from `chat/index.tsx` ahead of a
TestFlight build, since it was hardcoded diagnostic-sounding text
("shows elevated inflammation markers... your doctor needs to see this
trend") shipping to a real tester was unacceptable. Sending a text
message now just posts it — no fake AI reply. The rest of Step E (real
voice/text entry points replacing the temporary header icon) is still
not done.

**Acceptance criteria:**

-

## 2. Missing Piece Questions

**Status:** Not started. Depends on the summary schema from Feature 1,
which does not exist yet.

**Acceptance criteria:**

-

## 3. Next Step Tracker

**Status:** Not started. Depends on Feature 1.

**Acceptance criteria:**

-

## Parked

Out-of-scope ideas, noted so they don't get built early by accident.

- The chat tab's other multimodal cards (photo/image capture, "External
  Data", pain scale) — untouched by this MVP effort, not part of the
  Symptom Story flow.

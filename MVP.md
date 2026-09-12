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

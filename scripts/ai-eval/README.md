# AI eval harness (prototype, synthetic data only)
Scores the regex pre-fill in `components/atossa/capture/infer.ts` against `items.v0.json` (hand-authored synthetic
notes, no real user or dataset text). No model calls. Run from repo root:

    node --experimental-strip-types scripts/ai-eval/run.mjs --missed

Gold labels are a first draft and need owner review before any number here is quoted.
A candidate extractor (mocked/replayed LLM output) should expose the same `prefillFrom(text)` shape.

## items.v1-heldout.json
20 further synthetic items written after the negation rules. Run: `node --experimental-strip-types scripts/ai-eval/run.mjs items.v1-heldout.json`.
First pass scored 7% wrong-fill; one more fix ("nothing") was then tuned on it, so it is now a dev set and a new held-out set is needed.

## --json
`node --experimental-strip-types scripts/ai-eval/run.mjs items.v8-blind.json --json` prints counts per field (gold, fills, correct, wrong, miss, spurious = filled where gold was empty, mismatch = filled differently) and ids only, never note text. Diff two branches with `diff <(… --json) <(… --json)`.

## compare.mjs
`node scripts/ai-eval/compare.mjs a.json b.json` diffs two `--json` runs (deltas per field, ids newly wrong / fixed).

# AI eval harness (prototype, synthetic data only)
Scores the regex pre-fill in `components/atossa/capture/infer.ts` against `items.v0.json` (hand-authored synthetic
notes, no real user or dataset text). No model calls. Run from repo root:

    node --experimental-strip-types scripts/ai-eval/run.mjs --missed

Gold labels are a first draft and need owner review before any number here is quoted.
A candidate extractor (mocked/replayed LLM output) should expose the same `prefillFrom(text)` shape.

## items.v1-heldout.json
20 further synthetic items written after the negation rules. Run: `node --experimental-strip-types scripts/ai-eval/run.mjs items.v1-heldout.json`.
First pass scored 7% wrong-fill; one more fix ("nothing") was then tuned on it, so it is now a dev set and a new held-out set is needed.

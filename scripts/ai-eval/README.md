# AI eval harness (prototype, synthetic data only)
Scores the regex pre-fill in `components/atossa/capture/infer.ts` against `items.v0.json` (hand-authored synthetic
notes, no real user or dataset text). No model calls. Run from repo root:

    node --experimental-strip-types scripts/ai-eval/run.mjs --missed

Gold labels are a first draft and need owner review before any number here is quoted.
A candidate extractor (mocked/replayed LLM output) should expose the same `prefillFrom(text)` shape.

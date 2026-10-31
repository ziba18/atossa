// Option B (PM-A201): the Timeline urgent line shows on every symptom card where the guard fires, below her words, one block per card. Run: node scripts/timeline-urgent-recent.test.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const src = readFileSync(new URL('../components/atossa/timeline/EntryCard.tsx', import.meta.url), 'utf8');
assert.match(src, /const urgent = urgentSignpost\(textOf\(s\)\);/, 'detector runs for every symptom card (option B, no recent-day limit)');
assert.ok(!src.includes('isRecentDay'), 'no recent-day limit');

const quoteAt = src.indexOf('<Quote numberOfLines={2}>{words}</Quote>');
const urgentAt = src.indexOf('<View style={styles.urgent}>');
assert.ok(quoteAt > 0 && urgentAt > quoteAt, 'urgent line is rendered after the quote');
assert.equal((src.match(/styles\.urgent\}/g) || []).length, 1, 'one urgent block per symptom card');
console.log('ok: urgent line on every fired card, below the quote');

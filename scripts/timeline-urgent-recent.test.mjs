// Timeline cards show the urgent line only for notes from today or yesterday (Safety ruling). Run: node scripts/timeline-urgent-recent.test.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const src = readFileSync(new URL('../components/atossa/timeline/EntryCard.tsx', import.meta.url), 'utf8');
assert.match(src, /const urgent = isRecentDay\(s\.date\) \? urgentSignpost\(textOf\(s\)\) : null;/, 'detector only runs for recent notes');

// Uses the app's own day keys, so the demo's fixed "today" (design preview) is respected.
assert.match(src, /function isRecentDay\(date: string\): boolean \{\s*const today = todayKey\(\);\s*return date === today \|\| date === addDays\(today, -1\);/, 'today or yesterday by todayKey/addDays');
assert.match(src, /import \{[^}]*\baddDays\b[^}]*\} from '\.\.\/\.\.\/\.\.\/lib\/records\/dates'/);
console.log('ok: timeline urgent recent-only');

// PM-A201: the urgent line sits under her words in the same card, never above them.
const quoteAt = src.indexOf('<Quote numberOfLines={2}>{words}</Quote>');
const urgentAt = src.indexOf('<View style={styles.urgent}>');
assert.ok(quoteAt > 0 && urgentAt > quoteAt, 'urgent line is rendered after the quote');
assert.equal((src.match(/styles\.urgent\}/g) || []).length, 1, 'one urgent block per symptom card');
console.log('ok: urgent line below the quote');

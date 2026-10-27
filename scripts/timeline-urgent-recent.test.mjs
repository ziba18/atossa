// Timeline cards show the urgent line only for notes from today or yesterday (Safety ruling). Run: node scripts/timeline-urgent-recent.test.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const src = readFileSync(new URL('../components/atossa/timeline/EntryCard.tsx', import.meta.url), 'utf8');
assert.match(src, /const urgent = isRecentDay\(s\.date\) \? urgentSignpost\(textOf\(s\)\) : null;/, 'detector only runs for recent notes');

// Uses the app's own day keys, so the demo's fixed "today" (design preview) is respected.
assert.match(src, /function isRecentDay\(date: string\): boolean \{\s*const today = todayKey\(\);\s*return date === today \|\| date === addDays\(today, -1\);/, 'today or yesterday by todayKey/addDays');
assert.match(src, /import \{[^}]*\baddDays\b[^}]*\} from '\.\.\/\.\.\/\.\.\/lib\/records\/dates'/);
console.log('ok: timeline urgent recent-only');

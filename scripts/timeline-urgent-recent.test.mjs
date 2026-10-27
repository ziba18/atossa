// Timeline cards show the urgent line only for notes from today or yesterday (Safety ruling). Run: node scripts/timeline-urgent-recent.test.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const src = readFileSync(new URL('../components/atossa/timeline/EntryCard.tsx', import.meta.url), 'utf8');
assert.match(src, /const urgent = isRecentDay\(s\.date\) \? urgentSignpost\(textOf\(s\)\) : null;/, 'detector only runs for recent notes');

// Same logic as isRecentDay, run for a note 5 days ago, yesterday and today.
const toKey = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const recent = (date, now) => {
  const d = new Date(now);
  const today = toKey(d.getFullYear(), d.getMonth(), d.getDate());
  d.setDate(d.getDate() - 1);
  return date === today || date === toKey(d.getFullYear(), d.getMonth(), d.getDate());
};
const now = new Date(2026, 9, 27, 12);
assert.equal(recent('2026-10-27', now), true);
assert.equal(recent('2026-10-26', now), true);
assert.equal(recent('2026-10-22', now), false);
assert.equal(recent('2026-09-24', now), false);
assert.match(src, /function isRecentDay\(date: string\): boolean \{\s*const d = new Date\(\);\s*const today = toKey\(d\.getFullYear\(\), d\.getMonth\(\), d\.getDate\(\)\);\s*d\.setDate\(d\.getDate\(\) - 1\);/, 'test mirrors the component');
console.log('ok: timeline urgent recent-only');

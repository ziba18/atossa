import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// The reminder shows on the lock screen: it must carry no body or symptom words.
test('daily reminder body has no symptom words', () => {
  const src = readFileSync(new URL('../../lib/notifications.ts', import.meta.url), 'utf8');
  const m = src.match(/DAILY_LOG_REMINDER_BODY = "([^"]+)"/);
  assert.ok(m, 'constant present');
  assert.doesNotMatch(m[1], /pain|bleed|period|mood|sleep/i);
});

// Run: node --experimental-strip-types scripts/ai-eval/chat-payload.test.mjs
import assert from 'node:assert/strict';
import { contentOf } from '../../lib/chatPayload.ts';

const photo = { text: 'my scan', attachments: [{ kind: 'image', name: 'Jane_Smith_MRI_2026.jpg' }] };
const file = { text: '', attachments: [{ kind: 'file', name: 'bloods_results_JS.pdf' }] };
assert.equal(contentOf(photo), 'my scan\n[Attached a photo]');
assert.equal(contentOf(file), '[Attached a file]');
assert.ok(!contentOf(photo).includes('Jane') && !contentOf(file).includes('bloods'));
assert.equal(contentOf({ text: 'x'.repeat(3000) }).length, 2000);
assert.equal(contentOf({ text: '  hi  ' }), 'hi');
console.log('chat-payload: 5 asserts passed');

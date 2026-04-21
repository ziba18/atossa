/**
 * Generates the Apple client secret JWT required by Supabase.
 * Run: node scripts/generate-apple-secret.mjs
 */

import { createSign } from 'crypto';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── FILL THESE IN ──────────────────────────────────────────────────────────
const TEAM_ID   = '5MZF6USVHW';           // your Apple Team ID
const CLIENT_ID = 'com.attosa.app';        // your Bundle ID
const KEY_ID    = '8LZ5S8FAGQ';   // 10-char Key ID from Apple Developer
const P8_PATH   = './AuthKey_8LZ5S8FAGQ.p8'; // path to your downloaded .p8 file
// ───────────────────────────────────────────────────────────────────────────

const privateKey = readFileSync(resolve(P8_PATH), 'utf8');

const now = Math.floor(Date.now() / 1000);
const exp = now + 60 * 60 * 24 * 180; // 180 days (Apple's max)

const header  = Buffer.from(JSON.stringify({ alg: 'ES256', kid: KEY_ID })).toString('base64url');
const payload = Buffer.from(JSON.stringify({
  iss: TEAM_ID,
  iat: now,
  exp,
  aud: 'https://appleid.apple.com',
  sub: CLIENT_ID,
})).toString('base64url');

const signingInput = `${header}.${payload}`;

const sign = createSign('SHA256');
sign.update(signingInput);
const signature = sign.sign({ key: privateKey, dsaEncoding: 'ieee-p1363' }, 'base64url');

const jwt = `${signingInput}.${signature}`;

console.log('\n✅ Apple Client Secret JWT (paste this into Supabase):\n');
console.log(jwt);
console.log('\n⚠️  This JWT expires in 180 days. Regenerate it before then.\n');

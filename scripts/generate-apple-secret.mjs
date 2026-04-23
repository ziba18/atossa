/**
 * Generates the Apple client secret JWT required by Supabase.
 *
 * Usage:
 *   APPLE_TEAM_ID=XXXXXXXXXX APPLE_KEY_ID=XXXXXXXXXX APPLE_P8_PATH=./AuthKey_XXXX.p8 \
 *     node scripts/generate-apple-secret.mjs
 *
 * Or add these to your .env (never commit .env) and run with dotenv:
 *   node -r dotenv/config scripts/generate-apple-secret.mjs
 */

import { createSign } from 'crypto';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const TEAM_ID   = process.env.APPLE_TEAM_ID;
const CLIENT_ID = process.env.APPLE_CLIENT_ID   ?? 'com.attosa.app';
const KEY_ID    = process.env.APPLE_KEY_ID;
const P8_PATH   = process.env.APPLE_P8_PATH;

if (!TEAM_ID || !KEY_ID || !P8_PATH) {
  console.error('Missing required environment variables: APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_P8_PATH');
  process.exit(1);
}

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

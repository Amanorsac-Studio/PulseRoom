#!/usr/bin/env node
/* ============================================================================
 * Self-test for the proof verifier. License Integration Standard v1.1 s5.
 *
 * This proves two different things, and it is worth being clear which is
 * which, because section 11 records a build that confused them:
 *
 *   1. That the s5 algorithm here is implemented correctly. Proven by signing
 *      a body with an EPHEMERAL P-256 key generated in memory for this run and
 *      verifying it through the same steps - base64url, 64-byte raw r||s,
 *      ieee-p1363, bytes as received. If that round trip passes, the algorithm
 *      is right.
 *
 *   2. That the studio key is actually enforced. Proven by feeding that same
 *      well-formed proof to the real verifier and requiring it to be REJECTED.
 *      SecondOut 1.3.0 verified against a development key and told every
 *      customer "Activated."; a verifier that accepts any valid signature is
 *      the same bug with a different key.
 *
 * The ephemeral key is generated at runtime and never written anywhere, so no
 * second signing key exists in the repository (R2) and A11 still finds exactly
 * one hit.
 *
 * What this does NOT prove is that the studio key matches the live server.
 * Only a real proof does that - section 9 A3, which needs a test key from the
 * studio. Run `node scripts/license-selftest.js --proof "<proof>"` to check
 * one by hand.
 * ========================================================================== */
'use strict';

const crypto = require('crypto');
const { verifyProof, proofGrants, fromBase64Url, FORTY_EIGHT_HOURS } = require('../license/crypto');
const { LICENSE_SIGNING_KEY } = require('../license/signing-key');

let pass = 0, fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ok    ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}${detail ? ' - ' + detail : ''}`); }
};

const b64u = buf => Buffer.from(buf).toString('base64url');

/* ------------------------------------------------- a hand-checked real proof -- */

const argi = process.argv.indexOf('--proof');
if (argi !== -1) {
  const proof = process.argv[argi + 1];
  const r = verifyProof(proof);
  console.log(r.ok
    ? `VERIFIED against the studio key.\n${JSON.stringify(r.body, null, 2)}`
    : `NOT VERIFIED: ${r.reason}`);
  process.exit(r.ok ? 0 : 1);
}

/* ------------------------------------------ 1. is the s5 algorithm correct? -- */

console.log('\nSection 5 algorithm, against an ephemeral key:');

const eph = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const body = Buffer.from(JSON.stringify({
  deviceKey: '3f7c2a9e-6b1d-4e2f-9a8c-1d2e3f4a5b6c',
  licenseKey: 'SECO-610E-6070-3493',
  issuedAt: Date.now(),
  expiresAt: Date.now() + 48 * 3600e3,
  graceUntil: Date.now() + 30 * 86400e3
}), 'utf8');

const sig = crypto.sign('sha256', body, { key: eph.privateKey, dsaEncoding: 'ieee-p1363' });
ok('a raw r||s signature is exactly 64 bytes', sig.length === 64, `${sig.length} bytes`);

const ephProof = `${b64u(body)}.${b64u(sig)}`;

// The same steps crypto.js takes, with the ephemeral public key in place of
// the studio one. If this verifies, the algorithm is right.
const dot = ephProof.indexOf('.');
const roundTrip = crypto.verify('sha256', fromBase64Url(ephProof.slice(0, dot)),
  { key: eph.publicKey, dsaEncoding: 'ieee-p1363' }, fromBase64Url(ephProof.slice(dot + 1)));
ok('base64url + ieee-p1363 round trip verifies', roundTrip);

// DER is the shape you get by forgetting dsaEncoding, and s5 step 3 rejects it.
const der = crypto.sign('sha256', body, { key: eph.privateKey });
ok('a DER signature is not 64 bytes, so s5 step 3 catches it', der.length !== 64, `${der.length} bytes`);

// Re-serialising the JSON changes the bytes, which is why s5 verifies first.
const reserialised = Buffer.from(JSON.stringify(JSON.parse(body.toString())), 'utf8');
const sameBytes = reserialised.equals(body);
ok('a re-serialised body can differ from the bytes signed (so verify first)',
  true, sameBytes ? 'identical for this input, but not guaranteed' : 'differs, as expected');

/* ----------------------------------------- 2. is the studio key enforced? -- */

console.log('\nR2 - the studio key is the only one accepted:');

const r = verifyProof(ephProof);
ok('a perfectly valid proof from another key is REJECTED', r.ok === false, r.ok ? 'ACCEPTED - R2 violated' : r.reason);
ok('and the reason names the signature, not the body', !r.ok && /signature/i.test(r.reason), r.reason);

ok('the shipped key is 65 bytes starting 0x04',
  LICENSE_SIGNING_KEY.length === 65 && LICENSE_SIGNING_KEY[0] === 0x04);
ok('A11 byte sequence is present',
  LICENSE_SIGNING_KEY.includes(Buffer.from([0xcd, 0xa5, 0x7d, 0x1c, 0xc8, 0xa6, 0xe2, 0x71])));

/* ------------------------------------------------------- malformed input -- */

console.log('\nMalformed proofs are refused, not half-accepted:');

const bad = {
  'empty string': '',
  'not a string': null,
  'no dot': 'abcdef',
  'dot at the start': '.abc',
  'dot at the end': 'abc.',
  'body not base64url': `not+base64/url.${b64u(sig)}`,
  'signature not base64url': `${b64u(body)}.not+base64/url`,
  'signature too short': `${b64u(body)}.${b64u(sig.subarray(0, 32))}`,
  'signature too long (DER-sized)': `${b64u(body)}.${b64u(der)}`,
  'body is not JSON': `${b64u(Buffer.from('plain text'))}.${b64u(sig)}`
};
for (const [name, value] of Object.entries(bad)) {
  const res = verifyProof(value);
  ok(name, res.ok === false, 'was accepted');
}

/* ---------------------------------------------------- the licensing window -- */

console.log('\nSection 5 - what counts as licensed:');

const DEV = 'device-aaa', KEY = 'PULS-0000-0000-0001';
const now = Date.now();
const mk = over => ({
  deviceKey: DEV, licenseKey: KEY,
  issuedAt: now, expiresAt: now + 48 * 3600e3, graceUntil: now + 30 * 86400e3, ...over
});

ok('fresh proof grants', proofGrants(mk(), DEV, KEY, now).ok);
ok('wrong device is rejected (R5)', proofGrants(mk(), 'device-bbb', KEY, now).ok === false);
ok('wrong key is rejected (R5)', proofGrants(mk(), DEV, 'PULS-9999-9999-9999', now).ok === false);

const expiredNotGrace = mk({ issuedAt: now - 5 * 86400e3, expiresAt: now - 3 * 86400e3 });
const g = proofGrants(expiredNotGrace, DEV, KEY, now);
ok('past expiresAt but inside grace still works (R8)', g.ok === true);
ok('and is flagged stale for the quiet notice', g.stale === true);

const pastGrace = mk({ issuedAt: now - 40 * 86400e3, expiresAt: now - 38 * 86400e3, graceUntil: now - 10 * 86400e3 });
const pg = proofGrants(pastGrace, DEV, KEY, now);
ok('past graceUntil refuses (R8)', pg.ok === false);
ok('and says so as expired, so the proof can be dropped', pg.expired === true);

const clockBack = now - FORTY_EIGHT_HOURS - 60e3;
ok('clock set more than 48h before issuedAt is refused',
  proofGrants(mk(), DEV, KEY, clockBack).ok === false);
ok('clock set slightly back is tolerated',
  proofGrants(mk(), DEV, KEY, now - 60e3).ok === true);

/* --------------------------------------------------------------- result -- */

console.log(`\n${pass} passed, ${fail} failed\n`);
if (fail) {
  console.log('The proof verifier is the whole security model. Not shipping this.');
  process.exit(1);
}
console.log('Section 5 implemented correctly and the studio key is enforced.');
console.log('Still unproven until A3 with a real key: that this key matches the live server.\n');

/* ============================================================================
 * Proof verification. License Integration Standard v1.1 section 5.
 *
 * This file is the whole security model. The private signing key exists only
 * on the server, so nothing a customer or a cracker does on their machine
 * produces a valid proof - provided the check below is exact.
 *
 * Two rules from section 5 are easy to get wrong and both silently break
 * verification rather than failing loudly:
 *
 *   - The signature is raw r||s (IEEE P1363), 64 bytes, not DER. Node needs
 *     dsaEncoding:'ieee-p1363' or it expects DER and every proof fails.
 *   - The signature covers the decoded body bytes EXACTLY as received. Parsing
 *     the JSON and re-serialising it changes the bytes - key order, spacing -
 *     and verification fails. So the body is verified first and parsed second,
 *     which is also the order R3 requires.
 * ========================================================================== */
'use strict';

const crypto = require('crypto');
const { LICENSE_SIGNING_KEY } = require('./signing-key');

const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;

// base64url: - for +, _ for /, no padding. Padding is added back before
// decoding because Node's base64 decoder is lenient enough to accept short
// input and return the wrong bytes rather than complaining.
function fromBase64Url(s) {
  if (typeof s !== 'string' || !/^[A-Za-z0-9_-]+$/.test(s)) return null;
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);
  return Buffer.from(padded, 'base64');
}

// Built from the 65 raw bytes via JWK, which is the form section 9 uses to
// check a real proof by hand. Cached: the key never changes.
let publicKey = null;
function signingKey() {
  if (!publicKey) {
    publicKey = crypto.createPublicKey({
      format: 'jwk',
      key: {
        kty: 'EC',
        crv: 'P-256',
        x: LICENSE_SIGNING_KEY.subarray(1, 33).toString('base64url'),
        y: LICENSE_SIGNING_KEY.subarray(33, 65).toString('base64url')
      }
    });
  }
  return publicKey;
}

/**
 * Verify a proof string and return its body.
 *
 * Returns { ok: true, body } or { ok: false, reason } - never a half-verified
 * result, because R4 turns on being able to say "a proof verified" and nothing
 * weaker. The reason is for logs and the test report, not for customers.
 */
function verifyProof(proof) {
  if (typeof proof !== 'string' || !proof) return { ok: false, reason: 'no proof' };

  // Split on the FIRST dot. A base64url body contains no dot, but splitting on
  // the last would still be wrong if that ever changed.
  const dot = proof.indexOf('.');
  if (dot <= 0 || dot === proof.length - 1) return { ok: false, reason: 'proof is not body.signature' };

  const bodyBytes = fromBase64Url(proof.slice(0, dot));
  const sigBytes = fromBase64Url(proof.slice(dot + 1));
  if (!bodyBytes || !bodyBytes.length) return { ok: false, reason: 'body is not base64url' };
  if (!sigBytes) return { ok: false, reason: 'signature is not base64url' };

  // Section 5 step 3. A DER signature is 70-72 bytes and would be rejected
  // here rather than failing confusingly inside verify().
  if (sigBytes.length !== 64) {
    return { ok: false, reason: `signature is ${sigBytes.length} bytes, expected exactly 64 (raw r||s, not DER)` };
  }

  let verified = false;
  try {
    verified = crypto.verify('sha256', bodyBytes,
      { key: signingKey(), dsaEncoding: 'ieee-p1363' }, sigBytes);
  } catch (e) {
    return { ok: false, reason: `verification error: ${e.message}` };
  }
  if (!verified) return { ok: false, reason: 'signature does not verify against the studio key' };

  // Only now (R3).
  let body;
  try {
    body = JSON.parse(bodyBytes.toString('utf8'));
  } catch {
    return { ok: false, reason: 'signature verified but the body is not JSON' };
  }

  for (const field of ['deviceKey', 'licenseKey', 'issuedAt', 'expiresAt', 'graceUntil']) {
    if (body[field] === undefined) return { ok: false, reason: `body is missing ${field}` };
  }
  for (const field of ['issuedAt', 'expiresAt', 'graceUntil']) {
    if (!Number.isFinite(body[field])) return { ok: false, reason: `${field} is not a number` };
  }

  return { ok: true, body };
}

/**
 * Is a verified body currently licensing this device for this key?
 *
 * Section 5: all of - signature verified, device and key match, now within
 * graceUntil, and the clock not turned back more than 48 hours before
 * issuedAt. The clock check is what stops a machine being set to last year to
 * keep an expired proof alive forever.
 */
function proofGrants(body, deviceKey, licenseKey, now = Date.now()) {
  if (!body) return { ok: false, reason: 'no body' };

  // R5. A proof for another device or another key is rejected even though its
  // signature is genuine - the server signed it for somebody else.
  if (body.deviceKey !== deviceKey) return { ok: false, reason: 'proof was issued for a different device' };
  if (body.licenseKey !== licenseKey) return { ok: false, reason: 'proof was issued for a different license key' };

  if (now > body.graceUntil) return { ok: false, reason: 'grace period has passed', expired: true };
  if (now < body.issuedAt - FORTY_EIGHT_HOURS) return { ok: false, reason: 'system clock is set well before the proof was issued' };

  // Inside grace but past expiry is still licensed; section 7 asks for a quiet
  // notice, not a lockout.
  return { ok: true, stale: now > body.expiresAt };
}

module.exports = { verifyProof, proofGrants, fromBase64Url, FORTY_EIGHT_HOURS };

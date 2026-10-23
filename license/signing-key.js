/* ============================================================================
 * The Amanorsac Studio license signing key.
 *
 * License Integration Standard v1.1 section 5. Raw SEC1 uncompressed point,
 * 65 bytes: 0x04 followed by X and Y. The same key for every product.
 *
 * R2: the build must contain this key byte for byte, and MUST NOT contain any
 * other signing key, including a development key. There is no override here
 * and no second key anywhere in the repository - section 11 records that
 * SecondOut 1.3.0 shipped with a development key compiled in, told every
 * customer "Activated.", and locked all of them out. A constant with no way
 * to replace it is the point, not an inconvenience.
 *
 * Acceptance check A11 searches the shipped build for cd a5 7d 1c c8 a6 e2 71
 * and expects exactly one hit, which is why these bytes appear in this file
 * and nowhere else.
 * ========================================================================== */
'use strict';

const LICENSE_SIGNING_KEY = Buffer.from([
  0x04, 0xcd, 0xa5, 0x7d, 0x1c, 0xc8, 0xa6, 0xe2, 0x71, 0xd5, 0x48, 0x49,
  0xce, 0x55, 0xd5, 0x03, 0x77, 0x56, 0x66, 0x90, 0xfd, 0xb6, 0x95, 0x45,
  0xa4, 0x1a, 0x92, 0xc4, 0x77, 0xda, 0xcb, 0x00, 0x0d, 0x2c, 0x06, 0x0b,
  0xa8, 0x3f, 0xbd, 0x9b, 0x70, 0x85, 0xaf, 0xff, 0xc0, 0x42, 0xd4, 0x00,
  0x7e, 0x5b, 0x96, 0xfe, 0x68, 0xff, 0xec, 0x91, 0x11, 0xf6, 0x21, 0x00,
  0x79, 0xfc, 0x43, 0x59, 0x52
]);

// A truncated paste would still "work" right up to the first real proof, so
// the shape is asserted at load rather than trusted.
if (LICENSE_SIGNING_KEY.length !== 65 || LICENSE_SIGNING_KEY[0] !== 0x04) {
  throw new Error('license signing key is not a 65-byte uncompressed P-256 point');
}

const LICENSE_SIGNING_KEY_CONFIGURED = true;

module.exports = { LICENSE_SIGNING_KEY, LICENSE_SIGNING_KEY_CONFIGURED };

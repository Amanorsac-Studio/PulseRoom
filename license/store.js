/* ============================================================================
 * Device id and local storage. License Integration Standard v1.1 section 6.
 *
 * Paths are the ones the standard names, not Electron's app.getPath('userData')
 * - that would put this under %APPDATA%\PulseRoom, which is not where the
 * studio's other products look.
 *
 *   Windows   %LOCALAPPDATA%\Amanorsac Studio\PulseRoom\
 *   macOS     ~/Library/Application Support/Amanorsac Studio/PulseRoom/
 *
 * Files: device.id (plain), license-key.dat and license-proof.dat (encrypted).
 *
 * R7 DEVIATION, stated rather than hidden. The standard asks for
 * CryptProtectData with a fixed per-product entropy string on Windows and
 * Keychain on macOS. This is an Electron app, and Electron's safeStorage is
 * DPAPI on Windows and Keychain on macOS - the right OS facilities - but it
 * exposes no entropy parameter. The property R7 exists for still holds: the
 * blob is bound to the current user account, so a copied file does not work on
 * another machine. What is lost is the extra per-product domain separation.
 * Reaching it would mean a native module calling CryptProtectData directly,
 * which adds a build dependency to every platform. Flagged for the studio in
 * the delivery report rather than decided here.
 * ========================================================================== */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const PRODUCT = 'PulseRoom';

// Kept for the day this moves to a native CryptProtectData call; section 8
// specifies the value, so it is recorded at the point of use.
const DPAPI_ENTROPY = `${PRODUCT}/license/v1`;

function storageDir() {
  if (process.platform === 'win32') {
    const base = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    return path.join(base, 'Amanorsac Studio', PRODUCT);
  }
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'Amanorsac Studio', PRODUCT);
  }
  // Not a platform the standard covers. Follow the XDG convention so a Linux
  // development run works rather than writing somewhere arbitrary.
  const base = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
  return path.join(base, 'Amanorsac Studio', PRODUCT);
}

const DIR = storageDir();
const DEVICE_FILE = path.join(DIR, 'device.id');
const KEY_FILE = path.join(DIR, 'license-key.dat');
const PROOF_FILE = path.join(DIR, 'license-proof.dat');

/* ------------------------------------------------------------- encryption -- */
// safeStorage comes from electron, which is absent when these modules are
// loaded by a test script or the acceptance harness. Required lazily so the
// pure logic stays testable outside Electron.
let safeStorage = null;
function storage() {
  if (safeStorage === null) {
    try { safeStorage = require('electron').safeStorage; } catch { safeStorage = false; }
  }
  return safeStorage || null;
}

function encryptionAvailable() {
  const s = storage();
  try { return !!(s && s.isEncryptionAvailable()); } catch { return false; }
}

function writeSecret(file, text) {
  const s = storage();
  if (!s || !encryptionAvailable()) {
    // Never store a key or proof in the clear. Without the OS key store the
    // app simply asks for the key again next launch, which is a worse
    // experience and the correct one.
    return { ok: false, reason: 'the OS key store is unavailable, so nothing was stored' };
  }
  try {
    fs.mkdirSync(DIR, { recursive: true });
    fs.writeFileSync(file, s.encryptString(text));
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

// Section 6: if a blob will not decrypt - profile moved, password reset - delete
// it and show the activation screen quietly. Never crash.
function readSecret(file) {
  const s = storage();
  if (!s || !fs.existsSync(file)) return null;
  try {
    return s.decryptString(fs.readFileSync(file));
  } catch {
    try { fs.unlinkSync(file); } catch { /* nothing more to do */ }
    return null;
  }
}

/* -------------------------------------------------------------- device id -- */

/**
 * R6: a random UUID generated once on first run and reused forever. Never a
 * hardware serial, MAC address or anything personal - so this is
 * randomUUID(), which reads nothing about the machine.
 *
 * Section 6: if the file is missing, generate a new one. The customer uses a
 * seat again, which is the correct outcome for a wiped machine.
 */
function deviceId() {
  try {
    if (fs.existsSync(DEVICE_FILE)) {
      const existing = fs.readFileSync(DEVICE_FILE, 'utf8').trim();
      if (existing.length >= 16 && existing.length <= 128) return existing;
    }
  } catch { /* fall through and make a new one */ }

  const fresh = crypto.randomUUID();
  try {
    fs.mkdirSync(DIR, { recursive: true });
    fs.writeFileSync(DEVICE_FILE, fresh, 'utf8');
  } catch { /* in-memory id for this run; a new seat next launch */ }
  return fresh;
}

/* ------------------------------------------------------------ key / proof -- */

const readKey = () => readSecret(KEY_FILE);
const writeKey = key => writeSecret(KEY_FILE, key);
const readStoredProof = () => readSecret(PROOF_FILE);

// R3 / section 6: license-proof.dat is written ONLY after a proof verified, so
// its presence is the evidence that activation truly succeeded. Callers do not
// get to decide that - verification happens here too.
function writeProof(proof, deviceKey, licenseKey) {
  const { verifyProof, proofGrants } = require('./crypto');
  const v = verifyProof(proof);
  if (!v.ok) return { ok: false, reason: v.reason };
  const g = proofGrants(v.body, deviceKey, licenseKey);
  if (!g.ok) return { ok: false, reason: g.reason };
  const w = writeSecret(PROOF_FILE, proof);
  return w.ok ? { ok: true, body: v.body } : w;
}

function clearAll() {
  for (const f of [KEY_FILE, PROOF_FILE]) {
    try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch { /* best effort */ }
  }
  // device.id is deliberately kept: R10 frees the seat, it does not make the
  // machine look like a different one.
}

function clearProof() {
  try { if (fs.existsSync(PROOF_FILE)) fs.unlinkSync(PROOF_FILE); } catch { /* best effort */ }
}

module.exports = {
  PRODUCT, DPAPI_ENTROPY,
  DIR, DEVICE_FILE, KEY_FILE, PROOF_FILE,
  encryptionAvailable, deviceId,
  readKey, writeKey, readStoredProof, writeProof,
  clearAll, clearProof
};

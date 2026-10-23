/* ============================================================================
 * The license client. License Integration Standard v1.1 sections 4 and 7.
 *
 * Runs in the Electron main process, never the renderer. Three reasons, all
 * load-bearing:
 *
 *   - safeStorage (R7) only exists in the main process.
 *   - index.html sets `default-src 'self'`, which would block the renderer
 *     from reaching the license server. Keeping the request here means the
 *     Content-Security-Policy stays exactly as tight as it is today.
 *   - The license key and the proof never enter the window, so nothing in the
 *     page can read or forge them.
 *
 * R1: the shipped default is the studio server. The development override is
 * only read when the app is NOT packaged, so a shipped binary cannot be
 * pointed elsewhere by an environment variable. Section 11 records SecondOut
 * 1.3.0 shipping with a developer-machine address as its default and every
 * customer's activation going nowhere; making that impossible by construction
 * is cheaper than remembering not to do it.
 * ========================================================================== */
'use strict';

const os = require('os');
const { verifyProof, proofGrants } = require('./crypto');
const store = require('./store');

const STUDIO_BASE_URL = 'https://amanorsac.studio';
const HEARTBEAT_MS = 60 * 60 * 1000;   // section 7: about hourly
const REQUEST_TIMEOUT_MS = 20000;

function baseUrl() {
  let packaged = true;
  try { packaged = require('electron').app.isPackaged; } catch { packaged = false; }
  if (!packaged && process.env.PULSEROOM_LICENSE_BASE_URL) {
    return process.env.PULSEROOM_LICENSE_BASE_URL.replace(/\/+$/, '');
  }
  return STUDIO_BASE_URL;
}

/* --------------------------------------------------------------- messages -- */
// Section 7: never show a raw HTTP status or JSON to a customer. The server's
// `message` is safe to show when present; otherwise these.
const MESSAGES = {
  invalid_request: 'That key does not look complete. Check it in My Apps on amanorsac.studio.',
  no_such_license: 'That key was not found. Check it in My Apps on amanorsac.studio.',
  device_limit_reached: 'This key is already on its allowed machines.',
  upstream_error: 'The licensing service is not reachable right now. Try again shortly.',
  licensing_unavailable: 'The licensing service is temporarily unavailable. Try again shortly.',
  network: 'Could not reach the licensing service. Check your connection and try again.',
  unverified: 'The license could not be verified. Nothing has been activated.',
  no_keystore: 'This computer’s secure storage is unavailable, so the license cannot be saved.'
};

/* ------------------------------------------------------------------ state -- */
// Read by the window through IPC. A plain object rather than anything clever:
// the UI follows this flag, and only this flag.
const state = {
  licensed: false,
  stale: false,          // inside grace but past expiresAt - quiet notice
  licenseKey: null,
  deviceId: null,
  lastError: null,       // { code, message } for the activation screen
  devices: null,         // populated on device_limit_reached
  maxDevices: null,
  checking: false
};

let heartbeatTimer = null;
const listeners = new Set();

const snapshot = () => ({
  licensed: state.licensed,
  stale: state.stale,
  hasKey: !!state.licenseKey,
  checking: state.checking,
  error: state.lastError,
  devices: state.devices,
  maxDevices: state.maxDevices,
  encryptionAvailable: store.encryptionAvailable()
});

function emit() {
  const snap = snapshot();
  for (const fn of listeners) {
    try { fn(snap); } catch { /* a dead window must not break licensing */ }
  }
}

const onChange = fn => { listeners.add(fn); return () => listeners.delete(fn); };
const isLicensed = () => state.licensed;

/* ------------------------------------------------------------- the server -- */

async function post(pathname, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${baseUrl()}${pathname}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    // Section 4: any 2xx is success, any other status is failure. The body may
    // not be JSON on an error page, so parsing is allowed to fail.
    let payload = null;
    try { payload = await res.json(); } catch { payload = null; }
    return { status: res.status, ok: res.status >= 200 && res.status < 300, payload };
  } catch (e) {
    return { status: 0, ok: false, payload: null, networkError: e.name === 'AbortError' ? 'timed out' : e.message };
  } finally {
    clearTimeout(timer);
  }
}

function failureFrom(res) {
  if (res.status === 0) return { code: 'network', message: MESSAGES.network };
  const code = res.payload && res.payload.error;
  const serverMessage = res.payload && typeof res.payload.message === 'string' ? res.payload.message : null;
  return {
    code: code || 'upstream_error',
    message: serverMessage || MESSAGES[code] || MESSAGES.upstream_error
  };
}

/* ----------------------------------------------------------- the key shape -- */
// Section 3: four blocks of four, uppercase, hyphen separated. Block 1 is the
// app id prefix, which the STUDIO assigns and which is not always the obvious
// contraction - so it is deliberately not checked here. The server is the
// authority on whether a key is one of ours; this only catches a typo before
// a pointless round trip.
const KEY_SHAPE = /^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/;
const normaliseKey = raw => String(raw || '').trim().toUpperCase();

/* ------------------------------------------------------------- activation -- */

/**
 * POST /licenses/activate, then verify the proof before believing it.
 *
 * R4: "activated" is reported only after a proof verified. A 200 from the
 * server is not a license. This is the exact fault that shipped in SecondOut
 * 1.3.0, so the success path here has one entry point: store.writeProof,
 * which verifies again and refuses to write an unverified proof.
 */
async function activate(rawKey, { silent = false } = {}) {
  const licenseKey = normaliseKey(rawKey);
  const deviceKey = state.deviceId || (state.deviceId = store.deviceId());

  if (!KEY_SHAPE.test(licenseKey)) {
    state.lastError = { code: 'invalid_request', message: MESSAGES.invalid_request };
    emit();
    return { ok: false, ...state.lastError };
  }

  if (!store.encryptionAvailable()) {
    state.lastError = { code: 'no_keystore', message: MESSAGES.no_keystore };
    emit();
    return { ok: false, ...state.lastError };
  }

  state.checking = true;
  state.devices = null;
  state.maxDevices = null;
  if (!silent) state.lastError = null;
  emit();

  try {
    const res = await post('/licenses/activate', {
      licenseKey,
      deviceKey,
      deviceLabel: String(os.hostname() || '').slice(0, 120)
    });

    if (!res.ok) {
      const failure = failureFrom(res);

      // Section 4: show the device names so the customer knows what to remove.
      if (failure.code === 'device_limit_reached' && res.payload) {
        state.maxDevices = res.payload.max_devices || null;
        state.devices = Array.isArray(res.payload.devices)
          ? res.payload.devices.map(d => ({
              name: String(d.device_name || 'Unknown machine').slice(0, 120),
              lastSeen: d.last_seen || null
            }))
          : null;
      }

      // R9: a failed heartbeat must not delete a valid stored proof, so a
      // silent failure leaves `licensed` exactly as it was.
      state.lastError = failure;
      return { ok: false, ...failure };
    }

    const proof = res.payload && res.payload.proof;
    const written = store.writeProof(proof, deviceKey, licenseKey);
    if (!written.ok) {
      // The server answered, but nothing verified. R4: do not say it worked.
      state.lastError = { code: 'unverified', message: MESSAGES.unverified, detail: written.reason };
      return { ok: false, ...state.lastError };
    }

    const keyWrite = store.writeKey(licenseKey);
    if (!keyWrite.ok) {
      state.lastError = { code: 'no_keystore', message: MESSAGES.no_keystore };
      return { ok: false, ...state.lastError };
    }

    const grant = proofGrants(written.body, deviceKey, licenseKey);
    state.licenseKey = licenseKey;
    state.licensed = true;
    state.stale = !!grant.stale;
    state.lastError = null;
    startHeartbeat();
    return { ok: true };
  } finally {
    state.checking = false;
    emit();
  }
}

/**
 * R10. Frees the seat, then deletes the stored key and proof. On 404 the key is
 * unknown to the server, and section 4.2 says delete local state anyway.
 */
async function deactivate() {
  const licenseKey = state.licenseKey || store.readKey();
  const deviceKey = state.deviceId || (state.deviceId = store.deviceId());
  if (!licenseKey) { forgetLocally(); return { ok: true }; }

  state.checking = true;
  emit();
  try {
    const res = await post('/licenses/deactivate', { licenseKey, deviceKey });

    if (res.ok || res.status === 404) {
      forgetLocally();
      return { ok: true };
    }
    // Section 4.2: tell the customer it did not go through. The seat is still
    // taken on the server, so local state stays - deleting it here would strand
    // the seat with no way to free it.
    const failure = failureFrom(res);
    state.lastError = failure;
    return { ok: false, ...failure };
  } finally {
    state.checking = false;
    emit();
  }
}

function forgetLocally() {
  store.clearAll();
  state.licensed = false;
  state.stale = false;
  state.licenseKey = null;
  state.lastError = null;
  state.devices = null;
  state.maxDevices = null;
  stopHeartbeat();
  emit();
}

/* -------------------------------------------------------------- heartbeat -- */

function startHeartbeat() {
  stopHeartbeat();
  heartbeatTimer = setInterval(() => { heartbeat(); }, HEARTBEAT_MS);
  // Section 7 says hourly while open, not hourly forever.
  if (heartbeatTimer.unref) heartbeatTimer.unref();
}

function stopHeartbeat() {
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
}

/**
 * Section 7: silent, and on any failure the old proof is kept (R9). Calling
 * activate again from a device that already holds a seat is the heartbeat -
 * there is no separate check endpoint (section 4.2).
 */
async function heartbeat() {
  const key = state.licenseKey || store.readKey();
  if (!key) return { ok: false };
  const before = state.licensed;
  const res = await activate(key, { silent: true });
  if (!res.ok && before) {
    // Keep running on the stored proof. Re-assert the flag in case activate
    // cleared it, and keep the failure out of the customer's way.
    state.licensed = true;
    state.lastError = null;
    emit();
  }
  return res;
}

/* ---------------------------------------------------------------- startup -- */

/**
 * Section 7 startup, in order:
 *   stored proof that verifies and is inside grace -> unlock now, heartbeat after
 *   proof past graceUntil                          -> delete it, treat as key-only
 *   key but no proof                               -> activate at startup (R9)
 *   neither                                        -> activation screen
 */
async function start() {
  state.deviceId = store.deviceId();
  const key = store.readKey();
  state.licenseKey = key || null;

  const stored = store.readStoredProof();
  if (stored && key) {
    const v = verifyProof(stored);
    if (v.ok) {
      const grant = proofGrants(v.body, state.deviceId, key);
      if (grant.ok) {
        state.licensed = true;
        state.stale = !!grant.stale;
        emit();
        startHeartbeat();
        // Refresh in the background; failure leaves the unlock untouched (R9).
        heartbeat();
        return snapshot();
      }
      // Section 7: a stored proof past graceUntil is deleted and the app
      // behaves as "key but no proof".
      if (grant.expired) store.clearProof();
    } else {
      // A proof that no longer verifies is worthless; it is not evidence.
      store.clearProof();
    }
  }

  emit();
  if (key) {
    startHeartbeat();
    await activate(key, { silent: true });
  }
  return snapshot();
}

module.exports = {
  STUDIO_BASE_URL, HEARTBEAT_MS, KEY_SHAPE, MESSAGES,
  baseUrl, normaliseKey,
  start, activate, deactivate, heartbeat, forgetLocally,
  isLicensed, snapshot, onChange, stopHeartbeat
};

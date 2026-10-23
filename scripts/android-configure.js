#!/usr/bin/env node
/* ============================================================================
 * PulseRoom — prepare the generated Android project for a Play release build.
 *
 *  - stamps versionName (package.json) and versionCode (GitHub run number)
 *  - decodes the upload keystore and wires a release signingConfig into
 *    app/build.gradle
 *
 * The keystore comes from NAMED secrets only. An earlier version of this
 * script searched every secret for "keystore magic bytes" so that the secrets
 * could be called anything. That was wrong in a way that shipped: a PKCS#12
 * file begins 0x30 0x82, which is just a DER SEQUENCE, and so does every
 * certificate and private key in the repository. The scan matched
 * MAC_CERT_P12 - the Apple Distribution certificate - signed the Android
 * build with it, and reported success. jarsigner then called the bundle
 * unsigned, which Play would have rejected. Worse, had Play accepted it, the
 * first upload would have locked the listing to the wrong key permanently.
 *
 * It also tried every other secret as the keystore password, which is a
 * trial decryption of unrelated secrets and has no business in a build.
 *
 * So: named secrets, no content search, no password guessing. If the keystore
 * does not decode, say exactly what arrived instead and stop. Substituting a
 * different credential is never the helpful choice.
 *
 * Values are never printed - only names, sizes and outcomes.
 * ========================================================================== */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = process.cwd();
const GRADLE = path.join(ROOT, 'android', 'app', 'build.gradle');
const TMP = process.env.RUNNER_TEMP || os.tmpdir();

const version = require(path.join(ROOT, 'package.json')).version;
const versionCode = parseInt(process.env.GITHUB_RUN_NUMBER || '1', 10);

/* ------------------------------------------------------------- the inputs -- */
// The workflow resolves each of these from several accepted secret names, so
// one env var here may stand for any of them.
const B64 = (process.env.ANDROID_KEYSTORE_B64 || '').trim();
const STOREPASS = process.env.ANDROID_KEYSTORE_PASSWORD || '';
const ALIAS_IN = (process.env.ANDROID_KEY_ALIAS || '').trim();
const KEYPASS_IN = process.env.ANDROID_KEY_PASSWORD || '';

// Names only, so a missing secret is diagnosable without revealing values.
let visible = [];
try {
  visible = Object.keys(JSON.parse(process.env.ALL_SECRETS || '{}')).sort();
} catch { console.log('::warning::could not parse the secrets bundle'); }
console.log(`Secrets visible to this job (${visible.length}): ${visible.join(', ') || 'none'}`);

/* ------------------------------------------------------- version stamping -- */

let gradle = fs.readFileSync(GRADLE, 'utf8');
const beforeVersions = gradle;
gradle = gradle
  .replace(/versionCode\s+\d+/, `versionCode ${versionCode}`)
  .replace(/versionName\s+"[^"]*"/, `versionName "${version}"`);
if (gradle === beforeVersions) console.log('::warning::version fields not found in build.gradle');
console.log(`Version: ${version} (versionCode ${versionCode})`);

function finish(signed, reason = '') {
  fs.writeFileSync(GRADLE, gradle);
  if (process.env.GITHUB_ENV) {
    fs.appendFileSync(process.env.GITHUB_ENV,
      `ANDROID_SIGNED=${signed ? 'true' : 'false'}\nANDROID_SIGN_REASON=${reason.replace(/[\r\n]+/g, ' ')}\n`);
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, [
      `## Android signing: ${signed ? 'ready' : 'NOT ready'}`, '',
      signed ? 'A Play-ready .aab was built.' : `**${reason}**`, '',
      `Secrets visible to this job (${visible.length}): ` +
        (visible.length ? '`' + visible.join('`, `') + '`' : '_none_'), ''
    ].join('\n'));
  }
  if (!signed) console.log('::error::' + reason);
}

/* --------------------------------------------------------- decode the b64 -- */
// Diagnose rather than fall back. Each failure below names what actually
// arrived, because a vague "no keystore found" is what sent the last build
// looking for one elsewhere, and it found the wrong thing.

if (!B64) {
  finish(false, 'No Android keystore secret is set. Expected ANDROID_KEYSTORE_BASE64 ' +
    '(or ANDROID_SIGNING_KEY_BASE64, KEYSTORE_BASE64, UPLOAD_KEYSTORE_BASE64, ' +
    'ANDROID_KEYSTORE_B64, SIGNING_KEY) to hold the base64 of an upload keystore.');
  process.exit(0);
}

const cleaned = B64.replace(/^["']|["']$/g, '').replace(/^data:[^,]*,/, '').replace(/\s/g, '');
if (!/^[A-Za-z0-9+/=]+$/.test(cleaned)) {
  finish(false, `The Android keystore secret is ${B64.length} characters but is not base64. ` +
    'Produce it with: base64 -w0 upload.jks   (macOS: base64 -i upload.jks)');
  process.exit(0);
}

let buf;
try {
  buf = Buffer.from(cleaned, 'base64');
} catch {
  finish(false, 'The Android keystore secret is not decodable base64.');
  process.exit(0);
}

if (buf.length < 300) {
  finish(false, `The Android keystore secret decodes to only ${buf.length} bytes, which is too ` +
    'small to be a keystore. It is probably truncated, or base64 of a file path rather than of the file.');
  process.exit(0);
}

// What actually arrived, reported either way, so a wrong file is obvious.
const magic = buf.readUInt32BE(0);
const kind =
  magic === 0xfeedfeed ? 'JKS' :
  magic === 0xcececece ? 'BKS' :
  (buf[0] === 0x30 && buf[1] === 0x82) ? 'DER, PKCS#12-shaped' : null;

if (!kind) {
  const head = buf.subarray(0, 16).toString('hex').replace(/(..)/g, '$1 ').trim();
  const asText = buf.subarray(0, 40).toString('utf8').replace(/[^\x20-\x7e]/g, '.');
  finish(false, `The Android keystore secret decoded to ${buf.length} bytes that are not a keystore. ` +
    `First bytes: ${head}  (as text: "${asText}"). ` +
    'If that looks like base64 or PEM text, the value was encoded twice.');
  process.exit(0);
}
console.log(`Keystore: ${buf.length} bytes, ${kind}`);

const keystorePath = path.join(TMP, 'pulseroom-upload.jks');
fs.writeFileSync(keystorePath, buf);

/* ----------------------------------------- open it with the configured password -- */

if (spawnSync('keytool', ['-help'], { encoding: 'utf8' }).error) {
  finish(false, 'keytool is unavailable, so the keystore cannot be verified. Refusing to sign unverified.');
  process.exit(0);
}

if (!STOREPASS) {
  finish(false, 'The keystore decoded but no keystore password secret is set. Expected ' +
    'ANDROID_KEYSTORE_PASSWORD (or ANDROID_STORE_PASSWORD, KEYSTORE_PASSWORD, ' +
    'ANDROID_SIGNING_STORE_PASSWORD, STORE_PASSWORD).');
  process.exit(0);
}

const list = spawnSync('keytool',
  ['-list', '-v', '-keystore', keystorePath, '-storepass', STOREPASS], { encoding: 'utf8' });

if (list.status !== 0) {
  finish(false, `The keystore (${kind}, ${buf.length} bytes) did not open with the configured ` +
    'keystore password. Either that password secret is wrong, or the keystore secret holds a ' +
    'different file than the upload keystore.');
  process.exit(0);
}

// A certificate-only PKCS#12 lists entries but holds no signing key. That is
// exactly what the Apple certificate was, so this is checked, not assumed.
const entries = [...list.stdout.matchAll(/Alias name:\s*(.+)\r?\n(?:[\s\S]*?Entry type:\s*(\S+))?/g)]
  .map(m => ({ alias: m[1].trim(), type: (m[2] || '').trim() }));
const keyEntries = entries.filter(e => /PrivateKeyEntry/i.test(e.type));

if (!keyEntries.length) {
  finish(false, `The keystore opened but holds no PrivateKeyEntry - ${entries.length} entry(ies): ` +
    entries.map(e => `${e.alias} (${e.type || 'unknown type'})`).join(', ') +
    '. A certificate on its own cannot sign an app; this needs the upload keystore and its private key.');
  process.exit(0);
}

const keyAlias = (ALIAS_IN && keyEntries.some(e => e.alias === ALIAS_IN))
  ? ALIAS_IN
  : keyEntries[0].alias;
if (ALIAS_IN && keyAlias !== ALIAS_IN) {
  console.log(`::warning::configured key alias "${ALIAS_IN}" is not in the keystore; using "${keyAlias}"`);
}
console.log(`Key alias: ${keyAlias}${keyEntries.length > 1 ? ` (of ${keyEntries.length} keys)` : ''}`);

// Only the configured key password is tried, and only against this keystore.
let keyPassword = STOREPASS;
if (KEYPASS_IN && KEYPASS_IN !== STOREPASS) {
  const probe = spawnSync('keytool', ['-keypasswd', '-keystore', keystorePath,
    '-storepass', STOREPASS, '-alias', keyAlias,
    '-keypass', KEYPASS_IN, '-new', KEYPASS_IN], { encoding: 'utf8' });
  if (probe.status === 0) {
    keyPassword = KEYPASS_IN;
    console.log('Key password: using the configured key password.');
  } else {
    console.log('::warning::the configured key password did not open the key; using the keystore password.');
  }
}

/* ------------------------------------------------------ wire it into gradle -- */

const signingBlock = `    signingConfigs {
        release {
            storeFile file(System.getenv("ANDROID_KEYSTORE_PATH"))
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS")
            keyPassword System.getenv("ANDROID_KEY_PASSWORD")
        }
    }
`;
const anchor = /( *)buildTypes \{\s*\n( *)release \{\s*\n/;
if (!anchor.test(gradle)) {
  finish(false, 'Could not find the buildTypes/release block in build.gradle.');
  process.exit(1);
}
gradle = gradle.replace(anchor, (m, i1, i2) =>
  `${signingBlock}${i1}buildTypes {\n${i2}release {\n${i2}    signingConfig signingConfigs.release\n`);

if (process.env.GITHUB_ENV) {
  fs.appendFileSync(process.env.GITHUB_ENV, [
    `ANDROID_KEYSTORE_PATH=${keystorePath}`,
    `ANDROID_KEYSTORE_PASSWORD=${STOREPASS}`,
    `ANDROID_KEY_ALIAS=${keyAlias}`,
    `ANDROID_KEY_PASSWORD=${keyPassword}`,
    ''
  ].join('\n'));
}
console.log('Release signing configured - building a Play-ready .aab and a signed .apk.');
finish(true);

#!/usr/bin/env node
/* ============================================================================
 * PulseRoom — prepare the generated Android project for a Play release build.
 *
 *  - stamps versionName (package.json) and versionCode (GitHub run number)
 *  - finds the upload keystore among the repository/organization secrets and
 *    wires a release signingConfig into app/build.gradle
 *
 * The keystore is located by CONTENT, not by secret name: every secret is
 * checked for keystore magic bytes, then each candidate password is verified
 * with keytool and the key alias is read back from the keystore itself. That
 * way the secrets can be called anything.
 *
 * Values are never printed — only names and outcomes.
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

/* ------------------------------------------------------- gather candidates -- */

const secrets = new Map();
if (process.env.ALL_SECRETS) {
  try {
    for (const [k, v] of Object.entries(JSON.parse(process.env.ALL_SECRETS))) {
      if (typeof v === 'string' && v.length) secrets.set(k, v);
    }
  } catch { console.log('::warning::could not parse the secrets bundle'); }
}
// explicit env wins if provided
for (const k of ['ANDROID_KEYSTORE_B64', 'ANDROID_KEYSTORE_PASSWORD', 'ANDROID_KEY_ALIAS', 'ANDROID_KEY_PASSWORD']) {
  if (process.env[k]) secrets.set(k, process.env[k]);
}

console.log(`Secrets available to this job: ${secrets.size}`);
if (secrets.size) console.log(`  names: ${[...secrets.keys()].sort().join(', ')}`);

/* ------------------------------------------------- find the keystore by bytes -- */

const isKeystore = buf =>
  buf.length > 300 && (
    buf.readUInt32BE(0) === 0xfeedfeed ||            // JKS
    (buf[0] === 0x30 && buf[1] === 0x82) ||          // PKCS#12 (DER SEQUENCE)
    buf.readUInt32BE(0) === 0xcececece               // BKS
  );

function decodeMaybe(value) {
  const cleaned = value.trim()
    .replace(/^["']|["']$/g, '')   // stray quotes around the value
    .replace(/^data:[^,]*,/, '')   // data: prefix
    .replace(/\s/g, '');
  if (!/^[A-Za-z0-9+/=]+$/.test(cleaned) || cleaned.length < 400) return null;
  try {
    const buf = Buffer.from(cleaned, 'base64');
    return isKeystore(buf) ? buf : null;
  } catch { return null; }
}

let keystoreName = null, keystoreBuf = null;
for (const [name, value] of secrets) {
  const buf = decodeMaybe(value);
  if (buf) { keystoreName = name; keystoreBuf = buf; break; }
}

/* ------------------------------------------------------------ configure it -- */

let gradle = fs.readFileSync(GRADLE, 'utf8');
const beforeVersions = gradle;
gradle = gradle
  .replace(/versionCode\s+\d+/, `versionCode ${versionCode}`)
  .replace(/versionName\s+"[^"]*"/, `versionName "${version}"`);
if (gradle === beforeVersions) console.log('::warning::version fields not found in build.gradle');
console.log(`Version: ${version} (versionCode ${versionCode})`);

function finish(signed) {
  fs.writeFileSync(GRADLE, gradle);
  if (process.env.GITHUB_ENV) {
    fs.appendFileSync(process.env.GITHUB_ENV, `ANDROID_SIGNED=${signed ? 'true' : 'false'}\n`);
  }
  if (!signed) {
    console.log('::error::No usable upload keystore was found, so no Play-ready .aab can be produced.');
    console.log('::error::Add the keystore (base64 of your .jks/.p12) and its password as secrets visible to this repository, then re-run.');
  }
}

if (!keystoreBuf) {
  console.log('Keystore: none of the available secrets contain a keystore.');
  finish(false);
  process.exit(0);
}
console.log(`Keystore: found in secret "${keystoreName}" (${keystoreBuf.length} bytes)`);

const keystorePath = path.join(TMP, 'pulseroom-upload.jks');
fs.writeFileSync(keystorePath, keystoreBuf);

// candidate passwords: every short secret value, most-likely names first
const looksLikePassword = v => v.length > 0 && v.length < 200 && !/\s{2,}/.test(v);
const ranked = [...secrets.entries()]
  .filter(([n, v]) => n !== keystoreName && looksLikePassword(v))
  .sort(([a], [b]) => {
    const score = n => (/STORE.*PASS|KEYSTORE.*PASS|PASSWORD/i.test(n) ? 0 : /PASS/i.test(n) ? 1 : 2);
    return score(a) - score(b);
  });

function keytoolList(storepass) {
  const r = spawnSync('keytool', ['-list', '-v', '-keystore', keystorePath, '-storepass', storepass], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout : null;
}

const keytoolOk = spawnSync('keytool', ['-help'], { encoding: 'utf8' }).error === undefined;
if (!keytoolOk) console.log('::warning::keytool is unavailable — cannot verify the keystore password here.');
let storePassword = null, listing = null;
for (const [name, value] of ranked) {
  listing = keytoolList(value);
  if (listing) { storePassword = value; console.log(`Keystore password: matched secret "${name}"`); break; }
}

if (!storePassword) {
  console.log(keytoolOk
    ? '::error::Found a keystore, but none of the other secrets unlocked it — check the keystore password secret.'
    : '::error::Found a keystore but keytool is missing, so the password could not be verified.');
  finish(false);
  process.exit(0);
}

// alias: prefer an explicit one that actually exists, else the first key entry
const aliases = [...listing.matchAll(/Alias name:\s*(.+)/g)].map(m => m[1].trim());
const explicitAlias = [...secrets.entries()].find(([n]) => /ALIAS/i.test(n));
let keyAlias = aliases[0];
if (explicitAlias && aliases.includes(explicitAlias[1].trim())) keyAlias = explicitAlias[1].trim();
if (!keyAlias) {
  console.log('::error::The keystore contains no key entries.');
  finish(false);
  process.exit(0);
}
console.log(`Key alias: ${keyAlias}${aliases.length > 1 ? ` (of ${aliases.length} entries)` : ''}`);

// key password: an explicit one if it works, otherwise the store password
let keyPassword = storePassword;
const explicitKeyPass = [...secrets.entries()].find(([n]) => /KEY.*PASS/i.test(n));
if (explicitKeyPass) {
  const probe = spawnSync('keytool', ['-keypasswd', '-keystore', keystorePath, '-storepass', storePassword,
    '-alias', keyAlias, '-keypass', explicitKeyPass[1], '-new', explicitKeyPass[1]], { encoding: 'utf8' });
  if (probe.status === 0) { keyPassword = explicitKeyPass[1]; console.log(`Key password: matched secret "${explicitKeyPass[0]}"`); }
}

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
  console.log('::error::Could not find the buildTypes/release block to attach signing to.');
  finish(false);
  process.exit(1);
}
gradle = gradle.replace(anchor, (m, i1, i2) =>
  `${signingBlock}${i1}buildTypes {\n${i2}release {\n${i2}    signingConfig signingConfigs.release\n`);

if (process.env.GITHUB_ENV) {
  fs.appendFileSync(process.env.GITHUB_ENV, [
    `ANDROID_KEYSTORE_PATH=${keystorePath}`,
    `ANDROID_KEYSTORE_PASSWORD=${storePassword}`,
    `ANDROID_KEY_ALIAS=${keyAlias}`,
    `ANDROID_KEY_PASSWORD=${keyPassword}`,
    ''
  ].join('\n'));
}
console.log('Release signing configured — building a Play-ready .aab and a signed .apk.');
finish(true);

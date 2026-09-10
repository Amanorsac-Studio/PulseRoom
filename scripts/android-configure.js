#!/usr/bin/env node
/* ============================================================================
 * PulseRoom — prepare the generated Android project for a release build.
 *
 *  - stamps versionName (from package.json) and versionCode (GitHub run number,
 *    which must increase on every Play upload)
 *  - decodes the upload keystore and wires a release signingConfig into
 *    app/build.gradle, when the keystore secret is present
 *
 * Secrets are read from the environment; nothing is ever printed except whether
 * a value was found.
 * ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const GRADLE = path.join(ROOT, 'android', 'app', 'build.gradle');
const TMP = process.env.RUNNER_TEMP || require('os').tmpdir();

const version = require(path.join(ROOT, 'package.json')).version;
const versionCode = parseInt(process.env.GITHUB_RUN_NUMBER || '1', 10);

const keystoreB64 = process.env.ANDROID_KEYSTORE_B64 || '';
const storePassword = process.env.ANDROID_KEYSTORE_PASSWORD || '';
const keyAlias = process.env.ANDROID_KEY_ALIAS || '';
// many setups use one password for both the store and the key
const keyPassword = process.env.ANDROID_KEY_PASSWORD || storePassword;

const report = (label, value) => console.log(`  ${label}: ${value ? 'present' : 'not set'}`);
console.log('Android signing credentials visible to this run:');
report('keystore (base64)', keystoreB64);
report('keystore password', storePassword);
report('key alias', keyAlias);
report('key password', process.env.ANDROID_KEY_PASSWORD);
console.log('');

if (!fs.existsSync(GRADLE)) {
  console.error(`::error::${GRADLE} not found — run "npx cap add android" first.`);
  process.exit(1);
}

let gradle = fs.readFileSync(GRADLE, 'utf8');

// ---------------------------------------------------------------- versioning --
const before = gradle;
gradle = gradle
  .replace(/versionCode\s+\d+/, `versionCode ${versionCode}`)
  .replace(/versionName\s+"[^"]*"/, `versionName "${version}"`);
if (gradle === before) console.log('::warning::version fields not found in build.gradle');
console.log(`Version: ${version} (versionCode ${versionCode})`);

// ------------------------------------------------------------------- signing --
const signed = Boolean(keystoreB64 && storePassword && keyAlias);

if (signed) {
  const keystorePath = path.join(TMP, 'pulseroom-upload.jks');
  fs.writeFileSync(keystorePath, Buffer.from(keystoreB64.replace(/\s/g, ''), 'base64'));
  const size = fs.statSync(keystorePath).size;
  if (size < 100) {
    console.error('::error::Decoded keystore is suspiciously small — check the base64 secret.');
    process.exit(1);
  }
  console.log(`Keystore decoded (${size} bytes)`);

  // Gradle reads the credentials from the environment, so nothing lands on disk.
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
    console.error('::error::Could not find the buildTypes/release block to attach signing to.');
    process.exit(1);
  }
  gradle = gradle.replace(anchor, (m, i1, i2) =>
    `${signingBlock}${i1}buildTypes {\n${i2}release {\n${i2}    signingConfig signingConfigs.release\n`);

  // hand the resolved paths/credentials to the following workflow steps
  const env = [
    `ANDROID_KEYSTORE_PATH=${keystorePath}`,
    `ANDROID_KEYSTORE_PASSWORD=${storePassword}`,
    `ANDROID_KEY_ALIAS=${keyAlias}`,
    `ANDROID_KEY_PASSWORD=${keyPassword}`,
    'ANDROID_SIGNED=true'
  ].join('\n') + '\n';
  if (process.env.GITHUB_ENV) fs.appendFileSync(process.env.GITHUB_ENV, env);
  console.log('Release signing configured — will build a signed .aab and .apk.');
} else {
  if (process.env.GITHUB_ENV) fs.appendFileSync(process.env.GITHUB_ENV, 'ANDROID_SIGNED=false\n');
  console.log('::notice::No keystore secrets — building a debug APK only. Google Play needs a signed .aab.');
}

fs.writeFileSync(GRADLE, gradle);

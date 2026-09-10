#!/usr/bin/env node
/* ============================================================================
 * Picks the right iOS signing material out of the repository/organization
 * secrets, whatever they are named.
 *
 * The org holds several .p12 files (iOS distribution, Developer ID, installer
 * certificates), so candidates are not guessed by name: each one is opened and
 * its certificate subject is read, and only an Apple/iPhone Distribution
 * certificate is used for the iOS build.
 *
 * A provisioning profile is optional. With an App Store Connect API key,
 * Xcode creates and downloads the profile itself.
 *
 * Values are never printed — only names, certificate subjects and outcomes.
 * ========================================================================== */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const TMP = process.env.RUNNER_TEMP || os.tmpdir();

const secrets = new Map();
if (process.env.ALL_SECRETS) {
  try {
    for (const [k, v] of Object.entries(JSON.parse(process.env.ALL_SECRETS))) {
      if (typeof v === 'string' && v.trim()) secrets.set(k, v);
    }
  } catch { console.log('::warning::could not parse the secrets bundle'); }
}
const names = [...secrets.keys()].sort();
console.log(`Secrets available (${names.length}): ${names.join(', ') || 'none'}`);

const decode = value => {
  const cleaned = value.trim().replace(/^["']|["']$/g, '').replace(/^data:[^,]*,/, '').replace(/\s/g, '');
  if (!/^[A-Za-z0-9+/=]+$/.test(cleaned) || cleaned.length < 200) return null;
  try { return Buffer.from(cleaned, 'base64'); } catch { return null; }
};

const shortValues = [...secrets.entries()].filter(([, v]) => v.length < 200);

/* ------------------------------------------------ classify the DER blobs -- */

const p12s = [];      // { name, buf }
let profileName = null, profileBuf = null;

for (const [name, value] of secrets) {
  const buf = decode(value);
  if (!buf || buf.length < 300) continue;
  if (!(buf[0] === 0x30 && buf[1] === 0x82)) continue;          // not DER
  if (buf.includes(Buffer.from('<plist'))) {                     // provisioning profile
    if (!profileBuf) { profileName = name; profileBuf = buf; }
  } else {
    p12s.push({ name, buf });
  }
}
console.log(`Certificates found: ${p12s.length ? p12s.map(p => p.name).join(', ') : 'none'}`);

/* ------------------------------------ open each .p12 and read its subject -- */

function passwordsFor(p12Name) {
  // the paired secret first (FOO_P12 -> FOO_PASSWORD), then anything else short
  const paired = p12Name.replace(/_?P12$/i, '').replace(/_$/, '');
  const ordered = shortValues.slice().sort(([a], [b]) => {
    const rank = n => (n.startsWith(paired) && /PASS/i.test(n) ? 0 : /PASS/i.test(n) ? 1 : 2);
    return rank(a) - rank(b);
  });
  return [...ordered.map(([n, v]) => [n, v]), ['(empty)', '']];
}

function openP12(file, password) {
  for (const extra of [['-legacy'], []]) {
    const r = spawnSync('openssl', ['pkcs12', '-in', file, '-passin', `pass:${password}`,
      '-nokeys', '-clcerts', ...extra], { encoding: 'utf8' });
    if (r.status === 0 && r.stdout.includes('BEGIN CERTIFICATE')) return r.stdout;
  }
  return null;
}

function subjectOf(pem) {
  const r = spawnSync('openssl', ['x509', '-noout', '-subject'], { input: pem, encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : '';
}

let chosen = null;
for (const { name, buf } of p12s) {
  const file = path.join(TMP, `cand_${name}.p12`);
  fs.writeFileSync(file, buf);
  for (const [pwName, pw] of passwordsFor(name)) {
    const pem = openP12(file, pw);
    if (!pem) continue;
    const subject = subjectOf(pem);
    const isIos = /Apple Distribution|iPhone Distribution|Apple Development|iPhone Developer/i.test(subject);
    console.log(`  ${name}: opened with "${pwName}" -> ${subject.replace(/^subject=\s*/, '').slice(0, 90)}`);
    if (isIos && !chosen) chosen = { name, file, password: pw, subject };
    break;                       // password found for this p12; stop trying more
  }
}

/* --------------------------------------------------------------- results -- */

const env = [];
const problems = [];

if (chosen) {
  console.log(`Using certificate from "${chosen.name}"`);
  env.push(`IOS_CERT_PATH=${chosen.file}`, `IOS_CERT_PASSWORD=${chosen.password}`);
} else if (p12s.length) {
  problems.push('None of the certificates in the secrets is an iOS distribution certificate (they look like Mac/Developer ID certificates).');
} else {
  problems.push('No .p12 certificate was found in the secrets.');
}

if (profileBuf) {
  const profilePath = path.join(TMP, 'ios_profile.mobileprovision');
  fs.writeFileSync(profilePath, profileBuf);
  console.log(`Provisioning profile: found in secret "${profileName}"`);
  env.push(`IOS_PROFILE_PATH=${profilePath}`);
}

// App Store Connect API key -> lets Xcode create the profile automatically
const pick = re => { const hit = [...secrets.entries()].find(([n]) => re.test(n)); return hit || null; };
const keyId = pick(/^(ASC_KEY_ID|APP_STORE_CONNECT_KEY_ID|APPSTORE_KEY_ID|APPLE_API_KEY_ID)$/i);
const issuer = pick(/^(ASC_ISSUER_ID|APP_STORE_CONNECT_ISSUER_ID|APPSTORE_ISSUER_ID|APPLE_API_ISSUER_ID)$/i);
const p8 = pick(/^(ASC_KEY_P8|ASC_PRIVATE_KEY|APP_STORE_CONNECT_PRIVATE_KEY|APPSTORE_PRIVATE_KEY|APPLE_API_PRIVATE_KEY)$/i);
const team = pick(/^(APPLE_TEAM_ID|IOS_TEAM_ID|TEAM_ID)$/i);

if (keyId && issuer && p8) {
  const keyPath = path.join(TMP, `AuthKey_${keyId[1]}.p8`);
  const raw = p8[1].includes('BEGIN PRIVATE KEY') ? p8[1] : (decode(p8[1]) || Buffer.from(p8[1])).toString('utf8');
  fs.writeFileSync(keyPath, raw.trim() + '\n');
  console.log(`App Store Connect API key: "${p8[0]}" (key id from "${keyId[0]}")`);
  env.push(`ASC_KEY_ID=${keyId[1]}`, `ASC_ISSUER_ID=${issuer[1]}`, `ASC_KEY_PATH=${keyPath}`);
} else if (!profileBuf) {
  problems.push('No provisioning profile and no complete App Store Connect API key — Xcode cannot obtain a profile.');
}

if (team) { console.log(`Team id: from secret "${team[0]}"`); env.push(`APPLE_TEAM_ID=${team[1]}`); }

if (process.env.GITHUB_ENV && env.length) fs.appendFileSync(process.env.GITHUB_ENV, env.join('\n') + '\n');

const ready = Boolean(chosen) && (Boolean(profileBuf) || (keyId && issuer && p8));
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, [
    `## iOS signing: ${ready ? 'ready' : 'NOT ready'}`,
    '',
    ready
      ? `Signing with \`${chosen.name}\`${profileBuf ? ` and the profile in \`${profileName}\`` : ' and a profile obtained through the App Store Connect API'}.`
      : problems.map(p => `- ${p}`).join('\n'),
    '',
    `Secrets visible to this job (${names.length}): ${names.length ? '`' + names.join('`, `') + '`' : '_none_'}`,
    ''
  ].join('\n'));
}
if (!ready) problems.forEach(p => console.log('::warning::' + p));

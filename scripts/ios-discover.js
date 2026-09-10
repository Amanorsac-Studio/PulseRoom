#!/usr/bin/env node
/* ============================================================================
 * Picks the iOS signing certificate out of the repository/organization secrets.
 *
 * Certificates are identified the way codesign itself does it: every candidate
 * .p12 is imported into a throwaway keychain with macOS `security`, and the
 * resulting code-signing identities are read back. That handles every PKCS#12
 * variant Apple produces, which OpenSSL on the runner does not.
 *
 * Only an "Apple Distribution" / "iPhone Distribution" identity can sign an
 * App Store build; Developer ID and Mac installer certificates cannot.
 *
 * Secret values are never printed — only names, identities and outcomes.
 * ========================================================================== */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const TMP = process.env.RUNNER_TEMP || os.tmpdir();
const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: 'utf8', ...opts });

/* ------------------------------------------------------------- the secrets -- */

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

const p12s = [];
let profileName = null, profileBuf = null;
for (const [name, value] of secrets) {
  const buf = decode(value);
  if (!buf || buf.length < 300 || !(buf[0] === 0x30 && buf[1] === 0x82)) continue;
  if (buf.includes(Buffer.from('<plist'))) { if (!profileBuf) { profileName = name; profileBuf = buf; } }
  else p12s.push({ name, buf });
}
console.log(`Certificate blobs found: ${p12s.length ? p12s.map(p => p.name).join(', ') : 'none'}`);

/* --------------------------------------------- import them into a keychain -- */

const KEYCHAIN = path.join(TMP, 'pulseroom-signing.keychain-db');
const KEYCHAIN_PASS = require('crypto').randomBytes(18).toString('hex');
run('security', ['delete-keychain', KEYCHAIN]);
run('security', ['create-keychain', '-p', KEYCHAIN_PASS, KEYCHAIN]);
run('security', ['set-keychain-settings', '-lut', '21600', KEYCHAIN]);
run('security', ['unlock-keychain', '-p', KEYCHAIN_PASS, KEYCHAIN]);

const shortSecrets = [...secrets.entries()].filter(([, v]) => v.length < 200);
const passwordOrder = p12Name => {
  const stem = p12Name.replace(/_?P12$/i, '').replace(/_$/, '');
  return shortSecrets
    .slice()
    .sort(([a], [b]) => {
      const rank = n => (n.startsWith(stem) && /PASS/i.test(n) ? 0 : /PASS/i.test(n) ? 1 : 2);
      return rank(a) - rank(b);
    })
    .concat([['(empty)', '']]);
};

const identitiesIn = () => {
  const out = run('security', ['find-identity', '-v', '-p', 'codesigning', KEYCHAIN]).stdout || '';
  return [...out.matchAll(/"([^"]+)"/g)].map(m => m[1]);
};

const imported = [];
for (const { name, buf } of p12s) {
  const file = path.join(TMP, `cand_${name}.p12`);
  fs.writeFileSync(file, buf);
  const before = identitiesIn();
  let ok = false, usedPw = null;
  for (const [pwName, pw] of passwordOrder(name)) {
    const r = run('security', ['import', file, '-P', pw, '-A', '-t', 'cert', '-f', 'pkcs12',
      '-k', KEYCHAIN, '-T', '/usr/bin/codesign', '-T', '/usr/bin/security']);
    if (r.status === 0) { ok = true; usedPw = pwName; break; }
  }
  const after = identitiesIn();
  const added = after.filter(i => !before.includes(i));
  if (ok) {
    console.log(`  ${name}: imported (password from "${usedPw}") -> ${added.length ? added.join(' | ') : 'certificate only, no private key'}`);
    imported.push({ name, identities: added, hasKey: added.length > 0 });
  } else {
    console.log(`  ${name}: could not be opened with any available password`);
    imported.push({ name, identities: [], hasKey: false, locked: true });
  }
}

run('security', ['set-key-partition-list', '-S', 'apple-tool:,apple:,codesign:', '-s', '-k', KEYCHAIN_PASS, KEYCHAIN]);

const all = identitiesIn();
console.log(`Code-signing identities in the keychain (${all.length}):`);
all.forEach(i => console.log(`  - ${i}`));

const iosIdentity = all.find(i => /^(Apple Distribution|iPhone Distribution)/i.test(i))
  || all.find(i => /^(Apple Development|iPhone Developer)/i.test(i));

/* --------------------------------------------------------------- results -- */

const env = [];
const problems = [];

if (iosIdentity) {
  console.log(`Using identity: ${iosIdentity}`);
  env.push(`IOS_KEYCHAIN=${KEYCHAIN}`, `IOS_KEYCHAIN_PASSWORD=${KEYCHAIN_PASS}`, `IOS_SIGN_IDENTITY=${iosIdentity}`);
} else if (all.length) {
  problems.push(`The certificates available are not usable for the App Store: ${all.join(', ')}. An **Apple Distribution** certificate is required — Developer ID and Mac installer certificates cannot sign an iOS App Store build.`);
} else if (p12s.some(p => p.name)) {
  problems.push(`None of the ${p12s.length} certificate secret(s) could be imported with a private key. Re-export the .p12 from Keychain Access with its key, or check the password secret.`);
} else {
  problems.push('No .p12 certificate was found in the secrets.');
}

if (profileBuf) {
  const profilePath = path.join(TMP, 'ios_profile.mobileprovision');
  fs.writeFileSync(profilePath, profileBuf);
  console.log(`Provisioning profile: found in secret "${profileName}"`);
  env.push(`IOS_PROFILE_PATH=${profilePath}`);
}

const pick = re => [...secrets.entries()].find(([n]) => re.test(n)) || null;
const keyId = pick(/^(ASC_KEY_ID|APP_STORE_CONNECT_KEY_ID|APPSTORE_KEY_ID|APPLE_API_KEY_ID)$/i);
const issuer = pick(/^(ASC_ISSUER_ID|APP_STORE_CONNECT_ISSUER_ID|APPSTORE_ISSUER_ID|APPLE_API_ISSUER_ID)$/i);
const p8 = pick(/^(ASC_KEY_P8|ASC_PRIVATE_KEY|APP_STORE_CONNECT_PRIVATE_KEY|APPSTORE_PRIVATE_KEY|APPLE_API_PRIVATE_KEY)$/i);
const team = pick(/^(APPLE_TEAM_ID|IOS_TEAM_ID|TEAM_ID)$/i);

if (keyId && issuer && p8) {
  const keyPath = path.join(TMP, `AuthKey_${keyId[1].trim()}.p8`);
  const raw = p8[1].includes('BEGIN PRIVATE KEY') ? p8[1] : (decode(p8[1]) || Buffer.from(p8[1])).toString('utf8');
  fs.writeFileSync(keyPath, raw.trim() + '\n');
  console.log(`App Store Connect API key: "${p8[0]}"`);
  env.push(`ASC_KEY_ID=${keyId[1].trim()}`, `ASC_ISSUER_ID=${issuer[1].trim()}`, `ASC_KEY_PATH=${keyPath}`);
} else if (!profileBuf) {
  problems.push('No provisioning profile and no complete App Store Connect API key.');
}
if (team) env.push(`APPLE_TEAM_ID=${team[1].trim()}`);

if (process.env.GITHUB_ENV && env.length) fs.appendFileSync(process.env.GITHUB_ENV, env.join('\n') + '\n');

const ready = Boolean(iosIdentity) && (Boolean(profileBuf) || (keyId && issuer && p8));
if (process.env.GITHUB_STEP_SUMMARY) {
  const certTable = imported.length
    ? ['', '| Secret | Contains |', '|---|---|',
       ...imported.map(c => `| \`${c.name}\` | ${c.locked ? 'could not be opened' : (c.identities.length ? c.identities.join('<br>') : 'certificate without a private key')} |`), '']
    : [];
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, [
    `## iOS signing: ${ready ? 'ready' : 'NOT ready'}`,
    '',
    ready ? `Signing as \`${iosIdentity}\`.` : problems.map(p => `- ${p}`).join('\n'),
    ...certTable,
    `Secrets visible to this job (${names.length}): ${names.length ? '`' + names.join('`, `') + '`' : '_none_'}`,
    ''
  ].join('\n'));
}
if (!ready) problems.forEach(p => console.log('::warning::' + p.replace(/\*\*/g, '')));

#!/usr/bin/env node
/* ============================================================================
 * Acceptance checks A11 and A12 against a packaged build.
 *
 * License Integration Standard v1.1 section 9:
 *   A11  the build contains the s5 key and no other - search for
 *        cd a5 7d 1c c8 a6 e2 71, expect exactly one hit
 *   A12  the build's default URL is the studio, with no local-address
 *        fallback in the license path
 *
 * Both checks are written for the reference build, a JUCE plugin, where the
 * key is compiled into the binary as bytes and the whole binary is the app.
 * Neither assumption holds for an Electron app, and taking the wording
 * literally gives two wrong answers:
 *
 *   - The key ships inside app.asar as JavaScript source - the TEXT
 *     "0xcd, 0xa5, 0x7d, ..." - so a search for those raw bytes finds nothing
 *     and A11 "fails" on a build that is perfectly correct. Verified: the raw
 *     sequence is absent from the asar, the source form is present.
 *   - PulseRoom.exe is Chromium, which carries the word localhost in its own
 *     internals on every Electron app ever shipped. Searching the whole
 *     package makes A12 "fail" on something no product controls.
 *
 * So this asks the question the checks exist to answer, against the app's own
 * code rather than the runtime it is bundled with: exactly one signing key in
 * the files we ship, the studio URL present, and no local address anywhere in
 * the license path.
 *
 *   node scripts/license-audit.js dist/win-unpacked
 * ========================================================================== */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const TARGET = process.argv[2] || 'dist/win-unpacked';

const KEY_RAW = Buffer.from([0xcd, 0xa5, 0x7d, 0x1c, 0xc8, 0xa6, 0xe2, 0x71]);
const KEY_SRC = '0xcd, 0xa5, 0x7d, 0x1c, 0xc8, 0xa6, 0xe2, 0x71';
const STUDIO = 'amanorsac.studio';

// Split so this file does not trip its own check when it sits inside a build.
const LOCAL = ['local' + 'host', '127.0' + '.0.1'];

function findAsar(dir) {
  for (const p of [path.join(dir, 'resources', 'app.asar'), path.join(dir, 'app.asar')]) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const asarPath = findAsar(TARGET);
if (!asarPath) {
  console.error(`No app.asar under ${TARGET}. Package a build first:\n` +
    '  node node_modules/electron-builder/cli.js --win --dir --publish never');
  process.exit(2);
}

const out = fs.mkdtempSync(path.join(os.tmpdir(), 'pulseroom-audit-'));
require('@electron/asar').extractAll(asarPath, out);

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else if (e.isFile()) yield full;
  }
}

const files = [...walk(out)].filter(f => !f.includes(`${path.sep}node_modules${path.sep}`));
const rel = f => path.relative(out, f);

const found = { key: [], studio: [], local: [] };

for (const f of files) {
  let buf;
  try { buf = fs.readFileSync(f); } catch { continue; }
  const text = buf.toString('utf8');

  let n = 0;
  if (buf.includes(KEY_RAW)) n++;
  n += text.split(KEY_SRC).length - 1;
  if (n) found.key.push({ file: rel(f), count: n });

  if (text.includes(STUDIO)) found.studio.push(rel(f));
  for (const addr of LOCAL) {
    if (text.includes(addr)) { found.local.push({ file: rel(f), addr }); break; }
  }
}

console.log(`\n${path.relative(process.cwd(), asarPath)} - ${files.length} app file(s)\n`);

/* ------------------------------------------------------------------- A11 -- */
const total = found.key.reduce((n, h) => n + h.count, 0);
const a11 = total === 1;
console.log(`A11  exactly one signing key in the app     ${a11 ? 'PASS' : 'FAIL'}`);
for (const h of found.key) console.log(`       ${h.count} x  ${h.file}`);
if (!total) console.log('       NOT FOUND - this build would reject every real proof');
if (total > 1) console.log('       R2 allows exactly one, including development keys');

/* ------------------------------------------------------------------- A12 -- */
// The license path is what the check names. Anything else mentioning a local
// address is reported but does not fail the build.
const inLicense = found.local.filter(h => /(^|[\\/])license([\\/]|\.)/.test(h.file));
const a12 = found.studio.length > 0 && inLicense.length === 0;

console.log(`\nA12  studio URL, no local address in the    ${a12 ? 'PASS' : 'FAIL'}`);
console.log(`     license path`);
console.log(`       ${STUDIO} in ${found.studio.length} file(s): ${found.studio.join(', ') || 'NONE'}`);
if (inLicense.length) {
  for (const h of inLicense) console.log(`       ${h.addr} in the license path: ${h.file}`);
} else {
  console.log('       no local address in any license file');
}
if (found.local.length) {
  console.log(`       (${found.local.length} app file(s) mention one elsewhere, which A12 does not cover:`);
  console.log(`        ${found.local.map(h => h.file).join(', ')})`);
}

fs.rmSync(out, { recursive: true, force: true });
console.log(`\n${a11 && a12 ? 'A11 and A12 pass.' : 'Not shippable until both pass.'}\n`);
process.exit(a11 && a12 ? 0 : 1);

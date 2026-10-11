// Copies the app into www/ for Capacitor (mobile) builds.
// Strips the Electron-oriented CSP meta so Capacitor's native bridge can load.
const fs = require('fs');

/* Every file index.html loads, in the order it loads them. Adding a script or a
   stylesheet to the page means adding it here — the check below refuses to
   build if the two ever disagree, because the failure otherwise is a page that
   launches on the phone with a missing dependency and no error anyone sees. */
const ASSETS = ['index.html', 'styles.css', 'ask.css', 'answers.js', 'app.js', 'ask.js', 'icon.png'];

/* Directories copied whole. The fonts are referenced from CSS rather than from
   the page, so they are listed here and checked separately below. */
const ASSET_DIRS = ['fonts'];

const page = fs.readFileSync('index.html', 'utf8');
const referenced = [...page.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map(m => m[1])
  .filter(u => !/^(https?:|data:|#|mailto:)/.test(u));

/* A stylesheet can pull in files the page never names - @font-face is the
   obvious one. Scan every CSS file we copy for url() too, or the first
   missing font is something a user discovers, not the build. */
for (const css of ASSETS.filter(f => f.endsWith('.css'))) {
  for (const m of fs.readFileSync(css, 'utf8').matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    if (!/^(https?:|data:)/.test(m[1])) referenced.push(m[1]);
  }
}

const covered = u => ASSETS.includes(u) || ASSET_DIRS.some(d => u.startsWith(d + '/'));
const missing = [...new Set(referenced)].filter(u => !covered(u));
if (missing.length) {
  console.error(`index.html or its CSS loads files that build-www.js does not copy: ${missing.join(', ')}`);
  console.error(`Add them to ASSETS or ASSET_DIRS here, and to "build.files" in package.json.`);
  process.exit(1);
}

fs.rmSync('www', { recursive: true, force: true });
fs.mkdirSync('www');
for (const f of ASSETS) fs.copyFileSync(f, 'www/' + f);
for (const d of ASSET_DIRS) fs.cpSync(d, 'www/' + d, { recursive: true });
let html = fs.readFileSync('www/index.html', 'utf8');
html = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>\s*/, '');
fs.writeFileSync('www/index.html', html);

const bytes = p => fs.statSync(p).isDirectory()
  ? fs.readdirSync(p).reduce((n, f) => n + bytes(p + '/' + f), 0)
  : fs.statSync(p).size;
const total = [...ASSETS, ...ASSET_DIRS].reduce((n, f) => n + bytes('www/' + f), 0);
console.log(`www/ ready - ${ASSETS.length} files plus ${ASSET_DIRS.join(', ')}/, ${(total / 1024).toFixed(0)} KB`);

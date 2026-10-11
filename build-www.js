// Copies the app into www/ for Capacitor (mobile) builds.
// Strips the Electron-oriented CSP meta so Capacitor's native bridge can load.
const fs = require('fs');

/* Every file index.html loads, in the order it loads them. Adding a script or a
   stylesheet to the page means adding it here — the check below refuses to
   build if the two ever disagree, because the failure otherwise is a page that
   launches on the phone with a missing dependency and no error anyone sees. */
const ASSETS = ['index.html', 'styles.css', 'ask.css', 'answers.js', 'app.js', 'ask.js', 'icon.png'];

const page = fs.readFileSync('index.html', 'utf8');
const referenced = [...page.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map(m => m[1])
  .filter(u => !/^(https?:|data:|#|mailto:)/.test(u));
const missing = referenced.filter(u => !ASSETS.includes(u));
if (missing.length) {
  console.error(`index.html loads files that build-www.js does not copy: ${missing.join(', ')}`);
  console.error(`Add them to ASSETS here and to "build.files" in package.json.`);
  process.exit(1);
}

fs.rmSync('www', { recursive: true, force: true });
fs.mkdirSync('www');
for (const f of ASSETS) fs.copyFileSync(f, 'www/' + f);
let html = fs.readFileSync('www/index.html', 'utf8');
html = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>\s*/, '');
fs.writeFileSync('www/index.html', html);
console.log(`www/ ready — ${ASSETS.length} files, ${(ASSETS.reduce((n, f) =>
  n + fs.statSync('www/' + f).size, 0) / 1024).toFixed(0)} KB`);

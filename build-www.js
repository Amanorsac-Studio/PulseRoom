// Copies the app into www/ for Capacitor (mobile) builds.
// Strips the Electron-oriented CSP meta so Capacitor's native bridge can load.
const fs = require('fs');
fs.rmSync('www', { recursive: true, force: true });
fs.mkdirSync('www');
for (const f of ['index.html', 'styles.css', 'app.js', 'icon.png']) fs.copyFileSync(f, 'www/' + f);
let html = fs.readFileSync('www/index.html', 'utf8');
html = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>\s*/, '');
fs.writeFileSync('www/index.html', html);
console.log('www/ ready');

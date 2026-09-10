/* ============================================================================
 * Generates every graphic the Google Play Console asks for, by rendering the
 * real app (and two brand templates) in Electron and capturing them.
 *
 *   run: node_modules\electron\dist\electron.exe scripts/make-play-assets.js
 *   out: play-assets/
 *
 * One window is created and resized between shots — creating a second
 * BrowserWindow in the same process fails to load on this setup.
 * ========================================================================== */
'use strict';

const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'play-assets');
const TMP = path.join(OUT, '_tmp');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const BARS = [
  [30, 96, 26, 64, '#3fd3e4'],
  [76, 58, 26, 140, '#a48bfa'],
  [122, 26, 26, 204, '#f2b13c'],
  [168, 72, 26, 112, '#f25c7f'],
  [214, 104, 18, 48, '#4fd58f']
];
const markSvg = (scale = 1) => `<svg viewBox="0 0 256 256" width="${256 * scale}" height="${256 * scale}">
  ${BARS.map(([x, y, w, h, c]) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(w, h) / 2}" fill="${c}"/>`).join('\n  ')}
</svg>`;

/* ---------------------------------------------------------------- templates -- */
/* Play applies its own rounding to the listing icon, so it is full-bleed. */
const iconHtml = `<!doctype html><meta charset="utf-8">
<style>
  html,body{margin:0;padding:0;width:512px;height:512px;overflow:hidden;background:#12151c}
  .tile{width:512px;height:512px;display:flex;align-items:center;justify-content:center}
  svg{display:block}
</style>
<div class="tile">${markSvg(1.55)}</div>`;

const featureHtml = `<!doctype html><meta charset="utf-8">
<style>
  html,body{margin:0;padding:0;width:1024px;height:500px;overflow:hidden}
  body{background:#0c0e12;font-family:"Segoe UI Variable Display","Segoe UI",system-ui,Arial,sans-serif;color:#e9ebf1}
  .bg{position:absolute;inset:0;
      background:radial-gradient(900px 500px at 78% 20%, rgba(63,211,228,.16), transparent 62%),
                 radial-gradient(700px 460px at 18% 88%, rgba(164,139,250,.14), transparent 60%),
                 #0c0e12}
  .wrap{position:relative;height:100%;display:flex;align-items:center;gap:46px;padding:0 68px}
  .mark{flex:none;filter:drop-shadow(0 10px 30px rgba(0,0,0,.55))}
  h1{font-size:58px;font-weight:800;letter-spacing:-.025em;line-height:1.04;margin:0}
  h1 span{color:#3fd3e4}
  p{margin:14px 0 0;font-size:23px;color:#a2a9b8;line-height:1.35;max-width:20ch}
  .pill{display:inline-block;margin-top:22px;font-size:16px;font-weight:700;color:#3fd3e4;
        border:1px solid rgba(63,211,228,.42);background:rgba(63,211,228,.10);
        padding:8px 18px;border-radius:999px}
</style>
<div class="bg"></div>
<div class="wrap">
  <div class="mark">${markSvg(0.84)}</div>
  <div>
    <h1>Every mixing answer.<br><span>One tempo.</span></h1>
    <p>Delay, reverb, EQ and compression &mdash; at your song&rsquo;s BPM.</p>
    <div class="pill">Free &middot; Works offline</div>
  </div>
</div>`;

/* ------------------------------------------------------------------ capture -- */

let win;

async function grab(file, w, h, minBytes = 0) {
  let png, size;
  for (let attempt = 1; attempt <= 3; attempt++) {
    await sleep(attempt === 1 ? 320 : 700);
    const img = await win.webContents.capturePage();
    png = img.toPNG();
    size = img.getSize();
    if (png.length >= minBytes) break;
    console.log(`  (retrying ${file} — capture looked blank)`);
  }
  fs.writeFileSync(path.join(OUT, file), png);
  const note = (size.width === w && size.height === h) ? '' : '   <-- differs from requested';
  console.log(`  ${file.padEnd(30)} ${size.width}x${size.height}  ${Math.round(png.length / 1024)}KB${note}`);
}

async function shootHtml(html, name, w, h) {
  const tmp = path.join(TMP, name + '.html');
  fs.writeFileSync(tmp, html);
  win.setContentSize(w, h);
  await win.loadFile(tmp);
  await sleep(500);
  await grab(name + '.png', w, h);
}

async function waitReady(timeoutMs = 8000) {
  const t0 = Date.now();
  for (;;) {
    const ok = await win.webContents.executeJavaScript(
      "!!(typeof showPage === 'function' && document.querySelector('#page-delay') && document.querySelector('#page-delay').children.length)", true);
    if (ok) return true;
    if (Date.now() - t0 > timeoutMs) throw new Error('app did not finish initialising');
    await sleep(120);
  }
}

async function shootApp(file, page, w, h, extraJs = '') {
  win.setContentSize(w, h);
  await win.loadFile(path.join(ROOT, 'index.html'));
  await waitReady();
  const res = await win.webContents.executeJavaScript(
    `(() => { try { showPage('${page}'); ${extraJs} var a=document.querySelector('.nav-item.active'); if(a&&a.scrollIntoView) a.scrollIntoView({inline:'center',block:'nearest'}); return 'ok'; } catch (e) { return 'ERR: ' + e.message; } })()`, true);
  if (res !== 'ok') console.log(`::warning::${file}: ${res}`);
  await sleep(550);
  await grab(file, w, h, 25000);
}

app.whenReady().then(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(TMP, { recursive: true });

  win = new BrowserWindow({
    width: 1024, height: 500, useContentSize: true, show: true,
    backgroundColor: '#0c0e12', webPreferences: { contextIsolation: true }
  });

  console.log('Store graphics:');
  await shootHtml(iconHtml, 'icon-512', 512, 512);
  await shootHtml(featureHtml, 'feature-graphic-1024x500', 1024, 500);

  console.log('Phone screenshots (portrait):');
  const PW = 540, PH = 1110;
  await shootApp('phone-1-delay.png', 'delay', PW, PH, 'setBpm(128);');
  await shootApp('phone-2-reverb.png', 'reverb', PW, PH);
  await shootApp('phone-3-eq.png', 'eq', PW, PH, "state.eqInstrument='leadvocal';renderEQ();");
  await shootApp('phone-4-compression.png', 'comp', PW, PH, "state.compSource='leadvocal';renderComp();");
  await shootApp('phone-5-chains.png', 'chains', PW, PH);
  await shootApp('phone-6-reference.png', 'reference', PW, PH);

  console.log('Tablet screenshots:');
  await shootApp('tablet7-1-delay.png', 'delay', 820, 1180, 'setBpm(128);');
  await shootApp('tablet7-2-eq.png', 'eq', 820, 1180, "state.eqInstrument='kick';renderEQ();");
  await shootApp('tablet10-1-delay.png', 'delay', 1180, 820, 'setBpm(128);');
  await shootApp('tablet10-2-compression.png', 'comp', 1180, 820);

  fs.rmSync(TMP, { recursive: true, force: true });
  console.log(`\nWrote ${fs.readdirSync(OUT).length} files to play-assets/`);
  app.quit();
});

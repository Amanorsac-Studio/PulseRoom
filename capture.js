// One-shot screenshot capture for the marketing folder.
// Run: node_modules\electron\dist\electron.exe capture.js
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'marketing', 'screenshots');

const SHOTS = [
  ['S1-hero-delay-essentials', "setBpm(140); showPage('delay');", null],
  ['S2-tempo-bar', "setBpm(140);", { x: 236, y: 0, width: 1044, height: 68 }],
  ['S3-copy-toast', "showPage('delay'); toast('Copied 1/8 dotted = 482.14 ms');", null],
  ['S4-reverb-designer', "setBpm(120); showPage('reverb');", null],
  ['S5-send-eq-curve', "showPage('reverb');", null],
  ['S6-eq-cheat-sheet', "state.eqInstrument='leadvocal'; showPage('eq');", null],
  ['S7-compression-envelope', "state.compSource='leadvocal'; showPage('comp');", null],
  ['S8-mix-chains', "state.chainInstrument='leadvocal'; showPage('chains');", null],
  ['S9-mixing-guide', "showPage('guide');", null],
  ['S10-reference', "showPage('reference');", null]
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

app.whenReady().then(async () => {
  fs.mkdirSync(OUT, { recursive: true });

  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    useContentSize: true,
    autoHideMenuBar: true,
    backgroundColor: '#0c0e12',
    webPreferences: { contextIsolation: true }
  });
  await win.loadFile('index.html');
  await sleep(600);

  for (const [name, js, rect] of SHOTS) {
    await win.webContents.executeJavaScript(js);
    await sleep(700); // let the page-in animation settle
    const img = rect ? await win.webContents.capturePage(rect) : await win.webContents.capturePage();
    fs.writeFileSync(path.join(OUT, `${name}.png`), img.toPNG());
    console.log('captured', name);
  }

  app.quit();
});

// One-shot screenshot capture for the marketing folder.
// Run: node_modules\electron\dist\electron.exe capture.js
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'release', 'screenshots');

/* Release Standard section 2: screenshots/NN-<what>.png, numbered in the order
   a new user meets them, the real app at its real size. Ask comes first
   because it is the landing page and the reason the product exists. */
const SHOTS = [
  ['01-ask-answer',
   `window.state.page='ask';
    document.querySelector('.nav-item[data-page="ask"]').click();
    const i=document.getElementById('askInput');
    i.value='my 808 disappears on phone speakers';
    i.dispatchEvent(new Event('input',{bubbles:true}));`, null],

  ['02-ask-browsing',
   `const i=document.getElementById('askInput');
    i.value=''; i.dispatchEvent(new Event('input',{bubbles:true}));
    window.state.askGenre='gospel-trad'; window.renderAsk();`, null],

  ['03-delay-calculator',
   `setBpm(140); showPage('delay');`, null],

  ['04-reverb-designer',
   `setBpm(120); window.state.reverbStyle='plate'; showPage('reverb');`, null],

  ['05-eq-cheat-sheet',
   `window.state.eqInstrument='leadvocal'; showPage('eq');`, null],

  ['06-compression',
   `window.state.compSource='parallel'; showPage('comp');`, null],

  ['07-mix-chains',
   `window.state.chainInstrument='leadvocal'; showPage('chains');`, null],

  ['08-mixing-guide',
   `window.state.guideSection=2; showPage('guide');`, null],

  ['09-reference',
   `window.state.refTab='notes'; showPage('reference');`, null]
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

app.whenReady().then(async () => {
  fs.mkdirSync(OUT, { recursive: true });

  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    useContentSize: true,
    autoHideMenuBar: true,
    backgroundColor: '#0c0e12',
    show: true,
    // capturePage() returns an empty image from a minimised or throttled
    // window, which is how this produced 0-byte PNGs when run from a
    // background shell.
    webPreferences: { contextIsolation: true, backgroundThrottling: false }
  });
  await win.loadFile('index.html');
  win.show();
  win.focus();
  await sleep(1500);

  let failed = 0;
  for (const [name, js, rect] of SHOTS) {
    try {
      // wrapped both sides: a throw inside the page rejects the promise and
      // would otherwise stall the whole run on one bad shot
      await win.webContents.executeJavaScript(`(() => { try { ${js} } catch (e) { return 'ERR ' + e.message; } return 'ok'; })()`);
      await sleep(1100); // let the page-in animation and curve draw settle
      const img = rect ? await win.webContents.capturePage(rect) : await win.webContents.capturePage();
      const png = img.toPNG();
      if (!png.length) throw new Error('empty capture - window not visible?');
      fs.writeFileSync(path.join(OUT, `${name}.png`), png);
      console.log('captured', name, (png.length / 1024).toFixed(0) + ' KB');
    } catch (e) {
      failed++;
      console.error('FAILED', name, '-', e.message);
    }
  }
  console.log(failed ? `${failed} shot(s) failed` : 'all shots captured');

  app.exit(failed ? 1 : 0);
});

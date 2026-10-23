/* Screenshots the licensing states without needing the desktop in front.
 *
 * Wires the window exactly as main.js does - same preload, same IPC handlers,
 * same client - so what is captured is the real activation path and not a
 * mock-up of it. Run with:
 *
 *   node_modules/electron/dist/electron.exe scripts/license-shot.js
 *
 * Not shipped: scripts/ is outside package.json build.files.
 */
'use strict';

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const OUT = process.env.SHOT_DIR || path.join(ROOT, 'release', 'screenshots');
const license = require(path.join(ROOT, 'license', 'client'));

const wait = ms => new Promise(r => setTimeout(r, ms));

async function shot(win, name) {
  await wait(700);
  const img = await win.capturePage();
  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, `${name}.png`);
  fs.writeFileSync(file, img.toPNG());
  console.log(`${name}  ${(fs.statSync(file).size / 1024).toFixed(0)} KB`);
}

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1280, height: 840, show: true, backgroundColor: '#0c0e12',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(ROOT, 'preload.js'),
      backgroundThrottling: false
    }
  });

  ipcMain.handle('license:get', () => license.snapshot());
  ipcMain.handle('license:activate', (_e, key) => license.activate(key));
  ipcMain.handle('license:deactivate', () => license.deactivate());
  license.onChange(snap => {
    if (!win.isDestroyed()) win.webContents.send('license:changed', snap);
  });

  await win.loadFile(path.join(ROOT, 'index.html'));
  await license.start();

  console.log('base URL:', license.baseUrl());
  console.log('snapshot:', JSON.stringify(license.snapshot()));

  await shot(win, 'L1-activation');

  // A key of the right shape that the server will not know. Exercises the
  // real request and the real error wording.
  await win.webContents.executeJavaScript(`
    (() => { const i = document.getElementById('licKey');
      i.value = 'PULS-0000-0000-0000';
      i.dispatchEvent(new Event('input', { bubbles: true }));
      document.getElementById('licActivate').click(); })();
  `);
  await wait(6000);
  await shot(win, 'L2-rejected');

  console.log('after a bad key:', JSON.stringify(license.snapshot()));
  app.quit();
}).catch(e => { console.error(e); app.quit(); });

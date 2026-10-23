const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const license = require('./license/client');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 980,
    minHeight: 660,
    backgroundColor: '#0c0e12',
    autoHideMenuBar: true,
    title: 'PulseRoom',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile('index.html');

  // Push license changes to the window. Section 7: the interface follows the
  // flag, so the window is told rather than asked to poll.
  const unsubscribe = license.onChange(snapshot => {
    if (!win.isDestroyed()) win.webContents.send('license:changed', snapshot);
  });
  win.on('closed', unsubscribe);

  // Open external links in the system browser, not inside the app
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  return win;
}

// License Integration Standard section 4: the window never talks to the
// license server. It asks the main process, which owns the key, the proof and
// the only network call.
ipcMain.handle('license:get', () => license.snapshot());
ipcMain.handle('license:activate', (_event, key) => license.activate(key));
ipcMain.handle('license:deactivate', () => license.deactivate());

app.whenReady().then(() => {
  createWindow();

  // Not awaited: section 7 unlocks immediately from a stored proof and
  // heartbeats afterwards, so a slow or absent network must never delay the
  // window appearing.
  license.start();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Section 7: hourly while the app is open.
app.on('before-quit', () => license.stopHeartbeat());

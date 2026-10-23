/* ============================================================================
 * The only channel between the window and the license client.
 *
 * contextIsolation stays on and nodeIntegration stays off. The window gets
 * four functions and no more: it can read the licensed flag, send a key the
 * customer typed, free the seat, and be told when any of that changes.
 *
 * What it deliberately cannot do: read the stored license key, read the proof,
 * see the device id, or reach the license server. Those stay in the main
 * process, so nothing in the page - and nothing injected into it - can read or
 * forge a license.
 * ========================================================================== */
'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pulseLicense', {
  get: () => ipcRenderer.invoke('license:get'),
  activate: key => ipcRenderer.invoke('license:activate', String(key || '')),
  deactivate: () => ipcRenderer.invoke('license:deactivate'),

  // Returns an unsubscribe function, so a reload does not stack listeners.
  onChange: callback => {
    const handler = (_event, snapshot) => callback(snapshot);
    ipcRenderer.on('license:changed', handler);
    return () => ipcRenderer.removeListener('license:changed', handler);
  }
});

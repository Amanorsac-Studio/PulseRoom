/* ============================================================================
 * The activation screen, renderer side.
 *
 * This file holds no license logic. It cannot: the key, the proof, the device
 * id and the only network call all live in the main process. All this does is
 * render whatever snapshot arrives and send back what the customer typed.
 *
 * License Integration Standard v1.1 section 7: "The interface follows the
 * flag. The main view appears when isLicensed() becomes true, whether that
 * happened at startup or after the customer typed a key."
 *
 * The mobile builds have no preload bridge, so window.pulseLicense is absent
 * there and this file stands down rather than locking the app out of a store
 * build it cannot activate. See LICENSING.md - that is an open decision for
 * the studio, not something to settle by leaving a phone permanently locked.
 * ========================================================================== */
(function () {
  'use strict';

  const bridge = window.pulseLicense;
  const body = document.body;

  if (!bridge) {
    body.classList.remove('lic-unknown');
    return;
  }

  const $ = id => document.getElementById(id);
  const overlay = $('licOverlay');
  const input = $('licKey');
  const activateBtn = $('licActivate');
  const msg = $('licMsg');
  const deviceList = $('licDevices');
  const grace = $('licGrace');
  const seat = $('licSeat');
  const deactivateBtn = $('licDeactivate');

  /* ------------------------------------------------------------ key input -- */

  // Four blocks of four, hyphens inserted as you type. Paste of a formatted or
  // unformatted key both work, and so does a lowercase one (section 3).
  function format(raw) {
    const clean = String(raw).toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 16);
    return clean.replace(/(.{4})(?=.)/g, '$1-');
  }

  const complete = () => /^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(input.value);

  input.addEventListener('input', () => {
    // Keep the caret at the end rather than fighting the reformat; people type
    // a key straight through and rarely edit the middle of one.
    input.value = format(input.value);
    activateBtn.disabled = !complete();
    overlay.classList.remove('invalid');
    if (msg.textContent) setMessage('', null);
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && complete()) submit();
  });

  /* -------------------------------------------------------------- messages -- */

  function setMessage(text, kind) {
    msg.textContent = text || '';
    msg.className = 'lic-msg' + (kind ? ' ' + kind : '');
  }

  function setDevices(devices, max) {
    deviceList.innerHTML = '';
    if (!devices || !devices.length) return;

    for (const d of devices) {
      const li = document.createElement('li');
      // textContent, not innerHTML: these names come off the network and are
      // typed by whoever named their computer.
      const name = document.createElement('span');
      name.textContent = d.name;
      li.appendChild(name);

      if (d.lastSeen) {
        const when = document.createElement('time');
        when.textContent = describe(d.lastSeen);
        li.appendChild(when);
      }
      deviceList.appendChild(li);
    }

    const label = document.createElement('li');
    label.style.background = 'none';
    label.style.border = 'none';
    label.style.color = 'var(--text-3)';
    label.style.fontSize = '11.5px';
    label.textContent = max
      ? `This key allows ${max} machines. Remove one in My Apps, or use Deactivate on that machine.`
      : 'Remove one in My Apps, or use Deactivate on that machine.';
    deviceList.appendChild(label);
  }

  function describe(iso) {
    const t = Date.parse(iso);
    if (!Number.isFinite(t)) return '';
    const days = Math.floor((Date.now() - t) / 86400000);
    if (days <= 0) return 'seen today';
    if (days === 1) return 'seen yesterday';
    if (days < 30) return `seen ${days} days ago`;
    return new Date(t).toLocaleDateString();
  }

  /* ------------------------------------------------------------- activation -- */

  async function submit() {
    activateBtn.disabled = true;
    setMessage('Checking your key…', null);
    setDevices(null);

    const result = await bridge.activate(input.value);

    if (result && result.ok) {
      // Nothing to do here. The main process emits the new snapshot and
      // render() takes the overlay down - one path to "licensed", not two.
      return;
    }

    overlay.classList.add('invalid');
    setMessage((result && result.message) || 'That did not work. Try again shortly.', 'err');
    activateBtn.disabled = !complete();
    input.focus();
    input.select();
  }

  activateBtn.addEventListener('click', submit);

  $('licWhere').addEventListener('click', () => {
    setMessage('Sign in at amanorsac.studio and open My Apps. The same key is in '
      + 'Amanorsac Hub. Keys look like XXXX-XXXX-XXXX-XXXX.', null);
  });

  /* ------------------------------------------------------------- deactivate -- */

  deactivateBtn.addEventListener('click', async () => {
    deactivateBtn.disabled = true;
    deactivateBtn.textContent = 'Deactivating…';
    const result = await bridge.deactivate();
    deactivateBtn.disabled = false;
    deactivateBtn.textContent = 'Deactivate this device';

    if (!result || !result.ok) {
      // Section 4.2: it did not go through, and the seat is still taken, so
      // the app stays licensed rather than stranding it.
      setMessage((result && result.message)
        || 'Could not free the seat. Check your connection and try again.', 'err');
    }
  });

  /* ----------------------------------------------------------------- render -- */

  function render(snap) {
    if (!snap) return;
    body.classList.remove('lic-unknown');

    if (snap.licensed) {
      overlay.classList.remove('show', 'invalid');
      seat.hidden = false;
      grace.classList.toggle('show', !!snap.stale);
      input.value = '';
      setMessage('', null);
      setDevices(null);
      return;
    }

    seat.hidden = true;
    grace.classList.remove('show');
    overlay.classList.add('show');

    if (snap.encryptionAvailable === false) {
      setMessage('This computer’s secure storage is unavailable, so a license '
        + 'cannot be saved here. On Windows this usually means the user profile '
        + 'is damaged or a roaming profile is in use.', 'warn');
    } else if (snap.error) {
      setMessage(snap.error.message, 'err');
      setDevices(snap.devices, snap.maxDevices);
    } else if (snap.hasKey && snap.checking) {
      setMessage('Checking your license…', null);
    }

    if (!snap.checking) activateBtn.disabled = !complete();
    if (document.activeElement !== input) input.focus();
  }

  bridge.onChange(render);
  bridge.get().then(render).catch(() => {
    // If even the first read fails the app is in no state to claim a license.
    body.classList.remove('lic-unknown');
    overlay.classList.add('show');
    setMessage('The licensing component did not start. Reopen PulseRoom, and if '
      + 'it keeps happening reinstall it.', 'err');
  });
})();

// Scripted walkthrough recorder: drives the app with a simulated cursor while
// capturing frames, then writes frames + timings for ffmpeg assembly.
// Run: node_modules\electron\dist\electron.exe record.js
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const FRAMES_DIR = process.env.FRAMES_DIR || path.join(__dirname, 'frames-tmp');

const sleep = ms => new Promise(r => setTimeout(r, ms));

const CURSOR_SETUP = `(() => {
  if (window.__vc) return 'already';
  const style = document.createElement('style');
  style.textContent = \`
    #vcursor{position:fixed;z-index:99999;pointer-events:none;left:0;top:0}
    #vclick{position:fixed;z-index:99998;width:38px;height:38px;border-radius:50%;
      border:2px solid rgba(255,255,255,.75);pointer-events:none;opacity:0;
      transform:translate(-50%,-50%) scale(.4)}
    .sim-hover{filter:brightness(1.22)}
    .delay-cell.sim-hover{border-color:rgba(63,211,228,.6);background:var(--panel-2);filter:none}
    .rv-style.sim-hover{background:var(--panel-2);filter:none}
  \`;
  document.head.appendChild(style);
  const c = document.createElement('div');
  c.id = 'vcursor';
  c.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24">' +
    '<path d="M5 3 L19 12 L12 13.6 L9 20 Z" fill="#ffffff" stroke="#111" stroke-width="1.3" stroke-linejoin="round"/></svg>';
  document.body.appendChild(c);
  const ripple = document.createElement('div');
  ripple.id = 'vclick';
  document.body.appendChild(ripple);
  let pos = { x: 640, y: 500 };
  const setPos = p => { pos = p; c.style.left = p.x + 'px'; c.style.top = p.y + 'px'; };
  setPos(pos);
  window.__vc = {
    moveTo(sel, dur, ox, oy) {
      dur = dur || 700; ox = ox || 0; oy = oy || 0;
      const el = document.querySelector(sel);
      if (!el) return Promise.resolve('missing:' + sel);
      el.scrollIntoView({ block: 'center', behavior: 'instant' });
      const b = el.getBoundingClientRect();
      const tx = b.left + b.width / 2 + ox, ty = b.top + b.height / 2 + oy;
      const sx = pos.x, sy = pos.y, t0 = performance.now();
      return new Promise(res => {
        const step = now => {
          let k = Math.min((now - t0) / dur, 1);
          k = 1 - Math.pow(1 - k, 3);
          setPos({ x: sx + (tx - sx) * k, y: sy + (ty - sy) * k });
          if (k < 1) requestAnimationFrame(step);
          else { el.classList.add('sim-hover'); setTimeout(() => res('ok'), 130); }
        };
        requestAnimationFrame(step);
      });
    },
    click(sel) {
      const el = document.querySelector(sel);
      if (!el) return 'missing:' + sel;
      document.querySelectorAll('.sim-hover').forEach(e => e.classList.remove('sim-hover'));
      ripple.style.left = pos.x + 'px'; ripple.style.top = pos.y + 'px';
      ripple.animate(
        [{ opacity: .9, transform: 'translate(-50%,-50%) scale(.4)' },
         { opacity: 0, transform: 'translate(-50%,-50%) scale(1.35)' }],
        { duration: 380 });
      el.click();
      return 'ok';
    },
    scrollContent(y, dur) {
      const el = document.querySelector('.content');
      const s0 = el.scrollTop, t0 = performance.now();
      return new Promise(res => {
        const step = now => {
          let k = Math.min((now - t0) / (dur || 900), 1);
          k = 1 - Math.pow(1 - k, 3);
          el.scrollTop = s0 + (y - s0) * k;
          if (k < 1) requestAnimationFrame(step); else res('ok');
        };
        requestAnimationFrame(step);
      });
    }
  };
  return 'injected';
})()`;

app.whenReady().then(async () => {
  fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
  fs.mkdirSync(FRAMES_DIR, { recursive: true });

  const win = new BrowserWindow({
    width: 1280, height: 840, useContentSize: true,
    autoHideMenuBar: true, backgroundColor: '#0c0e12', resizable: false,
    webPreferences: { contextIsolation: true }
  });
  await win.loadFile('index.html');
  await sleep(400);
  await win.webContents.executeJavaScript(CURSOR_SETUP, true);

  const ex = js => win.webContents.executeJavaScript(js, true);
  const move = (sel, dur = 700) => ex(`__vc.moveTo(${JSON.stringify(sel)}, ${dur})`);
  const click = sel => ex(`__vc.click(${JSON.stringify(sel)})`);
  const nav = async page => { await move(`.nav-item[data-page="${page}"]`, 650); await click(`.nav-item[data-page="${page}"]`); };

  // ---- capture loop (runs concurrently with the timeline) ----
  const times = [];
  let recording = true;
  let frameErr = null;
  const captureLoop = (async () => {
    let i = 0;
    while (recording) {
      try {
        const img = await win.webContents.capturePage();
        const file = `f-${String(i).padStart(5, '0')}.png`;
        await fs.promises.writeFile(path.join(FRAMES_DIR, file), img.toPNG());
        times.push({ file, t: Date.now() });
        i++;
      } catch (e) { frameErr = e.message; await sleep(50); }
    }
  })();

  // ---- timeline (~40s) ----
  await sleep(1400);                                             // opening: delay page, 120 BPM

  await move('#tapBtn', 800);                                    // tap in ~140 BPM
  for (let i = 0; i < 4; i++) { await click('#tapBtn'); await sleep(430); }
  await sleep(1100);

  await move('.delay-cell:nth-child(5)', 750);                   // 1/8 dotted -> copy toast
  await click('.delay-cell:nth-child(5)');
  await sleep(1500);

  await move('#delayViewSeg button[data-v="all"]', 650);         // reveal the full grid
  await click('#delayViewSeg button[data-v="all"]');
  await sleep(1800);

  await nav('reverb');                                           // reverb designer
  await sleep(1500);
  await move('.rv-style:nth-child(4)', 700);                     // Plate
  await click('.rv-style:nth-child(4)');
  await sleep(1600);
  await move('.rv-style:nth-child(6)', 650);                     // Cathedral/Epic
  await click('.rv-style:nth-child(6)');
  await sleep(1700);

  await nav('eq');                                               // EQ cheat sheet
  await sleep(1400);
  await move('#eqPicker .eq-chip[data-i="leadvocal"]', 700);
  await click('#eqPicker .eq-chip[data-i="leadvocal"]');
  await sleep(1700);
  await move('#eqPicker .eq-chip[data-i="eight08"]', 600);
  await click('#eqPicker .eq-chip[data-i="eight08"]');
  await sleep(1700);

  await nav('comp');                                             // compression envelope
  await sleep(1400);
  await move('#compPicker .eq-chip[data-i="leadvocal"]', 700);
  await click('#compPicker .eq-chip[data-i="leadvocal"]');
  await sleep(1800);
  await move('#compPicker .eq-chip[data-i="parallel"]', 600);
  await click('#compPicker .eq-chip[data-i="parallel"]');
  await sleep(1800);

  await nav('chains');                                           // mix chains
  await sleep(1700);
  await move('#chainPicker .eq-chip[data-i="master"]', 700);
  await click('#chainPicker .eq-chip[data-i="master"]');
  await sleep(2000);

  await nav('guide');                                            // mixing guide accordion
  await sleep(1300);
  await move('#page-guide .guide-card:not(.open) .guide-head', 700);
  await click('#page-guide .guide-card:not(.open) .guide-head');
  await sleep(1800);

  await nav('reference');                                        // reference tables
  await sleep(1600);
  await ex('__vc.scrollContent(560, 1200)');
  await sleep(1600);

  await nav('delay');                                            // end where we began
  await sleep(1800);

  recording = false;
  await captureLoop;

  fs.writeFileSync(path.join(FRAMES_DIR, 'timings.json'), JSON.stringify(times));
  console.log('FRAMES', times.length, 'DURATION_S',
    ((times[times.length - 1].t - times[0].t) / 1000).toFixed(1),
    frameErr ? 'LAST_ERR ' + frameErr : 'CLEAN');
  app.quit();
});

/* ============================================================
   PulseRoom — app logic + content data
   ============================================================ */

'use strict';

/* ---------- state ---------- */

const state = {
  bpm: 120,
  page: 'delay',
  delayView: 'essential',
  delayFilter: 'all',
  reverbStyle: 'hall',
  eqInstrument: 'kick',
  compSource: 'kick',
  chainInstrument: 'leadvocal'
};

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const beatMs = () => 60000 / state.bpm;          // quarter note
const barMs  = () => beatMs() * 4;               // 4/4 bar

const fmt = (n, dp = 1) => {
  const v = Number(n);
  if (v >= 1000) return v.toFixed(0);
  return v.toFixed(dp);
};

/* ---------- toast + clipboard ---------- */

let toastTimer = null;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1400);
}

function copy(text, label) {
  navigator.clipboard.writeText(String(text)).then(
    () => toast(`Copied ${label}`),
    () => toast('Copy failed')
  );
}

/* ============================================================
   DELAY DATA
   ============================================================ */

const DIVISIONS = [1, 2, 4, 8, 16, 32, 64];

const DELAY_USES = {
  '1/2 straight':  'Long ambient echo. Great on vocal tails and guitar swells.',
  '1/4 straight':  'The classic echo. Works on almost everything: vocals, leads, guitars.',
  '1/4 dotted':    'Wide, musical bounce that fills space without crowding the beat.',
  '1/8 straight':  'Tight rhythmic echo. Doubles the groove on plucks and vocals.',
  '1/8 dotted':    'The famous U2 / The Edge rhythm delay. Instant motion on guitars and synths.',
  '1/8 triplet':   'Shuffled, swinging echo. Perfect for blues, trap hats and 6/8 feels.',
  '1/16 straight': 'Very tight slap. Thickens vocals and snares without an obvious echo.',
  '1/16 dotted':   'Galloping echo used in dance and synthwave arpeggio tricks.',
  '1/32 straight': 'Almost a doubler. Adds density and width at low mix levels.',
  '1/64 straight': 'Comb-filter territory. Use for metallic textures and flanger-like tones.'
};

/* the values producers actually reach for, shown by default */
const DELAY_ESSENTIALS = [
  '1/2 straight', '1/4 straight', '1/4 dotted', '1/8 straight',
  '1/8 dotted', '1/8 triplet', '1/16 straight', '1/32 straight'
];

function delayRows() {
  const rows = [];
  for (const d of DIVISIONS) {
    const base = barMs() / d;
    rows.push({ div: `1/${d}`, kind: 'straight', ms: base });
    rows.push({ div: `1/${d}`, kind: 'dotted',   ms: base * 1.5 });
    rows.push({ div: `1/${d}`, kind: 'triplet',  ms: base * (2 / 3) });
  }
  return rows;
}

function renderDelay() {
  const essential = state.delayView === 'essential';
  const rows = delayRows().filter(r => {
    if (essential) return DELAY_ESSENTIALS.includes(`${r.div} ${r.kind}`);
    return state.delayFilter === 'all' ? true : r.kind === state.delayFilter;
  });

  const cells = rows.map(r => {
    const use = DELAY_USES[`${r.div} ${r.kind}`];
    const hz = 1000 / r.ms;
    return `
      <div class="delay-cell" data-ms="${r.ms.toFixed(2)}" data-label="${r.div} ${r.kind}">
        <div class="dc-note">
          <span class="dc-div">${r.div}</span>
          <span class="dc-kind ${r.kind}">${r.kind.toUpperCase()}</span>
        </div>
        <div class="dc-ms">${fmt(r.ms)}<small>ms</small></div>
        <div class="dc-hz">${hz >= 100 ? hz.toFixed(0) : hz.toFixed(2)} Hz &middot; LFO rate</div>
        ${use ? `<div class="dc-use">${use}</div>` : ''}
      </div>`;
  }).join('');

  $('#page-delay').innerHTML = `
    <div class="page-head">
      <h1 class="page-title">Delay <span class="tint" style="--accent:var(--c-delay)">Calculator</span></h1>
      <p class="page-desc">Every note value at ${state.bpm} BPM, in milliseconds. Click any card to copy the time. The Hz value doubles as a tempo-synced LFO rate for tremolo, auto-pan and sidechain shaping.</p>
    </div>

    <div class="filter-row" style="--accent:var(--c-delay)">
      <div class="seg" id="delayViewSeg">
        <button data-v="essential" class="${essential ? 'on' : ''}">Essentials</button>
        <button data-v="all"       class="${essential ? '' : 'on'}">All note values</button>
      </div>
      ${essential ? '' : `
      <div class="seg" id="delayFilterSeg">
        <button data-f="all"      class="${state.delayFilter === 'all' ? 'on' : ''}">All</button>
        <button data-f="straight" class="${state.delayFilter === 'straight' ? 'on' : ''}">Straight</button>
        <button data-f="dotted"   class="${state.delayFilter === 'dotted' ? 'on' : ''}">Dotted</button>
        <button data-f="triplet"  class="${state.delayFilter === 'triplet' ? 'on' : ''}">Triplet</button>
      </div>`}
    </div>

    <div class="delay-grid" style="--accent:var(--c-delay)">${cells}</div>

    <div class="hint-strip" style="--accent:var(--c-delay)">
      <div>
        <strong>Short-time tricks that ignore tempo:</strong>
        1-30 ms on a duplicated, panned track creates the Haas width effect (keep it mono-compatible).
        60-120 ms is the rockabilly slapback zone for vocals and guitars.
        Feedback around 20-35% gives 2-4 audible repeats; low-pass the repeats so they sit behind the dry signal.
      </div>
    </div>`;

  $('#delayViewSeg').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    state.delayView = b.dataset.v;
    renderDelay();
  });

  const filterSeg = $('#delayFilterSeg');
  if (filterSeg) filterSeg.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    state.delayFilter = b.dataset.f;
    renderDelay();
  });

  $$('.delay-cell').forEach(c =>
    c.addEventListener('click', () => copy(c.dataset.ms, `${c.dataset.label} = ${c.dataset.ms} ms`))
  );
}

/* ============================================================
   REVERB DATA
   ============================================================ */

const REVERB_STYLES = {
  ambience: {
    name: 'Tight Ambience',
    desc: 'Invisible glue. Adds air around a source without audible tail.',
    bars: 0.25, preDiv: 128,
    lowcut: '250 Hz', highcut: '8 kHz', lowHz: 250, highHz: 8000, mix: '8-12 %', diffusion: 'High',
    use: 'Drums, percussion, rap vocals and anything that must stay upfront and dry-sounding.'
  },
  room: {
    name: 'Small Room',
    desc: 'Realistic space. The "band in a room" feel.',
    bars: 0.5, preDiv: 128,
    lowcut: '200 Hz', highcut: '9 kHz', lowHz: 200, highHz: 9000, mix: '10-18 %', diffusion: 'Medium-High',
    use: 'Drum bus, electric guitars, keys. Keeps energy tight in busy arrangements.'
  },
  chamber: {
    name: 'Chamber',
    desc: 'Dense, smooth, vintage studio character.',
    bars: 1, preDiv: 64,
    lowcut: '180 Hz', highcut: '10 kHz', lowHz: 180, highHz: 10000, mix: '12-20 %', diffusion: 'High',
    use: 'Vocals and strings when a plate feels too bright and a hall too big.'
  },
  plate: {
    name: 'Plate',
    desc: 'Bright, dense, no early reflections. The classic vocal reverb.',
    bars: 1, preDiv: 64,
    lowcut: '150 Hz', highcut: '12 kHz', lowHz: 150, highHz: 12000, mix: '12-22 %', diffusion: 'Very High',
    use: 'Lead vocals, snare, brass. Adds shine and sustain without room character.'
  },
  hall: {
    name: 'Concert Hall',
    desc: 'Big, wide and lush. The cinematic space.',
    bars: 2, preDiv: 64,
    lowcut: '150 Hz', highcut: '10 kHz', lowHz: 150, highHz: 10000, mix: '15-25 %', diffusion: 'Medium',
    use: 'Ballad vocals, pads, strings, orchestral elements. Needs space in the arrangement.'
  },
  epic: {
    name: 'Cathedral / Epic',
    desc: 'Huge wash. More effect than space.',
    bars: 4, preDiv: 32,
    lowcut: '200 Hz', highcut: '8 kHz', lowHz: 200, highHz: 8000, mix: '20-35 %', diffusion: 'Low-Medium',
    use: 'Ambient swells, cinematic impacts, breakdown moments. Automate it in and out.'
  }
};

/* 12 dB/oct high-pass + low-pass response curve for the reverb send */
function sendEqSvg(lowHz, highHz) {
  const pos = f => Math.log10(f / 20) / Math.log10(20000 / 20) * 100;
  const pts = [];
  for (let i = 0; i <= 80; i++) {
    const f = 20 * Math.pow(1000, i / 80);              // 20 Hz .. 20 kHz, log
    const hp = f < lowHz ? 12 * Math.log2(lowHz / f) : 0;
    const lp = f > highHz ? 12 * Math.log2(f / highHz) : 0;
    const db = Math.min(hp + lp, 30);                   // attenuation, 0..30 dB
    const y = 22 + (db / 30) * 66;                      // 0 dB -> y22, -30 dB -> y88
    pts.push(`${pos(f).toFixed(1)},${y.toFixed(1)}`);
  }
  const line = pts.join(' ');
  const lowX = pos(lowHz).toFixed(1);
  const highX = pos(highHz).toFixed(1);
  const gridlines = [50, 100, 200, 500, 1000, 2000, 5000, 10000].map(f =>
    `<line x1="${pos(f).toFixed(1)}" y1="0" x2="${pos(f).toFixed(1)}" y2="100"
       stroke="rgba(255,255,255,0.05)" stroke-width="0.25"/>`
  ).join('');
  const fmtF = h => h >= 1000 ? (h / 1000) + ' kHz' : h + ' Hz';
  return `
    ${gridlines}
    <line x1="0" y1="22" x2="100" y2="22" stroke="rgba(255,255,255,0.10)" stroke-width="0.3" stroke-dasharray="1.5 1.5"/>
    <polygon points="0,100 ${line} 100,100" fill="rgba(164,139,250,0.13)"/>
    <polyline points="${line}" fill="none" stroke="var(--c-reverb)" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
    <line x1="${lowX}" y1="10" x2="${lowX}" y2="100" stroke="var(--c-comp)" stroke-width="0.35" stroke-dasharray="2 2" opacity="0.8"/>
    <line x1="${highX}" y1="10" x2="${highX}" y2="100" stroke="var(--c-comp)" stroke-width="0.35" stroke-dasharray="2 2" opacity="0.8"/>
    <text x="${Number(lowX) + 1.5}" y="9" font-size="4.6" fill="var(--c-comp)" font-weight="600">LOW CUT ${fmtF(lowHz)}</text>
    <text x="${Number(highX) - 1.5}" y="9" text-anchor="end" font-size="4.6" fill="var(--c-comp)" font-weight="600">HIGH CUT ${fmtF(highHz)}</text>
    <text x="1.5" y="19.5" font-size="4" fill="rgba(255,255,255,0.45)">0 dB</text>`;
}

function renderReverb() {
  const s = REVERB_STYLES[state.reverbStyle];
  const total = barMs() * s.bars;
  const pre = barMs() / s.preDiv;   // 1/n note = whole-bar ms / n
  const decay = Math.max(total - pre, 0);

  const styleButtons = Object.entries(REVERB_STYLES).map(([key, st]) => `
    <button class="rv-style ${key === state.reverbStyle ? 'on' : ''}" data-style="${key}">
      <span class="rs-name">${st.name}</span>
      <span class="rs-desc">${st.desc}</span>
    </button>`).join('');

  // decay envelope path (exponential-ish decay drawn across the card)
  const pts = [];
  for (let i = 0; i <= 60; i++) {
    const x = i / 60;
    const y = Math.pow(1 - x, 2.2);
    pts.push(`${(x * 100).toFixed(1)},${(92 - y * 80).toFixed(1)}`);
  }
  const preX = Math.min((pre / total) * 100, 18);

  $('#page-reverb').innerHTML = `
    <div class="page-head">
      <h1 class="page-title">Reverb <span class="tint" style="--accent:var(--c-reverb)">Designer</span></h1>
      <p class="page-desc">Tempo-synced reverb sizing at ${state.bpm} BPM. Pick a space on the left; pre-delay and decay land on the grid so the tail breathes with the song instead of smearing it.</p>
    </div>

    <div class="reverb-layout">
      <div class="rv-styles" id="rvStyles">${styleButtons}</div>

      <div class="rv-result">
        <div class="rv-big">
          <div class="rv-num-card" data-copy="${pre.toFixed(1)}" data-label="pre-delay">
            <div class="label">PRE-DELAY</div>
            <div class="val">${fmt(pre)}<small> ms</small></div>
            <div class="sub">1/${s.preDiv} note. Keeps the transient clear of the tail.</div>
          </div>
          <div class="rv-num-card" data-copy="${(decay / 1000).toFixed(2)}" data-label="decay">
            <div class="label">DECAY TIME</div>
            <div class="val">${(decay / 1000).toFixed(2)}<small> s</small></div>
            <div class="sub">Tail dies right on the grid (${s.bars} bar${s.bars === 1 ? '' : 's'} total).</div>
          </div>
          <div class="rv-num-card" data-copy="${(total / 1000).toFixed(2)}" data-label="total time">
            <div class="label">TOTAL TIME</div>
            <div class="val">${(total / 1000).toFixed(2)}<small> s</small></div>
            <div class="sub">Pre-delay + decay = ${s.bars} bar${s.bars === 1 ? '' : 's'} of musical time.</div>
          </div>
        </div>

        <div class="card">
          <div class="card-title">Decay envelope</div>
          <div class="decay-vis">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <rect x="0" y="0" width="${preX}" height="100" fill="rgba(164,139,250,0.10)"/>
              <line x1="${preX}" y1="0" x2="${preX}" y2="100" stroke="rgba(164,139,250,0.5)" stroke-width="0.4" stroke-dasharray="2 2"/>
              <polyline points="${preX},92 ${pts.map(p => {
                const [px, py] = p.split(',');
                return `${(preX + (100 - preX) * (px / 100)).toFixed(1)},${py}`;
              }).join(' ')}" fill="none" stroke="var(--c-reverb)" stroke-width="1.4" vector-effect="non-scaling-stroke"/>
              <line x1="0" y1="92" x2="100" y2="92" stroke="rgba(255,255,255,0.12)" stroke-width="0.3"/>
            </svg>
          </div>
        </div>

        <div class="card">
          <div class="card-title">Send EQ curve</div>
          <div class="card-sub">Filter the reverb return like this so the tail adds space, not mud or hiss.</div>
          <div class="rv-eq-vis">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">${sendEqSvg(s.lowHz, s.highHz)}</svg>
          </div>
          <div class="spectrum-scale">
            <span>20</span><span>50</span><span>100</span><span>200</span><span>500</span>
            <span>1k</span><span>2k</span><span>5k</span><span>10k</span><span>20k</span>
          </div>
        </div>

        <div class="card">
          <div class="card-title">Suggested settings for ${s.name}</div>
          <div class="rv-settings">
            <div class="rv-set"><div class="k">LOW CUT (send EQ)</div><div class="v">${s.lowcut}</div></div>
            <div class="rv-set"><div class="k">HIGH CUT (send EQ)</div><div class="v">${s.highcut}</div></div>
            <div class="rv-set"><div class="k">WET / SEND LEVEL</div><div class="v">${s.mix}</div></div>
            <div class="rv-set"><div class="k">DIFFUSION</div><div class="v">${s.diffusion}</div></div>
          </div>
          <p class="comp-note" style="margin-top:12px"><strong>Where it shines:</strong> ${s.use}</p>
        </div>

        <div class="hint-strip" style="--accent:var(--c-reverb)">
          <div>
            <strong>Pro habit:</strong> set reverbs on send buses, not inserts. EQ the send (cut lows and highs as above),
            then push the send until you hear the reverb clearly and back it off 2-3 dB. If the mix gets muddy,
            shorten the decay before you lower the level.
          </div>
        </div>
      </div>
    </div>`;

  $('#rvStyles').addEventListener('click', e => {
    const b = e.target.closest('.rv-style');
    if (!b) return;
    state.reverbStyle = b.dataset.style;
    renderReverb();
  });

  $$('.rv-num-card').forEach(c =>
    c.addEventListener('click', () => copy(c.dataset.copy, `${c.dataset.label} = ${c.dataset.copy}`))
  );
}

/* ============================================================
   EQ DATA
   ============================================================ */

/* band type: boost (green), cut (rose), info (blue = context/sweep zone) */
const EQ_DATA = {
  kick: { name: 'Kick Drum', bands: [
    { lo: 40,   hi: 60,   type: 'boost', title: 'Sub weight',   note: 'The chest-hitting fundamental. Boost gently and check on a sub or good headphones.' },
    { lo: 200,  hi: 400,  type: 'cut',   title: 'Cardboard',    note: 'Boxy, dull energy lives here. A wide 2-4 dB cut cleans the low mids instantly.' },
    { lo: 3000, hi: 5000, type: 'boost', title: 'Beater click', note: 'The attack that cuts through dense mixes and small speakers.' },
    { lo: 60,   hi: 100,  type: 'info',  title: 'Punch zone',   note: 'Where kick and bass fight. Decide which instrument owns it and carve the other.' }
  ]},
  snare: { name: 'Snare', bands: [
    { lo: 150,  hi: 250,   type: 'boost', title: 'Body',      note: 'Fatness and weight of the drum. Too much gets tubby fast.' },
    { lo: 400,  hi: 700,   type: 'cut',   title: 'Boxiness',  note: 'Honky ring. Sweep with a narrow Q to find the ugly resonance, then cut.' },
    { lo: 3000, hi: 6000,  type: 'boost', title: 'Crack',     note: 'The snap that makes a snare feel close and aggressive.' },
    { lo: 8000, hi: 12000, type: 'boost', title: 'Snap & air', note: 'Wire buzz and brightness. Shelf gently for sheen.' }
  ]},
  hats: { name: 'Hi-Hats & Cymbals', bands: [
    { lo: 20,   hi: 200,   type: 'cut',   title: 'Rumble',     note: 'High-pass aggressively. Nothing useful for cymbals lives below 200 Hz.' },
    { lo: 2000, hi: 4000,  type: 'cut',   title: 'Harshness',  note: 'Gritty, painful zone on cheap cymbals. Small cuts tame the trash.' },
    { lo: 7000, hi: 12000, type: 'boost', title: 'Shimmer',    note: 'Silky brightness. A high shelf here opens the top of the kit.' },
    { lo: 12000, hi: 16000, type: 'info', title: 'Air ceiling', note: 'Boost only if the source is well recorded; otherwise it lifts hiss too.' }
  ]},
  bass: { name: 'Bass Guitar / Synth Bass', bands: [
    { lo: 40,  hi: 80,    type: 'boost', title: 'Foundation',  note: 'The weight of the record. Keep it controlled with compression first.' },
    { lo: 200, hi: 350,   type: 'cut',   title: 'Mud',        note: 'Woolly buildup that masks vocals and guitars. Cut wide and shallow.' },
    { lo: 700, hi: 1200,  type: 'boost', title: 'Growl',      note: 'Midrange character that survives on laptop speakers.' },
    { lo: 2000, hi: 3500, type: 'boost', title: 'String buzz / edge', note: 'Pick attack and definition. Great for rock and DnB bass.' }
  ]},
  eight08: { name: '808', bands: [
    { lo: 30,  hi: 60,   type: 'boost', title: 'Sub power',  note: 'The fundamental. Tune the 808 to the song key first; EQ cannot fix a wrong pitch.' },
    { lo: 100, hi: 200,  type: 'info',  title: 'Warmth vs mud', note: 'Adds body on small speakers but clouds the mix fast. Saturate instead of boosting.' },
    { lo: 500, hi: 1500, type: 'boost', title: 'Distortion zone', note: 'Drive or saturation here makes the 808 audible on phones.' },
    { lo: 20,  hi: 30,   type: 'cut',   title: 'Sub rumble', note: 'Below the audible sub. High-pass at 25-30 Hz to reclaim headroom.' }
  ]},
  eguitar: { name: 'Electric Guitar', bands: [
    { lo: 20,   hi: 100,  type: 'cut',   title: 'Rumble',      note: 'High-pass. Guitars need no sub content in a full mix.' },
    { lo: 200,  hi: 400,  type: 'cut',   title: 'Mud',         note: 'Clears space for bass and kick. Especially on distorted rhythm tracks.' },
    { lo: 2000, hi: 4000, type: 'boost', title: 'Presence',    note: 'Bite and articulation. Also where guitars fight vocals; pick your winner.' },
    { lo: 4000, hi: 7000, type: 'cut',   title: 'Fizz',        note: 'Amp-sim harshness. A gentle shelf or cut smooths digital distortion.' }
  ]},
  aguitar: { name: 'Acoustic Guitar', bands: [
    { lo: 80,   hi: 120,   type: 'cut',   title: 'Boom',     note: 'Body resonance that thumps on every strum. Narrow cut around the offender.' },
    { lo: 200,  hi: 350,   type: 'cut',   title: 'Mud',      note: 'Keeps the guitar out of the vocal and piano zone.' },
    { lo: 2000, hi: 5000,  type: 'boost', title: 'Clarity',  note: 'String detail and pick definition.' },
    { lo: 8000, hi: 12000, type: 'boost', title: 'Sparkle',  note: 'The expensive-sounding shimmer on strummed parts.' }
  ]},
  piano: { name: 'Piano / Keys', bands: [
    { lo: 20,   hi: 80,   type: 'cut',   title: 'Rumble',    note: 'Pedal noise and stool creaks. High-pass unless the piano is the bass.' },
    { lo: 250,  hi: 400,  type: 'cut',   title: 'Muddiness', note: 'Left-hand buildup in dense arrangements.' },
    { lo: 2500, hi: 5000, type: 'boost', title: 'Presence',  note: 'Note attack and articulation for pop mixes.' },
    { lo: 10000, hi: 14000, type: 'boost', title: 'Air',     note: 'Hammer detail and openness on ballads.' }
  ]},
  leadvocal: { name: 'Lead Vocal', bands: [
    { lo: 20,   hi: 90,    type: 'cut',   title: 'Rumble & plosives', note: 'High-pass at 80-100 Hz (lower for deep voices).' },
    { lo: 200,  hi: 400,   type: 'cut',   title: 'Mud',       note: 'Woolly chest tone. Cut 2-3 dB wide if the vocal sounds cloudy.' },
    { lo: 1000, hi: 2000,  type: 'info',  title: 'Honk / nasal', note: 'Sweep here if the vocal sounds pinched; cut narrow.' },
    { lo: 3000, hi: 6000,  type: 'boost', title: 'Presence',  note: 'Intelligibility and closeness. The money zone; boost gently.' },
    { lo: 10000, hi: 16000, type: 'boost', title: 'Air',      note: 'Breath and expensive sheen. Shelf 1-3 dB; de-ess first.' }
  ]},
  bvox: { name: 'Backing Vocals', bands: [
    { lo: 20,   hi: 150,  type: 'cut',   title: 'Low clutter', note: 'High-pass higher than the lead so backings stay out of the way.' },
    { lo: 3000, hi: 5000, type: 'cut',   title: 'Presence dip', note: 'Cut where the lead is boosted; backings tuck neatly behind it.' },
    { lo: 8000, hi: 14000, type: 'boost', title: 'Air blend',   note: 'Keeps stacks silky and wide without fighting the lead.' }
  ]},
  synthlead: { name: 'Synth Lead', bands: [
    { lo: 20,   hi: 120,  type: 'cut',   title: 'Low cut',   note: 'Reserve the lows for bass and kick.' },
    { lo: 500,  hi: 900,  type: 'info',  title: 'Body',      note: 'Warmth vs boxiness balance; adjust to taste against guitars and keys.' },
    { lo: 2000, hi: 5000, type: 'boost', title: 'Cut-through', note: 'Makes the hook readable on any speaker.' },
    { lo: 6000, hi: 10000, type: 'cut',  title: 'Digital edge', note: 'Harsh sawtooth zing. Dynamic EQ works beautifully here.' }
  ]},
  pads: { name: 'Pads & Strings', bands: [
    { lo: 20,   hi: 150,   type: 'cut',   title: 'Low cut',   note: 'Pads eat headroom invisibly. High-pass without mercy.' },
    { lo: 250,  hi: 500,   type: 'cut',   title: 'Blanket',   note: 'The "warm blanket over the mix" zone. Cut until the mix opens.' },
    { lo: 8000, hi: 14000, type: 'boost', title: 'Sheen',     note: 'Silky top that reads as "expensive" at low mix levels.' }
  ]},
  mixbus: { name: 'Full Mix Bus', bands: [
    { lo: 20,   hi: 35,    type: 'cut',   title: 'Sub trash',  note: 'Gentle high-pass reclaims limiter headroom.' },
    { lo: 200,  hi: 350,   type: 'cut',   title: 'Global mud', note: 'If the whole mix is cloudy: 1-1.5 dB wide cut, no more.' },
    { lo: 3000, hi: 6000,  type: 'info',  title: 'Presence check', note: 'Compare against references; adjust in half-dB steps.' },
    { lo: 10000, hi: 16000, type: 'boost', title: 'Air lift',  note: 'A 0.5-1.5 dB shelf can finish a dull mix. Subtlety wins here.' }
  ]}
};

const logPos = f => Math.log10(f / 20) / Math.log10(20000 / 20) * 100;

function renderEQ() {
  const inst = EQ_DATA[state.eqInstrument];

  const chips = Object.entries(EQ_DATA).map(([key, d]) =>
    `<button class="eq-chip ${key === state.eqInstrument ? 'on' : ''}" data-i="${key}">${d.name}</button>`
  ).join('');

  const colors = { boost: 'var(--c-chains)', cut: 'var(--c-comp)', info: 'var(--c-guide)' };

  const regions = inst.bands.map(b => {
    const x = logPos(b.lo);
    const w = logPos(b.hi) - x;
    const y = b.type === 'boost' ? 18 : b.type === 'cut' ? 52 : 35;
    const label = w >= b.title.length * 2.7
      ? `<text x="${(x + w / 2).toFixed(1)}" y="${y + 18}" text-anchor="middle"
           font-size="4.4" fill="#e9ebf1" font-family="inherit" font-weight="600">${b.title}</text>`
      : '';
    return `
      <rect x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="30" rx="3"
        fill="${colors[b.type]}" opacity="0.28"/>
      <rect x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="30" rx="3"
        fill="none" stroke="${colors[b.type]}" stroke-width="0.35" opacity="0.9"/>
      ${label}`;
  }).join('');

  const gridlines = [50, 100, 200, 500, 1000, 2000, 5000, 10000].map(f =>
    `<line x1="${logPos(f).toFixed(1)}" y1="0" x2="${logPos(f).toFixed(1)}" y2="100"
       stroke="rgba(255,255,255,0.06)" stroke-width="0.25"/>`
  ).join('');

  const bands = inst.bands.map(b => `
    <div class="eq-band ${b.type}">
      <div class="bar"></div>
      <div class="freq">${b.lo >= 1000 ? (b.lo / 1000) + 'k' : b.lo}-${b.hi >= 1000 ? (b.hi / 1000) + 'k' : b.hi} Hz</div>
      <div class="what"><strong>${b.title}</strong>${b.note}</div>
    </div>`).join('');

  $('#page-eq').innerHTML = `
    <div class="page-head">
      <h1 class="page-title">EQ <span class="tint" style="--accent:var(--c-eq)">Cheat Sheet</span></h1>
      <p class="page-desc">Where each instrument lives on the spectrum, what to cut, and what to boost. Sweep with a narrow boost to find problem spots, then cut with the smallest move that fixes it.</p>
    </div>

    <div class="eq-picker" id="eqPicker">${chips}</div>

    <div class="eq-spectrum">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">${gridlines}${regions}</svg>
    </div>
    <div class="spectrum-scale">
      <span>20</span><span>50</span><span>100</span><span>200</span><span>500</span>
      <span>1k</span><span>2k</span><span>5k</span><span>10k</span><span>20k</span>
    </div>

    <div class="legend">
      <span><i style="background:var(--c-chains)"></i>Boost zone</span>
      <span><i style="background:var(--c-comp)"></i>Cut zone</span>
      <span><i style="background:var(--c-guide)"></i>Listen &amp; decide</span>
    </div>

    <div class="eq-bands">${bands}</div>`;

  $('#eqPicker').addEventListener('click', e => {
    const b = e.target.closest('.eq-chip');
    if (!b) return;
    state.eqInstrument = b.dataset.i;
    renderEQ();
  });
}

/* ============================================================
   COMPRESSION DATA
   ============================================================ */

const COMP_DATA = {
  kick: { name: 'Kick Drum', ratio: '4:1', attack: '10-30 ms', release: '50-100 ms', gr: '3-6 dB',
    atk: [10, 30], rel: [50, 100], grN: 6,
    note: 'Slow enough attack to let the beater click through, fast release to reset before the next hit. <strong>Faster attack = rounder, softer kick.</strong>' },
  snare: { name: 'Snare', ratio: '4:1', attack: '5-15 ms', release: '40-80 ms', gr: '3-6 dB',
    atk: [5, 15], rel: [40, 80], grN: 6,
    note: 'Let the crack pass, squash the ring. For aggressive rock snares, push GR harder and blend in parallel.' },
  drumbus: { name: 'Drum Bus', ratio: '2:1 - 4:1', attack: '10-30 ms', release: 'Auto / 100 ms', gr: '2-4 dB',
    atk: [10, 30], rel: [100, 200], grN: 4,
    note: 'Glue, not smash. The kit should breathe with the song. SSL-style bus compressors are the classic tool here.' },
  parallel: { name: 'Parallel Drums', ratio: '10:1+', attack: '1 ms', release: '50 ms', gr: '10-20 dB',
    atk: [1, 3], rel: [50, 80], grN: 15,
    note: 'Destroy a duplicate of the drum bus, then blend it under the clean signal for explosive energy that keeps the transients.' },
  bass: { name: 'Bass', ratio: '4:1', attack: '10-40 ms', release: '40-120 ms', gr: '4-8 dB',
    atk: [10, 40], rel: [40, 120], grN: 8,
    note: 'The most-compressed instrument in most mixes. Consistency beats character: every note should sit at the same level.' },
  eight08: { name: '808 / Sub', ratio: '4:1 - 8:1', attack: '15-30 ms', release: '80-150 ms', gr: '2-5 dB',
    atk: [15, 30], rel: [80, 150], grN: 5,
    note: 'Often needs saturation more than compression. If the 808 is a steady sine, a limiter for peak control is enough.' },
  leadvocal: { name: 'Lead Vocal', ratio: '3:1 - 4:1', attack: '5-15 ms', release: '40-80 ms', gr: '3-6 dB',
    atk: [5, 15], rel: [40, 80], grN: 6,
    note: 'Serial compression wins: two compressors doing 3 dB each sound smoother than one doing 6. Opto into FET is the classic pairing.' },
  rapvocal: { name: 'Rap Vocal', ratio: '4:1 - 6:1', attack: '1-5 ms', release: '30-60 ms', gr: '5-10 dB',
    atk: [1, 5], rel: [30, 60], grN: 10,
    note: 'Fast, dense and upfront. Faster attack than sung vocals; the words must never leave the front of the mix.' },
  bvox: { name: 'Backing Vocals', ratio: '4:1', attack: '2-10 ms', release: '60-120 ms', gr: '4-8 dB',
    atk: [2, 10], rel: [60, 120], grN: 8,
    note: 'Compress harder than the lead so the stack becomes one flat texture behind it.' },
  aguitar: { name: 'Acoustic Guitar', ratio: '3:1', attack: '15-30 ms', release: '100-200 ms', gr: '2-5 dB',
    atk: [15, 30], rel: [100, 200], grN: 5,
    note: 'Keep the strum transient, tame the sustain. For fingerpicked parts, go gentler.' },
  eguitar: { name: 'Electric Guitar', ratio: '3:1 - 4:1', attack: '10-25 ms', release: '80-150 ms', gr: '2-4 dB',
    atk: [10, 25], rel: [80, 150], grN: 4,
    note: 'Distorted guitars are already compressed by the amp; often need nothing. Clean tones benefit most.' },
  piano: { name: 'Piano / Keys', ratio: '2:1 - 3:1', attack: '20-40 ms', release: '150-300 ms', gr: '2-4 dB',
    atk: [20, 40], rel: [150, 300], grN: 4,
    note: 'Gentle leveling only. Piano dynamics are part of the performance; over-compression sounds seasick.' },
  synth: { name: 'Synth / Pads', ratio: '2:1', attack: '30+ ms', release: 'Auto', gr: '1-3 dB',
    atk: [30, 60], rel: [150, 300], grN: 3,
    note: 'Synths are usually already flat. Sidechain to the kick is often the compression they actually need.' },
  mixbus: { name: 'Mix Bus', ratio: '1.5:1 - 2:1', attack: '30 ms', release: 'Auto / 100-300 ms', gr: '1-3 dB',
    atk: [25, 40], rel: [100, 300], grN: 3,
    note: 'The famous glue: slow attack, program-dependent release, needle barely moving. If you can clearly hear it working, back off.' }
};

/* gain-reduction envelope: a hit lands, GR dives over the attack, holds, recovers over the release */
function compEnvelopeSvg(c) {
  const atkM = (c.atk[0] + c.atk[1]) / 2;
  const relM = (c.rel[0] + c.rel[1]) / 2;
  const t0 = 25, hold = Math.max(30, atkM);
  const total = t0 + atkM + hold + relM * 1.15 + 30;
  const xs = t => (t / total) * 100;

  const y0 = 20;
  const depth = Math.min(52, 14 + c.grN * 3);
  const yG = y0 + depth;

  const atkEnd = t0 + atkM;
  const relStart = atkEnd + hold;
  const relEnd = relStart + relM;

  const curve = [
    `M0,${y0}`, `L${xs(t0)},${y0}`,
    `C${xs(t0 + atkM * 0.3)},${y0} ${xs(t0 + atkM * 0.5)},${yG} ${xs(atkEnd)},${yG}`,
    `L${xs(relStart)},${yG}`,
    `C${xs(relStart + relM * 0.4)},${yG} ${xs(relStart + relM * 0.5)},${y0} ${xs(relEnd)},${y0}`,
    `L100,${y0}`
  ].join(' ');

  return `
    <line x1="0" y1="${y0}" x2="100" y2="${y0}" stroke="rgba(255,255,255,0.12)" stroke-width="0.3" stroke-dasharray="1.5 1.5"/>
    <text x="1.5" y="${y0 - 3}" font-size="4" fill="rgba(255,255,255,0.45)">0 dB</text>

    <rect x="${xs(t0 + c.atk[0])}" y="8" width="${Math.max(xs(t0 + c.atk[1]) - xs(t0 + c.atk[0]), 1)}" height="84"
      fill="rgba(242,177,60,0.08)"/>
    <rect x="${xs(relStart + c.rel[0] * 0)}" y="8" width="${xs(relStart + c.rel[1]) - xs(relStart)}" height="84"
      fill="rgba(79,213,143,0.07)"/>

    <line x1="${xs(t0)}" y1="6" x2="${xs(t0)}" y2="96" stroke="rgba(255,255,255,0.28)" stroke-width="0.35" stroke-dasharray="2 2"/>
    <text x="${xs(t0) + 1.5}" y="10" font-size="4.2" fill="rgba(255,255,255,0.6)" font-weight="600">HIT</text>

    <path d="${curve}" fill="none" stroke="var(--c-comp)" stroke-width="1.6" vector-effect="non-scaling-stroke"/>

    <text x="${xs(t0 + atkM / 2)}" y="97.5" text-anchor="middle" font-size="4.4" fill="var(--c-eq)" font-weight="700">ATTACK ${c.attack}</text>
    <text x="${xs(relStart + relM / 2)}" y="97.5" text-anchor="middle" font-size="4.4" fill="var(--c-chains)" font-weight="700">RELEASE ${c.release}</text>
    <text x="${xs(atkEnd + hold / 2)}" y="${yG + 6.5}" text-anchor="middle" font-size="4.4" fill="var(--c-comp)" font-weight="700">${c.gr} GR</text>`;
}

function renderComp() {
  const c = COMP_DATA[state.compSource];

  const chips = Object.entries(COMP_DATA).map(([key, d]) =>
    `<button class="eq-chip ${key === state.compSource ? 'on' : ''}" data-i="${key}"
       style="--chip:var(--c-comp)">${d.name}</button>`
  ).join('');

  $('#page-comp').innerHTML = `
    <div class="page-head">
      <h1 class="page-title">Compression <span class="tint" style="--accent:var(--c-comp)">Settings</span></h1>
      <p class="page-desc">Starting points per source. GR = gain reduction on the loudest hits. Set the threshold last: dial ratio, attack and release first, then lower the threshold until the meter shows the target GR.</p>
    </div>

    <div class="eq-picker" id="compPicker">${chips}</div>

    <div class="comp-layout" style="--accent:var(--c-comp)">
      <div class="card" style="margin:0">
        <div class="card-title">Gain-reduction envelope</div>
        <div class="card-sub">What the compressor does to one loud hit with these settings.</div>
        <div class="comp-vis">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">${compEnvelopeSvg(c)}</svg>
        </div>
      </div>

      <div class="comp-stats">
        <div class="stat-card">
          <div class="label">RATIO</div>
          <div class="val">${c.ratio}</div>
          <div class="sub">How hard peaks are squeezed past the threshold.</div>
        </div>
        <div class="stat-card">
          <div class="label">ATTACK</div>
          <div class="val">${c.attack}</div>
          <div class="sub">Slower = more transient punch survives.</div>
        </div>
        <div class="stat-card">
          <div class="label">RELEASE</div>
          <div class="val">${c.release}</div>
          <div class="sub">Time it to recover before the next hit.</div>
        </div>
        <div class="stat-card">
          <div class="label">GAIN REDUCTION</div>
          <div class="val">${c.gr}</div>
          <div class="sub">Target on the loudest moments, not constantly.</div>
        </div>
      </div>
    </div>

    <div class="hint-strip" style="--accent:var(--c-comp)">
      <div><strong>${c.name}:</strong> ${c.note}</div>
    </div>`;

  $('#compPicker').addEventListener('click', e => {
    const b = e.target.closest('.eq-chip');
    if (!b) return;
    state.compSource = b.dataset.i;
    renderComp();
  });
}

/* ============================================================
   MIX CHAINS DATA
   ============================================================ */

const CHAIN_DATA = {
  leadvocal: {
    name: 'Lead Vocal',
    chain: [
      { t: 'High-Pass Filter', d: '80-100 Hz, 12-24 dB/oct. Remove rumble before anything else reacts to it.' },
      { t: 'Subtractive EQ', d: 'Cut mud (200-400 Hz) and any harsh resonance found by sweeping.' },
      { t: 'De-Esser', d: 'Tame 5-8 kHz sibilance before compression makes it louder.' },
      { t: 'Compressor 1 (smooth)', d: 'Opto style, 3:1, slow-ish, 2-3 dB GR. Evens the performance.' },
      { t: 'Compressor 2 (attitude)', d: 'FET style, 4:1, fast, 2-3 dB GR. Brings the vocal forward.' },
      { t: 'Saturation', d: 'Light tape or tube drive for density and harmonics.' },
      { t: 'Tone EQ', d: 'Presence (3-6 kHz) and air (10 kHz+) boosts, to taste.' },
      { t: 'Sends: Delay + Reverb', d: '1/4 or 1/8 delay plus plate reverb on buses, EQ-filtered.' }
    ],
    why: 'Corrective moves (filter, cuts, de-ess) come first so the compressors react to a clean signal. Character and sweetening come after dynamics, and time-based effects always live on sends so the dry vocal stays upfront.'
  },
  rapvocal: {
    name: 'Rap Vocal',
    chain: [
      { t: 'High-Pass Filter', d: '90-120 Hz. Rap vocals sit over heavy sub; clear the lane completely.' },
      { t: 'Subtractive EQ', d: 'Cut boxiness (300-500 Hz), tame nasal honk (~1 kHz) if present.' },
      { t: 'Compressor (fast)', d: '4:1-6:1, 1-5 ms attack, 5-8 dB GR. Dense and upfront.' },
      { t: 'De-Esser', d: 'After heavy compression, esses jump: catch them here.' },
      { t: 'Saturation / Clip', d: 'Soft clipping adds aggression and perceived loudness.' },
      { t: 'Tone EQ', d: 'Presence lift at 3-5 kHz so every syllable reads on phone speakers.' },
      { t: 'Sends: Slap + Ambience', d: '80-110 ms slapback plus a tight ambience verb. Keep it dry-sounding.' }
    ],
    why: 'Rap lives in front of the beat, so the chain prioritizes density and articulation over space. The de-esser sits after the compressor because heavy GR exaggerates sibilance.'
  },
  kick: {
    name: 'Kick',
    chain: [
      { t: 'Gate / Sample blend', d: 'Clean bleed on live kits, or layer a sample for consistency.' },
      { t: 'EQ (subtractive)', d: 'Cut cardboard at 200-400 Hz.' },
      { t: 'Compressor', d: '4:1, 10-30 ms attack, release before the next hit, 3-6 dB GR.' },
      { t: 'EQ (additive)', d: 'Sub weight 40-60 Hz, beater click 3-5 kHz.' },
      { t: 'Saturation', d: 'Adds harmonics so the kick reads on small speakers.' }
    ],
    why: 'Cut the ugly stuff before compressing so the compressor does not chase frequencies you are about to remove. Boost after compression so the boosts stay stable.'
  },
  snare: {
    name: 'Snare',
    chain: [
      { t: 'Gate', d: 'On live kits: tame the hat bleed, keep the natural decay.' },
      { t: 'EQ (subtractive)', d: 'Notch the boxy ring around 400-700 Hz.' },
      { t: 'Compressor', d: '4:1, 5-15 ms attack, 3-6 dB GR. Crack first, ring under control.' },
      { t: 'EQ (additive)', d: 'Body at 150-250 Hz, crack at 3-6 kHz.' },
      { t: 'Send: Plate reverb', d: 'Short bright plate (0.8-1.2 s) with 20-30 ms pre-delay.' }
    ],
    why: 'The snare carries the backbeat; the chain protects its transient at every step. The plate on a send lets you push size without washing out the hit.'
  },
  drumbus: {
    name: 'Drum Bus',
    chain: [
      { t: 'Bus EQ', d: 'Broad strokes only: a touch of 60 Hz and 10 kHz if the kit is dull.' },
      { t: 'Glue Compressor', d: '2:1-4:1, 10-30 ms attack, auto release, 2-4 dB GR.' },
      { t: 'Saturation / Tape', d: 'Rounds transient spikes and knits the kit together.' },
      { t: 'Parallel Crush (blend)', d: 'A smashed duplicate mixed underneath for energy.' },
      { t: 'Limiter (optional)', d: 'Catch stray peaks, 1-2 dB max.' }
    ],
    why: 'Individual drums are already shaped; the bus is about cohesion. Glue compression plus tape saturation is what makes separate hits feel like one performance.'
  },
  bass: {
    name: 'Bass',
    chain: [
      { t: 'High-Pass Filter', d: '30-40 Hz. Even bass has useless rumble beneath it.' },
      { t: 'Compressor', d: '4:1, medium attack, 4-8 dB GR. Consistency is the whole game.' },
      { t: 'Saturation', d: 'Harmonics at 700 Hz-2 kHz make the bass audible on laptops.' },
      { t: 'EQ', d: 'Carve around the kick: whoever owns 60-100 Hz, the other yields.' },
      { t: 'Sidechain (optional)', d: 'Duck 1-3 dB from the kick for a locked low end.' }
    ],
    why: 'Compression before EQ keeps the low end steady while you shape tone. The kick-bass relationship is the foundation of the whole mix; everything else is negotiated around it.'
  },
  guitar: {
    name: 'Guitars',
    chain: [
      { t: 'High-Pass Filter', d: '80-120 Hz depending on arrangement density.' },
      { t: 'Subtractive EQ', d: 'Mud at 200-400 Hz, fizz at 4-7 kHz on amp sims.' },
      { t: 'Compressor (light)', d: '3:1, 2-4 dB GR. Skip on heavily distorted parts.' },
      { t: 'Tone EQ', d: 'Presence at 2-4 kHz, but leave room for the vocal.' },
      { t: 'Double & Pan', d: 'Two takes hard-panned L/R beats any widener plugin.' }
    ],
    why: 'Real doubles panned wide create the huge rhythm sound; processing stays light because distortion is already compression. The vocal owns the center, so guitars live on the sides.'
  },
  synth: {
    name: 'Synths / Keys',
    chain: [
      { t: 'High-Pass Filter', d: 'Clear everything below where the part actually plays.' },
      { t: 'EQ', d: 'Carve a pocket around the vocal (dip 2-5 kHz slightly).' },
      { t: 'Sidechain Compression', d: 'Duck from the kick: the classic pumping glue of electronic music.' },
      { t: 'Width (sides only)', d: 'Chorus or widener on the sides; keep lows mono below 150 Hz.' },
      { t: 'Sends: Long Reverb', d: 'Pads can take big halls; filter the send heavily.' }
    ],
    why: 'Synths fill space by default, so the chain is mostly about clearing room: filtering lows, ducking under the kick, and pushing width out of the vocal lane.'
  },
  mixbus: {
    name: 'Mix Bus',
    chain: [
      { t: 'Bus EQ', d: 'Half-dB moves. A gentle high shelf if references sound brighter.' },
      { t: 'Glue Compressor', d: '2:1, 30 ms attack, auto release, 1-3 dB GR, needle dancing.' },
      { t: 'Saturation / Tape', d: 'Subtle density; blend to taste with dry.' },
      { t: 'Reference Check', d: 'A/B against 2-3 commercial tracks at matched loudness.' },
      { t: 'Headroom Out', d: 'Leave 3-6 dB of peak headroom for mastering.' }
    ],
    why: 'Everything on the mix bus is a finishing move: small, broad, and reversible. If you find yourself doing surgery here, the problem lives on a channel, not the bus.'
  },
  master: {
    name: 'Mastering Chain',
    chain: [
      { t: 'Corrective EQ', d: 'Linear-phase, half-dB moves, fix only what references reveal.' },
      { t: 'Multiband Comp (optional)', d: 'Tame a wild low end or harsh mids, 1-2 dB per band max.' },
      { t: 'Stereo Width Check', d: 'Mono below 120 Hz; verify the mix survives full mono.' },
      { t: 'Saturation / Exciter', d: 'A final 1-2% of harmonic lift, if the mix needs it.' },
      { t: 'Limiter', d: 'Ceiling at -1 dBTP, push input until it reads your LUFS target.' },
      { t: 'Meter & Compare', d: 'Check LUFS, true peak, and A/B at matched volume.' }
    ],
    why: 'Mastering is quality control, not rescue. Each stage nudges the mix a step closer to the reference; the limiter comes last because everything before it changes the level hitting it.'
  }
};

function renderChains() {
  const c = CHAIN_DATA[state.chainInstrument];

  const chips = Object.entries(CHAIN_DATA).map(([key, d]) =>
    `<button class="eq-chip ${key === state.chainInstrument ? 'on' : ''}" data-i="${key}"
       style="--c-eq:var(--c-chains)">${d.name}</button>`
  ).join('');

  const nodes = c.chain.map((n, i) => `
    ${i > 0 ? '<div class="chain-arrow">&#9654;</div>' : ''}
    <div class="chain-node">
      <div class="step-num">${String(i + 1).padStart(2, '0')}</div>
      <h4>${n.t}</h4>
      <p>${n.d}</p>
    </div>`).join('');

  $('#page-chains').innerHTML = `
    <div class="page-head">
      <h1 class="page-title">Mix <span class="tint" style="--accent:var(--c-chains)">Chains</span></h1>
      <p class="page-desc">Proven processing orders per source, with the reasoning behind each chain. Signal flows left to right; skip any stage the source does not need.</p>
    </div>

    <div class="chain-select-row eq-picker" id="chainPicker">${chips}</div>

    <div class="chain-flow">${nodes}</div>

    <div class="chain-why"><strong>Why this order:</strong> ${c.why}</div>`;

  $('#chainPicker').addEventListener('click', e => {
    const b = e.target.closest('.eq-chip');
    if (!b) return;
    state.chainInstrument = b.dataset.i;
    renderChains();
  });
}

/* ============================================================
   MIXING GUIDE
   ============================================================ */

const GUIDE_SECTIONS = [
  {
    t: 'Gain staging: the free upgrade',
    body: `
      <p>Every plugin, analog emulation and summing stage has a sweet spot. Feed it too hot and you get harshness; too quiet and you fight noise floors and weak meters.</p>
      <ul>
        <li>Aim each track to average around <span class="mono">-18 dBFS</span> with peaks near <span class="mono">-10 dBFS</span> before any processing.</li>
        <li>Use clip gain or a trim plugin first in every chain, not the fader, so your compressor thresholds stay meaningful.</li>
        <li>Keep <span class="mono">3-6 dB</span> of headroom on the mix bus. Loudness comes later, at mastering.</li>
      </ul>`
  },
  {
    t: 'Balance first, plugins second',
    body: `
      <p>A great static mix with only faders and pans gets you 80% of the way. If the rough balance does not feel good, no EQ will save it.</p>
      <ul>
        <li>Start with everything down. Bring up the most important element first (usually vocal or drums) and build around it.</li>
        <li>Mix at low volume. If it sounds balanced quiet, it will sound huge loud. The reverse is not true.</li>
        <li>Before reaching for an EQ, try the fader. A 1 dB fader move often beats a 3-band EQ curve.</li>
      </ul>`
  },
  {
    t: 'EQ philosophy: cut narrow, boost wide',
    body: `
      <p>EQ is about making room, not making things "better". Two instruments cannot own the same frequencies at the same time.</p>
      <ul>
        <li>Sweep with a narrow boost to find offenders, then cut with the smallest move that fixes the problem.</li>
        <li>Cuts sound transparent; boosts sound like EQ. When boosting, use wide, gentle bells.</li>
        <li>High-pass almost everything, but stop where the instrument loses body: filter until you hear it, then back off.</li>
        <li>Fix masking, not solo sound. An instrument that sounds thin alone often sits perfectly in the mix.</li>
      </ul>`
  },
  {
    t: 'Compression: shape energy, not just level',
    body: `
      <p>Compression is an envelope shaper. Attack decides how much punch survives; release decides how the sound breathes with the tempo.</p>
      <ul>
        <li>Set ratio and attack first, then lower the threshold to the target gain reduction, then tune release to the groove.</li>
        <li>Serial compression (two gentle stages) sounds smoother than one heavy stage.</li>
        <li>Parallel compression adds density while keeping transients: crush a duplicate, blend it underneath.</li>
        <li>If the mix pumps unpleasantly, the release is too slow or the ratio too high. Fix those before the threshold.</li>
      </ul>`
  },
  {
    t: 'Space: reverb and delay strategy',
    body: `
      <p>Depth comes from contrast: something must stay dry for anything to sound wet. Decide which elements live upfront and which sit back.</p>
      <ul>
        <li>Use 2-4 shared send buses (short room, plate, hall, tempo delay) instead of a reverb on every track.</li>
        <li>Pre-delay separates the source from its tail: more pre-delay = closer, clearer source.</li>
        <li>EQ every reverb return: cut below <span class="mono">150-250 Hz</span> and above <span class="mono">8-12 kHz</span> so tails never cloud the mix.</li>
        <li>Delay before reverb (in send order) sounds bigger than reverb alone at half the mud.</li>
        <li>Sync delays to tempo with the Delay Calculator; unsynced short slaps (60-120 ms) are the exception that grooves.</li>
      </ul>`
  },
  {
    t: 'Panning and stereo width',
    body: `
      <p>Width is a contrast game like depth: the wider the sides, the more powerful the mono center becomes.</p>
      <ul>
        <li>Keep kick, bass, snare and lead vocal in the center. Pan everything else with intention.</li>
        <li>Use LCR thinking as a start: hard left, center, hard right. Timid 10% pans read as blur, not width.</li>
        <li>Keep everything below <span class="mono">120-150 Hz</span> mono; wide lows fall apart on clubs and phones.</li>
        <li>Check mono regularly. If a doubled part vanishes in mono, fix the timing or the widener before moving on.</li>
      </ul>`
  },
  {
    t: 'References and monitoring',
    body: `
      <p>Your room and ears drift. References are the anchor that keeps a mix honest across playback systems.</p>
      <ul>
        <li>Pick 2-3 commercial tracks in the same genre and loudness-match them to your mix (this matters: louder always sounds "better").</li>
        <li>Check the mix on at least three systems: main monitors or headphones, earbuds, and a phone speaker.</li>
        <li>Mix mostly at conversation level (<span class="mono">~75-80 dB SPL</span>); go loud only briefly to check excitement, quiet to check balance.</li>
        <li>Take breaks every 45-60 minutes. Ear fatigue makes everything sound dull and pushes you to over-brighten.</li>
      </ul>`
  },
  {
    t: 'Loudness and the final limiter',
    body: `
      <p>Streaming platforms normalize playback, so extreme loudness buys nothing and costs punch. Master for translation, not for the meter.</p>
      <ul>
        <li>Typical streaming target: <span class="mono">-14 LUFS</span> integrated with peaks at <span class="mono">-1 dBTP</span>. Club and aggressive genres go louder (see Reference page).</li>
        <li>Push the limiter until you hear it degrade the punch, then back off 0.5-1 dB.</li>
        <li>A soft clipper before the limiter often reaches the same loudness with less audible pumping.</li>
        <li>Compare the master against the unmastered mix at matched volume: it should sound better, not just louder.</li>
      </ul>`
  },
  {
    t: 'Common mistakes checklist',
    body: `
      <ul>
        <li><strong>Mixing in solo.</strong> Nothing matters alone; every decision is about the combination.</li>
        <li><strong>Too much low end from mixing on small speakers.</strong> Verify sub content on headphones or a sub.</li>
        <li><strong>Every track compressed and EQed by default.</strong> Some tracks need only a fader and a pan.</li>
        <li><strong>Wideners on everything.</strong> Phase-based width collapses in mono; use real doubles and panning first.</li>
        <li><strong>Skipping gain staging, then fighting harshness all session.</strong></li>
        <li><strong>No reference tracks.</strong> You are mixing toward memory, and memory flatters.</li>
        <li><strong>Endless tweaking of the same 8 bars.</strong> Mix in passes over the whole song, then rest your ears before final decisions.</li>
      </ul>`
  }
];

function renderGuide() {
  const cards = GUIDE_SECTIONS.map((s, i) => `
    <div class="guide-section">
      <div class="guide-card ${i === 0 ? 'open' : ''}">
        <button class="guide-head"><span>${s.t}</span><span class="chev">&#9654;</span></button>
        <div class="guide-body">${s.body}</div>
      </div>
    </div>`).join('');

  $('#page-guide').innerHTML = `
    <div class="page-head">
      <h1 class="page-title">Mixing <span class="tint" style="--accent:var(--c-guide)">Guide</span></h1>
      <p class="page-desc">The habits and principles behind professional mixes, condensed. Read top to bottom once, then use it as a checklist per session.</p>
    </div>
    ${cards}`;

  $$('#page-guide .guide-head').forEach(h =>
    h.addEventListener('click', () => h.closest('.guide-card').classList.toggle('open'))
  );
}

/* ============================================================
   REFERENCE PAGE
   ============================================================ */

const LUFS_TARGETS = [
  { n: 'Spotify / Tidal / Amazon', v: '-14 LUFS', d: 'True peak -1 dBTP' },
  { n: 'Apple Music', v: '-16 LUFS', d: 'Sound Check normalization' },
  { n: 'YouTube', v: '-14 LUFS', d: 'Louder content turned down only' },
  { n: 'Club / DJ master', v: '-7 to -5 LUFS', d: 'No normalization on a PA' },
  { n: 'CD / aggressive pop-EDM', v: '-9 to -7 LUFS', d: 'Loudness-first tradition' },
  { n: 'Broadcast (EBU R128)', v: '-23 LUFS', d: '&plusmn;0.5 LU tolerance' },
  { n: 'Podcast / spoken word', v: '-16 to -14 LUFS', d: 'Mono-safe, consistent' }
];

const FREQ_BANDS = [
  { n: 'Sub', v: '20-60 Hz', d: 'Felt more than heard. Kick and 808 fundamentals.' },
  { n: 'Bass', v: '60-250 Hz', d: 'Warmth and weight. Too much = boom, too little = thin.' },
  { n: 'Low mids', v: '250-500 Hz', d: 'Mud lives here. The most-cut region in mixing.' },
  { n: 'Mids', v: '500 Hz-2 kHz', d: 'Body and honk. Phone speakers reproduce mostly this.' },
  { n: 'High mids', v: '2-6 kHz', d: 'Presence, attack, intelligibility. Also harshness.' },
  { n: 'Highs', v: '6-12 kHz', d: 'Sibilance, sparkle, cymbal detail.' },
  { n: 'Air', v: '12-20 kHz', d: 'Openness and sheen. Boost only on clean sources.' }
];

const TIMING_FACTS = [
  { n: 'Haas effect window', v: '1-30 ms', d: 'Perceived as one widened sound' },
  { n: 'Slapback delay', v: '60-120 ms', d: 'Heard as a distinct early echo' },
  { n: 'Pre-delay for clarity', v: '20-40 ms', d: 'Separates source from reverb tail' },
  { n: 'Echo threshold', v: '&gt;35 ms', d: 'Ear splits sound into two events' },
  { n: 'Mono-safe low end', v: '&lt;120-150 Hz', d: 'Keep this range centered' },
  { n: 'A4 tuning standard', v: '440 Hz', d: 'Octave up = double the frequency' }
];

function noteFreqs() {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const out = [];
  for (let octave = 0; octave <= 4; octave++) {
    for (let i = 0; i < 12; i++) {
      const midi = (octave + 1) * 12 + i;              // C0 = midi 12
      const hz = 440 * Math.pow(2, (midi - 69) / 12);
      out.push({ note: `${names[i]}${octave}`, hz });
    }
  }
  return out;
}

function renderReference() {
  const rows = arr => arr.map(r => `
    <div class="ref-row">
      <span class="n">${r.n}<br/><span class="d">${r.d}</span></span>
      <span class="v">${r.v}</span>
    </div>`).join('');

  const notes = noteFreqs().map(n => `
    <div class="nf">
      <div class="note">${n.note}</div>
      <div class="hz">${n.hz < 100 ? n.hz.toFixed(1) : n.hz.toFixed(0)} Hz</div>
    </div>`).join('');

  $('#page-reference').innerHTML = `
    <div class="page-head">
      <h1 class="page-title">Reference <span class="tint" style="--accent:var(--c-reference)">Tables</span></h1>
      <p class="page-desc">The numbers producers look up constantly: loudness targets per platform, the frequency map, psychoacoustic timing windows, and note-to-frequency for tuning 808s and resonant filters.</p>
    </div>

    <div class="ref-two-col">
      <div class="card">
        <div class="card-title">Loudness targets</div>
        <div class="card-sub">Integrated LUFS for delivery. Master to the platform, not to the meter war.</div>
        <div class="ref-rows">${rows(LUFS_TARGETS)}</div>
      </div>

      <div>
        <div class="card">
          <div class="card-title">Frequency map</div>
          <div class="card-sub">The seven zones every mix decision touches.</div>
          <div class="ref-rows">${rows(FREQ_BANDS)}</div>
        </div>
        <div class="card">
          <div class="card-title">Timing &amp; psychoacoustics</div>
          <div class="ref-rows">${rows(TIMING_FACTS)}</div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:18px">
      <div class="card-title">Note frequencies (C0-B4)</div>
      <div class="card-sub">Tune 808s, kicks and resonant filters to the song key. Octave up doubles the value.</div>
      <div class="note-freq-grid">${notes}</div>
    </div>`;
}

/* ============================================================
   TEMPO BAR + NAVIGATION
   ============================================================ */

function updateTempoReadout() {
  $('#roBeat').textContent = fmt(beatMs());
  $('#roBar').textContent = fmt(barMs(), 0);
  $('#roHz').textContent = (state.bpm / 60).toFixed(2);
}

function setBpm(v) {
  const bpm = Math.min(300, Math.max(20, Number(v) || 120));
  state.bpm = Math.round(bpm * 10) / 10;
  $('#bpmInput').value = state.bpm;
  updateTempoReadout();
  // re-render tempo-dependent pages
  if (state.page === 'delay') renderDelay();
  if (state.page === 'reverb') renderReverb();
}

/* tap tempo */
let taps = [];
function tap() {
  const now = performance.now();
  if (taps.length && now - taps[taps.length - 1] > 2200) taps = [];
  taps.push(now);
  if (taps.length > 8) taps.shift();
  if (taps.length >= 2) {
    const gaps = taps.slice(1).map((t, i) => t - taps[i]);
    const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    setBpm(60000 / avg);
  }
  const btn = $('#tapBtn');
  btn.classList.add('tapped');
  setTimeout(() => btn.classList.remove('tapped'), 120);
}

/* ============================================================
   TEMPO DETECTION (offline, Web Audio API)
   Filter the track down to kick energy, find peaks, cluster the
   intervals between them into a BPM vote.
   ============================================================ */

/*
  Pipeline (standard MIR approach — onset envelope + autocorrelation):
  1. Decode, take up to 75 s from a quarter of the way in.
  2. Render three band-passed copies (low / mid / high) in one offline pass.
  3. Onset strength envelope: half-wave-rectified energy flux per band,
     normalized and summed (~200 frames/s).
  4. Autocorrelate the envelope over the 60-200 BPM lag range.
  5. Score candidates with harmonic (comb) support + a perceptual tempo
     preference centred near 120 BPM; resolve octaves against evidence,
     tie-breaking with the track's actual onset rate.
  6. Parabolic-interpolate the winning lag, then snap to the integer /
     half-integer grid modern productions actually use.
*/
async function detectBpmFromFile(file) {
  const arr = await file.arrayBuffer();
  const probe = new AudioContext();
  let buf;
  try {
    buf = await probe.decodeAudioData(arr);
  } catch (e) {
    probe.close();
    throw new Error('unsupported or corrupt audio file');
  }
  probe.close();
  if (buf.duration < 8) throw new Error('track is too short to analyze');

  const sr = buf.sampleRate;
  const start = buf.duration > 100 ? buf.duration * 0.25 : 0;
  const len = Math.min(75, buf.duration - start);

  // --- three-band offline render in a single pass ---
  const off = new OfflineAudioContext(3, Math.ceil(len * sr), sr);
  const src = off.createBufferSource();
  src.buffer = buf;
  const merger = off.createChannelMerger(3);
  const bands = [[40, 160], [400, 2000], [4000, 10000]];
  bands.forEach(([lo, hi], i) => {
    const hp = off.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = lo;
    const lp = off.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = hi;
    src.connect(hp); hp.connect(lp); lp.connect(merger, 0, i);
  });
  merger.connect(off.destination);
  src.start(0, start, len);
  const rendered = await off.startRendering();

  // --- onset strength envelope at ~200 fps ---
  const hop = Math.round(sr / 200);
  const fps = sr / hop;
  const nFrames = Math.floor(rendered.length / hop) - 2;
  if (nFrames < fps * 6) throw new Error('not enough audio to analyze');
  const env = new Float32Array(nFrames);
  const bandWeight = [1.0, 0.8, 0.5]; // keep the kick/snare backbone dominant over hats
  for (let ch = 0; ch < 3; ch++) {
    const d = rendered.getChannelData(ch);
    const flux = new Float32Array(nFrames);
    let prev = 0, fmax = 0;
    for (let f = 0; f < nFrames; f++) {
      let e = 0;
      const base = f * hop;
      for (let i = 0; i < hop * 2; i++) e += d[base + i] * d[base + i];
      const rise = Math.max(0, e - prev);
      prev = e;
      flux[f] = rise;
      fmax = Math.max(fmax, rise);
    }
    if (fmax > 0) for (let f = 0; f < nFrames; f++) env[f] += bandWeight[ch] * flux[f] / fmax;
  }
  let eMean = 0;
  for (let f = 0; f < nFrames; f++) eMean += env[f];
  eMean /= nFrames;
  if (eMean === 0) throw new Error('the track appears to be silent');
  for (let f = 0; f < nFrames; f++) env[f] -= eMean;

  // --- autocorrelation over the 60-200 BPM lag range ---
  const minLag = Math.floor((60 * fps) / 200);
  const maxLag = Math.ceil((60 * fps) / 60);
  let ac0 = 0;
  for (let f = 0; f < nFrames; f++) ac0 += env[f] * env[f];
  if (ac0 === 0) throw new Error('no rhythmic variation found');
  const ac = new Float32Array(maxLag * 2 + 3);
  for (let lag = 1; lag <= maxLag * 2 + 2 && lag < nFrames; lag++) {
    let s = 0;
    for (let f = 0; f + lag < nFrames; f++) s += env[f] * env[f + lag];
    ac[lag] = s / ac0;
  }
  const acAt = l => {
    if (l < 1 || l >= ac.length - 1) return 0;
    const i = Math.floor(l), t = l - i;
    return ac[i] * (1 - t) + ac[i + 1] * t;
  };

  // --- median inter-onset interval (tie-break evidence) ---
  let vMax = 0;
  for (let f = 0; f < nFrames; f++) vMax = Math.max(vMax, env[f]);
  const gate = vMax * 0.3, minGap = Math.round(fps * 0.12);
  const onsets = [];
  for (let f = 1; f < nFrames - 1; f++) {
    if (env[f] > gate && env[f] >= env[f - 1] && env[f] >= env[f + 1]) {
      if (!onsets.length || f - onsets[onsets.length - 1] >= minGap) onsets.push(f);
    }
  }
  let ioiRate = 0;
  if (onsets.length > 8) {
    const iois = onsets.slice(1).map((v, i) => v - onsets[i]).sort((a, b) => a - b);
    ioiRate = (60 * fps) / iois[Math.floor(iois.length / 2)];
  }

  // --- candidate generation: AC peaks, expanded across octaves ---
  const peakLags = [];
  for (let lag = minLag + 1; lag < maxLag; lag++) {
    if (ac[lag] > ac[lag - 1] && ac[lag] >= ac[lag + 1]) peakLags.push(lag);
  }
  peakLags.sort((a, b) => ac[b] - ac[a]);
  const candidates = new Map();
  for (const lag of peakLags.slice(0, 8)) {
    for (const mult of [0.5, 1, 2]) {
      const l = lag * mult;
      const bpm = (60 * fps) / l;
      if (bpm < 58 || bpm > 202) continue;
      const key = Math.round(bpm * 2);
      if (!candidates.has(key)) candidates.set(key, l);
    }
  }
  if (!candidates.size) throw new Error('not enough rhythmic energy found');

  // --- scoring: comb support x tempo preference (x gentle IOI tie-break) ---
  const pref = bpm => Math.exp(-0.5 * Math.pow(Math.log2(bpm / 118) / 1.1, 2));
  let best = null, second = null;
  for (const l of candidates.values()) {
    const bpm = (60 * fps) / l;
    const comb = acAt(l) + 0.5 * acAt(l * 2) + 0.3 * acAt(l / 2);
    let score = comb * (0.65 * pref(bpm) + 0.35);
    if (ioiRate > 0) {
      const ioi = Math.exp(-0.5 * Math.pow(Math.log2(bpm / ioiRate) / 1.4, 2));
      score *= (0.8 + 0.2 * ioi);
    }
    const cand = { lag: l, bpm, score, ac: acAt(l) };
    if (!best || score > best.score) { second = best; best = cand; }
    else if (!second || score > second.score) second = cand;
  }

  /* --- octave correction (the anti-halving rule) ---
     Backbeat snares make the 2-beat cycle the strongest periodicity, so the
     raw winner is often HALF the perceived tempo. If the candidate's
     half-lag (= double tempo) also shows solid autocorrelation — meaning the
     "off-beats" carry real onset energy — the faster octave is the truth. */
  let lag = best.lag;
  let guard = 0;
  while (guard++ < 2) {
    const bpmNow = (60 * fps) / lag;
    if (bpmNow >= 100 || bpmNow * 2 > 200) break;
    if (acAt(lag / 2) >= 0.45 * acAt(lag)) lag = lag / 2;
    else break;
  }

  // --- parabolic refinement around the winning lag ---
  const li = Math.round(lag);
  if (li > 1 && li < ac.length - 1) {
    const den = ac[li - 1] - 2 * ac[li] + ac[li + 1];
    if (den < 0) {
      const shift = (0.5 * (ac[li - 1] - ac[li + 1])) / den;
      if (Math.abs(shift) <= 1) lag = li + shift;
    }
  }
  let bpm = (60 * fps) / lag;

  // --- snap to the grids real songs use ---
  if (Math.abs(bpm - Math.round(bpm)) <= 0.4) bpm = Math.round(bpm);
  else if (Math.abs(bpm * 2 - Math.round(bpm * 2)) <= 0.3) bpm = Math.round(bpm * 2) / 2;
  else bpm = Math.round(bpm * 10) / 10;

  // alternative octave worth mentioning? (compare against the corrected tempo)
  let alt = null;
  if (second && second.score >= best.score * 0.75) {
    const ratio = second.bpm / bpm;
    if (Math.abs(ratio - 0.5) < 0.05 || Math.abs(ratio - 2) < 0.1) {
      alt = Math.round(second.bpm);
    }
  }

  return { bpm, confidence: best.ac, alt };
}

async function analyzeFile(file) {
  const btn = $('#detectBtn');
  btn.classList.add('busy');
  btn.textContent = '· · ·';
  toast(`Analyzing ${file.name}…`);
  try {
    const { bpm, confidence, alt } = await detectBpmFromFile(file);
    setBpm(bpm);
    const conf = confidence >= 0.35 ? 'high' : confidence >= 0.18 ? 'medium' : 'low';
    const altNote = alt ? ` · could also be ${alt}` : '';
    toast(`Detected ${state.bpm} BPM (${conf} confidence)${altNote}`);
  } catch (err) {
    toast(`Could not detect tempo — ${err.message}`);
  }
  btn.classList.remove('busy');
  btn.textContent = 'DETECT';
}

function initTempoDetect() {
  const input = $('#audioFile');
  $('#detectBtn').addEventListener('click', () => input.click());
  input.addEventListener('change', e => {
    if (e.target.files[0]) analyzeFile(e.target.files[0]);
    e.target.value = '';
  });

  const overlay = $('#dropOverlay');
  let depth = 0;
  const isAudioName = n => /\.(mp3|wav|ogg|m4a|aac|flac|aif|aiff|opus|webm)$/i.test(n);
  document.addEventListener('dragenter', e => {
    e.preventDefault();
    if ([...(e.dataTransfer?.items || [])].some(i => i.kind === 'file')) {
      depth++;
      overlay.classList.add('show');
    }
  });
  document.addEventListener('dragover', e => e.preventDefault());
  document.addEventListener('dragleave', e => {
    e.preventDefault();
    depth = Math.max(0, depth - 1);
    if (!depth) overlay.classList.remove('show');
  });
  document.addEventListener('drop', e => {
    e.preventDefault();
    depth = 0;
    overlay.classList.remove('show');
    const f = [...(e.dataTransfer?.files || [])]
      .find(f => f.type.startsWith('audio/') || isAudioName(f.name));
    if (f) analyzeFile(f);
    else if (e.dataTransfer?.files.length) toast('Drop an audio file (mp3, wav, flac…)');
  });
}

const RENDERERS = {
  delay: renderDelay,
  reverb: renderReverb,
  eq: renderEQ,
  comp: renderComp,
  chains: renderChains,
  guide: renderGuide,
  reference: renderReference
};

function showPage(page) {
  state.page = page;
  $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  $$('.page').forEach(p => p.classList.remove('active'));
  const el = $(`#page-${page}`);
  RENDERERS[page]();
  el.classList.add('active');
  $('.content').scrollTop = 0;
}

/* ---------- init ---------- */

$('#nav').addEventListener('click', e => {
  const b = e.target.closest('.nav-item');
  if (b) showPage(b.dataset.page);
});

$('#bpmInput').addEventListener('change', e => setBpm(e.target.value));
$('#bpmUp').addEventListener('click', () => setBpm(state.bpm + 1));
$('#bpmDown').addEventListener('click', () => setBpm(state.bpm - 1));
$('#bpmHalf').addEventListener('click', () => setBpm(state.bpm / 2));
$('#bpmDouble').addEventListener('click', () => setBpm(state.bpm * 2));
$('#tapBtn').addEventListener('click', tap);

document.addEventListener('keydown', e => {
  if (e.key === 't' && document.activeElement.tagName !== 'INPUT') tap();
});

initTempoDetect();
updateTempoReadout();
showPage('delay');

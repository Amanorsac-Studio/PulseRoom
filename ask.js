/* ============================================================
   PulseRoom — Ask
   The mixing assistant: an offline search over hand-written
   answers, with a visual drawn from each answer's own numbers.

   No network, no model, no API. Everything here runs against
   window.PR_ANSWERS, which ships with the app.
   ============================================================ */
'use strict';

(function () {

const A = () => window.PR_ANSWERS || [];

/* ---------------------------------------------------------- *
 * 1. Search
 *
 * A producer at 2am types "kick has no punch", not "how do I
 * increase the transient content of my kick drum". The index is
 * built over the question, its aliases and its source, and the
 * query is expanded through a synonym table before matching, so
 * studio slang reaches the entry that answers it.
 * ---------------------------------------------------------- */

const SYN = {
  vox: 'vocal', vocals: 'vocal', vocalist: 'vocal', singer: 'vocal',
  kik: 'kick', bd: 'kick', 'bass drum': 'kick', kicks: 'kick',
  sn: 'snare', snr: 'snare', hat: 'hats', hihat: 'hats', 'hi-hat': 'hats', hats: 'hats',
  oh: 'overheads', bgv: 'harmony', bgvs: 'harmony', backing: 'harmony',
  sub: '808', eight08: '808', gtr: 'guitar', gtrs: 'guitar', axe: 'guitar',
  keys: 'piano', rhodes: 'rhodes', hammond: 'organ', leslie: 'organ',
  comp: 'compression', compressor: 'compression', eq: 'equaliser',
  verb: 'reverb', bus: 'mixbus', master: 'mixbus', mix: 'mixbus',
  knock: 'punch', slap: 'punch', bang: 'punch', hits: 'punch', hitting: 'punch',
  boomy: 'low end', woofy: 'low end', boom: 'low end',
  muddy: 'mud', cloudy: 'mud', woolly: 'mud', mushy: 'mud',
  harsh: 'harsh', piercing: 'harsh', brittle: 'harsh', painful: 'harsh', sharp: 'harsh',
  dull: 'dull', muffled: 'dull', dark: 'dull', covered: 'dull',
  thin: 'thin', weak: 'thin', small: 'thin',
  buried: 'masked', lost: 'masked', hidden: 'masked', disappear: 'masked',
  wide: 'wider', width: 'wider', stereo: 'wider',
  loud: 'louder', quiet: 'louder', volume: 'louder',
  sibilance: 'sibilant', ess: 'sibilant', esses: 'sibilant', deess: 'sibilant',
  afrobeat: 'afrobeats', naija: 'afrobeats', amapiano: 'afrobeats',
  trap: 'hiphop', rap: 'hiphop', drill: 'hiphop',
  worship: 'gospel', church: 'gospel', choir: 'choir', praise: 'gospel',
  rnb: 'rnb', 'r&b': 'rnb', soul: 'rnb', highlife: 'highlife'
};

const STOP = new Set(['how', 'do', 'i', 'my', 'the', 'a', 'an', 'to', 'is', 'are', 'it',
  'in', 'on', 'of', 'and', 'why', 'does', 'make', 'get', 'can', 'for', 'with', 'that',
  'sound', 'sounds', 'too', 'so', 'more', 'this']);

const norm = s => s.toLowerCase().replace(/[^a-z0-9& ]+/g, ' ').replace(/\s+/g, ' ').trim();

function tokens(s) {
  const t = [];
  for (const w of norm(s).split(' ')) {
    if (!w || STOP.has(w)) continue;
    t.push(w);
    if (SYN[w] && SYN[w] !== w) t.push(...SYN[w].split(' '));
  }
  return t;
}

let INDEX = null;
function index() {
  if (INDEX) return INDEX;
  INDEX = A().map(e => ({
    e,
    hay: norm([e.q, e.a.join(' '), e.src, e.intent, e.short].join(' ')),
    tok: new Set(tokens([e.q, e.a.join(' '), e.src, e.intent].join(' ')))
  }));
  return INDEX;
}

function search(query, filterSrc, filterGenre) {
  const q = norm(query);
  const qt = tokens(query);
  let rows = index();

  if (filterSrc && filterSrc !== 'all') rows = rows.filter(r => r.e.src === filterSrc);
  if (filterGenre && filterGenre !== 'all')
    rows = rows.filter(r => r.e.g.includes(filterGenre) || r.e.g.includes('all'));

  if (!q) return rows.map(r => r.e);

  const scored = [];
  for (const r of rows) {
    let s = 0;
    if (norm(r.e.q) === q) s += 1000;                                  // exact question
    if (r.e.a.some(x => norm(x) === q)) s += 700;                      // exact alias
    if (r.hay.includes(q)) s += 220;                                   // whole phrase present
    let hit = 0;
    for (const t of qt) if (r.tok.has(t)) hit++;
    if (qt.length) {
      s += (hit / qt.length) * 260;                                    // how much of the query matched
      if (hit === qt.length) s += 140;                                 // all of it
    }
    for (const t of qt) if (!r.tok.has(t) && r.hay.includes(t)) s += 14; // partial, worth little
    if (s > 0) scored.push({ e: r.e, s });
  }
  scored.sort((a, b) => b.s - a.s || a.e.q.length - b.e.q.length);
  return scored.map(x => x.e);
}

/* Never a dead end: if nothing scores, offer the nearest few by source. */
function nearest(query) {
  const qt = tokens(query);
  if (!qt.length) return [];
  return index()
    .map(r => ({ e: r.e, s: qt.filter(t => r.hay.includes(t)).length }))
    .filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 3).map(x => x.e);
}

/* ---------------------------------------------------------- *
 * 2. Visuals
 *
 * Twelve explainers, each drawn from the answer's own `params`
 * so the picture changes when the numbers change. Text is kept
 * out of the SVG: these are drawn with preserveAspectRatio
 * "none", which stretches any text inside them.
 * ---------------------------------------------------------- */

const lg = f => Math.log10(f / 20) / 3;                       // 20 Hz – 20 kHz
const sg = f => Math.log10(f / 20) / Math.log10(50);          // 20 Hz – 1 kHz
const HZ = [[20, '20'], [50, '50'], [100, '100'], [500, '500'], [2000, '2k'], [8000, '8k'], [20000, '20k']]
  .map(([f, l]) => [l, lg(f)]);
const SUB = [[20, '20'], [40, '40'], [60, '60'], [100, '100'], [200, '200'], [500, '500'], [1000, '1k']]
  .map(([f, l]) => [l, sg(f)]);

const grid = ticks => ticks.map(([, f]) =>
  `<line x1="${(f * 100).toFixed(2)}" y1="0" x2="${(f * 100).toFixed(2)}" y2="100"
     stroke="rgba(255,255,255,0.055)" stroke-width="0.25"/>`).join('');

const scaleRow = ticks => `<div class="ask-scale">${ticks.map(([l, f]) =>
  `<span style="left:${(f * 100).toFixed(2)}%;transform:translateX(${f <= 0 ? 0 : f >= 1 ? -100 : -50}%)">${l}</span>`
).join('')}</div>`;

const ms = n => {                                             // "20–30 ms" -> 25
  const m = String(n || '').match(/[\d.]+/g);
  if (!m) return null;
  return m.length > 1 ? (parseFloat(m[0]) + parseFloat(m[1])) / 2 : parseFloat(m[0]);
};

/* Batches have been written over time and spell the filter types differently.
   Normalise here rather than editing 700 entries — and never let an unknown
   type fall through to the bell branch, which turns a -24 dB filter into a
   -24 dB notch. */
function bandType(b) {
  const t = String(b.type || '').toLowerCase().replace(/[^a-z]/g, '');
  if (t === 'hp' || t === 'highpass' || t === 'hpf') return 'hp';
  if (t === 'lp' || t === 'lowpass' || t === 'lpf') return 'lp';
  if (t === 'highshelf' || t === 'hishelf') return 'hshelf';
  if (t === 'lowshelf') return 'lshelf';
  if (t === 'shelf') return b.f >= 1500 ? 'hshelf' : 'lshelf';
  if (t === 'bell' || t === 'peak' || t === 'peaking') return 'bell';
  // untyped: a deep cut with a gentle Q is a filter, anything else is a bell
  if (b.gain !== undefined && b.gain <= -12 && (b.q || 1) <= 1.2) return 'hp';
  return 'bell';
}

/* --- eq-curve: the filter response this answer describes --- */
function vizEq(p) {
  const bands = (p.eq || []).filter(b => b && (b.f || b.f === 0));
  if (!bands.length) return vizLevels(p);

  const resp = f => {
    let g = 0;
    for (const b of bands) {
      const t = bandType(b);
      const depth = Math.min(Math.abs(b.gain === undefined ? 18 : b.gain), 18);
      if (t === 'hp') g -= depth / (1 + Math.pow(f / b.f, 3));
      else if (t === 'lp') g -= depth / (1 + Math.pow(b.f / f, 3));
      else if (t === 'hshelf') g += b.gain / (1 + Math.pow(b.f / f, 2));
      else if (t === 'lshelf') g += b.gain / (1 + Math.pow(f / b.f, 2));
      else g += b.gain * Math.exp(-Math.pow(Math.log2(f / b.f), 2) / (1 / Math.max(b.q || 1, .3)));
    }
    return Math.max(-19, Math.min(19, g));
  };
  const Y = g => 50 - g * 2.4;
  const path = on => {
    let d = '';
    for (let i = 0; i <= 90; i++) {
      const x = i / 90, f = 20 * Math.pow(1000, x);
      d += `${i ? 'L' : 'M'}${(x * 100).toFixed(2)},${Y(on ? resp(f) : 0).toFixed(2)}`;
    }
    return d;
  };
  const handles = bands.map(b => {
    const x = lg(b.f) * 100, y = Y(resp(b.f));
    const t = bandType(b);
    const label = (t === 'hp' || t === 'lp') ? fmtHz(b.f)
      : `${b.gain > 0 ? '+' : '−'}${Math.abs(b.gain).toFixed(1)} dB`;
    return { x, y, label, flip: x > 68 };
  });

  return { svg: `<svg viewBox="0 0 100 100" preserveAspectRatio="none">${grid(HZ)}
      <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.11)" stroke-width="0.25" stroke-dasharray="1.5 1.5"/>
      <path d="${path(true)}L100,100L0,100Z" fill="url(#askFill)" opacity="0.5"/>
      <path d="${path(false)}" stroke="rgba(255,255,255,0.16)" stroke-width="1" fill="none" vector-effect="non-scaling-stroke"/>
      <path d="${path(true)}" stroke="var(--accent)" stroke-width="2" fill="none" vector-effect="non-scaling-stroke">
        <animate attributeName="d" dur="0.9s" values="${path(false)};${path(true)}" fill="freeze"
          calcMode="spline" keySplines=".3 0 .1 1"/></path>
      <defs><linearGradient id="askFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="var(--accent)" stop-opacity="0.26"/>
        <stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs></svg>`,
    marks: handles.map(h =>
      `<div class="ask-handle${h.flip ? ' flip' : ''}" style="left:${h.x.toFixed(2)}%;top:${h.y.toFixed(2)}%">
         <i></i><b>${h.label}</b></div>`).join(''),
    scale: scaleRow(HZ), cap: 'Frequency response' };
}

const fmtHz = f => f >= 1000 ? (f / 1000).toFixed(f % 1000 ? 1 : 0) + ' kHz' : Math.round(f) + ' Hz';

/* --- comp-envelope: gain reduction over one hit --- */
function vizCompEnv(p) {
  const c = p.comp || {};
  const atk = ms(c.attack) || 20, rel = ms(c.release) || 100;
  const gr = ms(c.gr) || 4;
  const t0 = 22, hold = Math.max(28, atk), total = t0 + atk + hold + rel * 1.15 + 28;
  const xs = v => (v / total) * 100;
  const y0 = 26, yG = y0 + Math.min(gr, 12) * 3.6;
  const ae = t0 + atk, rs = ae + hold, re = rs + rel;
  const d = `M0,${y0} L${xs(t0)},${y0} C${xs(t0 + atk * .3)},${y0} ${xs(t0 + atk * .5)},${yG} ${xs(ae)},${yG}` +
            ` L${xs(rs)},${yG} C${xs(rs + rel * .4)},${yG} ${xs(rs + rel * .5)},${y0} ${xs(re)},${y0} L100,${y0}`;

  return { svg: `<svg viewBox="0 0 100 100" preserveAspectRatio="none">
      <line x1="0" y1="${y0}" x2="100" y2="${y0}" stroke="rgba(255,255,255,0.12)" stroke-width="0.25" stroke-dasharray="1.5 1.5"/>
      <rect x="${xs(t0)}" y="4" width="${Math.max(xs(ae) - xs(t0), .8)}" height="88" fill="rgba(231,180,90,0.10)"/>
      <rect x="${xs(rs)}" y="4" width="${xs(re) - xs(rs)}" height="88" fill="rgba(79,213,143,0.08)"/>
      <line x1="${xs(t0)}" y1="4" x2="${xs(t0)}" y2="92" stroke="rgba(255,255,255,0.28)" stroke-width="0.3" stroke-dasharray="2 2"/>
      <path d="${d}" fill="none" stroke="var(--c-cut)" stroke-width="1.8" vector-effect="non-scaling-stroke"
        pathLength="100" stroke-dasharray="100" stroke-dashoffset="100">
        <animate attributeName="stroke-dashoffset" from="100" to="0" dur="1s" fill="freeze"
          calcMode="spline" keySplines=".25 0 .15 1"/></path></svg>`,
    marks: `<div class="ask-mk dim" style="left:2%;top:${y0}%;transform:translateY(-150%)">0 dB</div>
      <div class="ask-mk" style="left:${xs(t0)}%;top:4%;transform:translateX(4px)">HIT</div>
      <div class="ask-mk hold" style="left:${xs(t0 + atk / 2)}%;bottom:4%;transform:translateX(-50%)">ATTACK ${c.attack || '-'}</div>
      <div class="ask-mk boost" style="left:${xs(rs + rel / 2)}%;bottom:4%;transform:translateX(-50%)">RELEASE ${c.release || '-'}</div>
      <div class="ask-mk cut" style="left:${xs(ae + hold / 2)}%;top:${yG}%;transform:translate(-50%,6px)">${c.gr || ''}</div>`,
    scale: '', cap: 'Gain reduction over one hit' };
}

/* --- comp-attack: the same hit, fast attack against slow --- */
function vizCompAttack(p) {
  const c = p.comp || {}, atk = ms(c.attack) || 20;
  const env = (a, col, w, dash) => {
    const t0 = 20, hold = 34, rel = 40, total = 140, xs = v => (v / total) * 100;
    const y0 = 26, yG = 62, ae = t0 + a;
    const d = `M0,${y0} L${xs(t0)},${y0} C${xs(t0 + a * .3)},${y0} ${xs(t0 + a * .5)},${yG} ${xs(ae)},${yG}` +
              ` L${xs(ae + hold)},${yG} C${xs(ae + hold + rel * .5)},${yG} ${xs(ae + hold + rel * .6)},${y0} ${xs(ae + hold + rel)},${y0} L100,${y0}`;
    return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" vector-effect="non-scaling-stroke" ${dash}/>`;
  };
  return { svg: `<svg viewBox="0 0 100 100" preserveAspectRatio="none">
      <line x1="0" y1="26" x2="100" y2="26" stroke="rgba(255,255,255,0.12)" stroke-width="0.25" stroke-dasharray="1.5 1.5"/>
      ${env(2, 'rgba(255,255,255,0.22)', 1.2, 'stroke-dasharray="2 2"')}
      ${env(atk, 'var(--c-cut)', 1.8, 'pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"><animate attributeName="stroke-dashoffset" from="100" to="0" dur="1s" fill="freeze" calcMode="spline" keySplines=".25 0 .15 1"/>')}
      </svg>`,
    marks: `<div class="ask-mk dim" style="left:2%;top:26%;transform:translateY(-150%)">0 dB</div>
      <div class="ask-mk dim" style="right:3%;top:8%">dashed = fast attack</div>
      <div class="ask-mk cut" style="right:3%;top:22%">solid = ${c.attack || 'this setting'}</div>`,
    scale: '', cap: 'Transient survival: this attack against a fast one' };
}

/* --- eq-mask: two sources overlapping, the pocket opening --- */
function vizMask(p) {
  const sub = (p.eq || []).some(b => b.f && b.f < 300);
  const ticks = sub ? SUB : HZ;
  const bump = (cx, w, h, col, op) =>
    `<path d="M${cx - w},90 Q${cx},${90 - h} ${cx + w},90 Z" fill="${col}" opacity="${op}"/>`;
  const a = sub ? 19 : 44, b = sub ? 37 : 64, wA = sub ? 15 : 17, wB = sub ? 19 : 19;
  return { svg: `<svg viewBox="0 0 100 100" preserveAspectRatio="none">${grid(ticks)}
      ${bump(a, wA, 66, 'var(--c-cut)', .3)}${bump(b, wB, 56, 'var(--accent)', .3)}
      <path d="M${(a + wA * .4).toFixed(1)},90 Q${((a + b) / 2).toFixed(1)},46 ${(b - wB * .4).toFixed(1)},90 Z" fill="#fff" opacity=".15">
        <animate attributeName="opacity" values=".24;.04;.24" dur="2.6s" repeatCount="indefinite"/></path></svg>`,
    marks: `<div class="ask-mk cut" style="left:${a}%;top:16%;transform:translateX(-50%)">SOURCE A</div>
      <div class="ask-mk" style="left:${b}%;top:30%;transform:translateX(-50%)">SOURCE B</div>
      <div class="ask-mk dim" style="left:${((a + b) / 2).toFixed(0)}%;bottom:4%;transform:translateX(-50%)">overlap</div>`,
    scale: scaleRow(ticks), cap: 'Where they overlap' };
}

/* --- stereo-field: width, and the mono fold --- */
function vizStereo() {
  const blob = (cx, shift) => `<g>
      <circle cx="${cx}" cy="52" r="11" fill="var(--accent)" opacity=".26"/>
      <circle cx="${cx}" cy="52" r="5" fill="var(--accent)" opacity=".55"/>
      <animateTransform attributeName="transform" type="translate" dur="4.4s" repeatCount="indefinite"
        values="0,0; 0,0; ${shift},0; ${shift},0; 0,0" keyTimes="0;.32;.46;.66;1"
        calcMode="spline" keySplines=".4 0 .2 1;.4 0 .2 1;.4 0 .2 1;.4 0 .2 1"/></g>`;
  return { svg: `<svg viewBox="0 0 100 100" preserveAspectRatio="none">
      <path d="M8,82 A46,34 0 0 1 92,82" stroke="rgba(255,255,255,0.09)" stroke-width="0.4" fill="none"/>
      <line x1="50" y1="10" x2="50" y2="82" stroke="rgba(255,255,255,0.09)" stroke-width="0.25" stroke-dasharray="2 3"/>
      ${blob(24, 26)}${blob(76, -26)}
      <circle cx="50" cy="52" r="5" fill="#ECEEF3" opacity=".9"/></svg>`,
    marks: `<div class="ask-mk dim" style="left:50%;bottom:4%;transform:translateX(-50%)">dry centre</div>`,
    scale: `<div class="ask-scale"><span style="left:0">hard left</span>
      <span style="left:50%;transform:translateX(-50%)">centre</span>
      <span style="left:100%;transform:translateX(-100%)">hard right</span></div>`,
    cap: 'Stereo field, folding to mono' };
}

/* --- reverb-tail: decay and pre-delay against the bar grid --- */
function vizReverb(p) {
  const r = p.reverb || {};
  const decay = ms(r.decay) || 1.6, pre = ms(r.predelay) || 20;
  const totalMs = Math.max(decay * 1000 * 1.25, 600);
  const preX = (pre / totalMs) * 100;
  let d = `M${preX.toFixed(2)},20`;
  for (let i = 1; i <= 60; i++) {
    const x = preX + (100 - preX) * (i / 60);
    const t = ((x - preX) / 100) * totalMs;
    d += `L${x.toFixed(2)},${(20 + 70 * (1 - Math.exp(-3.2 * t / (decay * 1000)))).toFixed(2)}`;
  }
  const bars = [];
  for (let i = 1; i <= 4; i++) {
    const x = (window.__barMs ? (window.__barMs() * i / totalMs) * 100 : i * 25);
    if (x < 100) bars.push(`<line x1="${x.toFixed(2)}" y1="6" x2="${x.toFixed(2)}" y2="94"
      stroke="rgba(255,255,255,0.07)" stroke-width="0.25"/>`);
  }
  return { svg: `<svg viewBox="0 0 100 100" preserveAspectRatio="none">${bars.join('')}
      <rect x="0" y="6" width="${preX.toFixed(2)}" height="88" fill="rgba(69,200,216,0.07)"/>
      <line x1="${preX.toFixed(2)}" y1="6" x2="${preX.toFixed(2)}" y2="94" stroke="var(--accent)" stroke-width="0.4" stroke-dasharray="2 2"/>
      <path d="${d}" fill="none" stroke="var(--accent)" stroke-width="1.8" vector-effect="non-scaling-stroke"
        pathLength="100" stroke-dasharray="100" stroke-dashoffset="100">
        <animate attributeName="stroke-dashoffset" from="100" to="0" dur="1.1s" fill="freeze"/></path></svg>`,
    marks: `<div class="ask-mk" style="left:${preX.toFixed(2)}%;top:6%;transform:translateX(5px)">pre-delay ${r.predelay || pre + ' ms'}</div>
      <div class="ask-mk dim" style="right:3%;top:6%">decay ${r.decay || decay + ' s'}</div>`,
    scale: `<div class="ask-scale"><span style="left:0">hit</span>
      <span style="left:100%;transform:translateX(-100%)">${(totalMs / 1000).toFixed(1)} s</span></div>`,
    cap: 'Pre-delay and decay against the bar' };
}

/* --- sidechain: the duck, in time with the kick --- */
function vizSidechain(p) {
  const gr = ms((p.comp || {}).gr) || 3;
  let d = 'M0,30';
  for (let i = 0; i < 4; i++) {
    const x = i * 25;
    d += ` L${x},30 C${x + 2},30 ${x + 3},${30 + gr * 5} ${x + 6},${30 + gr * 5}` +
         ` C${x + 12},${30 + gr * 5} ${x + 16},30 ${x + 22},30`;
  }
  d += ' L100,30';
  return { svg: `<svg viewBox="0 0 100 100" preserveAspectRatio="none">
      ${[0, 25, 50, 75].map(x => `<line x1="${x}" y1="6" x2="${x}" y2="94" stroke="rgba(255,255,255,0.09)" stroke-width="0.3" stroke-dasharray="2 2"/>`).join('')}
      <line x1="0" y1="30" x2="100" y2="30" stroke="rgba(255,255,255,0.12)" stroke-width="0.25" stroke-dasharray="1.5 1.5"/>
      <path d="${d}" fill="none" stroke="var(--c-cut)" stroke-width="1.8" vector-effect="non-scaling-stroke"
        pathLength="100" stroke-dasharray="100" stroke-dashoffset="100">
        <animate attributeName="stroke-dashoffset" from="100" to="0" dur="1.2s" fill="freeze"/></path></svg>`,
    marks: `<div class="ask-mk dim" style="left:2%;top:30%;transform:translateY(-150%)">0 dB</div>
      <div class="ask-mk cut" style="left:50%;top:${30 + gr * 5}%;transform:translate(-50%,6px)">${(p.comp || {}).gr || gr + ' dB'} duck</div>`,
    scale: `<div class="ask-scale">${[1, 2, 3, 4].map(i =>
      `<span style="left:${(i - 1) * 25}%">beat ${i}</span>`).join('')}</div>`,
    cap: 'Ducking against the kick' };
}

/* --- layering: parts arriving one by one and spreading --- */
function vizLayering() {
  const rows = [[50, 0, 'var(--accent)'], [30, .18, 'rgba(255,255,255,.5)'], [70, .3, 'rgba(255,255,255,.5)'],
                [18, .45, 'rgba(255,255,255,.3)'], [82, .57, 'rgba(255,255,255,.3)']];
  return { svg: `<svg viewBox="0 0 100 100" preserveAspectRatio="none">
      <line x1="50" y1="8" x2="50" y2="92" stroke="rgba(255,255,255,0.08)" stroke-width="0.25" stroke-dasharray="2 3"/>
      ${rows.map(([x, d, c], i) => `<g opacity="0">
        <rect x="${x - 7}" y="${16 + i * 15}" width="14" height="8" rx="3" fill="${c}"/>
        <animate attributeName="opacity" from="0" to="1" dur=".4s" begin="${d}s" fill="freeze"/></g>`).join('')}</svg>`,
    marks: `<div class="ask-mk dim" style="left:50%;top:4%;transform:translateX(-50%)">lead, centre and dry</div>
      <div class="ask-mk dim" style="left:50%;bottom:4%;transform:translateX(-50%)">layers arrive and spread</div>`,
    scale: '', cap: 'Layers, in order' };
}

/* --- chain-flow: plugin order, with a pulse travelling it --- */
function vizChain() {
  const n = 4, w = 17, gap = (100 - n * w) / (n + 1);
  const boxes = Array.from({ length: n }, (_, i) => {
    const x = gap + i * (w + gap);
    return `<rect x="${x}" y="38" width="${w}" height="24" rx="4" fill="rgba(255,255,255,0.05)"
      stroke="rgba(255,255,255,0.14)" stroke-width="0.3"/>`;
  }).join('');
  return { svg: `<svg viewBox="0 0 100 100" preserveAspectRatio="none">
      <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.12)" stroke-width="0.3"/>
      ${boxes}
      <circle r="2.4" fill="var(--accent)">
        <animate attributeName="cx" from="0" to="100" dur="2.6s" repeatCount="indefinite"/>
        <animate attributeName="cy" values="50;50" dur="2.6s" repeatCount="indefinite"/></circle></svg>`,
    marks: `<div class="ask-mk dim" style="left:2%;top:4%">in</div>
      <div class="ask-mk dim" style="right:3%;top:4%">out</div>
      <div class="ask-mk dim" style="left:50%;bottom:4%;transform:translateX(-50%)">order matters more than settings</div>`,
    scale: '', cap: 'Signal path' };
}

/* --- automation: a ride drawing itself over the section --- */
function vizAutomation() {
  const d = 'M0,62 L18,62 C26,62 28,44 38,44 L54,44 C62,44 64,28 74,28 L100,28';
  return { svg: `<svg viewBox="0 0 100 100" preserveAspectRatio="none">
      ${[25, 50, 75].map(x => `<line x1="${x}" y1="6" x2="${x}" y2="94" stroke="rgba(255,255,255,0.07)" stroke-width="0.25"/>`).join('')}
      <path d="${d}L100,100L0,100Z" fill="url(#askFill2)" opacity=".4"/>
      <path d="${d}" fill="none" stroke="var(--accent)" stroke-width="1.8" vector-effect="non-scaling-stroke"
        pathLength="100" stroke-dasharray="100" stroke-dashoffset="100">
        <animate attributeName="stroke-dashoffset" from="100" to="0" dur="1.3s" fill="freeze"
          calcMode="spline" keySplines=".25 0 .15 1"/></path>
      <defs><linearGradient id="askFill2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="var(--accent)" stop-opacity="0.2"/>
        <stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs></svg>`,
    marks: `<div class="ask-mk dim" style="left:2%;bottom:4%">verse</div>
      <div class="ask-mk dim" style="left:50%;bottom:4%;transform:translateX(-50%)">build</div>
      <div class="ask-mk dim" style="right:3%;bottom:4%">chorus</div>`,
    scale: '', cap: 'The ride, across the section' };
}

/* --- levels: bars settling into a target balance --- */
function vizLevels() {
  const bars = [62, 44, 78, 52, 70, 36];
  const w = 9, gap = (100 - bars.length * w) / (bars.length + 1);
  return { svg: `<svg viewBox="0 0 100 100" preserveAspectRatio="none">
      <line x1="0" y1="24" x2="100" y2="24" stroke="rgba(255,255,255,0.12)" stroke-width="0.25" stroke-dasharray="1.5 1.5"/>
      ${bars.map((h, i) => {
        const x = gap + i * (w + gap);
        return `<rect x="${x}" y="${92 - h}" width="${w}" height="${h}" rx="2" fill="var(--accent)" opacity="${.3 + i * .07}">
          <animate attributeName="height" from="0" to="${h}" dur=".7s" begin="${i * .07}s" fill="freeze"
            calcMode="spline" keySplines=".3 0 .1 1"/>
          <animate attributeName="y" from="92" to="${92 - h}" dur=".7s" begin="${i * .07}s" fill="freeze"
            calcMode="spline" keySplines=".3 0 .1 1"/></rect>`;
      }).join('')}</svg>`,
    marks: `<div class="ask-mk dim" style="left:2%;top:24%;transform:translateY(-150%)">headroom</div>`,
    scale: '', cap: 'Relative balance' };
}

/* --- delay-grid: repeats landing on the project tempo --- */
function vizDelayGrid() {
  const beat = window.__beatMs ? window.__beatMs() : 500;
  const span = beat * 4;
  const taps = [0, .5, 1, 1.5, 2, 2.5, 3].map(b => b * beat).filter(t => t < span);
  return { svg: `<svg viewBox="0 0 100 100" preserveAspectRatio="none">
      ${[0, 1, 2, 3].map(i => `<line x1="${i * 25}" y1="6" x2="${i * 25}" y2="94"
        stroke="rgba(255,255,255,0.09)" stroke-width="0.3" stroke-dasharray="2 2"/>`).join('')}
      <line x1="0" y1="86" x2="100" y2="86" stroke="rgba(255,255,255,0.12)" stroke-width="0.3"/>
      ${taps.map((t, i) => {
        const x = (t / span) * 100, h = 60 * Math.pow(0.68, i);
        return `<rect x="${x.toFixed(2)}" y="${(86 - h).toFixed(2)}" width="1.6" height="${h.toFixed(2)}" rx="0.8"
          fill="var(--accent)" opacity="${(1 - i * 0.12).toFixed(2)}">
          <animate attributeName="opacity" from="0" to="${(1 - i * 0.12).toFixed(2)}" dur=".3s" begin="${i * .12}s" fill="freeze"/></rect>`;
      }).join('')}</svg>`,
    marks: `<div class="ask-mk dim" style="left:2%;top:4%">repeats on the grid</div>`,
    scale: `<div class="ask-scale">${[1, 2, 3, 4].map(i =>
      `<span style="left:${(i - 1) * 25}%">beat ${i}</span>`).join('')}</div>`,
    cap: 'Repeats against the project tempo' };
}

const VIZ = {
  'eq-curve': vizEq, 'eq-mask': vizMask, 'comp-envelope': vizCompEnv, 'comp-attack': vizCompAttack,
  'reverb-tail': vizReverb, 'delay-grid': vizDelayGrid, 'stereo-field': vizStereo,
  'sidechain': vizSidechain, 'layering': vizLayering, 'chain-flow': vizChain,
  'levels': vizLevels, 'automation': vizAutomation
};

function drawViz(entry) {
  const fn = VIZ[entry.viz] || vizEq;
  let v;
  try { v = fn(entry.params || {}); } catch (e) { v = vizLevels(); }
  if (!v || !v.svg) v = vizLevels();
  return v;
}

/* ---------------------------------------------------------- *
 * 3. Voice — the OS speaks, so nothing ships as audio
 * ---------------------------------------------------------- */

/* Read-aloud is finished and works, but it speaks in whatever voice the OS
   provides - Microsoft David on Windows, which sounds like a 2009 screen
   reader and wrong in a paid studio tool. Shipping it that way sets the wrong
   expectation for the feature we actually intend: Nene's own cloned voice,
   rendered offline. Hidden for this release, not removed. Flip to true when
   the rendered audio ships; everything below it already works. */
const VOICE_ENABLED = false;

const speech = window.speechSynthesis || null;
let speaking = false;

function speak(entry, onState) {
  if (!speech) return;
  if (speaking) { speech.cancel(); speaking = false; onState(false); return; }
  speech.cancel();
  const lines = [entry.short, ...entry.steps, entry.watch ? 'Watch out. ' + entry.watch : ''].filter(Boolean);
  lines.forEach((line, i) => {
    const u = new SpeechSynthesisUtterance(line);
    u.rate = 0.98; u.pitch = 1;
    if (i === lines.length - 1) u.onend = () => { speaking = false; onState(false); };
    speech.speak(u);
  });
  speaking = true; onState(true);
}

/* ---------------------------------------------------------- *
 * 4. Render
 * ---------------------------------------------------------- */

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const SRC_LABEL = {
  kick: 'Kick', snare: 'Snare', hats: 'Hats', toms: 'Toms', overheads: 'Overheads',
  room: 'Room mics', drumbus: 'Drum bus', percussion: 'Percussion', '808': '808',
  bass: 'Bass', synthbass: 'Synth bass', leadvocal: 'Lead vocal', double: 'Doubles',
  harmony: 'Harmony', choir: 'Choir', rapvocal: 'Rap vocal', adlib: 'Ad-libs',
  eguitar: 'Distorted guitar', 'eguitar-clean': 'Clean guitar', aguitar: 'Acoustic',
  piano: 'Piano', organ: 'Organ', rhodes: 'Rhodes', synthlead: 'Synth lead', pad: 'Pad',
  strings: 'Strings', horns: 'Horns', mixbus: 'Mix bus', concept: 'Concepts',
  talkbox: 'Talkbox', sax: 'Saxophone', congas: 'Congas', talkingdrum: 'Talking drum',
  logdrum: 'Log drum', flute: 'Flute', vocalchop: 'Vocal chops', fx: 'FX & transitions'
};

const GENRE_LABEL = {
  all: 'All genres', gospel: 'Gospel', 'gospel-trad': 'Gospel · Traditional',
  'gospel-contemporary': 'Gospel · Contemporary', 'gospel-worship': 'Praise & Worship',
  'gospel-african': 'African Gospel', 'gospel-trap': 'Gospel Trap', 'gospel-urban': 'Urban Gospel',
  afrobeats: 'Afrobeats', hiphop: 'Hip-hop & Trap', rnb: 'R&B', highlife: 'Highlife'
};

const S = window.state;                               // shared app state

function listRow(e, sel) {
  return `<button class="ask-row${sel ? ' sel' : ''}" data-ask="${e.id}">
    <span class="ask-rt"><b>${esc(e.q)}</b><small>${SRC_LABEL[e.src] || e.src}${
      e.g[0] && e.g[0] !== 'all' ? ' · ' + (GENRE_LABEL[e.g[0]] || e.g[0]) : ''}</small></span>
    <svg class="ask-arw" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round"><path d="m9 6 6 6-6 6"/></svg></button>`;
}

/* "1/8 dotted" -> {div:'1/8', kind:'dotted'}. "1/8 and 1/4" takes the first of
   the two. A plain millisecond figure has no note value, so it gets no link —
   the calculator would have nothing to point at. */
function delayDivision(time) {
  const m = /1\/(2|4|8|16|32|64)\b/.exec(String(time || ''));
  if (!m) return null;
  const rest = String(time).slice(m.index + m[0].length);
  const kind = /dotted/i.test(rest) ? 'dotted' : /triplet/i.test(rest) ? 'triplet' : 'straight';
  return { div: `1/${m[1]}`, kind };
}

/* The reverb page is organised by style. An answer names one, or names a decay
   that only one style is built around. */
const RV_STYLE = { ambience: 'ambience', room: 'room', chamber: 'chamber',
                   plate: 'plate', hall: 'hall', cathedral: 'epic', epic: 'epic' };

function reverbStyle(rv) {
  const named = /^[a-z]+/.exec(String(rv.type || '').toLowerCase());
  if (named && RV_STYLE[named[0]]) return RV_STYLE[named[0]];
  const s = parseFloat(rv.decay);
  if (!isFinite(s)) return null;
  return s <= 0.4 ? 'ambience' : s <= 1.0 ? 'room' : s <= 1.6 ? 'chamber'
       : s <= 2.6 ? 'hall' : 'epic';
}

const RV_LABEL = { ambience: 'Tight Ambience', room: 'Small Room', chamber: 'Chamber',
                   plate: 'Plate', hall: 'Concert Hall', epic: 'Cathedral' };

function deepLinks(p) {
  const out = [];
  const d = p.delay && delayDivision(p.delay.time);
  if (d) out.push(`<button class="ask-jump" data-delay="${d.div} ${d.kind}">
      <u>Delay Calculator</u><b>${d.div} ${d.kind} at your tempo</b></button>`);
  const r = p.reverb && reverbStyle(p.reverb);
  if (r) out.push(`<button class="ask-jump" data-reverb="${r}">
      <u>Reverb Designer</u><b>${RV_LABEL[r]}, full settings</b></button>`);
  return out.length ? `<div class="ask-jumps">${out.join('')}</div>` : '';
}

function answerHtml(e) {
  const v = drawViz(e);
  const chips = [];
  const p = e.params || {};
  if (p.comp) for (const [k, val] of Object.entries(p.comp)) chips.push([k, val]);
  for (const b of p.eq || []) {
    const t = bandType(b);
    const name = { hp: 'High-pass', lp: 'Low-pass', hshelf: 'High shelf', lshelf: 'Low shelf' }[t] || 'Bell';
    chips.push([name, (t === 'hp' || t === 'lp') ? fmtHz(b.f)
      : `${b.gain > 0 ? '+' : '−'}${Math.abs(b.gain)} dB @ ${fmtHz(b.f)}`]);
  }
  if (p.reverb) for (const [k, val] of Object.entries(p.reverb)) chips.push([k, val]);
  if (p.delay) for (const [k, val] of Object.entries(p.delay)) chips.push([k, val]);

  const notes = e.notes ? Object.entries(e.notes) : [];

  return `
    <p class="ask-q">${esc(e.q)}</p>
    <h2 class="ask-short">${esc(e.short)}</h2>

    <div class="ask-viz">
      <div class="ask-viz-top"><b>${v.cap}</b><button class="ask-replay">Replay</button></div>
      <div class="ask-canvas">${v.svg}<div class="ask-marks">${v.marks || ''}</div></div>
      ${v.scale || '<div class="ask-scale"></div>'}
    </div>

    ${VOICE_ENABLED ? `<div class="ask-voice${speaking ? ' on' : ''}">
      <button class="ask-play" aria-label="Read this answer aloud">${speaking
        ? '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.2v13.6L19 12 8 5.2Z"/></svg>'}</button>
      <span class="ask-wave">${Array.from({ length: 22 }, (_, i) => `<i style="--i:${i % 7}"></i>`).join('')}</span>
      <small>${speech ? (speaking ? 'reading' : 'read aloud') : 'no voice on this device'}</small>
    </div>` : ''}

    <ol class="ask-steps">${e.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>

    ${chips.length ? `<div class="ask-params">${chips.map(([k, val]) =>
      `<button class="ask-param" data-copy="${esc(val)}"><u>${esc(k)}</u><b>${esc(val)}</b></button>`).join('')}</div>` : ''}

    ${deepLinks(p)}

    <div class="ask-prose"><h4>Why</h4><p>${esc(e.why)}</p></div>
    ${e.watch ? `<div class="ask-watch"><p><b>Watch:</b> ${esc(e.watch)}</p></div>` : ''}

    ${notes.length ? `<div class="ask-prose"><h4>By genre</h4>${notes.map(([g, t]) =>
      `<p class="ask-gn"><b>${GENRE_LABEL[g] || g}</b> ${esc(t)}</p>`).join('')}</div>` : ''}

    ${e.rel.length ? `<div class="ask-prose"><h4>Related</h4><div class="ask-rel">${
      e.rel.map(id => A().find(x => x.id === id)).filter(Boolean)
        .map(r => `<button class="ask-relbtn" data-ask="${r.id}">${esc(r.q)}</button>`).join('')
    }</div></div>` : ''}`;
}

function sourcesWithCounts() {
  const c = {};
  for (const e of A()) c[e.src] = (c[e.src] || 0) + 1;
  return Object.entries(c).sort((a, b) => b[1] - a[1]);
}

window.renderAsk = function renderAsk() {
  const total = A().length;
  if (!total) {
    document.getElementById('page-ask').innerHTML =
      `<div class="page-head"><h1 class="page-title">Ask</h1>
       <p class="page-desc">The answer library did not load. Run <code>npm run answers</code> and reopen the app.</p></div>`;
    return;
  }

  let rows = search(S.askQuery, S.askSource, S.askGenre);
  const fellBack = !rows.length && S.askQuery.trim();
  if (fellBack) rows = nearest(S.askQuery);

  if (rows.length && !rows.some(r => r.id === S.askId)) S.askId = rows[0].id;
  const current = A().find(e => e.id === S.askId) || rows[0];

  const srcChips = [['all', 'All', total], ...sourcesWithCounts().map(([k, n]) => [k, SRC_LABEL[k] || k, n])];
  const genreChips = [['all', 'All genres'], ['gospel-trad', 'Trad'], ['gospel-contemporary', 'Contemp'],
    ['gospel-worship', 'Worship'], ['gospel-african', 'African'], ['gospel-trap', 'G-Trap'],
    ['gospel-urban', 'Urban'], ['afrobeats', 'Afrobeats'], ['hiphop', 'Hip-hop'], ['rnb', 'R&B'], ['highlife', 'Highlife']];

  document.getElementById('page-ask').innerHTML = `
    <div class="ask-wrap${S.askOpen ? ' open' : ''}">

      <div class="ask-list">
        <div class="ask-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.4-3.4"/></svg>
          <input id="askInput" value="${esc(S.askQuery)}" autocomplete="off" spellcheck="false"
            maxlength="120" placeholder="Say it the way it sounds in your head" />
          ${S.askQuery ? '<button class="ask-clear" id="askClear" aria-label="Clear">&times;</button>' : ''}
        </div>

        <div class="ask-filters">
          <select id="askSrc" class="ask-select" aria-label="Filter by source">
            ${srcChips.map(([k, l, n]) =>
              `<option value="${k}"${S.askSource === k ? ' selected' : ''}>${l} (${n})</option>`).join('')}
          </select>
          <div class="ask-chips wrap">${genreChips.map(([k, l]) =>
            `<button class="ask-chip${S.askGenre === k ? ' on' : ''}" data-genre="${k}">${l}</button>`).join('')}</div>
        </div>

        <div class="ask-count">
          <span>${S.askQuery.trim() ? (fellBack ? 'Closest matches' : 'Results') : 'All answers'}</span>
          <em>${rows.length}</em>
        </div>

        <div class="ask-scroll">${
          rows.length
            ? rows.slice(0, 300).map(e => listRow(e, e.id === S.askId)).join('')
            : `<div class="ask-empty">
                 <div class="ask-ring"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.4-3.4"/></svg></div>
                 <b>No exact match</b>
                 <p>Nothing worded quite like that yet. Try the source it affects, or clear the filters.</p>
                 <button class="ask-chip" data-src="all">Show all ${total}</button>
               </div>`}</div>
      </div>

      <div class="ask-answer">
        <button class="ask-back" id="askBack">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="m15 6-6 6 6 6"/></svg>All questions</button>
        <div class="ask-pane">${current ? answerHtml(current) : ''}</div>
      </div>
    </div>`;
};

/* ---------------------------------------------------------- *
 * 5. Events — one delegated listener on the page
 * ---------------------------------------------------------- */

document.addEventListener('input', e => {
  if (e.target.id !== 'askInput') return;
  S.askQuery = e.target.value;
  window.renderAsk();
  const el = document.getElementById('askInput');
  if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
});

/* The source filter is a select now that there are 37 of them. */
document.addEventListener('change', e => {
  if (e.target.id !== 'askSrc') return;
  S.askSource = e.target.value;
  window.renderAsk();
});

document.addEventListener('click', e => {
  const page = document.getElementById('page-ask');
  if (!page || !page.contains(e.target)) return;

  const row = e.target.closest('[data-ask]');
  if (row) {
    S.askId = row.dataset.ask;
    S.askOpen = true;
    if (speech) { speech.cancel(); speaking = false; }
    window.renderAsk();
    // start the answer at its own top; scrollIntoView would fight the slide
    const col = document.querySelector('.ask-answer');
    if (col) col.scrollTop = 0;
    const content = document.querySelector('.content');
    if (content) content.scrollTop = 0;
    return;
  }

  const src = e.target.closest('[data-src]');
  if (src) { S.askSource = src.dataset.src; window.renderAsk(); return; }

  const gen = e.target.closest('[data-genre]');
  if (gen) { S.askGenre = gen.dataset.genre; window.renderAsk(); return; }

  if (e.target.closest('#askClear')) { S.askQuery = ''; window.renderAsk(); return; }
  if (e.target.closest('#askBack')) { S.askOpen = false; window.renderAsk(); return; }

  if (e.target.closest('.ask-replay')) {
    const cur = A().find(x => x.id === S.askId);
    if (!cur) return;
    const v = drawViz(cur);
    const c = document.querySelector('.ask-canvas');
    if (c) c.innerHTML = v.svg + `<div class="ask-marks">${v.marks || ''}</div>`;
    return;
  }

  if (e.target.closest('.ask-play')) {
    const cur = A().find(x => x.id === S.askId);
    if (cur) speak(cur, () => window.renderAsk());
    return;
  }

  const jump = e.target.closest('.ask-jump');
  if (jump) {
    if (jump.dataset.delay && window.openDelayAt) {
      const [div, kind] = jump.dataset.delay.split(' ');
      window.openDelayAt(div, kind);
    } else if (jump.dataset.reverb && window.openReverbAs) {
      window.openReverbAs(jump.dataset.reverb);
    }
    return;
  }

  const param = e.target.closest('.ask-param');
  if (param && window.copyText) window.copyText(param.dataset.copy);
});

/* Typing anywhere on the Ask page jumps to the search field. */
document.addEventListener('keydown', e => {
  if (S.page !== 'ask') return;
  if (e.key === 'Escape' && S.askOpen) { S.askOpen = false; return window.renderAsk(); }
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const el = document.getElementById('askInput');
  if (!el || document.activeElement === el) return;
  if (e.key.length === 1 && /\S/.test(e.key)) { el.focus(); }
});

/* Stop the voice when the user navigates away. */
window.askStopVoice = () => { if (speech) { speech.cancel(); speaking = false; } };

/* app.js runs showPage() as it loads, before this file exists, so if Ask is the
   landing page its first render has already been missed. Draw it now. */
if (S && S.page === 'ask') window.renderAsk();

})();

// Builds delay-time-calculator.html for amanorsac.studio, reusing the site's
// own <style> block, font preloads and footer so it matches every other page.
const fs = require('fs');
const path = require('path');

const parts = JSON.parse(fs.readFileSync(path.join(__dirname, '_parts.json'), 'utf8'));

const CANON = 'https://amanorsac.studio/delay-time-calculator';

const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'Delay Time Calculator',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript',
      url: CANON,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      publisher: { '@type': 'Organization', name: 'Amanorsac Studio', url: 'https://amanorsac.studio/' }
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        ['How do you calculate delay time from BPM?', 'Divide 60,000 by the tempo to get one quarter note in milliseconds. At 120 BPM that is 500 ms. Halve it for an eighth note, multiply by 1.5 for a dotted value and by 2/3 for a triplet.'],
        ['What delay time should I use at 140 BPM?', 'At 140 BPM a quarter note is 428.6 ms, an eighth note is 214.3 ms, a dotted eighth is 321.4 ms and a sixteenth is 107.1 ms.'],
        ['What is a dotted eighth delay used for?', 'A dotted eighth delay lands between the eighth notes, creating the galloping rhythmic echo used on guitars and synths. At 120 BPM it is 375 ms.'],
        ['What is a good reverb pre-delay?', '20 to 40 ms keeps the source clear of its tail. Syncing pre-delay to a 1/64 or 1/32 note of the tempo lets the reverb breathe with the track instead of smearing it.'],
        ['Is this delay calculator free?', 'Yes. The calculator is free to use in the browser, and PulseRoom, the free desktop app, adds tempo detection, EQ and compression references and works fully offline.']
      ].map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }))
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Amanorsac Studio', item: 'https://amanorsac.studio/' },
        { '@type': 'ListItem', position: 2, name: 'PulseRoom', item: 'https://amanorsac.studio/pulseroom' },
        { '@type': 'ListItem', position: 3, name: 'Delay Time Calculator', item: CANON }
      ]
    }
  ]
};

// static chart rows (indexable text — the long-tail SEO engine)
const TEMPOS = [70, 80, 85, 90, 95, 100, 110, 120, 124, 128, 130, 140, 150, 160, 174, 175];
const rows = TEMPOS.map(b => {
  const q = 60000 / b;
  const f = n => (n >= 1000 ? n.toFixed(0) : n.toFixed(1));
  return `<tr><th scope="row">${b} BPM</th><td>${f(q)}</td><td>${f(q / 2)}</td><td>${f(q * 0.75)}</td><td>${f(q / 4)}</td><td>${f(q * 2 / 3)}</td></tr>`;
}).join('\n        ');

const page = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Delay Time Calculator — BPM to ms, Dotted &amp; Triplet | Amanorsac Studio</title>
<meta name="description" content="Free delay time calculator. Enter your BPM for quarter, eighth, dotted and triplet delay times in milliseconds, plus reverb pre-delay and decay. Includes a delay chart for common tempos.">
<link rel="canonical" href="${CANON}">
<meta name="theme-color" content="#0c0e12">
<meta property="og:type" content="website">
<meta property="og:title" content="Delay Time Calculator — BPM to milliseconds">
<meta property="og:description" content="Enter your tempo and get every delay time in milliseconds: straight, dotted and triplet, plus reverb pre-delay and decay.">
<meta property="og:url" content="${CANON}">
<meta property="og:image" content="https://amanorsac.studio/images/apps/pulseroom-hero.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Delay Time Calculator — BPM to milliseconds">
<meta name="twitter:description" content="Free BPM to ms delay calculator with dotted and triplet values, reverb pre-delay and a delay chart for common tempos.">
${parts.headLinks}
<script type="application/ld+json">
${JSON.stringify(schema)}
</script>
${parts.style}
<style>
/* ---------- calculator (page-specific) ---------- */
.calc{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:22px;margin-top:22px}
.calc-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.calc-row label{font-weight:600}
.calc input[type=number]{width:118px;height:50px;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.18);
  border-radius:10px;color:#3fd3e4;font-family:ui-monospace,"Cascadia Code","SF Mono",Consolas,monospace;
  font-size:24px;font-weight:600;text-align:center;outline:none}
.calc input[type=number]:focus{border-color:#3fd3e4}
.preset{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.16);color:inherit;border-radius:999px;
  padding:8px 14px;font:inherit;font-size:14px;cursor:pointer}
.preset:hover{border-color:#3fd3e4;color:#3fd3e4}
.out{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:10px;margin-top:18px}
.out .cell{background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.10);border-radius:10px;padding:12px 14px}
.out .cell .k{font-size:12px;opacity:.6;font-weight:700;letter-spacing:.04em}
.out .cell .v{font-family:ui-monospace,"Cascadia Code","SF Mono",Consolas,monospace;font-size:20px;font-weight:650;color:#3fd3e4;margin-top:2px}
.out .cell .x{font-family:ui-monospace,monospace;font-size:11.5px;opacity:.5}
.out .cell.dot .v{color:#f2b13c}.out .cell.tri .v{color:#a48bfa}.out .cell.rv .v{color:#a48bfa}
.calc h3{margin:22px 0 0}
.chart{width:100%;border-collapse:collapse;margin-top:16px;font-size:15px}
.chart th,.chart td{padding:9px 10px;border-bottom:1px solid rgba(255,255,255,.09);text-align:right}
.chart th[scope=row]{text-align:left;font-weight:600}
.chart thead th{text-align:right;font-size:12.5px;letter-spacing:.05em;text-transform:uppercase;opacity:.6}
.faq details{border-bottom:1px solid rgba(255,255,255,.09);padding:14px 0}
.faq summary{cursor:pointer;font-weight:650}
@media(max-width:700px){.out{grid-template-columns:repeat(2,1fr)}.chart{font-size:13.5px}.chart th,.chart td{padding:7px 6px}}
</style>
</head>
<body data-app="pulseroom">

<p class="top"><a class="back" href="pulseroom.html">&larr; PulseRoom</a> <span class="name">Delay Time Calculator</span></p>

<header class="hero wrap">
  <span class="status">Free &middot; No sign-up &middot; Works in your browser</span>
  <h1>Delay time calculator.</h1>
  <p class="sub">Enter your tempo and get every delay time in milliseconds — straight, dotted and triplet — plus the reverb pre-delay and decay that fit the same song. The Hz figure doubles as a tempo-synced LFO rate for tremolo, auto-pan and sidechain shaping.</p>

  <div class="calc">
    <div class="calc-row">
      <label for="bpm">Tempo</label>
      <input type="number" id="bpm" value="120" min="20" max="300" step="0.1" inputmode="decimal" aria-label="Tempo in BPM">
      <span>BPM</span>
      <button class="preset" type="button" data-bpm="90">90</button>
      <button class="preset" type="button" data-bpm="100">100</button>
      <button class="preset" type="button" data-bpm="120">120</button>
      <button class="preset" type="button" data-bpm="128">128</button>
      <button class="preset" type="button" data-bpm="140">140</button>
      <button class="preset" type="button" data-bpm="174">174</button>
    </div>
    <div class="out" id="delayOut"></div>
    <h3>Reverb pre-delay &amp; decay at this tempo</h3>
    <div class="out" id="reverbOut"></div>
  </div>
  <p class="fine">One quarter note = 60000 &divide; BPM milliseconds. Dotted &times;1.5, triplet &times;&#8532;.</p>
</header>

<section class="wrap">
  <h2>Delay chart for common tempos</h2>
  <p class="lede">The values producers reach for most, in milliseconds. Dotted eighth is the rhythmic one — it lands between the eighths and gives that galloping echo on guitars and synths.</p>
  <div class="tablewrap">
    <table class="chart">
      <thead><tr><th scope="col">Tempo</th><th scope="col">1/4</th><th scope="col">1/8</th><th scope="col">1/8 dotted</th><th scope="col">1/16</th><th scope="col">1/4 triplet</th></tr></thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </div>
</section>

<section class="wrap">
  <h2>Which delay time should you use?</h2>
  <div class="trio">
    <div class="step"><h3>1/4 &mdash; the classic echo</h3><p>Wide and obvious. Works on vocals, leads and guitars when you want the repeat to be heard as its own event.</p></div>
    <div class="step"><h3>1/8 dotted &mdash; the rhythmic one</h3><p>Falls between the eighths, filling space without crowding the beat. The sound behind countless guitar and synth hooks.</p></div>
    <div class="step"><h3>1/16 &mdash; the thickener</h3><p>Short enough to read as density rather than echo. Adds size to vocals and snares at low mix levels.</p></div>
  </div>
  <p class="lede">Two timings ignore tempo entirely: <strong>1&ndash;30 ms</strong> on a duplicated, panned track creates the Haas widening effect, and <strong>60&ndash;120 ms</strong> is the slapback zone for vocals and guitars. Keep feedback around 20&ndash;35% for two to four audible repeats, and low-pass the repeats so they sit behind the dry signal.</p>
</section>

<section class="wrap">
  <h2>Everything else at your tempo</h2>
  <p class="lede">The calculator above covers delay and reverb. <a href="pulseroom.html">PulseRoom</a>, the free desktop app, adds the rest of the reference desk: it detects the tempo from any song you drop in, then gives you EQ zones for 13 instruments, compression settings for 14 sources, plugin-order chains and loudness targets &mdash; offline, with no account.</p>
  <div class="cta-row">
    <a class="cta" href="pulseroom.html">See PulseRoom</a>
    <a class="cta ghost" href="apps.html#access">Download free</a>
  </div>
</section>

<section class="wrap faq">
  <h2>Questions, answered.</h2>
  <details open><summary>How do you calculate delay time from BPM?</summary><p>Divide 60,000 by the tempo to get one quarter note in milliseconds. At 120 BPM that is 500 ms. Halve it for an eighth note, multiply by 1.5 for a dotted value, and by two thirds for a triplet.</p></details>
  <details><summary>What delay time should I use at 140 BPM?</summary><p>A quarter note is 428.6 ms, an eighth note 214.3 ms, a dotted eighth 321.4 ms and a sixteenth 107.1 ms.</p></details>
  <details><summary>What is a dotted eighth delay used for?</summary><p>It lands between the eighth notes, creating the galloping rhythmic echo heard on guitars and synths. At 120 BPM it is 375 ms.</p></details>
  <details><summary>What is a good reverb pre-delay?</summary><p>Twenty to forty milliseconds keeps the source clear of its tail. Syncing pre-delay to a 1/64 or 1/32 note of the tempo lets the reverb breathe with the track instead of smearing it.</p></details>
  <details><summary>Is this calculator free?</summary><p>Yes, and so is the app. PulseRoom is a free download with no account and no ads, and it works entirely offline.</p></details>
</section>

${parts.footer}

<script>
(function () {
  'use strict';
  var bpm = document.getElementById('bpm'),
      dOut = document.getElementById('delayOut'),
      rOut = document.getElementById('reverbOut');
  var DIVS = [['1/1', 1], ['1/2', 2], ['1/4', 4], ['1/8', 8], ['1/16', 16], ['1/32', 32]];
  function f(n) { return n >= 1000 ? n.toFixed(0) : n.toFixed(1); }
  function cell(cls, k, ms) {
    return '<div class="cell ' + cls + '"><div class="k">' + k + '</div><div class="v">' + f(ms) +
      ' <span style="font-size:12px;opacity:.55">ms</span></div><div class="x">' + (1000 / ms).toFixed(2) + ' Hz</div></div>';
  }
  function render() {
    var v = parseFloat(bpm.value);
    if (!isFinite(v)) v = 120;
    v = Math.min(300, Math.max(20, v));
    var bar = (60000 / v) * 4, d = '', r = '';
    DIVS.forEach(function (x) {
      var base = bar / x[1];
      d += cell('', x[0], base) + cell('dot', x[0] + ' dotted', base * 1.5) + cell('tri', x[0] + ' triplet', base * (2 / 3));
    });
    dOut.innerHTML = d;
    [['Room', 0.5, 128], ['Plate', 1, 64], ['Hall', 2, 64], ['Cathedral', 4, 32]].forEach(function (s) {
      var total = bar * s[1], pre = bar / s[2];
      r += '<div class="cell rv"><div class="k">' + s[0].toUpperCase() + '</div><div class="v">' +
        ((total - pre) / 1000).toFixed(2) + ' <span style="font-size:12px;opacity:.55">s</span></div>' +
        '<div class="x">pre-delay ' + f(pre) + ' ms</div></div>';
    });
    rOut.innerHTML = r;
  }
  bpm.addEventListener('input', render);
  Array.prototype.forEach.call(document.querySelectorAll('[data-bpm]'), function (b) {
    b.addEventListener('click', function () { bpm.value = b.dataset.bpm; render(); });
  });
  render();
})();
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, 'delay-time-calculator.html'), page);
console.log('built delay-time-calculator.html', Math.round(page.length / 1024) + ' KB');

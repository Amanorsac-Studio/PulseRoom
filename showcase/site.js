(function () {
  'use strict';
  var bpmInput = document.getElementById('bpm');
  var delayOut = document.getElementById('delayResults');
  var rvOut = document.getElementById('reverbResults');

  var DIVS = [
    ['1/1', 1], ['1/2', 2], ['1/4', 4], ['1/8', 8], ['1/16', 16], ['1/32', 32]
  ];

  function fmt(n) { return n >= 1000 ? n.toFixed(0) : n.toFixed(1); }

  function render() {
    var bpm = parseFloat(bpmInput.value);
    if (!isFinite(bpm) || bpm < 20) bpm = 20;
    if (bpm > 300) bpm = 300;
    var bar = (60000 / bpm) * 4;

    var html = '';
    DIVS.forEach(function (d) {
      var base = bar / d[1];
      [['', base, ''], [' dotted', base * 1.5, 'dot'], [' triplet', base * (2 / 3), 'tri']]
        .forEach(function (k) {
          var ms = k[1];
          html += '<div class="res ' + k[2] + '"><div class="k">' + d[0] + k[0].toUpperCase() + '</div>' +
            '<div class="v">' + fmt(ms) + ' <span style="font-size:12px;color:var(--text-3)">ms</span></div>' +
            '<div class="hz">' + (1000 / ms).toFixed(2) + ' Hz</div></div>';
        });
    });
    delayOut.innerHTML = html;

    // reverb: pre-delay 1/64, decay = total - pre for common spaces
    var spaces = [['Room', 0.5, 128], ['Plate', 1, 64], ['Hall', 2, 64], ['Cathedral', 4, 32]];
    var rv = '';
    spaces.forEach(function (s) {
      var total = bar * s[1], pre = bar / s[2], decay = total - pre;
      rv += '<div class="res rv"><div class="k">' + s[0].toUpperCase() + '</div>' +
        '<div class="v">' + (decay / 1000).toFixed(2) + ' <span style="font-size:12px;color:var(--text-3)">s decay</span></div>' +
        '<div class="hz">pre-delay ' + fmt(pre) + ' ms</div></div>';
    });
    rvOut.innerHTML = rv;
  }

  bpmInput.addEventListener('input', render);
  Array.prototype.forEach.call(document.querySelectorAll('[data-bpm]'), function (b) {
    b.addEventListener('click', function () { bpmInput.value = b.dataset.bpm; render(); });
  });
  render();
})();

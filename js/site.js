/* MDS request form.
   Preview build: no backend. The form composes an email (mailto:) to MDS in the visitor's own mail program.
   Production hook: add data-endpoint="https://..." to the <form> (e.g. a Formspree URL) and the same fields
   are POSTed there instead. Nothing is stored by this page; no cookies, no tracking. */
(function (root) {
  'use strict';

  var TO = 'dougashley@monasheedrillingsolutions.com';
  var TYPES = {
    'rental': 'Rental availability and rates',
    'package': 'Equipment information package',
    'uni-line': 'Uni-Line drilling fluids',
    'investor': 'Investor information (accredited investors only)'
  };
  var FIELDS = [
    ['name', 'Name'], ['company', 'Company'], ['email', 'Email'], ['phone', 'Phone'],
    ['region', 'Project region'], ['access', 'Access'], ['core', 'Core size'],
    ['start', 'Program start'], ['rigs', 'Number of rigs']
  ];
  var TRADE = ['region', 'access', 'core', 'start', 'rigs'];

  function clean(v) { return String(v == null ? '' : v).trim(); }

  /* data: plain object { type, name, company, email, phone, region, access, core, start, rigs, notes } */
  function buildMailto(data) {
    var type = TYPES[data.type] ? data.type : 'rental';
    var lines = ['Request: ' + TYPES[type], ''];
    FIELDS.forEach(function (f) {
      if (type === 'investor' && TRADE.indexOf(f[0]) !== -1) return;
      var v = clean(data[f[0]]);
      if (v) lines.push(f[1] + ': ' + v);
    });
    var notes = clean(data.notes);
    if (notes) lines.push('', 'Notes:', notes);
    lines.push('', '(Sent from the request form on the MDS website.)');
    var body = lines.join('\n').replace(/\r\n|\r|\n/g, '\r\n');
    return 'mailto:' + TO +
      '?subject=' + encodeURIComponent('MDS request: ' + TYPES[type]) +
      '&body=' + encodeURIComponent(body);
  }

  var api = { buildMailto: buildMailto, TYPES: TYPES, TO: TO };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.MDSForm = api;

  if (typeof document === 'undefined') return;

  var form = document.getElementById('request-form');
  if (!form) return;
  var status = document.getElementById('form-status');
  var trade = document.getElementById('trade-fields');
  var investorNote = document.getElementById('investor-note');

  var MESSAGES = {
    name: { valueMissing: 'Enter your name.' },
    email: { valueMissing: 'Enter your email address.', typeMismatch: 'Enter an email address like name@company.com.' },
    rigs: { badInput: 'Enter the number of rigs as a whole number.', rangeUnderflow: 'Enter 1 or more.', stepMismatch: 'Enter a whole number.' }
  };

  function selectedType() {
    var r = form.querySelector('input[name="type"]:checked');
    return r ? r.value : 'rental';
  }

  function syncType() {
    var investor = selectedType() === 'investor';
    investorNote.hidden = !investor;
    trade.hidden = investor;
    trade.disabled = investor;   // disabled fields are skipped by validation and by FormData
    if (investor) {
      // hidden trade fields must not keep a stale error from before the switch
      Array.prototype.forEach.call(trade.querySelectorAll('input, select'), function (el) { clearError(el); });
    }
  }

  function clearError(input) {
    var err = document.getElementById('err-' + input.name);
    if (err) err.textContent = '';
    input.removeAttribute('aria-invalid');
  }

  function preselect(type) {
    var r = form.querySelector('input[name="type"][value="' + type + '"]');
    if (r) { r.checked = true; syncType(); }
  }

  form.addEventListener('change', function (e) {
    if (e.target.name === 'type') syncType();
    if (e.target.getAttribute('aria-invalid') === 'true') check(e.target);
  });

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-request]');
    if (a) preselect(a.getAttribute('data-request'));
  });

  // Deep link support: index.html?request=uni-line#requests
  var q = /[?&]request=([a-z-]+)/.exec(window.location.search);
  if (q && TYPES[q[1]]) preselect(q[1]);
  syncType();

  function check(input) {
    var err = document.getElementById('err-' + input.name);
    var v = input.validity;
    var msg = '';
    if (input.required && clean(input.value) === '') {
      // native "required" accepts a value of only spaces; treat it as empty
      msg = (MESSAGES[input.name] || {}).valueMissing || input.validationMessage;
    } else if (!v.valid) {
      var m = MESSAGES[input.name] || {};
      for (var k in m) { if (v[k]) { msg = m[k]; break; } }
      if (!msg) msg = input.validationMessage;
    }
    if (err) err.textContent = msg;
    if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    return !msg;
  }

  form.addEventListener('blur', function (e) {
    if (e.target.getAttribute && e.target.getAttribute('aria-invalid') === 'true') check(e.target);
  }, true);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var inputs = form.querySelectorAll('input[required], input[type="email"], input[type="number"]');
    var firstBad = null;
    Array.prototype.forEach.call(inputs, function (input) {
      // willValidate is false for a field inside a disabled <fieldset>; input.disabled alone misses that
      if (!input.willValidate) { clearError(input); return; }
      if (!check(input) && !firstBad) firstBad = input;
    });
    if (firstBad) {
      status.textContent = 'Check the highlighted fields, then try again.';
      status.classList.add('is-error');
      firstBad.focus();
      return;
    }

    status.classList.remove('is-error');
    var fd = new FormData(form);
    var data = {};
    fd.forEach(function (v, k) { data[k] = v; });
    data.type = selectedType();

    var endpoint = form.getAttribute('data-endpoint');
    if (endpoint) {
      fd.append('request_type', TYPES[data.type]);
      status.textContent = 'Sending your request...';
      fetch(endpoint, { method: 'POST', body: fd, headers: { 'Accept': 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          form.reset(); syncType();
          status.textContent = 'Thank you. Your request has been sent to MDS.';
        })
        .catch(function () {
          status.textContent = 'Your request could not be sent. Please call 250-575-8169 or email ' + TO + '.';
        });
      return;
    }

    var url = buildMailto(data);
    status.textContent = 'Your email program should open with the request filled in. If it does not, ';
    var link = document.createElement('a');
    link.href = url;
    link.id = 'mailto-fallback';
    link.textContent = 'open the email from this link';
    status.appendChild(link);
    status.appendChild(document.createTextNode(' or write to ' + TO + '.'));
    window.location.href = url;
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* Silent loop in "Watch it work": load and play only once it scrolls into view; for visitors who prefer
   reduced motion it never autoplays and shows normal play controls instead. */
(function () {
  'use strict';
  if (typeof document === 'undefined') return;
  var v = document.querySelector('video.vid-loop');
  if (!v) return;
  var src = v.getAttribute('data-src');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    v.src = src; v.controls = true; v.removeAttribute('data-src');
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        if (!v.getAttribute('src')) { v.src = src; }
        var p = v.play(); if (p && p.catch) p.catch(function () { v.controls = true; });
      } else if (v.getAttribute('src')) {
        v.pause();
      }
    });
  }, { rootMargin: '200px 0px' });
  io.observe(v);
})();

/* Savings ticker: plays one simulated week (day 0 to day 7) in a few seconds once it scrolls into view.
   PLACEHOLDER FIGURES - replace with measured MDS data before the site goes live on its own domain. */
(function () {
  'use strict';
  if (typeof document === 'undefined') return;
  var SAVINGS = {
    m3PerHour: 1.5,     // drilling fluid recovered per hour (placeholder)
    costPerM3: 35,      // CAD of mud product per m3 of mixed fluid (placeholder: midpoint of 1.5-3.0 kg/m3 dosing)
    kgPerM3: 2.25,      // mud powder per m3 of fluid (placeholder: midpoint of Doug's 1.5-3.0 kg/m3 dosing)
    kgPerPail: 15,      // Uni-Line pail net weight
    hoursPerDay: 24,    // two 12-hour shifts
    days: 7,
    playSeconds: 12     // how long the simulated week takes on screen
  };
  var root = document.getElementById('savings');
  if (!root) return;
  var $ = function (sel) { return root.querySelector(sel); };
  var clock = $('[data-save-clock]'), bar = $('[data-save-bar]'), fluid = $('[data-save-fluid]'),
      money = $('[data-save-money]'), pails = $('[data-save-pails]'), replay = $('[data-save-replay]'), basis = $('[data-save-basis]'),
      summary = $('[data-save-summary]');
  var totalHours = SAVINGS.days * SAVINGS.hoursPerDay;
  var cad = function (n) { return '$' + Math.round(n).toLocaleString('en-CA'); };
  var num = function (n) { return Math.round(n).toLocaleString('en-CA'); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };

  basis.textContent = 'Example: ' + SAVINGS.m3PerHour + ' m³ of fluid recovered per hour, ' + cad(SAVINGS.costPerM3) +
    ' of mud product per m³, running ' + SAVINGS.hoursPerDay + ' hours a day.';
  var pailsFor = function (hours) { return hours * SAVINGS.m3PerHour * SAVINGS.kgPerM3 / SAVINGS.kgPerPail; };
  summary.textContent = 'Over ' + SAVINGS.days + ' days: about ' + num(totalHours * SAVINGS.m3PerHour) +
    ' cubic metres of drilling fluid recovered, ' + num(pailsFor(totalHours)) + ' pails of mud not flown in, and ' +
    cad(totalHours * SAVINGS.m3PerHour * SAVINGS.costPerM3) + ' in mud cost saved.';

  function render(hours) {
    var mins = Math.floor(hours * 60), d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60;
    clock.textContent = d + 'd ' + pad(h) + 'h ' + pad(m) + 'm';
    bar.style.width = (hours / totalHours * 100).toFixed(2) + '%';
    fluid.textContent = num(hours * SAVINGS.m3PerHour);
    pails.textContent = num(pailsFor(hours));
    money.textContent = cad(hours * SAVINGS.m3PerHour * SAVINGS.costPerM3);
  }

  var raf = null;
  function play() {
    if (raf) cancelAnimationFrame(raf);
    var start = null, dur = SAVINGS.playSeconds * 1000;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      render(p * totalHours);
      raf = p < 1 ? requestAnimationFrame(step) : null;
    }
    raf = requestAnimationFrame(step);
  }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  replay.addEventListener('click', function () { reduce ? render(totalHours) : play(); });
  if (reduce || !('IntersectionObserver' in window)) { render(totalHours); return; }
  render(0);
  var io = new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) { io.disconnect(); play(); }
  }, { threshold: 0.4 });
  io.observe(root);
})();

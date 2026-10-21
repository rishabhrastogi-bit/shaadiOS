(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var io = 'IntersectionObserver' in window;

  // Reveal sections as they scroll in.
  var reveals = document.querySelectorAll('.reveal');
  if (io && !reduce) {
    var ro = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { ro.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  // Animated counters: <span class="count" data-to="1149907" data-format="lakh">.
  function fmt(n, f) {
    if (f === 'lakh') return (n / 100000).toFixed(1).replace(/\.0$/, '');
    if (f === 'in') return Math.round(n).toLocaleString('en-IN');
    return String(Math.round(n));
  }
  function run(el) {
    var to = parseFloat(el.dataset.to), f = el.dataset.format, t0 = null, dur = 1600;
    if (reduce) { el.textContent = fmt(to, f); return; }
    function tick(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(to * e, f);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var counts = document.querySelectorAll('.count');
  if (io) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { run(e.target); co.unobserve(e.target); } });
    }, { threshold: 0.5 });
    counts.forEach(function (el) { co.observe(el); });
  } else counts.forEach(run);

  // Journey line draws when visible.
  var j = document.querySelector('.journey');
  if (j) {
    var go = function () { j.classList.add('go'); j.querySelector('.track').style.setProperty('--p', 1); };
    if (io && !reduce) {
      var jo = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { go(); jo.disconnect(); } }, { threshold: 0.3 });
      jo.observe(j);
    } else go();
  }

  // Pain-point rotator.
  var quote = document.getElementById('pain-quote');
  if (quote) {
    var lines = JSON.parse(quote.dataset.lines), imgs = document.querySelectorAll('.pain .stack img');
    var dots = document.querySelector('.pain .dots'), i = 0, timer;
    lines.forEach(function (_, k) {
      var b = document.createElement('button');
      b.setAttribute('aria-label', 'Show line ' + (k + 1));
      b.addEventListener('click', function () { show(k); restart(); });
      dots.appendChild(b);
    });
    function show(k) {
      i = k;
      quote.classList.add('fade');
      setTimeout(function () { quote.textContent = lines[k]; quote.classList.remove('fade'); }, reduce ? 0 : 350);
      imgs.forEach(function (im, n) { im.classList.toggle('on', n === k % imgs.length); });
      dots.querySelectorAll('button').forEach(function (b, n) { b.classList.toggle('on', n === k); });
    }
    function restart() { clearInterval(timer); if (!reduce) timer = setInterval(function () { show((i + 1) % lines.length); }, 4500); }
    show(0); restart();
  }

  // Chapter tabs.
  document.querySelectorAll('[data-tabs]').forEach(function (root) {
    var btns = root.querySelectorAll('[role=tab]');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.setAttribute('aria-selected', x === b); });
        root.querySelectorAll('.panel').forEach(function (p) { p.classList.toggle('on', p.id === b.getAttribute('aria-controls')); });
      });
    });
  });

  // Mini check-in: scores stay in the browser, nothing is sent.
  var ci = document.getElementById('checkin');
  if (ci) {
    var answers = {};
    ci.querySelectorAll('.opts').forEach(function (g) {
      g.querySelectorAll('button').forEach(function (b) {
        b.addEventListener('click', function () {
          g.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
          b.classList.add('on');
          answers[g.dataset.q] = +b.dataset.v;
          var n = Object.keys(answers).length, total = ci.querySelectorAll('.opts').length;
          if (n === total) {
            var s = 0; for (var k in answers) s += answers[k];
            var avg = s / total, out = ci.querySelector('.result');
            out.innerHTML = avg >= 3.3
              ? '<strong>Sounds like a steady month.</strong> Keep the small rituals going: a date night or a long walk this week keeps it that way.'
              : avg >= 2.3
              ? '<strong>A little wobbly, and that’s normal.</strong> One unhurried 30-minute talk this week, phones away, can reset a lot. ShaadiOS nudges you to have it.'
              : '<strong>This sounds heavy right now.</strong> You don’t have to carry it alone. Talking to a counsellor early, before things escalate, is a sign of strength. ShaadiOS’s concierge can point you to the right help.';
            out.classList.add('on');
          }
        });
      });
    });
  }
})();

/* ══════════════════════════════════════
   SERVICES.JS
   Comportamento da página de serviços e das subpáginas:
   entrada ao rolar, índices de escalonamento, frases que se acendem,
   explorador de tecnologias, seletor de fases do design e seletor
   antes e depois da otimização. O reveal geral, o menu, o FAQ e o
   rodapé continuam em script.js.
══════════════════════════════════════ */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Índice --i nos filhos de listas que entram um a um ── */
  document.querySelectorAll('.inc-list, .inc-apart ul, .tag-row, .cd-list, .ph-steps, .arch, .dp, .os ul').forEach(function (list) {
    var n = 0;
    Array.prototype.forEach.call(list.children, function (c) {
      if (c.classList.contains('arch-rail')) return;
      c.style.setProperty('--i', n++);
    });
  });

  /* ── Frases que se acendem palavra a palavra ── */
  function split(node, counter) {
    Array.prototype.slice.call(node.childNodes).forEach(function (c) {
      if (c.nodeType === 3) {
        var parts = c.nodeValue.split(/(\s+)/);
        var frag = document.createDocumentFragment();
        parts.forEach(function (p) {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
          var s = document.createElement('span');
          s.className = 'u-w';
          s.style.setProperty('--w', counter.n++);
          s.textContent = p;
          frag.appendChild(s);
        });
        c.parentNode.replaceChild(frag, c);
      } else if (c.nodeType === 1) {
        split(c, counter);
      }
    });
  }
  document.querySelectorAll('[data-words]').forEach(function (el) { split(el, { n: 0 }); });

  /* ── Entrada ao rolar: [data-in] recebe .is-in uma vez ── */
  var targets = document.querySelectorAll('[data-in]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (el) { io.observe(el); });
  } else {
    targets.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ── Explorador de tecnologias (separadores) ── */
  document.querySelectorAll('[data-tabs]').forEach(function (root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
    var panels = Array.prototype.slice.call(root.querySelectorAll('[role="tabpanel"]'));
    if (!tabs.length) return;

    function select(i, focus) {
      tabs.forEach(function (t, n) {
        var on = n === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        if (panels[n]) panels[n].hidden = !on;
      });
      if (focus) tabs[i].focus();
    }

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('mouseenter', function () {
        if (window.matchMedia('(hover: hover)').matches) select(i);
      });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = tabs.length;
        if (k === 'ArrowDown' || k === 'ArrowRight') { e.preventDefault(); select((i + 1) % n, true); }
        else if (k === 'ArrowUp' || k === 'ArrowLeft') { e.preventDefault(); select((i - 1 + n) % n, true); }
      });
    });
    select(0);
  });

  /* ── Seletor esboço / wireframe / final (corre uma vez ao entrar) ── */
  document.querySelectorAll('[data-df]').forEach(function (root) {
    var view = root.querySelector('.df-view');
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
    var text = root.querySelector('.df-text');
    var touched = false;
    var timers = [];
    if (!view || !tabs.length) return;

    function select(i, focus) {
      tabs.forEach(function (t, n) {
        var on = n === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
      });
      view.setAttribute('data-step', String(i));
      if (text) text.textContent = tabs[i].getAttribute('data-text') || '';
      if (focus) tabs[i].focus();
    }

    function stop() {
      touched = true;
      timers.forEach(clearTimeout);
      timers = [];
      if (text) text.setAttribute('aria-live', 'polite');
    }

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { stop(); select(i); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = tabs.length;
        if (k === 'ArrowDown' || k === 'ArrowRight') { e.preventDefault(); stop(); select((i + 1) % n, true); }
        else if (k === 'ArrowUp' || k === 'ArrowLeft') { e.preventDefault(); stop(); select((i - 1 + n) % n, true); }
      });
    });
    select(0);

    if (!reduce && 'IntersectionObserver' in window) {
      var seen = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        seen.disconnect();
        if (text) text.setAttribute('aria-live', 'off');
        [[1, 1100], [2, 3400], [3, 5700], [0, 8000]].forEach(function (s) {
          timers.push(setTimeout(function () {
            if (touched) return;
            select(s[0]);
            if (s[0] === 0 && text) text.setAttribute('aria-live', 'polite');
          }, s[1]));
        });
      }, { threshold: 0.5 });
      seen.observe(view);
    }
  });

  /* ── Seletor antes e depois (otimização) ── */
  document.querySelectorAll('[data-ba]').forEach(function (root) {
    var input = root.querySelector('[data-range]');
    var rings = Array.prototype.slice.call(root.querySelectorAll('.ring'));
    var vals = Array.prototype.slice.call(root.querySelectorAll('[data-val]'));
    var C = 276.46;
    var touched = false;
    var raf = 0;
    if (!input) return;

    function level(n) { return n >= 90 ? 'good' : (n >= 50 ? 'mid' : 'bad'); }
    function parse(s) {
      var m = /^([\d.,]+)\s*(.*)$/.exec(s) || [];
      var raw = m[1] || '0';
      var dec = raw.indexOf(',') > -1 ? raw.length - raw.indexOf(',') - 1 : 0;
      return { n: parseFloat(raw.replace(',', '.')), dec: dec, unit: m[2] || '' };
    }

    var parsed = vals.map(function (v) {
      var a = parse(v.getAttribute('data-from'));
      var b = parse(v.getAttribute('data-to'));
      return { a: a, b: b, dec: Math.max(a.dec, b.dec), unit: b.unit || a.unit, lim: parseFloat(v.getAttribute('data-lim')) };
    });

    function setT(t) {
      rings.forEach(function (r) {
        var from = parseFloat(r.getAttribute('data-from'));
        var to = parseFloat(r.getAttribute('data-to'));
        var v = Math.round(from + (to - from) * t);
        r.querySelector('.a').style.strokeDashoffset = (C * (1 - v / 100)).toFixed(2);
        r.querySelector('b').textContent = v;
        r.setAttribute('data-s', level(v));
      });
      vals.forEach(function (el, i) {
        var p = parsed[i];
        var n = p.a.n + (p.b.n - p.a.n) * t;
        el.textContent = n.toFixed(p.dec).replace('.', ',') + (p.unit ? ' ' + p.unit : '');
        if (el.parentNode) el.parentNode.setAttribute('data-s', n <= p.lim ? 'good' : 'bad');
      });
      input.style.setProperty('--p', (t * 100).toFixed(1) + '%');
    }

    function user() {
      touched = true;
      if (raf) cancelAnimationFrame(raf);
      setT(input.value / 100);
    }
    input.addEventListener('input', user);

    function play() {
      var t0 = null;
      function step(ts) {
        if (touched) return;
        if (t0 === null) t0 = ts;
        var p = Math.min(1, (ts - t0) / 2600);
        var e = 1 - Math.pow(1 - p, 3);
        input.value = Math.round(e * 100);
        setT(e);
        if (p < 1) raf = requestAnimationFrame(step);
      }
      raf = requestAnimationFrame(step);
    }

    if (!reduce && 'IntersectionObserver' in window) {
      var seen = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        seen.disconnect();
        setTimeout(function () { if (!touched) play(); }, 1600);
      }, { threshold: 0.5 });
      seen.observe(root);
    }
  });
})();

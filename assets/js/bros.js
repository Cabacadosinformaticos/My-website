/* ══════════════════════════════════════
   BROS.JS  (página escondida "Os meus Bros")
   Ordem aleatória, entradas ao scroll, etiquetas e glossário a virar,
   régua, confeti (uma vez), arrastar fotos e lightbox.
   Sem listeners de scroll: IntersectionObserver e CSS.
══════════════════════════════════════ */
(function () {
  'use strict';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduce = reduceQuery.matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ── 1. Ordem dos três: baralhada a cada visita ── */
  (function shuffle() {
    var box = $('#tres');
    if (!box) return;
    var kids = $$('.bro', box);
    for (var i = kids.length - 1; i > 0; i--) {
      var r;
      if (window.crypto && crypto.getRandomValues) {
        var buf = new Uint32Array(1);
        crypto.getRandomValues(buf);
        r = buf[0] % (i + 1);
      } else {
        r = Math.floor(Math.random() * (i + 1));
      }
      var t = kids[i]; kids[i] = kids[r]; kids[r] = t;
    }
    kids.forEach(function (k) { box.appendChild(k); });
  })();

  /* ── 2. Palavras soltas para a escrita à mão ── */
  function splitWords(el) {
    var text = el.textContent;
    el.textContent = '';
    var n = 0;
    text.split(/(\s+)/).forEach(function (tok) {
      if (!tok) return;
      if (/^\s+$/.test(tok)) { el.appendChild(document.createTextNode(' ')); return; }
      var s = document.createElement('span');
      s.className = 'w';
      s.style.setProperty('--w', n++);
      s.textContent = tok;
      el.appendChild(s);
    });
  }
  if (!reduce) {
    $$('.cap').forEach(splitWords);
    $$('.write').forEach(splitWords);
  }

  /* ── 3. Leque: cada foto parte do centro do monte ── */
  function pileOffsets() {
    $$('.fan').forEach(function (fan) {
      var cx = fan.clientWidth / 2, cy = fan.clientHeight / 2;
      $$('.print', fan).forEach(function (p) {
        var px = p.offsetLeft + p.offsetWidth / 2;
        var py = p.offsetTop + p.offsetHeight / 2;
        p.style.setProperty('--fx', Math.round(cx - px) + 'px');
        p.style.setProperty('--fy', Math.round(cy - py) + 'px');
      });
    });
  }
  pileOffsets();
  if (window.ResizeObserver) {
    var rt = 0;
    var ro = new ResizeObserver(function () { clearTimeout(rt); rt = setTimeout(pileOffsets, 120); });
    $$('.fan').forEach(function (f) { ro.observe(f); });
  }

  /* ── 4. Entradas ao scroll ── */
  function watch(selector, opts, cb) {
    var els = $$(selector);
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); if (cb) cb(e); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        en.target.classList.add('in');
        if (cb) cb(en.target);
      });
    }, opts);
    els.forEach(function (e) { io.observe(e); });
  }
  watch('.print', { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  watch('.rise', { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  watch('.tl', { threshold: 0.25 });
  watch('.bro-head', { threshold: 0.35 });
  watch('.note', { threshold: 0.4 });
  watch('.fin-p', { threshold: 0.55 });
  watch('.sign', { threshold: 0.9 });
  watch('.finale-photo', { threshold: 0.2 });
  watch('.gl-ruler', { threshold: 0.6 }, function (el) { measure(el); });

  /* ── 5. Régua: mede até 150 ── */
  var rulerEl = $('.ruler');
  var rulerNum = $('.ruler-num');
  var measuring = 0;
  function measure() {
    if (!rulerNum) return;
    var to = parseInt(rulerNum.getAttribute('data-to'), 10) || 150;
    if (reduce) { rulerNum.textContent = to; return; }
    cancelAnimationFrame(measuring);
    var t0 = null, dur = 2000;
    rulerNum.textContent = '0';
    (function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      rulerNum.textContent = Math.round(to * e);
      if (p < 1) measuring = requestAnimationFrame(step);
    })(performance.now());
  }
  if (rulerEl) {
    rulerEl.addEventListener('click', function () {
      if (reduce) return;
      rulerEl.classList.add('re');
      void rulerEl.offsetWidth;
      rulerEl.classList.remove('re');
      measure();
    });
  }

  /* ── 6. Etiquetas e glossário: viram ── */
  var confettiDone = false;
  function flip(btn) {
    var on = !btn.classList.contains('is-flipped');
    btn.classList.toggle('is-flipped', on);
    btn.setAttribute('aria-pressed', String(on));
    if (on && btn.classList.contains('gl-sheee') && !confettiDone) {
      confettiDone = true;
      var r = btn.getBoundingClientRect();
      setTimeout(function () { burst(r.left + r.width / 2, r.top + r.height / 2); }, 260);
    }
  }
  $$('.tag, .gl').forEach(function (b) { b.addEventListener('click', function () { flip(b); }); });

  /* ── 7. Confeti: uma vez ── */
  function burst(x, y) {
    if (reduce) return;
    var cv = $('#confetti');
    if (!cv || !cv.getContext) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var W = window.innerWidth, H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    var ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);
    var colors = ['#d23f26', '#1f2a2e', '#e9cf70', '#fbfaf4', '#a92e18'];
    var bits = [];
    for (var i = 0; i < 120; i++) {
      var a = (-Math.PI / 2) + (Math.random() - .5) * Math.PI * 1.15;
      var s = 6 + Math.random() * 11;
      bits.push({
        x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        w: 6 + Math.random() * 7, h: 10 + Math.random() * 9,
        rot: Math.random() * 6.28, vr: (Math.random() - .5) * .3,
        c: colors[i % colors.length], life: 0, max: 110 + Math.random() * 60
      });
    }
    (function frame() {
      ctx.clearRect(0, 0, W, H);
      var alive = 0;
      bits.forEach(function (b) {
        b.life++;
        if (b.life > b.max) return;
        alive++;
        b.vx *= .985; b.vy = b.vy * .985 + .32;
        b.x += b.vx; b.y += b.vy; b.rot += b.vr;
        ctx.save();
        ctx.globalAlpha = Math.min(1, (b.max - b.life) / 30);
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.scale(1, Math.cos(b.life * .12));
        ctx.fillStyle = b.c;
        ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
        ctx.restore();
      });
      if (alive) requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, W, H);
    })();
  }

  /* ── 8. Arrastar fotos (só com rato; no telemóvel o scroll manda) ── */
  if (fine) {
    var zTop = 40;
    $$('.print').forEach(function (fig) {
      var drag = $('.print-drag', fig), btn = $('.print-btn', fig);
      var id = null, sx = 0, sy = 0, ox = 0, oy = 0, dx = 0, dy = 0;
      var lx = 0, ly = 0, lt = 0, vx = 0, vy = 0, moved = false, raf = 0;
      var minDx = -1e5, maxDx = 1e5;

      function apply() { drag.style.translate = dx.toFixed(1) + 'px ' + dy.toFixed(1) + 'px'; }

      btn.addEventListener('dragstart', function (e) { e.preventDefault(); });
      btn.addEventListener('pointerdown', function (e) {
        if (e.button !== 0 || reduce) return;
        cancelAnimationFrame(raf);
        id = e.pointerId; moved = false;
        sx = e.clientX; sy = e.clientY; ox = dx; oy = dy;
        lx = sx; ly = sy; lt = e.timeStamp; vx = vy = 0;
        var r = fig.getBoundingClientRect();
        minDx = dx - r.left + 8;
        maxDx = dx + (window.innerWidth - r.right) - 8;
        try { btn.setPointerCapture(id); } catch (err) {}
      });
      btn.addEventListener('pointermove', function (e) {
        if (e.pointerId !== id) return;
        var mx = e.clientX - sx, my = e.clientY - sy;
        if (!moved) {
          if (Math.hypot(mx, my) < 6) return;
          moved = true;
          fig.classList.add('held');
          fig.style.zIndex = ++zTop;
          drag.style.transition = 'none';
        }
        var dt = Math.max(1, e.timeStamp - lt);
        vx = vx * .6 + ((e.clientX - lx) / dt) * 16 * .4;
        vy = vy * .6 + ((e.clientY - ly) / dt) * 16 * .4;
        lx = e.clientX; ly = e.clientY; lt = e.timeStamp;
        dx = Math.min(maxDx, Math.max(minDx, ox + mx));
        dy = Math.min(900, Math.max(-900, oy + my));
        drag.style.rotate = Math.max(-9, Math.min(9, vx * 1.1)).toFixed(2) + 'deg';
        apply();
      });
      function release(e) {
        if (e.pointerId !== id) return;
        id = null;
        try { btn.releasePointerCapture(e.pointerId); } catch (err) {}
        if (!moved) return;
        fig.classList.remove('held');
        drag.style.transition = 'rotate .7s cubic-bezier(.3,1.3,.45,1)';
        drag.style.rotate = ((Math.random() * 6) - 3).toFixed(1) + 'deg';
        vx = Math.max(-28, Math.min(28, vx)); vy = Math.max(-28, Math.min(28, vy));
        (function glide() {
          vx *= .93; vy *= .93;
          if (Math.abs(vx) < .15 && Math.abs(vy) < .15) return;
          dx = Math.min(maxDx, Math.max(minDx, dx + vx));
          dy = Math.min(900, Math.max(-900, dy + vy));
          apply();
          raf = requestAnimationFrame(glide);
        })();
      }
      btn.addEventListener('pointerup', release);
      btn.addEventListener('pointercancel', release);
      btn.addEventListener('click', function (e) {
        if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
      }, true);
    });
  }

  /* ── 9. Lightbox ── */
  var lb = $('#lb');
  if (lb && typeof lb.showModal === 'function') {
    var lbPrint = $('.lb-print', lb), lbImg = $('.lb-img', lb), lbCap = $('.lb-cap', lb);
    var bPrev = $('.lb-prev', lb), bNext = $('.lb-next', lb), bClose = $('.lb-close', lb);
    var list = [], idx = 0, opener = null, lastY = 0;

    function show() {
      var b = list[idx];
      var fig = b.closest('.print');
      var cap = $('.cap', fig).textContent;
      var thumb = $('img', b);
      var w = +b.getAttribute('data-w'), h = +b.getAttribute('data-h');
      lbImg.width = w; lbImg.height = h;
      lbImg.style.aspectRatio = w + ' / ' + h;
      lbImg.style.width = 'min(88vw, ' + Math.round(Math.min(w * 1.5, 1000)) + 'px, calc(68dvh * ' + (w / h).toFixed(4) + '))';
      lbImg.alt = cap;
      lbCap.textContent = cap;
      lbImg.src = thumb.currentSrc || thumb.src;
      var full = b.getAttribute('data-src').replace('{W}', '1200');
      var pre = new Image();
      pre.onload = function () { if (list[idx] === b) lbImg.src = full; };
      pre.src = full;
      var many = list.length > 1;
      bPrev.hidden = bNext.hidden = !many;
    }
    function open(btn) {
      opener = btn;
      var g = btn.closest('.print').getAttribute('data-gallery');
      list = $$('.print[data-gallery="' + g + '"] .print-btn');
      idx = list.indexOf(btn);
      show();
      lastY = window.scrollY;
      lb.showModal();
      document.documentElement.style.overflow = 'hidden';
      if (!reduce && lbPrint.animate) {
        var from = $('.print-frame', btn).getBoundingClientRect();
        var to = lbPrint.getBoundingClientRect();
        if (to.width && from.width) {
          var s = from.width / to.width;
          var rot = parseFloat(getComputedStyle(btn.closest('.print')).rotate) || 0;
          lbPrint.animate([
            { transform: 'translate(' + (from.left + from.width / 2 - to.left - to.width / 2) + 'px,' + (from.top + from.height / 2 - to.top - to.height / 2) + 'px) rotate(' + rot + 'deg) scale(' + s + ')' },
            { transform: 'none' }
          ], { duration: 560, easing: 'cubic-bezier(.2,.9,.25,1)' });
          lbCap.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 380, delay: 330, fill: 'backwards' });
        }
      }
    }
    function step(d) {
      if (list.length < 2) return;
      idx = (idx + d + list.length) % list.length;
      show();
      if (!reduce && lbPrint.animate) {
        lbPrint.animate([{ opacity: 0, transform: 'translateX(' + (d * 36) + 'px) rotate(' + (d * 1.5) + 'deg)' }, { opacity: 1, transform: 'none' }], { duration: 340, easing: 'cubic-bezier(.23,1,.32,1)' });
        lbCap.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 120, fill: 'backwards' });
      }
    }
    $$('.print-btn').forEach(function (b) { b.addEventListener('click', function () { open(b); }); });
    bPrev.addEventListener('click', function () { step(-1); });
    bNext.addEventListener('click', function () { step(1); });
    function shut() { if (lb.open) lb.close(); tidy(); }
    function tidy() {
      document.documentElement.style.overflow = '';
      if (opener && document.activeElement !== opener) opener.focus({ preventScroll: true });
    }
    bClose.addEventListener('click', shut);
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    });
    lb.addEventListener('click', function (e) {
      if (!e.target.closest('.lb-print, .lb-btn, .lb-cap')) shut();
    });
    lb.addEventListener('close', tidy);
    // Deslizar para mudar de foto
    var tx = null, ty = null;
    lb.addEventListener('pointerdown', function (e) { tx = e.clientX; ty = e.clientY; });
    lb.addEventListener('pointerup', function (e) {
      if (tx === null) return;
      var ddx = e.clientX - tx, ddy = e.clientY - ty;
      tx = ty = null;
      if (Math.abs(ddx) > 60 && Math.abs(ddx) > Math.abs(ddy) * 1.5) step(ddx < 0 ? 1 : -1);
    });
  }

  /* ── 10. Segurança: se algo não disparou, mostra tudo ── */
  setTimeout(function () {
    $$('.print:not(.in), .rise:not(.in)').forEach(function (e) {
      var r = e.getBoundingClientRect();
      if (r.top < window.innerHeight * 1.2 && r.bottom > -50) e.classList.add('in');
    });
  }, 4000);
})();

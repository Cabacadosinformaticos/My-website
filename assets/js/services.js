/* ══════════════════════════════════════
   SERVICES.JS
   Comportamento da página de serviços e das subpáginas:
   entrada ao rolar, explorador de tecnologias e seletor de fases
   do design. O reveal geral, o menu, o FAQ e o rodapé continuam
   em script.js.
══════════════════════════════════════ */
(function () {
  'use strict';

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

  /* ── Seletor esboço / wireframe / final ── */
  document.querySelectorAll('[data-df]').forEach(function (root) {
    var view = root.querySelector('.df-view');
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
    var text = root.querySelector('.df-text');
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

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = tabs.length;
        if (k === 'ArrowDown' || k === 'ArrowRight') { e.preventDefault(); select((i + 1) % n, true); }
        else if (k === 'ArrowUp' || k === 'ArrowLeft') { e.preventDefault(); select((i - 1 + n) % n, true); }
      });
    });
    select(0);
  });
})();

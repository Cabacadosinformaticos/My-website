/* ══════════════════════════════════════
   PORTFOLIO.JS
   Índice do portfólio (lista, pré-visualização que segue o cursor,
   filtros) e página de cada projeto (conteúdo a partir de
   data/portfolio.json, faixa horizontal, lightbox, navegação).
   O menu, o rodapé e o reveal geral continuam em script.js.
   Sem bibliotecas. Só se animam transform e opacity (mais clip-path
   nas revelações de imagem). Com prefers-reduced-motion tudo fica
   estático e visível.
══════════════════════════════════════ */
(function () {
  'use strict';

  var IN_SUB = !!document.body.getAttribute('data-project-id');
  var DATA_URL = IN_SUB ? '../../data/portfolio.json' : '../data/portfolio.json';
  var SITE = 'https://cabacatech.com/pages/';
  var TIPOS = [
    { id: 'todos', label: 'Todos' },
    { id: 'sites', label: 'Sites' },
    { id: 'webapps', label: 'Web apps' },
    { id: 'apps', label: 'Apps' },
    { id: 'design', label: 'Design' }
  ];
  var ROTULO = { sites: 'Site', webapps: 'Web app', apps: 'App', design: 'Design' };
  var ARROW_L = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12H5M11 6l-6 6 6 6"/></svg>';
  var ARROW_R = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';
  var CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var EASE = 'cubic-bezier(.2, .8, .2, 1)';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function img(src, alt, opts) {
    opts = opts || {};
    var i = new Image();
    i.src = src;
    i.alt = alt || '';
    i.width = 1600;
    i.height = 1000;
    i.decoding = 'async';
    i.draggable = false;
    if (opts.eager) { i.loading = 'eager'; if (opts.priority) i.setAttribute('fetchpriority', 'high'); }
    else i.loading = 'lazy';
    if (opts.cls) i.className = opts.cls;
    return i;
  }
  function projectUrl(p) {
    return IN_SUB ? encodeURIComponent(p.id) + '.html' : 'portfolio/' + encodeURIComponent(p.id) + '.html';
  }
  function tiposLabel(p) { return p.tipo.map(function (t) { return ROTULO[t] || t; }); }

  /* ── Entrada ao rolar ── */
  var io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  }
  function reveal(node) {
    if (io) io.observe(node); else node.classList.add('is-in');
  }

  function load() {
    return fetch(DATA_URL).then(function (r) {
      if (!r.ok) throw new Error('http ' + r.status);
      return r.json();
    }).then(function (d) { return d.projetos || []; });
  }

  /* ══════════ Índice ══════════ */
  function initIndex() {
    var list = document.getElementById('pf-list');
    var filters = document.getElementById('pf-filters');
    var count = document.getElementById('pf-count');
    if (!list || !filters) return;

    load().then(function (projetos) {
      var rows = [];
      list.textContent = '';

      projetos.forEach(function (p, i) {
        var li = el('li', 'pf-row');
        li.setAttribute('data-id', p.id);
        var a = el('a', 'pf-link');
        a.href = projectUrl(p);
        a.setAttribute('aria-label', p.nome + ', ' + p.setor);
        a.innerHTML =
          '<span class="pf-num" aria-hidden="true">' + pad(i + 1) + '</span>' +
          '<span class="pf-name"><span class="pf-name-in">' + esc(p.nome) + '</span></span>' +
          '<span class="pf-meta"><span class="pf-kind">' + esc(tiposLabel(p).join(', ')) + '</span><span class="pf-sector">' + esc(p.setor) + '</span></span>';
        var thumb = el('span', 'pf-thumb pf-fade');
        thumb.appendChild(img(p.ecras[0].img, 'Ecrãs do projeto ' + p.nome, { eager: i < 2 }));
        a.appendChild(thumb);
        li.appendChild(a);
        list.appendChild(li);
        rows.push({ node: li, link: a, p: p, tipos: p.tipo });
        reveal(li);
      });

      function countFor(id) {
        return id === 'todos' ? projetos.length : projetos.filter(function (p) { return p.tipo.indexOf(id) > -1; }).length;
      }

      /* Filtros em texto simples */
      var buttons = {};
      filters.textContent = '';
      TIPOS.forEach(function (t) {
        var n = countFor(t.id);
        if (t.id !== 'todos' && n === 0) return;
        var b = el('button', 'pf-f', '<span class="pf-f-t">' + esc(t.label) + '</span><sup>' + n + '</sup>');
        b.type = 'button';
        b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', function () { apply(t.id, true, true); });
        filters.appendChild(b);
        buttons[t.id] = b;
      });

      var current = null;
      var countN = null;
      function setCount(n, animate) {
        if (!countN) {
          count.innerHTML = '<span class="pf-count-wrap"><span class="pf-count-n"></span></span><span class="pf-count-l"></span>';
          countN = count.querySelector('.pf-count-n');
        }
        countN.textContent = String(n);
        count.querySelector('.pf-count-l').textContent = n === 1 ? ' projeto' : ' projetos';
        if (animate && !reduceMotion && countN.animate) {
          countN.animate([{ transform: 'translateY(60%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 500, easing: EASE });
        }
      }

      function apply(id, push, animate) {
        if (!buttons[id]) id = 'todos';
        if (id === current) return;
        current = id;
        Object.keys(buttons).forEach(function (k) { buttons[k].setAttribute('aria-pressed', k === id ? 'true' : 'false'); });
        if (filters.scrollWidth > filters.clientWidth) filters.scrollTo({ left: Math.max(0, buttons[id].offsetLeft - 20), behavior: reduceMotion ? 'auto' : 'smooth' });

        var canAnimate = animate && !reduceMotion && rows[0].node.animate;
        var before = new Map();
        var leaving = [];
        rows.forEach(function (r) {
          if (!r.node.hidden) before.set(r, r.node.getBoundingClientRect().top);
        });
        var keep = rows.filter(function (r) { return id === 'todos' || r.tipos.indexOf(id) > -1; });
        if (canAnimate) leaving = rows.filter(function (r) { return !r.node.hidden && keep.indexOf(r) < 0; });

        function swap() {
          rows.forEach(function (r) {
            r.node.hidden = keep.indexOf(r) < 0;
            if (r.node.getAnimations) r.node.getAnimations().forEach(function (a) { a.cancel(); });
          });
          if (canAnimate) {
            keep.forEach(function (r, k) {
              r.node.style.setProperty('--k', String(k % 5));
              var was = before.get(r);
              if (was == null) {
                if (r.node.classList.contains('is-in')) {
                  r.node.animate([{ opacity: 0, transform: 'translateY(28px)' }, { opacity: 1, transform: 'none' }], { duration: 650, delay: Math.min(k, 8) * 40, easing: EASE, fill: 'backwards' });
                }
              } else {
                var dy = was - r.node.getBoundingClientRect().top;
                if (Math.abs(dy) > 1) r.node.animate([{ transform: 'translateY(' + dy + 'px)' }, { transform: 'none' }], { duration: 700, easing: EASE });
              }
            });
          } else {
            keep.forEach(function (r, k) { r.node.style.setProperty('--k', String(k % 5)); });
          }
          setCount(keep.length, animate);
        }

        if (leaving.length) {
          leaving.forEach(function (r) { r.node.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: 'ease-out', fill: 'forwards' }); });
          setTimeout(swap, 170);
        } else {
          swap();
        }

        if (push && window.history && history.replaceState) {
          var url = location.pathname + (id === 'todos' ? '' : '?tipo=' + id) + location.hash;
          history.replaceState(null, '', url);
        }
      }

      var wanted = new URLSearchParams(location.search).get('tipo') || 'todos';
      apply(wanted, false, false);

      initCollage(projetos);
      initPeek(list, rows);
    }).catch(function () {
      list.textContent = '';
      var p = el('p', 'pf-empty', 'Não foi possível carregar os projetos. Recarrega a página ou <a href="contact.html">fala comigo</a>.');
      list.parentNode.insertBefore(p, list);
    });
  }

  /* Duas capas sobrepostas ao lado do título, para o índice não começar só com texto */
  function initCollage(projetos) {
    var box = document.getElementById('pf-collage');
    if (!box) return;
    ['alma-ceramica', 'casa-clara'].forEach(function (id, k) {
      var p = projetos.filter(function (x) { return x.id === id; })[0];
      if (!p) return;
      var a = el('a', 'pf-col pf-col-' + (k + 1));
      a.href = projectUrl(p);
      a.setAttribute('aria-hidden', 'true');
      a.tabIndex = -1;
      var fr = el('span', 'pf-col-frame pf-fade');
      fr.appendChild(img(p.ecras[0].img, '', { eager: true, cls: 'pf-col-img' }));
      a.appendChild(fr);
      box.appendChild(a);
    });
    requestAnimationFrame(function () { requestAnimationFrame(function () { box.classList.add('is-in'); }); });
  }

  /* Pré-visualização que segue o cursor (só com rato e ecrã largo) */
  function initPeek(list, rows) {
    var mq = window.matchMedia ? window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 901px)') : null;
    if (!mq) return;
    var peek = el('div', 'pf-peek');
    peek.setAttribute('aria-hidden', 'true');
    var frame = el('div', 'pf-peek-frame');
    peek.appendChild(frame);
    document.body.appendChild(peek);

    var imgs = {};
    var active = null, activeRow = null, on = false, raf = 0;
    var x = 0, y = 0, tx = 0, ty = 0, rot = 0;

    function size() { return { w: peek.offsetWidth, h: peek.offsetHeight }; }
    function place(px, py) {
      var s = size();
      var vw = document.documentElement.clientWidth, vh = window.innerHeight;
      tx = clamp(px + 36, 16, vw - s.w - 16);
      ty = clamp(py - s.h * 0.55, 80, vh - s.h - 16);
    }
    function tick() {
      raf = 0;
      var dx = tx - x, dy = ty - y;
      x += dx * (reduceMotion ? 1 : 0.16); y += dy * (reduceMotion ? 1 : 0.16);
      rot = reduceMotion ? 0 : rot + (clamp(dx * 0.05, -4, 4) - rot) * 0.18;
      peek.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) rotate(' + rot.toFixed(2) + 'deg)';
      if (on || Math.abs(dx) > 0.3 || Math.abs(dy) > 0.3) raf = requestAnimationFrame(tick);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(tick); }

    function show(r, px, py) {
      if (!mq.matches) return;
      var id = r.p.id;
      if (!imgs[id]) {
        var i = img(r.p.ecras[0].img, '', { eager: true });
        i.className = 'pf-peek-img';
        frame.appendChild(i);
        imgs[id] = i;
      }
      if (active && active !== imgs[id]) active.classList.remove('is-on');
      active = imgs[id];
      active.classList.add('is-on');
      if (activeRow) activeRow.node.classList.remove('is-active');
      activeRow = r;
      r.node.classList.add('is-active');
      list.classList.add('is-hot');
      place(px, py);
      if (!on) { x = tx; y = ty; on = true; peek.classList.add('is-on'); }
      kick();
    }
    function hide() {
      on = false;
      peek.classList.remove('is-on');
      list.classList.remove('is-hot');
      if (activeRow) activeRow.node.classList.remove('is-active');
      activeRow = null;
      if (active) active.classList.remove('is-on');
      active = null;
    }

    rows.forEach(function (r) {
      r.link.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') show(r, e.clientX, e.clientY); });
      r.link.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        if (activeRow !== r) show(r, e.clientX, e.clientY);
        else { place(e.clientX, e.clientY); kick(); }
      });
      r.link.addEventListener('focus', function () {
        if (!mq.matches) return;
        var b = r.link.getBoundingClientRect();
        show(r, b.left + b.width * 0.55, b.top + b.height / 2);
      });
      r.link.addEventListener('blur', hide);
    });
    list.addEventListener('pointerleave', hide);
    window.addEventListener('blur', hide);
    document.addEventListener('visibilitychange', hide);
    mq.addEventListener ? mq.addEventListener('change', hide) : mq.addListener(hide);
  }

  /* ══════════ Página de projeto ══════════ */
  function missing(root, msg) {
    root.innerHTML =
      '<section class="pc-missing"><div class="pf-wrap">' +
      '<h1>Projeto não encontrado</h1>' +
      '<p>' + msg + '</p>' +
      '<div class="pf-btns"><a href="portfolio.html" class="btn btn-primary">Ver todos os projetos</a>' +
      '<a href="contact.html" class="pf-link-text">Falar comigo</a></div>' +
      '</div></section>';
    document.title = 'Projeto não encontrado | Portfólio | Tiago Cabaça';
    var robots = document.querySelector('meta[name="robots"]');
    if (robots) robots.setAttribute('content', 'noindex, follow');
  }

  function setMeta(sel, attr, val) {
    var m = document.querySelector(sel);
    if (m) m.setAttribute(attr, val);
  }

  function initCase() {
    var root = document.getElementById('pf-root');
    if (!root) return;
    var staticId = document.body.getAttribute('data-project-id');
    var id = staticId || new URLSearchParams(location.search).get('id');

    load().then(function (projetos) {
      var idx = -1;
      projetos.forEach(function (p, i) { if (p.id === id) idx = i; });
      if (idx < 0) {
        missing(root, 'Não encontrei esse projeto. Pode ter mudado de endereço ou o link estar incompleto.');
        return;
      }
      if (staticId) { enhance(root, projetos, idx); return; }
      location.replace('portfolio/' + encodeURIComponent(projetos[idx].id) + '.html');
    }).catch(function () {
      if (staticId) {
        root.querySelectorAll('[data-in], .pc-cover, .pc-hero, .pc-next-media').forEach(function (n) { n.classList.add('is-in'); });
        return;
      }
      missing(root, 'Não foi possível carregar os projetos. Recarrega a página ou volta ao portfólio.');
    });
  }

  /* As páginas estáticas já trazem o texto e as imagens; o JS só liga a
     galeria, a lightbox, a faixa horizontal e as entradas ao rolar. */
  function enhance(root, projetos, idx) {
    var p = projetos[idx];
    root.querySelectorAll('[data-in]').forEach(reveal);
    var nm = root.querySelector('.pc-next-media');
    if (nm) reveal(nm);
    var track = root.querySelector('.pc-track');
    var bar = root.querySelector('.pc-progress i');
    if (track && bar) initTrack(track, bar);
    initLightbox(root, p);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var cover = root.querySelector('.pc-cover');
        var hero = root.querySelector('.pc-hero');
        if (cover) cover.classList.add('is-in');
        if (hero) hero.classList.add('is-in');
      });
    });
  }

  function maskWords(text) {
    return esc(text).split(' ').map(function (w, i) {
      return '<span class="pf-mask"><span style="--w:' + i + '">' + w + '</span></span>';
    }).join(' ');
  }

  function render(root, projetos, idx) {
    var p = projetos[idx];
    var title = p.nome + ' | Portfólio | Tiago Cabaça';
    var url = SITE + 'portfolio/' + encodeURIComponent(p.id) + '.html';
    document.title = title;
    setMeta('meta[name="description"]', 'content', p.resumo);
    setMeta('link[rel="canonical"]', 'href', url);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', p.resumo);
    setMeta('meta[property="og:url"]', 'content', url);
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[name="twitter:description"]', 'content', p.resumo);

    root.textContent = '';
    var shots = p.ecras;

    function zoomBtn(i, cls, eager) {
      var b = el('button', 'pc-zoom');
      b.type = 'button';
      b.setAttribute('data-i', String(i));
      b.setAttribute('aria-label', 'Ampliar o ecrã ' + (i + 1) + ' de ' + shots.length + ': ' + shots[i].legenda);
      var fr = el('span', 'pc-frame pf-fade');
      fr.appendChild(img(shots[i].img, p.nome + ': ' + shots[i].legenda, { eager: eager, priority: eager, cls: 'pc-img' }));
      b.appendChild(fr);
      return b;
    }
    function caption(i) {
      return el('figcaption', 'pc-cap', '<span class="pc-capn">' + pad(i + 1) + '</span><span class="pc-capt">' + esc(shots[i].legenda) + '</span>');
    }

    /* Cabeçalho */
    var hero = el('header', 'pc-hero');
    var wrap = el('div', 'pf-wrap');
    wrap.innerHTML =
      '<a class="pc-back" href="portfolio.html">' + ARROW_L + 'Portfólio</a>' +
      '<h1 class="pc-title">' + maskWords(p.nome) + '</h1>' +
      '<p class="pc-sum">' + esc(p.resumo) + '</p>';
    hero.appendChild(wrap);

    var cover = el('figure', 'pc-cover');
    cover.appendChild(zoomBtn(0, '', true));
    var ccap = el('figcaption', 'pc-cap');
    ccap.innerHTML = '<span class="pc-capn">01</span><span class="pc-capt">' + esc(shots[0].legenda) + '</span>';
    var capWrap = el('div', 'pf-wrap');
    capWrap.appendChild(ccap);
    cover.appendChild(capWrap);
    hero.appendChild(cover);
    root.appendChild(hero);
    requestAnimationFrame(function () { requestAnimationFrame(function () { cover.classList.add('is-in'); hero.classList.add('is-in'); }); });

    /* Ficha e texto */
    var story = el('section', 'pc-story');
    var sw = el('div', 'pf-wrap pc-story-in');
    var meta = el('dl', 'pc-meta');
    meta.setAttribute('data-in', '');
    meta.innerHTML =
      '<div><dt>Setor</dt><dd>' + esc(p.setor) + '</dd></div>' +
      '<div><dt>Tipo</dt><dd>' + esc(tiposLabel(p).join(', ')) + '</dd></div>' +
      '<div><dt>Entregáveis</dt><dd><ul>' + p.entregaveis.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></dd></div>' +
      '<div><dt>Tecnologias</dt><dd>' + p.tecnologias.map(esc).join(', ') + '</dd></div>';
    var texts = el('div', 'pc-texts');
    [['O desafio', p.desafio], ['A abordagem', p.abordagem]].forEach(function (pair) {
      var blk = el('div', 'pc-block');
      blk.setAttribute('data-in', '');
      blk.appendChild(el('h2', 'pc-h', pair[0]));
      blk.appendChild(el('p', '', esc(pair[1])));
      texts.appendChild(blk);
    });
    sw.appendChild(meta);
    sw.appendChild(texts);
    story.appendChild(sw);
    root.appendChild(story);

    /* Restantes ecrãs: pilha com legenda fixa e, no fim, uma faixa horizontal */
    var rest = shots.length - 1;
    if (rest > 0) {
      var strip = rest >= 5 ? Math.floor(rest / 2) : 0;
      var stack = rest - strip;
      var pattern = ['wide', 'l', 'r'];

      var sec = el('section', 'pc-shots');
      var sw2 = el('div', 'pf-wrap');
      sw2.appendChild(el('h2', 'pf-sr', 'Ecrãs'));
      var st = el('div', 'pc-stack');
      for (var k = 0; k < stack; k++) {
        var i = 1 + k;
        var f = el('figure', 'pc-fig pc-' + pattern[k % pattern.length]);
        f.setAttribute('data-in', '');
        f.appendChild(zoomBtn(i));
        f.appendChild(caption(i));
        st.appendChild(f);
      }
      sw2.appendChild(st);
      sec.appendChild(sw2);
      root.appendChild(sec);

      if (strip) {
        var ss = el('section', 'pc-strip');
        ss.appendChild(el('h2', 'pf-sr', 'Mais ecrãs'));
        var track = el('div', 'pc-track');
        track.tabIndex = 0;
        track.setAttribute('role', 'group');
        track.setAttribute('aria-label', 'Mais ecrãs de ' + p.nome + '. Usa as setas para andar para o lado.');
        for (var j = 0; j < strip; j++) {
          var n = 1 + stack + j;
          var sf = el('figure', 'pc-sfig');
          sf.appendChild(zoomBtn(n));
          sf.appendChild(caption(n));
          track.appendChild(sf);
        }
        ss.appendChild(track);
        var prog = el('div', 'pf-wrap');
        prog.innerHTML = '<div class="pc-progress" aria-hidden="true"><i></i></div>';
        ss.appendChild(prog);
        root.appendChild(ss);
        initTrack(track, prog.querySelector('i'));
      }
    }

    /* Seguinte */
    var prev = projetos[(idx - 1 + projetos.length) % projetos.length];
    var next = projetos[(idx + 1) % projetos.length];
    if (projetos.length > 1) {
      var nx = el('div', 'pc-next');
      nx.setAttribute('role', 'navigation');
      nx.setAttribute('aria-label', 'Outros projetos');
      var na = el('a', 'pc-next-link');
      na.href = projectUrl(next);
      na.innerHTML =
        '<span class="pf-wrap pc-next-top"><span class="pc-next-label">Seguinte</span>' +
        '<span class="pc-next-name">' + esc(next.nome) + '</span></span>';
      var nm = el('span', 'pc-next-media pf-fade');
      nm.appendChild(img(next.ecras[0].img, 'Ecrãs do projeto ' + next.nome, { cls: 'pc-next-img' }));
      na.appendChild(nm);
      nx.appendChild(na);
      var pv = el('div', 'pf-wrap pc-prev');
      var pa = el('a', 'pf-link-text');
      pa.href = projectUrl(prev);
      pa.innerHTML = ARROW_L + 'Anterior: ' + esc(prev.nome);
      pv.appendChild(pa);
      nx.appendChild(pv);
      root.appendChild(nx);
      reveal(nm);
    }

    /* Fecho */
    var fin = el('section', 'pf-end');
    fin.innerHTML =
      '<div class="pf-wrap">' +
      '<h2 class="pf-end-h" data-in>Queres algo assim para o teu negócio?</h2>' +
      '<div class="pf-end-row" data-in>' +
        '<p>Conta-me o que precisas. A primeira conversa não custa nada nem te compromete.</p>' +
        '<div class="pf-btns"><a href="contact.html" class="btn btn-primary">Falar sobre um projeto</a><a href="servicos.html" class="pf-link-text">Ver serviços</a></div>' +
      '</div></div>';
    root.appendChild(fin);

    root.querySelectorAll('[data-in]').forEach(reveal);
    initLightbox(root, p);
  }

  /* Faixa horizontal: arrastar com o rato, progresso, sem cliques fantasma */
  function initTrack(track, bar) {
    var down = false, sx = 0, sl = 0, moved = 0, raf = 0;
    function progress() {
      raf = 0;
      var max = track.scrollWidth;
      var v = max ? (track.scrollLeft + track.clientWidth) / max : 1;
      bar.style.transform = 'scaleX(' + clamp(v, 0, 1).toFixed(4) + ')';
    }
    track.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(progress); }, { passive: true });
    window.addEventListener('resize', progress);
    progress();

    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; sx = e.clientX; sl = track.scrollLeft; moved = 0;
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      moved = Math.max(moved, Math.abs(dx));
      if (moved > 5) track.classList.add('is-drag');
      track.scrollLeft = sl - dx;
    });
    function up() {
      if (!down) return;
      down = false;
      track.classList.remove('is-drag');
    }
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    track.addEventListener('click', function (e) {
      if (moved > 5) { e.stopPropagation(); e.preventDefault(); moved = 0; }
    }, true);
  }

  /* ── Lightbox ── */
  function initLightbox(root, p) {
    var shots = p.ecras;
    var lb = el('div', 'pf-lb');
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Ecrãs de ' + p.nome);
    lb.innerHTML =
      '<button type="button" class="pf-lb-btn pf-lb-close" aria-label="Fechar">' + CLOSE + '</button>' +
      '<button type="button" class="pf-lb-btn pf-lb-prev" aria-label="Ecrã anterior">' + ARROW_L + '</button>' +
      '<button type="button" class="pf-lb-btn pf-lb-next" aria-label="Ecrã seguinte">' + ARROW_R + '</button>' +
      '<figure class="pf-lb-fig"><img class="pf-lb-img" width="1600" height="1000" alt=""><figcaption class="pf-lb-cap"></figcaption></figure>';
    document.body.appendChild(lb);

    var imgEl = lb.querySelector('.pf-lb-img');
    var cap = lb.querySelector('.pf-lb-cap');
    var bClose = lb.querySelector('.pf-lb-close');
    var bPrev = lb.querySelector('.pf-lb-prev');
    var bNext = lb.querySelector('.pf-lb-next');
    var cur = 0, opener = null, touchX = null;

    function show(i) {
      cur = (i + shots.length) % shots.length;
      imgEl.src = shots[cur].img;
      imgEl.alt = p.nome + ': ' + shots[cur].legenda;
      cap.innerHTML = '<b>' + (cur + 1) + ' de ' + shots.length + '</b>' + esc(shots[cur].legenda);
      var n = new Image(); n.src = shots[(cur + 1) % shots.length].img;
      var m = new Image(); m.src = shots[(cur - 1 + shots.length) % shots.length].img;
    }
    function open(i, from) {
      opener = from || null;
      show(i);
      lb.classList.add('is-open');
      document.body.classList.add('pf-lb-open');
      var single = shots.length < 2;
      bPrev.hidden = single; bNext.hidden = single;
      bClose.focus();
    }
    function close() {
      lb.classList.remove('is-open');
      document.body.classList.remove('pf-lb-open');
      if (opener && opener.focus) opener.focus();
    }

    root.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.pc-zoom') : null;
      if (b) open(parseInt(b.getAttribute('data-i'), 10) || 0, b);
    });
    bClose.addEventListener('click', close);
    bPrev.addEventListener('click', function () { show(cur - 1); });
    bNext.addEventListener('click', function () { show(cur + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); show(cur + 1); }
      else if (e.key === 'Tab') {
        var f = Array.prototype.filter.call(lb.querySelectorAll('button'), function (b) { return !b.hidden; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    lb.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-in]').forEach(function (n) { reveal(n); });
    if (document.body.classList.contains('pf-index')) {
      initIndex();
      requestAnimationFrame(function () { requestAnimationFrame(function () { document.body.classList.add('pf-ready'); }); });
    } else if (document.body.classList.contains('pf-case')) initCase();
  });
})();

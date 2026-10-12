/* ══════════════════════════════════════
   SCRIPT.JS
══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Nav scroll ── */
  const nav = document.querySelector('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });

  /* ── Mobile nav ── */
  const toggle = document.querySelector('.nav-toggle');
  const links  = document.querySelector('.nav-links');

  if (toggle && links && nav) {
    const closeMobileNav = () => {
      links.classList.remove('open');
      nav.classList.remove('menu-open');
      document.body.classList.remove('menu-open');
      toggle.textContent = '☰';
      toggle.setAttribute('aria-label', 'Abrir menu');
      toggle.setAttribute('aria-expanded', 'false');
    };

    toggle.setAttribute('type', 'button');
    toggle.setAttribute('aria-label', 'Abrir menu');
    toggle.setAttribute('aria-expanded', 'false');

    toggle.addEventListener('click', () => {
      const isOpen = links.classList.toggle('open');
      nav.classList.toggle('menu-open', isOpen);
      document.body.classList.toggle('menu-open', isOpen);
      toggle.textContent = isOpen ? '×' : '☰';
      toggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    links.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMobileNav));
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900 && links.classList.contains('open')) closeMobileNav();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && links.classList.contains('open')) closeMobileNav();
    });
  }

  /* ── Active nav link ── */
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });

  /* ── Reveal on scroll ── */
  const reveals = document.querySelectorAll('.reveal');
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 70);
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  reveals.forEach(el => revealObs.observe(el));

  /* ── Skill bars ── */
  const fills = document.querySelectorAll('.skill-fill');
  const fillObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.animationPlayState = 'running';
        fillObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  fills.forEach(f => { f.style.animationPlayState = 'paused'; fillObs.observe(f); });

  /* ── Count up ── */
  const counters = document.querySelectorAll('.count-up');
  const countObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const el = e.target;
        const target = parseInt(el.dataset.target);
        const suffix = el.dataset.suffix || '';
        let cur = 0;
        const step = target / 50;
        const t = setInterval(() => {
          cur = Math.min(cur + step, target);
          el.textContent = Math.round(cur) + suffix;
          if (cur >= target) clearInterval(t);
        }, 28);
        countObs.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(c => countObs.observe(c));

  /* ── Typing effect ── */
  const typer = document.querySelector('.typer');
  if (typer) {
    const words = typer.dataset.words ? typer.dataset.words.split(',') : ['Developer'];
    let wi = 0, ci = 0, del = false;
    function tick() {
      const w = words[wi];
      if (!del) {
        typer.textContent = w.slice(0, ++ci);
        if (ci === w.length) { del = true; setTimeout(tick, 2000); return; }
      } else {
        typer.textContent = w.slice(0, --ci);
        if (ci === 0) { del = false; wi = (wi + 1) % words.length; }
      }
      setTimeout(tick, del ? 55 : 90);
    }
    setTimeout(tick, 800);
  }

  /* ── FAQ accordion ── */
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  /* ── Project filter ── */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card[data-cat]');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.filter;
      projectCards.forEach(card => {
        if (cat === 'all' || card.dataset.cat === cat) {
          card.removeAttribute('data-hidden');
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  /* ── Blog search ── */
  const searchInput = document.querySelector('.blog-search');
  const blogCards   = document.querySelectorAll('.blog-card[data-title]');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase();
      blogCards.forEach(card => {
        const match = card.dataset.title.toLowerCase().includes(q);
        card.style.display = match ? '' : 'none';
      });
    });
  }

  /* ── TOC active on scroll ── */
  const tocLinks = document.querySelectorAll('.toc-link');
  if (tocLinks.length) {
    const headings = Array.from(document.querySelectorAll('.post-body h2'));
    window.addEventListener('scroll', () => {
      let current = '';
      headings.forEach(h => {
        if (window.scrollY >= h.offsetTop - 120) current = h.id;
      });
      tocLinks.forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === '#' + current);
      });
    });
  }

  /* ── Contact form ── */
  const form = document.querySelector('.contact-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('[type=submit]');
      const orig = btn.textContent;
      btn.textContent = 'Enviado ✓';
      btn.style.background = '#00e87a';
      btn.style.color = '#04060f';
      setTimeout(() => {
        btn.textContent = orig;
        btn.style.background = '';
        btn.style.color = '';
        form.reset();
      }, 3500);
    });
  }

  /* ── Copiar email do rodapé ── */
  const copyToClipboard = text => {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '-1000px';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        ok ? resolve() : reject(new Error('copy falhou'));
      } catch (err) {
        reject(err);
      }
    });
  };

  document.querySelectorAll('.copy-btn[data-copy]').forEach(btn => {
    const row = btn.parentElement;
    const status = row ? row.querySelector('.copy-status') : null;

    btn.addEventListener('click', () => {
      copyToClipboard(btn.dataset.copy).then(() => {
        btn.classList.add('is-copied');
        if (status) status.textContent = 'Copiado';
      }).catch(() => {
        if (status) status.textContent = 'Falhou';
      }).then(() => {
        setTimeout(() => {
          btn.classList.remove('is-copied');
          if (status) status.textContent = '';
        }, 1500);
      });
    });
  });

  /* ── Rodapé ──
     Entrada uma só vez, wordmark ajustado à largura e voltar ao topo. */
  const footer = document.querySelector('.site-footer');
  if (footer) {
    const footerObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        footerObs.unobserve(e.target);
        footer.classList.add('is-in');
      });
    }, { threshold: 0, rootMargin: '0px 0px -40px 0px' });
    footerObs.observe(footer);

    // "TIAGO CABAÇA" ocupa exactamente a largura do contentor.
    const wordmark = footer.querySelector('.footer-wordmark');
    const wordmarkBox = footer.querySelector('.footer-wordmark-box');
    if (wordmark && wordmarkBox) {
      let fitFrame = null;
      const fitWordmark = () => {
        fitFrame = null;
        const available = wordmarkBox.clientWidth;
        if (!available) return;
        wordmark.style.fontSize = '100px';
        const natural = wordmark.scrollWidth || 1;
        const size = Math.max(28, Math.min(260, Math.floor((available / natural) * 100)));
        wordmark.style.fontSize = size + 'px';
      };
      const queueFit = () => { if (fitFrame === null) fitFrame = requestAnimationFrame(fitWordmark); };
      fitWordmark();
      window.addEventListener('resize', queueFit);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(queueFit);
      window.addEventListener('load', queueFit);

      // Deslize lento do nome com o scroll enquanto o rodapé está visível.
      const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reduceMotion) {
        let shiftFrame = null;
        const shiftWordmark = () => {
          shiftFrame = null;
          const rect = footer.getBoundingClientRect();
          const vh = window.innerHeight;
          if (rect.top > vh || rect.bottom < 0) return;
          // Garantia: se o observador ainda não disparou, as letras entram já.
          if (rect.top < vh - 40) footer.classList.add('is-in');
          const progress = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
          wordmark.style.setProperty('--wm-shift', ((0.5 - progress) * 80).toFixed(1) + 'px');
        };
        window.addEventListener('scroll', () => {
          if (shiftFrame === null) shiftFrame = requestAnimationFrame(shiftWordmark);
        }, { passive: true });
        shiftWordmark();
      }
    }

    footer.querySelectorAll('.footer-top-link').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      });
    });
  }

  /* ── Página escondida ──
     O coração do rodapé e a palavra "bros" escrita no teclado levam lá. */
  const ownScript = document.querySelector('script[src$="assets/js/script.js"]');
  const siteRoot = ownScript ? ownScript.getAttribute('src').replace(/assets\/js\/script\.js$/, '') : '';
  const hiddenPage = siteRoot + 'pages/bros.html';
  const onHiddenPage = /\/pages\/bros\.html$/.test(window.location.pathname);

  document.querySelectorAll('.footer-heart').forEach(span => {
    const heart = document.createElement('a');
    heart.className = span.className;
    heart.textContent = span.textContent;
    heart.href = hiddenPage;
    heart.setAttribute('aria-label', span.getAttribute('aria-label') || 'amor');
    heart.style.display = 'inline-block';
    heart.style.transformOrigin = '50% 55%';
    span.replaceWith(heart);
    const reduceHeart = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    const beat = () => {
      if (!heart.animate || (reduceHeart && reduceHeart.matches)) return;
      heart.animate([
        { transform: 'scale(1)' }, { transform: 'scale(1.38)', offset: .18 }, { transform: 'scale(1)', offset: .34 },
        { transform: 'scale(1.26)', offset: .5 }, { transform: 'scale(1)' }
      ], { duration: 900, easing: 'ease-out' });
    };
    heart.addEventListener('mouseenter', beat);
    heart.addEventListener('focus', beat);
  });

  let typed = '';
  let typedAt = 0;
  document.addEventListener('keydown', e => {
    if (onHiddenPage || e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName))) return;
    const now = Date.now();
    if (now - typedAt > 1500) typed = '';
    typedAt = now;
    typed = (typed + e.key.toLowerCase()).slice(-4);
    if (typed === 'bros') window.location.href = hiddenPage;
  });

  /* ── Glitch hover ── */
  const glitches = document.querySelectorAll('.glitch');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#';
  glitches.forEach(el => {
    const orig = el.textContent;
    el.addEventListener('mouseenter', () => {
      let iter = 0;
      const iv = setInterval(() => {
        el.textContent = orig.split('').map((c, i) => {
          if (i < iter || c === ' ') return orig[i];
          return chars[Math.floor(Math.random() * chars.length)];
        }).join('');
        if (iter >= orig.length) { clearInterval(iv); el.textContent = orig; }
        iter += 2;
      }, 35);
    });
  });

});

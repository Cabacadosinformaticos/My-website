/*!
 * Content engine of cabacatech.com
 * Copyright (c) 2026 Tiago Cabaça. Released under the MIT License.
 * https://github.com/Cabacadosinformaticos/My-website
 */
/* ══════════════════════════════════════
   CONTENT ENGINE v3
══════════════════════════════════════ */

/* ── Caminho base absoluto ──
   Calcula o root do site independentemente
   de estar em /pages/ ou na raiz
──────────────────────────────────────── */
function getRootURL() {
  const path = window.location.pathname;
  let root = path.replace(/\/pages\/.*$/, '').replace(/\/[^/]*\.html$/, '');
  if (!root.endsWith('/')) root += '/';
  return window.location.origin + root;
}

async function fetchMD(relativePath) {
  const url = getRootURL() + relativePath;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ${res.status}: ${url}`);
  return res.text();
}

/* ── Frontmatter ── */
function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };
  const meta = {};
  match[1].split('\n').forEach(line => {
    const col = line.indexOf(':');
    if (col === -1) return;
    const key = line.slice(0, col).trim();
    let val   = line.slice(col + 1).trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else if (/^"[^"]*"$|^'[^']*'$/.test(val)) {
      // Valores entre aspas, como cover: "", ficam sem as aspas.
      val = val.slice(1, -1);
    }
    meta[key] = val;
  });
  return { meta, body: match[2] };
}

/* ── Categorias - suporta string, "Cat1, Cat2" ou array ── */
function getCategories(meta) {
  if (!meta.category) return [];
  if (Array.isArray(meta.category)) return meta.category;
  return meta.category.split(',').map(s => s.trim()).filter(Boolean);
}

function slugify(text) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim();
}

/* ── Placeholder com ícone SVG por categoria ── */
function categoryIcon(category) {
  const icons = {
    'Web Dev':     `<path d="M13 10V3L4 14h7v7l9-11h-7z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
    'Design':      `<circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" stroke-width="2" stroke-linecap="round"/>`,
    'Ferramentas': `<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
    'Carreira':    `<path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
    'TypeScript':  `<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
    'Performance': `<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
    'Backend':     `<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" stroke-width="2" stroke-linecap="round"/>`,
    'Web App':     `<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
    'Open Source': `<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 012 2v7M6 9v12" stroke-width="2" stroke-linecap="round"/>`,
    'Tutorial':    `<path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  };
  // Ícone neutro (terminal) para categorias sem ícone próprio.
  return icons[category] || `<rect x="2" y="4" width="20" height="16" rx="1"/><path d="M6 9l3 3-3 3M12 15h6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function categoryColor(category) {
  const map = {
    'Web Dev':     '#00f5d4', 'Design':      '#e8ff47',
    'Ferramentas': '#00b4d8', 'Carreira':    '#f72585',
    'TypeScript':  '#3b82f6', 'Performance': '#f97316',
    'Backend':     '#22c55e', 'Web App':     '#00f5d4',
    'Open Source': '#a78bfa', 'Tutorial':    '#fb923c',
  };
  return map[category] || 'var(--accent)';
}

function thumbPlaceholder(category) {
  const color = categoryColor(category);
  const icon  = categoryIcon(category);
  return `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--surface);position:relative;overflow:hidden;"><svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="${color}" opacity="0.35" xmlns="http://www.w3.org/2000/svg">${icon}</svg></div>`;
}

/* ── Vídeo ── */
function isYouTube(url) { return url.includes('youtube.com') || url.includes('youtu.be'); }
function isVimeo(url)   { return url.includes('vimeo.com'); }
function getYouTubeId(url) { const m = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/); return m ? m[1] : null; }
function getVimeoId(url)   { const m = url.match(/vimeo\.com\/(\d+)/); return m ? m[1] : null; }

function parseBlockAttrs(raw = '') {
  const attrs = {};
  raw.replace(/(\w+)="([^"]*)"/g, (_, key, value) => {
    attrs[key] = value;
    return '';
  });
  return attrs;
}

function renderInnerMarkdown(text) {
  const html = renderMarkdown(text.trim());
  return html.replace(/^<p>/, '').replace(/<\/p>\s*$/, '');
}

function renderCalloutBlock(type, attrText, inner) {
  const attrs = parseBlockAttrs(attrText);
  const title = attrs.title || ({
    callout: 'Nota',
    info: 'Nota',
    tip: 'Dica',
    warning: 'Atencao',
    danger: 'Cuidado'
  }[type] || 'Nota');
  return `<aside class="content-callout content-callout-${type}"><div class="content-callout-kicker">${escapeHtml(title)}</div><div class="content-callout-body">${renderInnerMarkdown(inner)}</div></aside>`;
}

function renderSpecBlock(attrText, inner) {
  const attrs = parseBlockAttrs(attrText);
  const title = attrs.title || 'Especificacoes';
  const rows = inner.trim().split('\n').map(line => {
    const col = line.indexOf(':');
    if (col === -1) return '';
    const key = line.slice(0, col).trim();
    const value = line.slice(col + 1).trim();
    return `<div class="spec-row"><span>${escapeHtml(key)}</span><strong>${escapeHtml(value)}</strong></div>`;
  }).filter(Boolean).join('');
  return `<section class="spec-card"><h3>${escapeHtml(title)}</h3><div class="spec-grid">${rows}</div></section>`;
}

function renderResourceBlock(attrText, inner) {
  const attrs = parseBlockAttrs(attrText);
  const title = attrs.title || 'Recurso';
  const url = attrs.url || '#';
  const label = attrs.label || 'Abrir recurso';
  const body = inner.trim() ? `<p>${renderInnerMarkdown(inner)}</p>` : '';
  return `<aside class="resource-card"><div><span class="resource-kicker">Recurso recomendado</span><h3>${escapeHtml(title)}</h3>${body}</div><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a></aside>`;
}

function renderImagePlaceholder(attrText, inner) {
  const attrs = parseBlockAttrs(attrText);
  const title = attrs.title || 'Imagem a adicionar';
  const ratio = attrs.ratio || '16:9';
  const desc = attrs.desc || inner.trim() || 'Substituir este placeholder por uma imagem final.';
  return `<figure class="image-placeholder" style="--placeholder-ratio:${escapeHtml(ratio.replace(':', ' / '))}"><div><span>Imagem pendente</span><strong>${escapeHtml(title)}</strong><p>${escapeHtml(desc)}</p></div></figure>`;
}

/* ── Blocos de texto ── */
// Devolve ao texto os blocos de código já trocados por tokens,
// para o Markdown interior (ex.: details) os poder renderizar.
function restoreFences(text, fences) {
  return text.replace(/@@CODE_FENCE_(\d+)@@/g, (match, i) => fences[Number(i)] ?? match);
}

// O HTML interior é guardado em placeholders e só entra depois do
// renderMarkdown final: assim o marked não volta a analisá-lo como
// Markdown e as linhas vazias dentro do bloco não o partem.
function pushDeferred(list, html) {
  const token = `@@BLOCK_BODY_${list.length}@@`;
  list.push({ token, html });
  return token;
}

function renderDetailsBlock(attrText, inner, fences, deferred) {
  const attrs = parseBlockAttrs(attrText);
  const title = attrs.title || 'Detalhes';
  const body  = pushDeferred(deferred, renderMarkdown(restoreFences(inner, fences).trim()));
  return `<details class="content-details"><summary>${escapeHtml(title)}</summary><div class="content-details-body">${body}</div></details>`;
}

/* ── Linha do tempo: data | título | texto ──
   `layout="horizontal|compact|grid"` na linha de abertura;
   sem atributo mantém a linha vertical de sempre. */
function parseTimelineItems(inner) {
  return inner.trim().split('\n').filter(l => l.trim()).map(line => {
    const parts = line.split('|').map(p => p.trim());
    return {
      date:  parts[0] || '',
      title: parts[1] || '',
      text:  parts.slice(2).join(' | ').trim()
    };
  });
}

function renderTimelineBlock(attrText, inner) {
  const attrs   = parseBlockAttrs(attrText);
  const layout  = (attrs.layout || '').trim().toLowerCase();
  const heading = attrs.title ? `<h3>${escapeHtml(attrs.title)}</h3>` : '';
  const items   = parseTimelineItems(inner);

  if (layout === 'horizontal') {
    const steps = items.map((it, i) => `<li class="timeline-h-item" style="--i:${i}">
        <span class="timeline-h-date">${escapeHtml(it.date)}</span>
        <strong class="timeline-h-title">${escapeHtml(it.title)}</strong>
        ${it.text ? `<div class="timeline-h-text">${renderInnerMarkdown(it.text)}</div>` : ''}
      </li>`).join('');
    return `<section class="timeline-card timeline-card-h">${heading}<div class="timeline-h-scroll" tabindex="0" role="region" aria-label="Linha do tempo, desliza para ver mais"><ol class="timeline-h" style="--steps:${items.length}">${steps}</ol></div></section>`;
  }

  if (layout === 'compact') {
    const rows = items.map((it, i) => `<li class="timeline-c-item" style="--i:${i}">
        <span class="timeline-c-date">${escapeHtml(it.date)}</span>
        <span class="timeline-c-mark" aria-hidden="true"></span>
        <div class="timeline-c-body"><strong class="timeline-c-title">${escapeHtml(it.title)}</strong>${it.text ? `<div class="timeline-c-text">${renderInnerMarkdown(it.text)}</div>` : ''}</div>
      </li>`).join('');
    return `<section class="timeline-card timeline-card-c">${heading}<ol class="timeline-c">${rows}</ol></section>`;
  }

  if (layout === 'grid') {
    const cells = items.map((it, i) => `<li class="timeline-g-item" style="--i:${i}">
        <span class="timeline-g-num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
        <span class="timeline-g-date">${escapeHtml(it.date)}</span>
        <strong class="timeline-g-title">${escapeHtml(it.title)}</strong>
        ${it.text ? `<div class="timeline-g-text">${renderInnerMarkdown(it.text)}</div>` : ''}
      </li>`).join('');
    return `<section class="timeline-card timeline-card-g">${heading}<ol class="timeline-g">${cells}</ol></section>`;
  }

  const list = items.map((it, i) => `<li class="timeline-item" style="--i:${i}"><span class="timeline-date">${escapeHtml(it.date)}</span><div class="timeline-body"><strong class="timeline-title">${escapeHtml(it.title)}</strong>${it.text ? renderInnerMarkdown(it.text) : ''}</div></li>`).join('');
  return `<section class="timeline-card">${heading}<ol class="timeline">${list}</ol></section>`;
}

function renderStatsBlock(inner) {
  const tiles = inner.trim().split('\n').filter(l => l.trim()).map(line => {
    const col   = line.indexOf('|');
    const value = (col === -1 ? line : line.slice(0, col)).trim();
    const label = col === -1 ? '' : line.slice(col + 1).trim();
    return `<div class="stat-tile"><span class="stat-value">${escapeHtml(value)}</span><span class="stat-label">${escapeHtml(label)}</span></div>`;
  });
  // Máximo de 4 por linha no desktop (a classe fixa as colunas).
  const count = Math.min(tiles.length, 4) || 1;
  return `<div class="stats-block stats-count-${count}">${tiles.join('')}</div>`;
}

function renderCompareBlock(attrText, inner, fences, deferred) {
  const attrs = parseBlockAttrs(attrText);
  const [left = '', right = ''] = inner.split(/^[ \t]*\|\|\|[ \t]*\r?$/m);
  const heading = attrs.title ? `<h3>${escapeHtml(attrs.title)}</h3>` : '';
  const col = (name, text) => `<div class="compare-col"><h4>${escapeHtml(name)}</h4>${pushDeferred(deferred, renderMarkdown(restoreFences(text, fences).trim()))}</div>`;
  return `<section class="compare-card">${heading}<div class="compare-grid">${col(attrs.left || 'Antes', left)}${col(attrs.right || 'Depois', right)}</div></section>`;
}

/* ── Blocos de código ──
   Barra de terminal (pontos + título + copiar). Nos blocos de
   shell cada linha é um span próprio: o prompt `$` é um
   pseudo-elemento (nunca entra no texto copiado) e o bloco
   revela as linhas uma a uma na primeira entrada em ecrã. */
const SHELL_LANGS = ['bash', 'sh', 'shell', 'console', 'zsh'];

function highlightCode(code, lang) {
  if (window.hljs && lang) {
    try { return window.hljs.highlight(code, { language: lang }).value; } catch {}
  }
  return escapeHtml(code);
}

function renderCodeBlock(code, lang, title) {
  const isShell  = SHELL_LANGS.includes(String(lang).toLowerCase());
  const label    = title || lang || 'código';
  const clean    = String(code).replace(/\n$/, '');
  const lines    = clean.split('\n');
  const body     = isShell
    ? lines.map((line, i) => {
        // Linhas de comentário ficam apagadas.
        const cls = /^\s*#/.test(line) ? ' code-line-comment' : '';
        return `<span class="code-line${cls}" style="--i:${i}">${highlightCode(line, lang)}</span>`;
      }).join('')
    : highlightCode(clean, lang);

  return `<div class="code-block${isShell ? ' code-block-shell' : ''}" style="--lines:${lines.length}">
  <div class="code-bar">
    <span class="code-dots" aria-hidden="true"><i></i><i></i><i></i></span>
    <span class="code-name">${escapeHtml(label)}</span>
    <button class="code-copy" type="button"><span class="code-copy-label" aria-live="polite">Copiar</span></button>
  </div>
  <pre><code class="language-${escapeHtml(lang)}">${body}</code></pre>
</div>`;
}

/* ── Blocos especiais ── */
function processBlocks(md) {
  const fences = [];
  md = md.replace(/```[\s\S]*?```/g, block => {
    const token = `@@CODE_FENCE_${fences.length}@@`;
    fences.push(block);
    return token;
  });

  md = md.replace(/:::carousel\n([\s\S]*?):::/g, (_, inner) => {
    // Cada linha é "caminho" ou "caminho | legenda".
    const images = inner.trim().split('\n').filter(l => l.trim()).map(line => {
      const col = line.indexOf('|');
      return col === -1
        ? { src: line.trim(), caption: '' }
        : { src: line.slice(0, col).trim(), caption: line.slice(col + 1).trim() };
    });
    const slides = images.map((img, i) => `<div class="carousel-slide${i === 0 ? ' active' : ''}"><img src="${img.src}" alt="${escapeHtml(img.caption || `Imagem ${i + 1}`)}" loading="lazy"/>${img.caption ? `<div class="carousel-caption">${escapeHtml(img.caption)}</div>` : ''}</div>`).join('');
    const dots   = images.map((_, i) => `<button class="carousel-dot${i === 0 ? ' active' : ''}" data-index="${i}" aria-label="Slide ${i + 1}"></button>`).join('');
    return `<div class="carousel" data-total="${images.length}"><div class="carousel-track">${slides}</div><button class="carousel-prev" aria-label="Anterior">&#8592;</button><button class="carousel-next" aria-label="Próximo">&#8594;</button><div class="carousel-dots">${dots}</div></div>`;
  });
  md = md.replace(/:::(callout|info|tip|warning|danger)([^\n]*)\n([\s\S]*?):::/g, (_, type, attrText, inner) =>
    renderCalloutBlock(type, attrText, inner)
  );
  md = md.replace(/:::specs([^\n]*)\n([\s\S]*?):::/g, (_, attrText, inner) =>
    renderSpecBlock(attrText, inner)
  );
  md = md.replace(/:::resource([^\n]*)\n([\s\S]*?):::/g, (_, attrText, inner) =>
    renderResourceBlock(attrText, inner)
  );
  md = md.replace(/:::decision([^\n]*)\n([\s\S]*?):::/g, (_, attrText, inner) =>
    renderCalloutBlock('info', attrText || ' title="Decisao tecnica"', inner)
  );
  md = md.replace(/:::image-placeholder([^\n]*)\n([\s\S]*?):::/g, (_, attrText, inner) =>
    renderImagePlaceholder(attrText, inner)
  );
  md = md.replace(/:::video\n([\s\S]*?):::/g, (_, inner) => {
    const url = inner.trim();
    if (isYouTube(url)) return `<div class="video-wrap"><iframe src="https://www.youtube.com/embed/${getYouTubeId(url)}" frameborder="0" allowfullscreen loading="lazy"></iframe></div>`;
    if (isVimeo(url))   return `<div class="video-wrap"><iframe src="https://player.vimeo.com/video/${getVimeoId(url)}" frameborder="0" allowfullscreen loading="lazy"></iframe></div>`;
    return `<div class="video-wrap"><video controls><source src="${url}"></video></div>`;
  });
  // Blocos novos: âncora no início da linha, para não apanhar
  // menções ao bloco dentro de texto corrido.
  const deferred = [];
  md = md.replace(/^:::details([^\n]*)\n([\s\S]*?)^:::/gm, (_, attrText, inner) =>
    renderDetailsBlock(attrText, inner, fences, deferred)
  );
  md = md.replace(/^:::timeline([^\n]*)\n([\s\S]*?)^:::/gm, (_, attrText, inner) =>
    renderTimelineBlock(attrText, inner)
  );
  md = md.replace(/^:::stats([^\n]*)\n([\s\S]*?)^:::/gm, (_, _attrText, inner) =>
    renderStatsBlock(inner)
  );
  md = md.replace(/^:::compare([^\n]*)\n([\s\S]*?)^:::/gm, (_, attrText, inner) =>
    renderCompareBlock(attrText, inner, fences, deferred)
  );
  fences.forEach((block, i) => {
    md = md.replace(`@@CODE_FENCE_${i}@@`, block);
  });
  deferred.forEach(({ token, html }) => {
    md = md.split(token).join(html);
  });
  return md;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function setMetaTag(selector, attr, value) {
  if (!value) return;
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement('meta');
    const nameMatch = selector.match(/meta\[name="([^"]+)"\]/);
    const propertyMatch = selector.match(/meta\[property="([^"]+)"\]/);
    if (nameMatch) tag.setAttribute('name', nameMatch[1]);
    if (propertyMatch) tag.setAttribute('property', propertyMatch[1]);
    document.head.appendChild(tag);
  }
  tag.setAttribute(attr, value);
}

function setCanonical(url) {
  if (!url) return;
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

function setStructuredData(id, data) {
  let script = document.getElementById(id);
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

// Mantém as páginas dinâmicas com metadata própria depois de carregar Markdown.
function updateDynamicSeo({ title, description, url, image, type = 'article', structuredData }) {
  const fullTitle = title ? `${title} | Tiago Cabaça` : 'Tiago Cabaça';
  document.title = fullTitle;
  setMetaTag('meta[name="description"]', 'content', description);
  setCanonical(url);
  setMetaTag('meta[property="og:type"]', 'content', type);
  setMetaTag('meta[property="og:title"]', 'content', fullTitle);
  setMetaTag('meta[property="og:description"]', 'content', description);
  setMetaTag('meta[property="og:url"]', 'content', url);
  setMetaTag('meta[property="og:image"]', 'content', image);
  setMetaTag('meta[name="twitter:title"]', 'content', fullTitle);
  setMetaTag('meta[name="twitter:description"]', 'content', description);
  setMetaTag('meta[name="twitter:image"]', 'content', image);
  if (structuredData) setStructuredData('dynamic-structured-data', structuredData);
}

/* ── Datas do frontmatter ("Out 2026") para ISO 8601 ("2026-10") ── */
function toIsoMonth(value) {
  if (!value) return undefined;
  const months = { jan: '01', fev: '02', mar: '03', abr: '04', mai: '05', jun: '06', jul: '07', ago: '08', set: '09', out: '10', nov: '11', dez: '12' };
  const m = String(value).trim().match(/^([A-Za-zçÇ]{3})[a-zç]*\.?\s+(\d{4})$/);
  if (m && months[m[1].toLowerCase()]) return `${m[2]}-${months[m[1].toLowerCase()]}`;
  return /^\d{4}(-\d{2}){0,2}$/.test(String(value).trim()) ? String(value).trim() : undefined;
}

/* ── Markdown ── */
function renderMarkdown(md) {
  if (window.marked) {
    const renderer = new window.marked.Renderer();
    renderer.code = function(codeOrToken, infoString) {
      const code = typeof codeOrToken === 'object' && codeOrToken !== null
        ? codeOrToken.text || ''
        : codeOrToken || '';
      const rawInfo = typeof codeOrToken === 'object' && codeOrToken !== null
        ? codeOrToken.lang || ''
        : infoString || '';
      const titleMatch = rawInfo.match(/title="([^"]+)"/);
      const lang = rawInfo.replace(/\s*title="[^"]*"/, '').trim();
      return renderCodeBlock(code, lang, titleMatch ? titleMatch[1] : '');
    };
    renderer.image = (href, title, alt) =>
      `<figure class="post-figure"><img src="${href}" alt="${alt || ''}" loading="lazy"/>${alt ? `<figcaption>${alt}</figcaption>` : ''}</figure>`;
    renderer.heading = function(text, level) {
      const t = typeof text === 'object' ? text.text : text;
      const l = typeof text === 'object' ? text.depth : level;
      return `<h${l} id="${slugify(t)}">${t}</h${l}>`;
    };
    window.marked.setOptions({ breaks: true, gfm: true });
    return window.marked.parse(md, { renderer });
  }
  return md;
}

/* ── TOC ── */
function buildTOC(html) {
  const headings = [...html.matchAll(/<h2 id="([^"]+)">([^<]+)<\/h2>/g)];
  if (headings.length < 2) return '';
  return `<div class="post-toc"><h4>Índice</h4><div class="toc-list">${headings.map(([, id, text]) => `<a href="#${id}" class="toc-link">${text}</a>`).join('')}</div></div>`;
}

function initTOCSpy() {
  const links    = document.querySelectorAll('.toc-link');
  const headings = [...document.querySelectorAll('.post-body h2, .project-content h2')];
  if (!links.length || !headings.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const a = [...links].find(l => l.getAttribute('href') === '#' + e.target.id);
        if (a) a.classList.add('active');
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px' });
  headings.forEach(h => obs.observe(h));
}

/* ── Carrossel ── */
function initCarousels() {
  document.querySelectorAll('.carousel').forEach(c => {
    const slides = c.querySelectorAll('.carousel-slide');
    const dots   = c.querySelectorAll('.carousel-dot');
    let current  = 0;
    function goTo(n) {
      slides[current].classList.remove('active');
      dots[current] && dots[current].classList.remove('active');
      current = (n + slides.length) % slides.length;
      slides[current].classList.add('active');
      dots[current] && dots[current].classList.add('active');
    }
    c.querySelector('.carousel-prev')?.addEventListener('click', () => goTo(current - 1));
    c.querySelector('.carousel-next')?.addEventListener('click', () => goTo(current + 1));
    dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));
    let startX = 0;
    c.addEventListener('touchstart', e => { startX = e.touches[0].clientX; });
    c.addEventListener('touchend',   e => { const dx = e.changedTouches[0].clientX - startX; if (Math.abs(dx) > 50) goTo(dx < 0 ? current + 1 : current - 1); });
  });
}

/* ── Fallback para imagens em falta nos cards ── */
function handleImgError(img) {
  const cat     = img.dataset.fallbackCat || '';
  const wrapper = img.parentElement;
  if (wrapper) wrapper.innerHTML = thumbPlaceholder(cat);
}

/* ── Erros de media dentro do body de posts/projetos ── */
function initBodyMediaErrors() {
  // Imagens simples dentro de figures
  document.querySelectorAll('.post-body figure img, .project-content figure img').forEach(img => {
    if (img.complete && img.naturalWidth === 0) {
      img.closest('figure')?.classList.add('img-missing');
    } else {
      img.addEventListener('error', () => img.closest('figure')?.classList.add('img-missing'));
    }
  });

  // Imagens dentro de carrosseis
  document.querySelectorAll('.carousel-slide img').forEach(img => {
    if (img.complete && img.naturalWidth === 0) {
      img.closest('.carousel-slide')?.classList.add('slide-missing');
    } else {
      img.addEventListener('error', () => img.closest('.carousel-slide')?.classList.add('slide-missing'));
    }
  });

  // Iframes de vídeo (YouTube/Vimeo não dão erro, mas vídeo local pode falhar)
  document.querySelectorAll('.video-wrap video').forEach(video => {
    video.addEventListener('error', () => video.closest('.video-wrap')?.classList.add('video-missing'));
  });
}

/* ══════════════════════════════════════
   LIGHTBOX - imagens do corpo e do carrossel
══════════════════════════════════════ */
let lightboxEl = null;

function getLightbox() {
  if (lightboxEl) return lightboxEl;
  lightboxEl = document.createElement('div');
  lightboxEl.className = 'lightbox';
  lightboxEl.setAttribute('role', 'dialog');
  lightboxEl.setAttribute('aria-modal', 'true');
  lightboxEl.setAttribute('aria-label', 'Imagem ampliada');
  lightboxEl.innerHTML = '<button class="lightbox-close" type="button" aria-label="Fechar imagem">&times;</button><figure class="lightbox-figure"><img alt=""/><figcaption></figcaption></figure>';
  // Fechar ao clicar fora da imagem.
  lightboxEl.addEventListener('click', e => { if (e.target === lightboxEl) closeLightbox(); });
  lightboxEl.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
  document.body.appendChild(lightboxEl);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
  return lightboxEl;
}

function openLightbox(src, alt, caption) {
  const el  = getLightbox();
  const img = el.querySelector('img');
  const cap = el.querySelector('figcaption');
  img.src = src;
  img.alt = alt || '';
  cap.textContent = caption || '';
  cap.hidden = !caption;
  el.classList.add('open');
  document.body.classList.add('lightbox-open');
  el.querySelector('.lightbox-close').focus();
}

function closeLightbox() {
  if (!lightboxEl || !lightboxEl.classList.contains('open')) return;
  lightboxEl.classList.remove('open');
  document.body.classList.remove('lightbox-open');
}

function initLightbox() {
  document.querySelectorAll('.post-figure img, .project-content figure img, .carousel-slide img').forEach(img => {
    if (img.dataset.lightbox) return;
    img.dataset.lightbox = '1';
    img.classList.add('lightbox-img');
    img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', 'Ampliar imagem');
    const open = () => {
      // Imagens em falta não abrem.
      if (img.closest('.img-missing') || img.closest('.slide-missing')) return;
      if (img.complete && img.naturalWidth === 0) return;
      const caption = img.closest('.carousel-slide')?.querySelector('.carousel-caption')?.textContent
        || img.closest('figure')?.querySelector('figcaption')?.textContent
        || img.alt || '';
      openLightbox(img.currentSrc || img.src, img.alt, caption);
    };
    img.addEventListener('click', open);
    img.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });
  getLightbox();
}

/* ── Barra de progresso de leitura (só em posts) ── */
function initReadingProgress() {
  const target = document.getElementById('post-body');
  if (!target) return;
  const bar = document.createElement('div');
  bar.className = 'reading-progress';
  bar.setAttribute('role', 'progressbar');
  bar.setAttribute('aria-label', 'Progresso de leitura');
  bar.setAttribute('aria-valuemin', '0');
  bar.setAttribute('aria-valuemax', '100');
  bar.setAttribute('aria-valuenow', '0');
  document.body.appendChild(bar);

  const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 0;
  let ticking = false;
  function update() {
    const rect  = target.getBoundingClientRect();
    const start = window.scrollY + rect.top - navH;
    const total = rect.height - window.innerHeight + navH;
    const pct   = total <= 0 ? 100 : Math.min(100, Math.max(0, ((window.scrollY - start) / total) * 100));
    bar.style.width = pct + '%';
    bar.setAttribute('aria-valuenow', String(Math.round(pct)));
  }
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { update(); ticking = false; });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
}

/* ══════════════════════════════════════
   EFEITOS DE ENTRADA (correm uma só vez)
   Observador partilhado: acrescenta `is-in`
   ao elemento, corre o callback e deixa de
   observar. Nunca volta a disparar.
══════════════════════════════════════ */
const onceCallbacks = new WeakMap();
let onceObserver = null;

function prefersReducedMotion() {
  return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

function getOnceObserver() {
  if (onceObserver) return onceObserver;
  onceObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      obs.unobserve(el);
      el.classList.add('is-in');
      const cb = onceCallbacks.get(el);
      onceCallbacks.delete(el);
      if (cb) cb(el);
    });
  }, { threshold: 0, rootMargin: '0px 0px -60px 0px' });
  return onceObserver;
}

function initOnce(el, cb) {
  if (!el || el.dataset.onceObserved) return;
  el.dataset.onceObserved = '1';
  if (cb) onceCallbacks.set(el, cb);
  getOnceObserver().observe(el);
}

/* ── Copiar para a área de transferência ── */
async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}
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
    return ok;
  } catch { return false; }
}

/* ── Blocos de código: copiar + revelar linhas ── */
function initCodeBlocks(root = document) {
  root.querySelectorAll('.code-block').forEach(block => {
    if (block.dataset.codeReady) return;
    block.dataset.codeReady = '1';
    const codeEl = block.querySelector('code');
    const btn    = block.querySelector('.code-copy');
    const label  = block.querySelector('.code-copy-label');
    if (btn && codeEl && label) {
      btn.addEventListener('click', async () => {
        // Nos blocos de terminal cada linha é um span: junta-as com quebras de linha.
        const lines = codeEl.querySelectorAll('.code-line');
        const text  = lines.length ? [...lines].map(l => l.textContent).join('\n') : codeEl.textContent;
        const ok = await copyText(text);
        label.textContent = ok ? 'Copiado' : 'Falhou';
        btn.classList.toggle('is-copied', ok);
        clearTimeout(btn.copyTimer);
        btn.copyTimer = setTimeout(() => {
          label.textContent = 'Copiar';
          btn.classList.remove('is-copied');
        }, 1500);
      });
    }
    if (block.classList.contains('code-block-shell')) initOnce(block);
  });
}

/* ── Números que contam uma vez ── */
// Devolve o inteiro a animar e o resto (unidade) que fica estático.
// Valores como "95/100" ou "1.5" ficam parados: não são um inteiro
// seguido de uma unidade simples.
function splitCountable(text) {
  const m = String(text).trim().match(/^(\d+)([^\d]*)$/);
  if (!m) return null;
  const rest = m[2];
  if (rest && !/^\s*[A-Za-zµ%°]{1,4}$/.test(rest)) return null;
  return { num: Number(m[1]), rest };
}

function countUpValue(el, num, rest) {
  const duration = 900;
  const start = performance.now();
  const step = now => {
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(num * eased) + rest;
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = num + rest;
  };
  requestAnimationFrame(step);
}

function initStats(root = document) {
  root.querySelectorAll('.stats-block').forEach(block => {
    if (block.dataset.statsReady) return;
    block.dataset.statsReady = '1';
    if (prefersReducedMotion()) return;
    const values  = [...block.querySelectorAll('.stat-value')];
    const targets = values.map(el => splitCountable(el.textContent));
    if (!targets.some(t => t && t.num > 0)) return;
    initOnce(block, () => {
      values.forEach((el, i) => {
        const t = targets[i];
        if (t && t.num > 0) countUpValue(el, t.num, t.rest);
      });
    });
  });
}

/* ── Efeitos do conteúdo carregado por Markdown ── */
function initContentEffects(root = document) {
  initCodeBlocks(root);
  initStats(root);
  root.querySelectorAll('.timeline-card, .content-callout, .repo-card').forEach(el => initOnce(el));
}

/* ── Reveal ── */
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) { setTimeout(() => e.target.classList.add('visible'), i * 70); obs.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

/* ══════════════════════════════════════
   CACHE DE METADADOS
   Evita repetir os mesmos fetches entre
   relacionados, séries e listagens.
══════════════════════════════════════ */
const metaCache = { posts: new Map(), projects: new Map(), postsAll: null, projectsAll: null };

async function fetchPostMeta(id) {
  if (metaCache.posts.has(id)) return metaCache.posts.get(id);
  const raw = await fetchMD(`content/posts/${id}.md`);
  const { meta } = parseFrontmatter(raw);
  const item = { id, ...meta };
  metaCache.posts.set(id, item);
  return item;
}

async function fetchProjectMeta(id) {
  if (metaCache.projects.has(id)) return metaCache.projects.get(id);
  const raw = await fetchMD(`content/projects/${id}.md`);
  const { meta } = parseFrontmatter(raw);
  const item = { id, ...meta };
  metaCache.projects.set(id, item);
  return item;
}

function loadAllPostsMeta() {
  if (!metaCache.postsAll) {
    metaCache.postsAll = fetchMD('data/posts-index.json').then(t => JSON.parse(t))
      .then(index => Promise.all(index.map(fetchPostMeta)))
      .then(posts => { rememberSeriesTotals(posts); return posts; });
  }
  return metaCache.postsAll;
}

function loadAllProjectsMeta() {
  if (!metaCache.projectsAll) {
    metaCache.projectsAll = fetchMD('data/projects-index.json').then(t => JSON.parse(t))
      .then(index => Promise.all(index.map(fetchProjectMeta)));
  }
  return metaCache.projectsAll;
}

/* ══════════════════════════════════════
   SÉRIE DE ARTIGOS
══════════════════════════════════════ */
async function buildSeriesNav(currentId, meta) {
  if (!meta.series) return { top: '', bottom: '' };
  let members = [];
  try {
    members = (await loadAllPostsMeta()).filter(p => p.series === meta.series);
  } catch {}
  if (!members.some(p => p.id === currentId)) members.push({ id: currentId, ...meta });
  members.sort((a, b) => (Number(a.seriesPart) || 0) - (Number(b.seriesPart) || 0));

  const total = members.length;
  const pos   = members.findIndex(p => p.id === currentId);
  const num   = Number(meta.seriesPart) || pos + 1;
  const link  = id => `blog-post.html?id=${encodeURIComponent(id)}`;
  const name  = p => escapeHtml(p.title || p.id);

  const list = members.map((p, i) => p.id === currentId
    ? `<li class="current" aria-current="page"><span>${i + 1}. ${name(p)}</span></li>`
    : `<li><a href="${link(p.id)}">${i + 1}. ${name(p)}</a></li>`
  ).join('');

  const top = `<div class="series-box" role="navigation" aria-label="Série de artigos">
    <span class="series-kicker">Série</span>
    <div class="series-head"><strong class="series-name">${escapeHtml(meta.series)}</strong><span class="series-count">Parte ${num} de ${total}</span></div>
    <ol class="series-list">${list}</ol>
  </div>`;

  const links = [];
  if (members[pos - 1]) links.push(`<a class="series-link series-prev" href="${link(members[pos - 1].id)}"><span>← Anterior</span><strong>${name(members[pos - 1])}</strong></a>`);
  if (members[pos + 1]) links.push(`<a class="series-link series-next" href="${link(members[pos + 1].id)}"><span>Seguinte →</span><strong>${name(members[pos + 1])}</strong></a>`);
  const bottom = links.length
    ? `<div class="series-nav${links.length === 1 ? ' series-nav-single' : ''}" role="navigation" aria-label="Navegação da série">${links.join('')}</div>`
    : '';

  return { top, bottom };
}

/* ── Relacionados curados (related: [post:id, project:id]) ── */
async function renderRelatedInto(el, related) {
  const items = (await Promise.all(related.map(async entry => {
    const [type, ...rest] = String(entry).split(':');
    const id = rest.join(':').trim();
    if (!id) return null;
    try {
      if (type === 'project') return { type: 'project', data: await fetchProjectMeta(id) };
      if (type === 'post')    return { type: 'post',    data: await fetchPostMeta(id) };
    } catch (e) { console.error(e); }
    return null;
  }))).filter(Boolean);
  if (!items.length) return;
  el.innerHTML = items.map(i => i.type === 'project' ? projectCard(i.data) : blogCard(i.data)).join('');
  // Cards de tipos diferentes na mesma grelha precisam de gap próprio.
  if (new Set(items.map(i => i.type)).size > 1) el.classList.add('related-mixed');
}

/* ══════════════════════════════════════
   BLOG LIST
══════════════════════════════════════ */
async function loadBlogList() {
  const grid     = document.getElementById('blog-grid');
  const featured = document.getElementById('blog-featured');
  if (!grid) return;
  try {
    const index = await fetchMD('data/posts-index.json').then(t => JSON.parse(t));
    const posts  = await Promise.all(index.map(async id => {
      const raw = await fetchMD(`content/posts/${id}.md`);
      const { meta } = parseFrontmatter(raw);
      return { id, ...meta };
    }));
    rememberSeriesTotals(posts);
    buildFilters(posts, 'post');
    if (featured) featured.innerHTML = posts.slice(0, 2).map(p => featuredCard(p)).join('');
    grid.innerHTML = posts.map(p => blogCard(p)).join('');
    initFilters('post');
  } catch (e) {
    grid.innerHTML = '<p class="error-msg">Não foi possível carregar os posts.</p>';
    console.error(e);
  }
}

/* Miniatura do card. Vai dentro de `.thumb-media` para o
   fallback de imagem em falta não apagar o resto do bloco. */
function cardThumb(p, cats) {
  return `<div class="thumb-media">${p.cover
    ? `<img src="${p.cover}" alt="${escapeHtml(p.title || '')}" loading="lazy" style="width:100%;height:100%;object-fit:cover" data-fallback-cat="${cats[0] || ''}" onerror="handleImgError(this)"/>`
    : thumbPlaceholder(cats[0])}</div>`;
}

/* Etiqueta de série: "Diário do Homelab · 3/7". Os totais são
   preenchidos sempre que a lista completa de posts é conhecida. */
const seriesTotals = {};

function rememberSeriesTotals(posts) {
  Object.keys(seriesTotals).forEach(key => delete seriesTotals[key]);
  posts.forEach(p => {
    if (!p || !p.series) return;
    seriesTotals[p.series] = (seriesTotals[p.series] || 0) + 1;
  });
}

function seriesBadge(p) {
  if (!p || !p.series) return '';
  const part  = Number(p.seriesPart) || 0;
  const total = seriesTotals[p.series] || 0;
  const count = part ? (total ? `${part}/${total}` : String(part)) : '';
  const label = count ? `${p.series} · ${count}` : String(p.series);
  return `<span class="blog-series">${escapeHtml(label)}</span>`;
}

/* Linha de kicker do card: primeira categoria + data no fim. */
function cardKicker(p) {
  const cat = getCategories(p)[0] || '';
  return `<div class="blog-meta">
      ${cat ? `<span class="blog-cat">${escapeHtml(cat)}</span>` : ''}
      ${p.date ? `<span class="blog-date">${escapeHtml(p.date)}</span>` : ''}
    </div>`;
}

function blogCard(p, linkPrefix = '') {
  const cats = getCategories(p);
  return `
<a href="${linkPrefix}blog-post.html?id=${p.id}" class="blog-card" data-category="${cats.join(',')}">
  <span class="blog-accent-line" aria-hidden="true"></span>
  <div class="blog-thumb">${cardThumb(p, cats)}${seriesBadge(p)}</div>
  <div class="blog-body">
    ${cardKicker(p)}
    <div class="blog-title">${escapeHtml(p.title || '')}</div>
    <div class="blog-excerpt">${escapeHtml(p.desc || '')}</div>
    <div class="blog-footer">
      <span class="read-time">${p.readTime || ''}</span>
      <span class="blog-arrow" aria-hidden="true">→</span>
    </div>
  </div>
</a>`;
}

function featuredCard(p) {
  const cats = getCategories(p);
  return `
<a href="blog-post.html?id=${p.id}" class="blog-featured-card">
  <span class="blog-accent-line" aria-hidden="true"></span>
  <div class="blog-featured-thumb">${cardThumb(p, cats)}${seriesBadge(p)}</div>
  <div class="blog-featured-body">
    ${cardKicker(p)}
    <div class="blog-featured-title">${escapeHtml(p.title || '')}</div>
    <p class="blog-featured-excerpt">${p.desc || ''}</p>
    <div class="blog-footer">
      <span class="read-time">${p.readTime || ''}</span>
      <span class="blog-arrow" aria-hidden="true">→</span>
    </div>
  </div>
</a>`;
}

/* ══════════════════════════════════════
   BLOG POST
══════════════════════════════════════ */
async function loadBlogPost() {
  const container = document.getElementById('post-container');
  if (!container) return;
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) { container.innerHTML = '<p class="error-msg">Post não encontrado.</p>'; return; }
  try {
    const raw = await fetchMD(`content/posts/${id}.md`);
    const { meta, body } = parseFrontmatter(raw);
    // Usa o frontmatter do post para alimentar previews e dados estruturados.
    const postUrl = `https://cabacatech.com/pages/blog-post.html?id=${encodeURIComponent(id)}`;
    const postImage = meta.cover
      ? new URL(meta.cover, 'https://cabacatech.com/').href
      : 'https://res.cloudinary.com/ddmoo3e4n/image/upload/c_fill,g_face,z_0.85,w_1200,h_630,q_auto/f_auto/v1780519074/Ganda_foto_doocur.jpg';
    updateDynamicSeo({
      title: meta.title,
      description: meta.desc || 'Artigo de Tiago Cabaça sobre desenvolvimento web, tecnologia e projetos pessoais.',
      url: postUrl,
      image: postImage,
      type: 'article',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        '@id': `${postUrl}#article`,
        url: postUrl,
        headline: meta.title,
        description: meta.desc || '',
        image: postImage,
        author: { '@id': 'https://cabacatech.com/#person' },
        publisher: { '@id': 'https://cabacatech.com/#person' },
        datePublished: toIsoMonth(meta.date),
        inLanguage: 'pt-PT',
        mainEntityOfPage: postUrl
      }
    });

    const hero = document.getElementById('post-hero');
    if (hero) {
      const cats    = getCategories(meta);
      const catTags = cats.map(c => `<span class="blog-cat">${c}</span>`).join('');
      const cover   = meta.cover ? `<div class="post-cover"><img src="${meta.cover}" alt="${meta.title}"/></div>` : '';
      hero.innerHTML = `
        <div class="container" style="position:relative;z-index:2">
          <div style="margin-bottom:12px"><a href="blog.html" style="font-family:var(--font-mono);font-size:11px;color:var(--muted2);letter-spacing:.08em">← Blog</a></div>
          <div class="post-meta">
            ${catTags}
            ${meta.date ? `<span class="blog-date">${escapeHtml(meta.date)}</span>` : ''}
            ${meta.readTime ? `<span class="post-meta-sep" aria-hidden="true">·</span><span class="read-time">${escapeHtml(meta.readTime)}</span>` : ''}
          </div>
          <h1 class="section-title" style="max-width:760px">${meta.title}</h1>
          ${cover}
        </div>
        <div class="page-hero-bg">POST</div>`;
    }

    const processed = processBlocks(body);
    const html      = renderMarkdown(processed);

    const tocEl = document.getElementById('post-toc-container');
    if (tocEl) tocEl.innerHTML = buildTOC(html);

    // Caixa da série no topo e navegação anterior/seguinte no fim.
    const series = await buildSeriesNav(id, meta);

    const bodyEl = document.getElementById('post-body');
    if (bodyEl) bodyEl.innerHTML = series.top + html + series.bottom;

    const metaEl = document.getElementById('post-meta-sidebar');
    if (metaEl) {
      const cats    = getCategories(meta);
      const catTags = cats.map(c => `<span class="tag" style="margin:2px 4px 2px 0">${c}</span>`).join('');
      metaEl.innerHTML = `
        <div class="detail-info-card">
          ${meta.date   ? `<div class="detail-info-row"><span>Publicado</span><span>${meta.date}</span></div>` : ''}
          ${meta.readTime ? `<div class="detail-info-row"><span>Leitura</span><span>${meta.readTime}</span></div>` : ''}
          ${cats.length ? `<div class="detail-info-row" style="flex-direction:column;align-items:flex-start;gap:6px;border-bottom:none"><span style="font-family:var(--font-mono);font-size:11px;color:var(--muted)">Categorias</span><div>${catTags}</div></div>` : ''}
        </div>`;
    }

    initTOCSpy(); initCarousels(); initReveal(); initBodyMediaErrors();
    initLightbox(); initReadingProgress(); initContentEffects();
    loadRelatedPosts(id, meta.related);
  } catch (e) {
    container.innerHTML = '<p class="error-msg">Não foi possível carregar o post.</p>';
    console.error(e);
  }
}

async function loadRelatedPosts(currentId, related) {
  const el = document.getElementById('related-posts');
  if (!el) return;
  if (Array.isArray(related) && related.length) {
    await renderRelatedInto(el, related);
    return;
  }
  try {
    const all = await loadAllPostsMeta();
    el.innerHTML = all.filter(p => p.id !== currentId).slice(0, 3).map(p => blogCard(p)).join('');
  } catch {}
}

/* ══════════════════════════════════════
   GITHUB
══════════════════════════════════════ */
const GITHUB_MARK = '<svg class="gh-mark" width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z"/></svg>';

// "https://github.com/Cabacadosinformaticos/fieldnote" -> "Cabacadosinformaticos/fieldnote"
function repoPath(url) {
  return String(url)
    .replace(/^https?:\/\/(www\.)?github\.com\//i, '')
    .replace(/\.git$/i, '')
    .replace(/\/+$/, '');
}

function repoCard(url) {
  return `<aside class="repo-card">
    <span class="repo-kicker">Código aberto</span>
    <span class="repo-path">${escapeHtml(repoPath(url))}</span>
    <p class="repo-text">Explora o código, a documentação e o histórico do projeto.</p>
    <a class="repo-btn" href="${escapeHtml(url)}" target="_blank" rel="noopener">${GITHUB_MARK}<span>Abrir no GitHub</span><span class="repo-arrow" aria-hidden="true">→</span></a>
  </aside>`;
}

/* ══════════════════════════════════════
   PROJECTS LIST
══════════════════════════════════════ */
async function loadProjectsList() {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;
  try {
    const index    = await fetchMD('data/projects-index.json').then(t => JSON.parse(t));
    const projects = await Promise.all(index.map(async (id, i) => {
      const raw = await fetchMD(`content/projects/${id}.md`);
      const { meta } = parseFrontmatter(raw);
      return { id, num: String(i + 1).padStart(2, '0'), ...meta };
    }));
    buildFilters(projects, 'project');
    grid.innerHTML = projects.map(p => projectCard(p)).join('');
    initFilters('project');
  } catch (e) {
    grid.innerHTML = '<p class="error-msg">Não foi possível carregar os projetos.</p>';
    console.error(e);
  }
}

function projectCard(p, linkPrefix = '') {
  const cats      = getCategories(p);
  const thumb     = p.cover
    ? `<img src="${p.cover}" alt="${escapeHtml(p.title || '')}" loading="lazy" style="width:100%;height:100%;object-fit:cover" data-fallback-cat="${cats[0] || ''}" onerror="handleImgError(this)"/>`
    : thumbPlaceholder(cats[0]);
  const stackTags = Array.isArray(p.stack) ? p.stack.slice(0, 3).map(t => `<span class="project-tag">${t}</span>`).join('') : '';
  return `
<div class="project-card" data-category="${cats.join(',')}">
  <div class="project-accent-line"></div>
  <div class="project-thumb">${thumb}</div>
  <div class="project-body">
    <div class="project-tags">${stackTags}</div>
    <div class="project-name">${escapeHtml(p.title || '')}</div>
    <div class="project-desc">${escapeHtml(p.desc || '')}</div>
    <div class="project-links">
      <a href="${linkPrefix}project-detail.html?id=${p.id}" class="btn-ghost">Ver projeto</a>
      ${p.github ? `<a href="${p.github}" target="_blank" rel="noopener" class="project-link-pill">${GITHUB_MARK}Código</a>` : ''}
      ${p.live   ? `<a href="${p.live}"   target="_blank" rel="noopener" class="project-link-pill project-link-pill-live">Online</a>` : ''}
    </div>
  </div>
</div>`;
}

/* ══════════════════════════════════════
   PROJECT DETAIL
══════════════════════════════════════ */
async function loadProjectDetail() {
  const container = document.getElementById('project-container');
  if (!container) return;
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) { container.innerHTML = '<p class="error-msg">Projeto não encontrado.</p>'; return; }
  try {
    const raw = await fetchMD(`content/projects/${id}.md`);
    const { meta, body } = parseFrontmatter(raw);
    // Usa o frontmatter do projeto para alimentar previews e dados estruturados.
    const projectUrl = `https://cabacatech.com/pages/project-detail.html?id=${encodeURIComponent(id)}`;
    const projectImage = meta.cover
      ? new URL(meta.cover, 'https://cabacatech.com/').href
      : 'https://res.cloudinary.com/ddmoo3e4n/image/upload/c_fill,g_face,z_0.85,w_1200,h_630,q_auto/f_auto/v1780519074/Ganda_foto_doocur.jpg';
    updateDynamicSeo({
      title: meta.title,
      description: meta.desc || 'Projeto de Tiago Cabaça com contexto, stack técnica e decisões de desenvolvimento.',
      url: projectUrl,
      image: projectImage,
      type: 'article',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        '@id': `${projectUrl}#project`,
        url: projectUrl,
        name: meta.title,
        description: meta.desc || '',
        image: projectImage,
        creator: { '@id': 'https://cabacatech.com/#person' },
        keywords: Array.isArray(meta.stack) ? meta.stack.join(', ') : undefined,
        dateCreated: meta.year || undefined,
        inLanguage: 'pt-PT'
      }
    });

    const hero = document.getElementById('project-hero');
    if (hero) {
      const stackTags = Array.isArray(meta.stack) ? meta.stack.map(t => `<span class="project-tag">${t}</span>`).join('') : '';
      const githubCta = meta.github ? `
            <a href="${escapeHtml(meta.github)}" target="_blank" rel="noopener" class="btn btn-primary github-cta">
              ${GITHUB_MARK}<span>Ver código no GitHub</span><span class="github-cta-arrow" aria-hidden="true">→</span>
              <span class="corner tl" aria-hidden="true"></span><span class="corner tr" aria-hidden="true"></span><span class="corner bl" aria-hidden="true"></span><span class="corner br" aria-hidden="true"></span>
            </a>` : '';
      const liveCta = meta.live ? `\n            <a href="${escapeHtml(meta.live)}" target="_blank" rel="noopener" class="btn btn-outline">Ver online <span aria-hidden="true">→</span></a>` : '';
      hero.innerHTML = `
        <div class="container" style="position:relative;z-index:2">
          <div style="margin-bottom:12px"><a href="projects.html" style="font-family:var(--font-mono);font-size:11px;color:var(--muted2);letter-spacing:.08em">← Projetos</a></div>
          <div class="project-tags" style="margin-bottom:16px">${stackTags}</div>
          <h1 class="section-title">${meta.title}</h1>
          ${(githubCta || liveCta) ? `<div class="project-hero-actions">${githubCta}${liveCta}</div>` : ''}
        </div>
        <div class="page-hero-bg">PROJECT</div>`;
    }

    const processed = processBlocks(body);
    const html      = renderMarkdown(processed);

    const sidebar = document.getElementById('project-sidebar');
    if (sidebar) {
      const cats      = getCategories(meta);
      const catTags   = cats.map(c => `<span class="tag" style="margin:2px 4px 2px 0">${c}</span>`).join('');
      const stackList = Array.isArray(meta.stack) ? meta.stack.map(t => `<span class="tag" style="margin:2px 4px 2px 0">${t}</span>`).join('') : '';
      const statusColor = meta.status === 'Em produção' ? '#00e87a'
        : meta.status === 'Concluído' ? '#38bdf8'
        : meta.status === 'Em desenvolvimento' ? 'var(--accent)'
        : 'var(--muted2)';
      sidebar.innerHTML = `
        ${meta.github ? repoCard(meta.github) : ''}
        <div class="detail-info-card">
          ${meta.year     ? `<div class="detail-info-row"><span>Ano</span><span>${meta.year}</span></div>` : ''}
          ${meta.type     ? `<div class="detail-info-row"><span>Tipo</span><span>${meta.type}</span></div>` : ''}
          ${meta.duration ? `<div class="detail-info-row"><span>Duração</span><span>${meta.duration}</span></div>` : ''}
          ${meta.status   ? `<div class="detail-info-row"><span>Estado</span><span style="color:${statusColor};font-family:var(--font-mono);font-size:11px">● ${meta.status}</span></div>` : ''}
          ${cats.length   ? `<div class="detail-info-row" style="flex-direction:column;align-items:flex-start;gap:6px"><span style="font-family:var(--font-mono);font-size:11px;color:var(--muted)">Categorias</span><div>${catTags}</div></div>` : ''}
          ${meta.stack    ? `<div class="detail-info-row" style="flex-direction:column;align-items:flex-start;gap:8px;border-bottom:none"><span style="font-family:var(--font-mono);font-size:11px;color:var(--muted)">Stack</span><div>${stackList}</div></div>` : ''}
        </div>`;
      // Índice no sidebar quando o projeto tem 3 ou mais secções.
      if ((html.match(/<h2 id="/g) || []).length >= 3) sidebar.innerHTML += buildTOC(html);
    }

    const bodyEl    = document.getElementById('project-body');
    if (bodyEl) bodyEl.innerHTML = html;

    initCarousels(); initReveal(); initTOCSpy(); initBodyMediaErrors(); initLightbox();
    initContentEffects();
    loadRelatedProjects(id, meta.related);
  } catch (e) {
    container.innerHTML = '<p class="error-msg">Não foi possível carregar o projeto.</p>';
    console.error(e);
  }
}

async function loadRelatedProjects(currentId, related) {
  const el = document.getElementById('related-projects');
  if (!el) return;
  if (Array.isArray(related) && related.length) {
    await renderRelatedInto(el, related);
    return;
  }
  try {
    const all = await loadAllProjectsMeta();
    el.innerHTML = all.filter(p => p.id !== currentId).slice(0, 3).map(p => projectCard(p)).join('');
  } catch {}
}

/* ══════════════════════════════════════
   INDEX PREVIEWS
══════════════════════════════════════ */
async function loadIndexPreviews() {
  const projGrid = document.getElementById('index-projects');
  if (projGrid) {
    try {
      const index    = await fetchMD('data/projects-index.json').then(t => JSON.parse(t));
      const projects = await Promise.all(index.slice(0, 3).map(async (id, i) => {
        const raw = await fetchMD(`content/projects/${id}.md`);
        const { meta } = parseFrontmatter(raw);
        return { id, num: String(i + 1).padStart(2, '0'), ...meta };
      }));
      projGrid.innerHTML = projects.map(p => projectCard(p, 'pages/')).join('');
    } catch {}
  }

  const blogGrid = document.getElementById('index-blog');
  if (blogGrid) {
    try {
      // A lista completa dá os totais das séries para o selo dos cards.
      const posts = (await loadAllPostsMeta()).slice(0, 3);
      blogGrid.innerHTML = posts.map(p => blogCard(p, 'pages/')).join('');
    } catch {}
  }
}

/* ══════════════════════════════════════
   FILTROS - suporta múltiplas categorias
══════════════════════════════════════ */
function buildFilters(items, type) {
  const bar = document.getElementById(`${type}-filters`);
  if (!bar) return;
  const allCats = new Set();
  items.forEach(item => getCategories(item).forEach(c => allCats.add(c)));
  bar.innerHTML = [
    `<button class="filter-btn active" data-filter="all">Todos</button>`,
    ...[...allCats].map(c => `<button class="filter-btn" data-filter="${c}">${c}</button>`)
  ].join('');
}

function initFilters(type) {
  const bar    = document.getElementById(`${type}-filters`);
  const gridId = type === 'post' ? 'blog-grid' : 'projects-grid';
  const grid   = document.getElementById(gridId);
  if (!bar || !grid) return;
  bar.addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    bar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const cat = btn.dataset.filter;
    grid.querySelectorAll('[data-category]').forEach(card => {
      if (cat === 'all') { card.style.display = ''; return; }
      card.style.display = card.dataset.category.split(',').includes(cat) ? '' : 'none';
    });
  });
}

/* ══════════════════════════════════════
   SEARCH
══════════════════════════════════════ */
function initSearch() {
  const input = document.querySelector('.blog-search');
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    document.querySelectorAll('.blog-card').forEach(card => {
      const title = card.querySelector('.blog-title')?.textContent.toLowerCase() || '';
      const cats  = (card.dataset.category || '').toLowerCase();
      const exc   = card.querySelector('.blog-excerpt')?.textContent.toLowerCase() || '';
      card.style.display = (!q || title.includes(q) || cats.includes(q) || exc.includes(q)) ? '' : 'none';
    });
  });
}

/* ══════════════════════════════════════
   INIT
══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  if (path.endsWith('index.html') || path === '/' || path.endsWith('/'))   loadIndexPreviews();
  if (path.includes('blog.html') && !path.includes('blog-post'))           { loadBlogList(); initSearch(); }
  if (path.includes('blog-post.html'))                                      loadBlogPost();
  if (path.includes('projects.html') && !path.includes('project-detail'))  loadProjectsList();
  if (path.includes('project-detail.html'))                                 loadProjectDetail();
  initReveal();
});

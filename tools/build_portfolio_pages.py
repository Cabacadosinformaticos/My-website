# Copyright (c) 2026 Tiago Cabaça. Released under the MIT License.
"""Build one static HTML page per portfolio project, plus the sitemap entries.

Crawlers and link previews do not run JavaScript, so each project needs a real
page with its own title, Open Graph image and visible text. This script reads
`data/portfolio.json` and the template `pages/portfolio-projeto.html`, then
writes `pages/portfolio/<id>.html` for every project. `assets/js/portfolio.js`
reads the id from `<body data-project-id>` and turns the static page into the
interactive case study (lightbox, horizontal strip, motion).

Run from the repository root before publishing:

    python tools/build_portfolio_pages.py

The same run rewrites the portfolio entries in `sitemap.xml` so the two stay in
sync. Other sitemap entries are left untouched.
"""

import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "portfolio.json"
TEMPLATE = ROOT / "pages" / "portfolio-projeto.html"
OUT_DIR = ROOT / "pages" / "portfolio"
SITEMAP = ROOT / "sitemap.xml"

BASE = "https://cabacatech.com"
LASTMOD = "2026-11-14"
TIPO = {"sites": "Site", "webapps": "Web app", "apps": "App", "design": "Design"}
ARROW_L = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" '
           'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
           '<path d="M20 12H5M11 6l-6 6 6 6"/></svg>')
CLOUDINARY = "f_auto,q_auto"


def esc(value):
    return html.escape(str(value), quote=True)


def og_image(url):
    """1200x630 JPEG crop for social previews."""
    return re.sub(r".webp$", ".jpg", url.replace(CLOUDINARY, "f_jpg,q_80,w_1200,h_630,c_fill,g_north"))


def srcset(url):
    widths = (800, 1200, 1600, 2400)
    return ", ".join(
        "{url} {w}w".format(url=url.replace(CLOUDINARY, "f_auto,q_auto,w_{0}".format(w)), w=w)
        for w in widths
    )


def img_tag(url, alt, cls, sizes, eager=False):
    priority = ' fetchpriority="high"' if eager else ""
    loading = "eager" if eager else "lazy"
    return (
        '<img src="{src}" srcset="{srcset}" sizes="{sizes}" width="1600" height="1000" '
        'alt="{alt}" class="{cls}" loading="{loading}" decoding="async" draggable="false"{priority}>'
    ).format(
        src=esc(url), srcset=esc(srcset(url)), sizes=esc(sizes), alt=esc(alt),
        cls=esc(cls), loading=loading, priority=priority,
    )


def mask_words(text):
    words = esc(text).split(" ")
    return " ".join(
        '<span class="pf-mask"><span style="--w:{i}">{word}</span></span>'.format(i=i, word=word)
        for i, word in enumerate(words)
    )


def caption(index, legend):
    return (
        '<figcaption class="pc-cap"><span class="pc-capn">{n:02d}</span>'
        '<span class="pc-capt">{legend}</span></figcaption>'
    ).format(n=index + 1, legend=esc(legend))


def zoom(index, project, sizes, eager=False):
    shot = project["ecras"][index]
    label = "Ampliar o ecrã {n} de {total}: {legend}".format(
        n=index + 1, total=len(project["ecras"]), legend=shot["legenda"])
    return (
        '<button class="pc-zoom" type="button" data-i="{i}" aria-label="{label}">'
        '<span class="pc-frame pf-fade">{img}</span></button>'
    ).format(
        i=index, label=esc(label),
        img=img_tag(shot["img"], project["nome"] + ": " + shot["legenda"],
                    "pc-img", sizes, eager),
    )


def story(project):
    tipos = ", ".join(TIPO[t] for t in project["tipo"])
    deliverables = "".join("<li>{0}</li>".format(esc(t)) for t in project["entregaveis"])
    tech = ", ".join(esc(t) for t in project["tecnologias"])
    return (
        '<section class="pc-story"><div class="pf-wrap pc-story-in">'
        '<dl class="pc-meta" data-in>'
        '<div><dt>Setor</dt><dd>{setor}</dd></div>'
        '<div><dt>Tipo</dt><dd>{tipos}</dd></div>'
        '<div><dt>Entregáveis</dt><dd><ul>{entregaveis}</ul></dd></div>'
        '<div><dt>Tecnologias</dt><dd>{tech}</dd></div>'
        '</dl>'
        '<div class="pc-texts">'
        '<div class="pc-block" data-in><h2 class="pc-h">O desafio</h2><p>{desafio}</p></div>'
        '<div class="pc-block" data-in><h2 class="pc-h">A abordagem</h2><p>{abordagem}</p></div>'
        '</div></div></section>'
    ).format(
        setor=esc(project["setor"]), tipos=esc(tipos), entregaveis=deliverables,
        tech=tech, desafio=esc(project["desafio"]), abordagem=esc(project["abordagem"]),
    )


def screens(project):
    shots = project["ecras"]
    rest = len(shots) - 1
    if rest <= 0:
        return ""

    strip_count = rest // 2 if rest >= 5 else 0
    stack_count = rest - strip_count
    pattern = ("wide", "l", "r")
    sizes = {
        "wide": "(min-width: 1360px) 1264px, 92vw",
        "l": "(min-width: 1360px) 840px, 66vw",
        "r": "(min-width: 1360px) 840px, 66vw",
    }

    stack = []
    for k in range(stack_count):
        index = 1 + k
        kind = pattern[k % len(pattern)]
        stack.append(
            '<figure class="pc-fig pc-{kind}" data-in">{zoom}{caption}</figure>'.format(
                kind=kind, zoom=zoom(index, project, sizes[kind]), caption=caption(index, shots[index]["legenda"]))
        )

    out = (
        '<section class="pc-shots"><div class="pf-wrap"><h2 class="pf-sr">Ecrãs</h2>'
        '<div class="pc-stack">{stack}</div></div></section>'
    ).format(stack="".join(stack))

    if strip_count:
        items = []
        for j in range(strip_count):
            index = 1 + stack_count + j
            items.append(
                '<figure class="pc-sfig">{zoom}{caption}</figure>'.format(
                    zoom=zoom(index, project, "(min-width: 980px) 980px, 62vw"),
                    caption=caption(index, shots[index]["legenda"]))
            )
        out += (
            '<section class="pc-strip"><h2 class="pf-sr">Mais ecrãs</h2>'
            '<div class="pc-track" tabindex="0" role="group" aria-label="{label}">{items}</div>'
            '<div class="pf-wrap"><div class="pc-progress" aria-hidden="true"><i></i></div></div>'
            '</section>'
        ).format(
            label=esc("Mais ecrãs de {0}. Usa as setas para andar para o lado.".format(project["nome"])),
            items="".join(items),
        )
    return out


def following(project, projects, index):
    if len(projects) < 2:
        return ""
    prev_project = projects[(index - 1) % len(projects)]
    next_project = projects[(index + 1) % len(projects)]
    return (
        '<div class="pc-next" role="navigation" aria-label="Outros projetos">'
        '<a class="pc-next-link" href="{next_id}.html">'
        '<span class="pf-wrap pc-next-top"><span class="pc-next-label">Seguinte</span>'
        '<span class="pc-next-name">{next_name}</span></span>'
        '<span class="pc-next-media pf-fade">{next_img}</span></a>'
        '<div class="pf-wrap pc-prev"><a class="pf-link-text" href="{prev_id}.html">{arrow}'
        'Anterior: {prev_name}</a></div>'
        '</div>'
    ).format(
        next_id=esc(next_project["id"]), next_name=esc(next_project["nome"]),
        next_img=img_tag(next_project["ecras"][0]["img"],
                         "Ecrãs do projeto " + next_project["nome"],
                         "pc-next-img", "(min-width: 1400px) 1400px, 100vw"),
        prev_id=esc(prev_project["id"]), prev_name=esc(prev_project["nome"]),
        arrow=ARROW_L,
    )


def closing():
    return (
        '<section class="pf-end"><div class="pf-wrap">'
        '<h2 class="pf-end-h" data-in>Queres algo assim para o teu negócio?</h2>'
        '<div class="pf-end-row" data-in>'
        '<p>Conta-me o que precisas. A primeira conversa não custa nada nem te compromete.</p>'
        '<div class="pf-btns"><a href="../contact.html" class="btn btn-primary">Falar sobre um projeto</a>'
        '<a href="../servicos.html" class="pf-link-text">Ver serviços</a></div>'
        '</div></div></section>'
    )


def main_markup(project, projects, index):
    cover = project["ecras"][0]
    return (
        '<header class="pc-hero"><div class="pf-wrap">'
        '<a class="pc-back" href="../portfolio.html">{arrow}Portfólio</a>'
        '<h1 class="pc-title">{name}</h1>'
        '<p class="pc-sum">{summary}</p></div>'
        '<figure class="pc-cover">{cover_zoom}'
        '<div class="pf-wrap">{cover_caption}</div></figure></header>'
        '{story}{screens}{following}{closing}'
    ).format(
        arrow=ARROW_L,
        name=mask_words(project["nome"]),
        summary=esc(project["resumo"]),
        cover_zoom=zoom(0, project, "(min-width: 1680px) 1680px, 100vw", eager=True),
        cover_caption=caption(0, cover["legenda"]),
        story=story(project),
        screens=screens(project),
        following=following(project, projects, index),
        closing=closing(),
    )


def replace_once(text, pattern, replacement, label):
    def apply(match):
        return replacement(match) if callable(replacement) else replacement

    new_text, count = re.subn(pattern, apply, text, count=1, flags=re.S)
    if count != 1:
        raise SystemExit("Template is missing the {0} block.".format(label))
    return new_text


def build_page(template, project, projects, index):
    title = "{0} | Portfólio | Tiago Cabaça".format(project["nome"])
    description = project["resumo"]
    url = "{0}/pages/portfolio/{1}.html".format(BASE, project["id"])
    image = og_image(project["ecras"][0]["img"])

    page = replace_once(template, r"<title>.*?</title>", "<title>{0}</title>".format(esc(title)), "title")
    page = replace_once(
        page, r'<meta name="description" content="[^"]*"/>',
        '<meta name="description" content="{0}"/>'.format(esc(description)), "description")
    page = replace_once(
        page, r'<link rel="canonical" href="[^"]*"/>',
        '<link rel="canonical" href="{0}"/>'.format(esc(url)), "canonical")
    page = replace_once(
        page, r'<meta property="og:type" content="[^"]*"/>',
        '<meta property="og:type" content="article"/>', "og:type")
    page = replace_once(
        page, r'<meta property="og:title" content="[^"]*"/>',
        '<meta property="og:title" content="{0}"/>'.format(esc(title)), "og:title")
    page = replace_once(
        page, r'<meta property="og:description" content="[^"]*"/>',
        '<meta property="og:description" content="{0}"/>'.format(esc(description)), "og:description")
    page = replace_once(
        page, r'<meta property="og:url" content="[^"]*"/>',
        '<meta property="og:url" content="{0}"/>'.format(esc(url)), "og:url")
    page = replace_once(
        page, r'<meta property="og:image" content="[^"]*"/>',
        '<meta property="og:locale" content="pt_PT"/>\n'
        '  <meta property="og:image" content="{0}"/>\n'
        '  <meta property="og:image:width" content="1200"/>\n'
        '  <meta property="og:image:height" content="630"/>'.format(esc(image)), "og:image")
    page = replace_once(
        page, r'<meta name="twitter:title" content="[^"]*"/>',
        '<meta name="twitter:title" content="{0}"/>'.format(esc(title)), "twitter:title")
    page = replace_once(
        page, r'<meta name="twitter:description" content="[^"]*"/>',
        '<meta name="twitter:description" content="{0}"/>'.format(esc(description)), "twitter:description")
    page = replace_once(
        page, r'<meta name="twitter:image" content="[^"]*"/>',
        '<meta name="twitter:image" content="{0}"/>'.format(esc(image)), "twitter:image")

    json_ld = json.dumps({
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        "name": project["nome"],
        "description": project["resumo"],
        "image": image,
        "url": url,
        "inLanguage": "pt-PT",
    }, ensure_ascii=False, indent=2).replace("<", "\\u003c")
    page = replace_once(
        page, r'(<meta name="twitter:image" content="[^"]*"/>)',
        lambda m: m.group(1) + '\n  <script type="application/ld+json">\n' + json_ld + '\n  </script>',
        "JSON-LD insertion")

    page = replace_once(
        page, r'<body class="pf pf-case">',
        '<body class="pf pf-case" data-project-id="{0}">'.format(esc(project["id"])), "body")
    page = replace_once(
        page, r'(<main id="pf-root" class="pc-root">).*?(</main>)',
        lambda m: m.group(1) + main_markup(project, projects, index) + m.group(2), "project main")

    # The page now lives one folder deeper than the template.
    page = page.replace('"../assets/', '"../../assets/')
    page = page.replace('"../site.webmanifest"', '"../../site.webmanifest"')
    page = page.replace('"../index.html"', '"../../index.html"')
    page = re.sub(
        r'href="(about|projects|portfolio|blog|servicos|contact|uses|privacidade|'
        r'blog-post|project-detail)\.html',
        r'href="../\1.html', page)
    return page


def url_block(loc, priority):
    return (
        "\n  <url>\n    <loc>{loc}</loc>\n"
        "    <lastmod>{lastmod}</lastmod>\n"
        "    <priority>{priority}</priority>\n  </url>"
    ).format(loc=loc, lastmod=LASTMOD, priority=priority)


def update_sitemap(projects):
    text = SITEMAP.read_text(encoding="utf-8")
    text = re.sub(
        r"\n  <url>\n    <loc>https://cabacatech\.com/pages/portfolio"
        r"(?:\.html|/[^<]*\.html)</loc>.*?</url>",
        "", text, flags=re.S)
    blocks = [url_block(BASE + "/pages/portfolio.html", "0.9")]
    blocks.extend(
        url_block("{0}/pages/portfolio/{1}.html".format(BASE, p["id"]), "0.7")
        for p in projects
    )
    text = text.replace("</urlset>", "".join(blocks) + "\n</urlset>")
    SITEMAP.write_text(text, encoding="utf-8")


def main():
    template = TEMPLATE.read_text(encoding="utf-8")
    projects = json.loads(DATA.read_text(encoding="utf-8"))["projetos"]
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for index, project in enumerate(projects):
        output = OUT_DIR / (project["id"] + ".html")
        output.write_text(build_page(template, project, projects, index), encoding="utf-8")

    update_sitemap(projects)
    print("Built {0} portfolio pages in {1}.".format(len(projects), OUT_DIR.relative_to(ROOT)))
    print("Updated the portfolio entries in sitemap.xml.")


if __name__ == "__main__":
    main()

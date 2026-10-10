# Copyright (c) 2026 Tiago Cabaça. Released under the MIT License.
"""Generate feed.xml (RSS 2.0), sitemap.xml and llms-full.txt from the content indexes.

The site has no build step. Run this before publishing, from the repository root:

    python tools/build_feeds.py

Post dates come from the `date` frontmatter ("Out 2026"). Sitemap `lastmod` values come
from the last commit that touched each file, so commit content changes first.
"""

import json
import re
import subprocess
from datetime import date, datetime, timezone
from email.utils import format_datetime
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parent.parent
BASE = "https://cabacatech.com"
MONTHS = {"jan": 1, "fev": 2, "mar": 3, "abr": 4, "mai": 5, "jun": 6,
          "jul": 7, "ago": 8, "set": 9, "out": 10, "nov": 11, "dez": 12}

FRONTMATTER_RE = re.compile(r"^---\r?\n(.*?)\r?\n---\r?\n?", re.S)
COMMENT_RE = re.compile(r"<!--.*?-->\n?", re.S)

STATIC_PAGES = [
    ("index.html", "/", "1.0"),
    ("pages/about.html", "/pages/about.html", "0.9"),
    ("pages/projects.html", "/pages/projects.html", "0.9"),
    ("pages/blog.html", "/pages/blog.html", "0.8"),
    ("pages/services.html", "/pages/services.html", "0.8"),
    ("pages/contact.html", "/pages/contact.html", "0.7"),
    ("pages/uses.html", "/pages/uses.html", "0.6"),
    ("pages/privacidade.html", "/pages/privacidade.html", "0.3"),
]


def frontmatter(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    match = FRONTMATTER_RE.match(text)
    meta = {}
    if match:
        for line in match.group(1).splitlines():
            key, sep, value = line.partition(":")
            if sep:
                value = value.strip()
                if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
                    value = value[1:-1]
                meta[key.strip()] = value
    return meta


def body(path: Path) -> str:
    text = path.read_text(encoding="utf-8")
    text = FRONTMATTER_RE.sub("", text, count=1)
    return COMMENT_RE.sub("", text).strip()


def post_date(value: str) -> datetime:
    match = re.match(r"([A-Za-z]{3})\w*\.?\s+(\d{4})", value or "")
    if not match or match.group(1).lower() not in MONTHS:
        raise ValueError(f"Unrecognised post date: {value!r}")
    return datetime(int(match.group(2)), MONTHS[match.group(1).lower()], 1, 9, 0,
                    tzinfo=timezone.utc)


def last_commit_date(path: Path) -> str:
    result = subprocess.run(
        ["git", "log", "-1", "--format=%cs", "--", str(path.relative_to(ROOT))],
        cwd=ROOT, capture_output=True, text=True, check=False)
    return result.stdout.strip() or date.today().isoformat()


def load_index(name: str) -> list:
    return json.loads((ROOT / "data" / name).read_text(encoding="utf-8"))


def build_feed(posts: list) -> str:
    if not posts:
        raise SystemExit("posts-index.json is empty: nothing to put in the feed")
    items = []
    for post_id in posts:
        meta = frontmatter(ROOT / "content" / "posts" / f"{post_id}.md")
        url = f"{BASE}/pages/blog-post.html?id={post_id}"
        categories = meta.get("category", "").strip("[]")
        cats = "".join(f"\n      <category>{escape(c.strip())}</category>"
                       for c in categories.split(",") if c.strip())
        items.append(f"""    <item>
      <title>{escape(meta.get('title', post_id))}</title>
      <link>{escape(url)}</link>
      <guid isPermaLink="true">{escape(url)}</guid>
      <pubDate>{format_datetime(post_date(meta.get('date', '')))}</pubDate>
      <description>{escape(meta.get('desc', ''))}</description>{cats}
    </item>""")
    newest = max(post_date(frontmatter(ROOT / "content" / "posts" / f"{p}.md").get("date", ""))
                 for p in posts)
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Blog de Tiago Cabaça</title>
    <link>{BASE}/pages/blog.html</link>
    <description>Projetos, homelab e o que vou aprendendo, do desenvolvimento web à infraestrutura.</description>
    <language>pt-PT</language>
    <lastBuildDate>{format_datetime(newest)}</lastBuildDate>
    <atom:link href="{BASE}/feed.xml" rel="self" type="application/rss+xml"/>
{chr(10).join(items)}
  </channel>
</rss>
"""


def build_sitemap(posts: list, projects: list) -> str:
    entries = [(BASE + url, last_commit_date(ROOT / file), prio)
               for file, url, prio in STATIC_PAGES if (ROOT / file).exists()]
    entries += [(f"{BASE}/pages/project-detail.html?id={p}",
                 last_commit_date(ROOT / "content" / "projects" / f"{p}.md"), "0.8")
                for p in projects]
    entries += [(f"{BASE}/pages/blog-post.html?id={p}",
                 last_commit_date(ROOT / "content" / "posts" / f"{p}.md"), "0.7")
                for p in posts]
    urls = "\n".join(f"""  <url>
    <loc>{escape(loc)}</loc>
    <lastmod>{mod}</lastmod>
    <priority>{prio}</priority>
  </url>""" for loc, mod, prio in entries)
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{urls}
</urlset>
"""


def build_llms_full(posts: list, projects: list) -> str:
    parts = ["# Tiago Cabaça (CabacaTech): full text", "",
             "> Full Markdown text of every project case study and blog post on "
             "https://cabacatech.com, in European Portuguese. The summary and links are in "
             "https://cabacatech.com/llms.txt. Blocks opened with `:::name` are site components "
             "(spec sheets, callouts, timelines, comparisons) and read as plain text.", ""]
    sections = (("projects", projects, "project-detail", "Projects"),
                ("posts", posts, "blog-post", "Blog posts"))
    for kind, ids, page, heading in sections:
        parts += [f"# {heading}", ""]
        for item in ids:
            path = ROOT / "content" / kind / f"{item}.md"
            meta = frontmatter(path)
            facts = [f"URL: {BASE}/pages/{page}.html?id={item}"]
            for key in ("date", "year", "status", "type", "stack", "category", "github", "live"):
                if meta.get(key):
                    facts.append(f"{key.capitalize()}: {meta[key].strip('[]')}")
            parts += [f"## {meta.get('title', item)}", "", meta.get("desc", ""), "",
                      *[f"- {fact}" for fact in facts], "", body(path), "", "---", ""]
    return "\n".join(parts)


def main() -> None:
    posts = load_index("posts-index.json")
    projects = load_index("projects-index.json")
    (ROOT / "feed.xml").write_text(build_feed(posts), encoding="utf-8", newline="\n")
    (ROOT / "sitemap.xml").write_text(build_sitemap(posts, projects), encoding="utf-8",
                                      newline="\n")
    (ROOT / "llms-full.txt").write_text(build_llms_full(posts, projects), encoding="utf-8",
                                        newline="\n")
    print(f"feed.xml: {len(posts)} posts; llms-full.txt: {len(posts) + len(projects)} "
          f"entries; sitemap.xml: {len(STATIC_PAGES) + len(posts) + len(projects)} URLs")


if __name__ == "__main__":
    main()

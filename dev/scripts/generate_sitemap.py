#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path


BASE_URL = "https://kenetg.com"
OUTPUT_PATH = Path("web") / "sitemap.xml"

ROUTES = [
    ("/", "weekly", "1.0"),
    ("/redes/", "weekly", "0.9"),
    ("/contacto/", "weekly", "0.85"),
    ("/tienda/", "weekly", "0.8"),
]


def build_xml() -> str:
    items = []
    for path, changefreq, priority in ROUTES:
        items.append(
            "  <url>\n"
            f"    <loc>{BASE_URL}{path}</loc>\n"
            f"    <priority>{priority}</priority>\n"
            f"    <changefreq>{changefreq}</changefreq>\n"
            "  </url>"
        )
    joined = "\n".join(items)
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{joined}\n"
        "</urlset>\n"
    )


def main() -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(build_xml(), encoding="utf-8")
    print(f"generated sitemap -> {OUTPUT_PATH}")


if __name__ == "__main__":
    main()

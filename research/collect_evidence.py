#!/usr/bin/env python3
"""Collect observable evidence for selected leads (research helper).

Fetches only public pages, records visible text, headings, navigation and
contact-page signals. No logins, no CAPTCHA bypass, no private data.

Usage: py research/collect_evidence.py
"""

from __future__ import annotations

import gzip
import json
import re
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "research" / "lead_evidence.json"
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 "
    "LeadResearch/1.0"
)
EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
SKIP_TEXT = re.compile(r"^[\s|·•\-–—>»<]+$")

LEADS = [
    ("Kirchhoff's Bakery & Deli", "https://www.kirchhoffsbakery.net/"),
    ("Gymology", "https://gymology247.com/"),
    ("Oklahoma Landscape", "https://oklahomalandscape.com/"),
    ("The French Reception", "https://thefrenchreception.com/"),
    ("The Loopy Shrew", "https://www.loopyshrew.com/"),
    ("Incisively", "https://incisively.uk/"),
    ("EXIT Realty Associates", "https://www.exitmoncton.ca/"),
    ("Muir Real Estate Group", "https://muirrealestategroup.com/"),
    ("Okanagan Yard Works", "https://okanaganyardworks.ca/"),
    ("Greenlife Landscaping", "https://www.greenlifelandscaping.net/"),
    ("17 by 4", "https://17by4.com.au/"),
    ("Florence Cafe", "https://www.florencecafe.com.au/"),
    ("Inside Cafe", "https://www.insidecafe.com.au/"),
    ("The Rehab Gym", "https://therehabgymbunbury.com.au/"),
    ("Inside Systems", "https://www.insidesystems.co.nz/"),
    ("PBS Plumbers & Building Services", "https://www.pbsnz.com/"),
    ("The Studio by Sam", "https://thestudio.org.nz/"),
    ("Be Be Beauty", "https://bebebeauty.co.nz/"),
]


class Page(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title = ""
        self.meta: dict[str, str] = {}
        self.headings: list[tuple[str, str]] = []
        self.nav: list[tuple[str, str]] = []
        self.links: list[tuple[str, str]] = []
        self.text: list[str] = []
        self.images = 0
        self.images_no_alt = 0
        self.forms = 0
        self.inputs: list[str] = []
        self.scripts: list[str] = []
        self.links_css: list[str] = []
        self._skip = 0
        self._capture = ""
        self._buf: list[str] = []
        self._href = ""
        self._in_a = False
        self._in_nav = 0
        self._in_title = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        a = {k.lower(): (v or "") for k, v in attrs}
        if tag in ("script", "style", "noscript", "svg"):
            self._skip += 1
        elif tag == "title":
            self._in_title = True
        elif tag == "meta":
            key = (a.get("property") or a.get("name") or "").lower()
            if key:
                self.meta[key] = a.get("content", "")
        elif tag in ("h1", "h2", "h3"):
            self._capture = tag
            self._buf = []
        elif tag == "nav":
            self._in_nav += 1
        elif tag == "a":
            self._in_a = True
            self._href = a.get("href", "")
            self._buf = []
        elif tag == "img":
            self.images += 1
            if not a.get("alt"):
                self.images_no_alt += 1
        elif tag == "form":
            self.forms += 1
        elif tag in ("input", "textarea", "select"):
            self.inputs.append(a.get("type") or tag)
        elif tag == "script" and a.get("src"):
            self.scripts.append(a["src"])
        elif tag == "link" and "stylesheet" in a.get("rel", ""):
            self.links_css.append(a.get("href", ""))
        if tag == "br":
            self.text.append(" ")

    def handle_endtag(self, tag: str) -> None:
        if tag in ("script", "style", "noscript", "svg"):
            self._skip = max(0, self._skip - 1)
        elif tag == "title":
            self._in_title = False
        elif tag in ("h1", "h2", "h3") and self._capture == tag:
            value = clean(" ".join(self._buf))
            if value:
                self.headings.append((tag, value))
            self._capture = ""
            self._buf = []
        elif tag == "nav":
            self._in_nav = max(0, self._in_nav - 1)
        elif tag == "a" and self._in_a:
            value = clean(" ".join(self._buf))
            if value:
                self.links.append((value, self._href))
                if self._in_nav:
                    self.nav.append((value, self._href))
            self._in_a = False
            self._buf = []

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title += data
        if self._skip:
            return
        value = clean(data)
        if not value or SKIP_TEXT.match(value):
            return
        self.text.append(value)
        if self._capture:
            self._buf.append(value)
        if self._in_a:
            self._buf.append(value)


def clean(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def fetch(url: str, timeout: int = 20) -> dict:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": UA,
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "en-US,en;q=0.8",
            "Accept-Encoding": "gzip",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
            if resp.headers.get("Content-Encoding") == "gzip":
                raw = gzip.decompress(raw)
            charset = resp.headers.get_content_charset() or "utf-8"
            return {
                "ok": True,
                "status": resp.status,
                "url": resp.geturl(),
                "html": raw.decode(charset, "replace"),
            }
    except Exception as exc:  # noqa: BLE001 - research helper
        return {"ok": False, "status": 0, "url": url, "error": f"{type(exc).__name__}: {exc}", "html": ""}


def emails(html: str) -> list[str]:
    bad = ("godaddy.com", "example.com", "sentry.io", "wixpress.com", "squarespace.com", "u003e")
    found = []
    for value in EMAIL_RE.findall(html):
        value = value.strip(".").lower()
        if value not in found and not any(b in value for b in bad):
            found.append(value)
    return found[:6]


def run(name: str, url: str) -> dict:
    page = fetch(url)
    data: dict = {"name": name, "url": url, "status": page["status"], "final_url": page["url"]}
    if not page["ok"]:
        data["error"] = page.get("error", "")
        return data
    parser = Page()
    parser.feed(page["html"])
    text = " ".join(parser.text)
    text = re.sub(r"\s+", " ", text)
    lower = text.lower()
    data.update(
        {
            "title": clean(parser.title),
            "description": parser.meta.get("description", ""),
            "viewport": "width=device-width" in page["html"],
            "headings": parser.headings[:30],
            "nav": parser.nav[:25],
            "links": parser.links[:80],
            "words": len(text.split()),
            "text_sample": text[:3500],
            "has_contact_form": parser.forms > 0,
            "inputs": parser.inputs[:12],
            "images": parser.images,
            "images_no_alt": parser.images_no_alt,
            "emails": emails(page["html"]),
            "copyright": sorted(set(re.findall(r"(?:©|&copy;|copyright)[^0-9]{0,30}(20\d{2})", page["html"], re.I))),
            "http_assets": len(re.findall(r'(?:src|href)="http://', page["html"], re.I)),
            "signals": {
                "menu": "menu" in lower,
                "booking": any(w in lower for w in ("book now", "booking", "appointment", "reserve")),
                "order_online": any(w in lower for w in ("order online", "order now", "delivery")),
                "hours": "opening hours" in lower or "hours" in lower,
                "instagram": "instagram.com" in page["html"].lower(),
                "facebook": "facebook.com" in page["html"].lower(),
                "google_maps": "maps.google" in page["html"].lower() or "google.com/maps" in page["html"].lower(),
            },
            "contact_form_action": next(
                (m for m in re.findall(r'<form[^>]+action="([^"]*)"', page["html"], re.I) if m),
                "",
            ),
        }
    )
    return data


def main() -> None:
    results = [run(name, url) for name, url in LEADS]
    OUT.write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {OUT.relative_to(ROOT)} ({len(results)} leads)")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Audit public small-business websites for lead qualification.

Reads a candidate list, fetches the public homepage and up to two contact
pages, and records observable signals only (viewport meta, linked CSS media
queries, public email addresses, copyright year, builder, forms, etc.).

This is a one-off research helper, not a crawler. It makes a small number of
GET requests per domain with a normal user agent and a short timeout.

Usage:
    py tools/audit_lead_sites.py
    py tools/audit_lead_sites.py --limit 10
"""

from __future__ import annotations

import argparse
import gzip
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "research" / "site_audit.json"
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 "
    "LeadResearch/1.0"
)

CANDIDATES = [
    # United States
    {"name": "Sunshine Family Restaurant", "country": "United States", "city": "Dubuque, IA", "industry": "Restaurant", "url": ""},
    {"name": "MLC's Family Restaurant", "country": "United States", "city": "Paducah, KY", "industry": "Restaurant", "url": ""},
    {"name": "Kirchhoff's Bakery & Deli", "country": "United States", "city": "Paducah, KY", "industry": "Cafe / Restaurant", "url": "https://www.kirchhoffsbakery.net/"},
    {"name": "El Torito Mexican Grill", "country": "United States", "city": "Paducah, KY", "industry": "Restaurant", "url": "https://eltoritomexicangrill.com/"},
    {"name": "Gymology", "country": "United States", "city": "Springfield, MO", "industry": "Gym / Fitness", "url": "https://gymology247.com/"},
    {"name": "River City Hair Co.", "country": "United States", "city": "Dubuque, IA", "industry": "Salon / Beauty", "url": "https://www.rivercityhairco.com/"},
    {"name": "Sense of Style Salon", "country": "United States", "city": "Dubuque, IA", "industry": "Salon / Beauty", "url": "https://senseofstylesalon.com/"},
    {"name": "Designworks Wellness Spa", "country": "United States", "city": "Dubuque, IA", "industry": "Salon / Beauty", "url": "https://www.designworksspa.com/"},
    {"name": "Oklahoma Landscape", "country": "United States", "city": "Tulsa, OK", "industry": "Local Service", "url": "https://oklahomalandscape.com/"},
    {"name": "Everything Outdoors of Tulsa", "country": "United States", "city": "Tulsa, OK", "industry": "Local Service", "url": "https://everythingoutdoorstulsa.com/"},
    {"name": "Arrowhead Consulting", "country": "United States", "city": "Tulsa, OK", "industry": "Consultant", "url": "https://arrowheadconsulting.com/"},
    {"name": "Welltide Consulting", "country": "United States", "city": "Tulsa, OK", "industry": "Consultant", "url": "https://welltideconsulting.com/"},
    # United Kingdom
    {"name": "BeBaBo Hair Salon", "country": "United Kingdom", "city": "Harrogate", "industry": "Salon / Beauty", "url": "https://bebabo.co.uk/"},
    {"name": "The Phoenix Lounge", "country": "United Kingdom", "city": "Harrogate", "industry": "Salon / Beauty", "url": "https://thephoenixlounge.com/"},
    {"name": "The French Reception", "country": "United Kingdom", "city": "Harrogate", "industry": "Salon / Beauty", "url": "https://thefrenchreception.com/"},
    {"name": "Phoenix Gym Norwich", "country": "United Kingdom", "city": "Norwich", "industry": "Gym / Fitness", "url": "https://phoenixgymnorwich.co.uk/"},
    {"name": "The Loopy Shrew", "country": "United Kingdom", "city": "Shrewsbury", "industry": "Restaurant", "url": "https://www.loopyshrew.com/"},
    {"name": "The Featherbed", "country": "United Kingdom", "city": "Shrewsbury", "industry": "Restaurant", "url": "https://www.featherbedpubshrewsbury.co.uk/"},
    {"name": "Incisively", "country": "United Kingdom", "city": "Southampton", "industry": "Consultant", "url": "https://incisively.uk/"},
    {"name": "MHL Business Consultants", "country": "United Kingdom", "city": "Southampton", "industry": "Consultant", "url": "https://www.mhlbusinessconsultants.co.uk/"},
    {"name": "ThinkWOW", "country": "United Kingdom", "city": "Southampton", "industry": "Consultant", "url": "https://thinkwow.co.uk/"},
    {"name": "Adamson Jones Salon", "country": "United Kingdom", "city": "Llandudno", "industry": "Salon / Beauty", "url": "https://www.adamsonjonessalon.co.uk/"},
    # Canada
    {"name": "EXIT Realty Associates", "country": "Canada", "city": "Dieppe / Moncton, NB", "industry": "Real Estate", "url": "https://www.exitmoncton.ca/"},
    {"name": "Muir Real Estate Group", "country": "Canada", "city": "Moncton, NB", "industry": "Real Estate", "url": "https://muirrealestategroup.com/"},
    {"name": "Okanagan Yard Works", "country": "Canada", "city": "Kelowna, BC", "industry": "Local Service", "url": "https://okanaganyardworks.ca/"},
    {"name": "Empire Landscaping", "country": "Canada", "city": "Kelowna, BC", "industry": "Local Service", "url": "https://empirelandscaping.ca/"},
    {"name": "Greenlife Landscaping", "country": "Canada", "city": "Kelowna, BC", "industry": "Local Service", "url": "https://www.greenlifelandscaping.net/"},
    {"name": "Hopkins Dining Parlour", "country": "Canada", "city": "Moose Jaw, SK", "industry": "Restaurant", "url": "https://www.hopkinsdiningparlour.com/"},
    {"name": "Prairie Oasis Restaurant", "country": "Canada", "city": "Moose Jaw, SK", "industry": "Restaurant", "url": ""},
    # Australia
    {"name": "17 by 4", "country": "Australia", "city": "Geelong, VIC", "industry": "Cafe / Restaurant", "url": "https://17by4.com.au/"},
    {"name": "Untitled Cafe", "country": "Australia", "city": "Geelong, VIC", "industry": "Cafe / Restaurant", "url": "https://untitledcafe-geelong.square.site/home"},
    {"name": "PH Property", "country": "Australia", "city": "Bendigo, VIC", "industry": "Real Estate", "url": "https://www.phproperty.com.au/"},
    {"name": "Bendigo Real Estate", "country": "Australia", "city": "Bendigo, VIC", "industry": "Real Estate", "url": "https://bendigorealestate.com.au/"},
    {"name": "The Pantry Cafe", "country": "Australia", "city": "Launceston, TAS", "industry": "Cafe / Restaurant", "url": "https://thepantrycafe.com.au/"},
    {"name": "Florence Cafe", "country": "Australia", "city": "Launceston, TAS", "industry": "Cafe / Restaurant", "url": "https://www.florencecafe.com.au/"},
    {"name": "Inside Cafe", "country": "Australia", "city": "Launceston, TAS", "industry": "Cafe / Restaurant", "url": "https://www.insidecafe.com.au/"},
    {"name": "The Rehab Gym", "country": "Australia", "city": "Bunbury, WA", "industry": "Gym / Fitness", "url": "https://therehabgymbunbury.com.au/"},
    # New Zealand
    {"name": "RMP Plumbing", "country": "New Zealand", "city": "Invercargill", "industry": "Local Service", "url": "https://www.rmpplumbing.nz/"},
    {"name": "Inside Systems", "country": "New Zealand", "city": "Invercargill", "industry": "Local Service", "url": "https://www.insidesystems.co.nz/"},
    {"name": "PBS Plumbers & Building Services", "country": "New Zealand", "city": "Invercargill", "industry": "Local Service", "url": "https://www.pbsnz.com/"},
    {"name": "D'Lux Hair & Beauty", "country": "New Zealand", "city": "Hamilton", "industry": "Salon / Beauty", "url": "https://dluxhairandbeautyhamilton.co.nz/"},
    {"name": "Akshara Beauty & Hair", "country": "New Zealand", "city": "Hamilton", "industry": "Salon / Beauty", "url": "https://aksharabeautyandhair.com/"},
    {"name": "The Little Loft", "country": "New Zealand", "city": "Hamilton", "industry": "Salon / Beauty", "url": "https://www.thelittleloft.co.nz/"},
    {"name": "Ironic Cafe & Bar", "country": "New Zealand", "city": "Dunedin", "industry": "Cafe / Restaurant", "url": "https://www.ironiccafebar.co.nz/"},
    {"name": "Heritage Coffee", "country": "New Zealand", "city": "Dunedin", "industry": "Cafe / Restaurant", "url": "https://heritagecoffee.co.nz/"},
    {"name": "Govs Cafe", "country": "New Zealand", "city": "Dunedin", "industry": "Cafe / Restaurant", "url": "https://governorscafe.co.nz/"},
    {"name": "Beautyology", "country": "New Zealand", "city": "Whanganui", "industry": "Salon / Beauty", "url": "https://www.beautyology.co.nz/"},
    {"name": "The Studio by Sam", "country": "New Zealand", "city": "Whanganui", "industry": "Salon / Beauty", "url": "https://thestudio.org.nz/"},
    {"name": "Raffles Hair Salon", "country": "New Zealand", "city": "Whanganui", "industry": "Salon / Beauty", "url": "https://www.raffleshair.co.nz/"},
    {"name": "Be Be Beauty", "country": "New Zealand", "city": "Whanganui", "industry": "Salon / Beauty", "url": "https://bebebeauty.co.nz/"},
]

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")
EMAIL_BAD = (
    "sentry", "example.", "yourdomain", "domain.com", "@email", "wixpress",
    "squarespace.com", "gstatic", "googlemail.com/img", ".png", ".jpg", ".jpeg",
    ".gif", ".webp", ".svg", "no-reply", "noreply",
)
BUILDERS = {
    "wix": "Wix", "squarespace": "Squarespace", "wp-content": "WordPress",
    "wordpress": "WordPress", "godaddy": "GoDaddy", "webflow": "Webflow",
    "shopify": "Shopify", "duda": "Duda", "weebly": "Weebly",
    "jimdo": "Jimdo", "site123": "Site123",
}


class MetaParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title = ""
        self._in_title = False
        self.metas: list[dict[str, str]] = []
        self.links: list[dict[str, str]] = []
        self.scripts: list[str] = []
        self.forms = 0
        self.h1 = 0
        self.nav = 0
        self.tables = 0
        self.images = 0
        self.iframes = 0
        self.font_tags = 0
        self.marquee = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        a = {k.lower(): (v or "") for k, v in attrs}
        if tag == "title":
            self._in_title = True
        elif tag == "meta":
            self.metas.append(a)
        elif tag == "link":
            self.links.append(a)
        elif tag == "script" and a.get("src"):
            self.scripts.append(a["src"])
        elif tag == "form":
            self.forms += 1
        elif tag == "h1":
            self.h1 += 1
        elif tag == "nav":
            self.nav += 1
        elif tag == "table":
            self.tables += 1
        elif tag == "img":
            self.images += 1
        elif tag == "iframe":
            self.iframes += 1
        elif tag == "font":
            self.font_tags += 1
        elif tag == "marquee":
            self.marquee += 1

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self._in_title = False

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title += data


def fetch(url: str, timeout: int = 15) -> dict:
    started = time.time()
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Encoding": "gzip"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
            if resp.headers.get("Content-Encoding") == "gzip":
                raw = gzip.decompress(raw)
            charset = resp.headers.get_content_charset() or "utf-8"
            try:
                html = raw.decode(charset, errors="replace")
            except LookupError:
                html = raw.decode("utf-8", errors="replace")
            return {
                "ok": True, "status": resp.status, "final_url": resp.geturl(),
                "html": html, "ms": int((time.time() - started) * 1000),
                "error": "",
            }
    except urllib.error.HTTPError as exc:
        return {"ok": False, "status": exc.code, "final_url": url, "html": "", "ms": int((time.time() - started) * 1000), "error": f"HTTP {exc.code}"}
    except Exception as exc:  # network, TLS, timeout
        return {"ok": False, "status": 0, "final_url": url, "html": "", "ms": int((time.time() - started) * 1000), "error": str(exc)[:160]}


def emails_from(html: str) -> set[str]:
    found = set()
    for email in EMAIL_RE.findall(html):
        low = email.lower().strip(".,;:()<>\"'")
        if len(low) > 80 or any(bad in low for bad in EMAIL_BAD):
            continue
        found.add(low)
    return found


def audit(cand: dict) -> dict:
    result = dict(cand)
    result.update({
        "audited_at": time.strftime("%Y-%m-%d"),
        "reachable": False, "status": 0, "final_url": "", "error": "",
        "title": "", "description": "", "viewport": False, "generator": "",
        "builder": "", "copyright_year": "", "emails": [], "email_pages": [],
        "contact_url": "", "has_contact_form": False, "media_queries": False,
        "nav_count": 0, "h1_count": 0, "tables": 0, "images": 0, "iframes": 0,
        "font_tags": 0, "marquee": 0, "http_assets": 0, "page_kb": 0,
        "css_files": 0, "word_count": 0,
    })
    if not cand["url"]:
        result["error"] = "No official website found in public search results"
        return result

    home = fetch(cand["url"])
    result["status"] = home["status"]
    result["final_url"] = home["final_url"]
    result["reachable"] = home["ok"]
    result["error"] = home["error"]
    if not home["ok"]:
        return result

    html = home["html"]
    result["page_kb"] = round(len(html.encode(errors="ignore")) / 1024, 1)
    result["word_count"] = len(re.sub(r"<[^>]+>", " ", html).split())
    result["http_assets"] = len(re.findall(r'(?:src|href)=["\']http://', html, re.I))
    parser = MetaParser()
    try:
        parser.feed(html)
    except Exception:
        pass
    result["title"] = " ".join(parser.title.split())[:160]
    result["nav_count"] = parser.nav
    result["h1_count"] = parser.h1
    result["tables"] = parser.tables
    result["images"] = parser.images
    result["iframes"] = parser.iframes
    result["font_tags"] = parser.font_tags
    result["marquee"] = parser.marquee
    result["has_contact_form"] = parser.forms > 0

    lower = html.lower()
    result["viewport"] = any(
        m.get("name", "").lower() == "viewport" for m in parser.metas
    )
    result["description"] = next(
        (m.get("content", "")[:220] for m in parser.metas
         if m.get("name", "").lower() == "description"), ""
    )
    result["generator"] = next(
        (m.get("content", "") for m in parser.metas
         if m.get("name", "").lower() == "generator"), ""
    )
    for needle, label in BUILDERS.items():
        if needle in lower:
            result["builder"] = label
            break

    years = []
    for match in re.finditer(r"(?:©|&copy;|copyright)[^0-9]{0,30}(19\d{2}|20\d{2})", lower):
        years.append(int(match.group(1)))
    for match in re.finditer(r"(19\d{2}|20\d{2})\s*(?:©|&copy;|copyright)", lower):
        years.append(int(match.group(1)))
    if years:
        result["copyright_year"] = str(max(years))

    found = {e: cand["url"] for e in emails_from(html)}
    css_urls = []
    for link in parser.links:
        href = link.get("href", "")
        rel = link.get("rel", "").lower()
        if not href:
            continue
        if "stylesheet" in rel:
            css_urls.append(urllib.parse.urljoin(home["final_url"], href))
        elif "contact" in (href + " " + link.get("title", "")).lower():
            result.setdefault("_contact_links", [])
            result["_contact_links"].append(urllib.parse.urljoin(home["final_url"], href))

    contact_candidates = list(dict.fromkeys(
        result.pop("_contact_links", [])[:2]
        + [urllib.parse.urljoin(home["final_url"], p) for p in
           ("contact", "contact-us", "contact.html", "contact.php", "about/contact")]
    ))
    for url in contact_candidates[:3]:
        page = fetch(url)
        if not page["ok"]:
            continue
        if not result["contact_url"]:
            result["contact_url"] = page["final_url"]
        for email in emails_from(page["html"]):
            found.setdefault(email, page["final_url"])
        if not result["has_contact_form"]:
            result["has_contact_form"] = "<form" in page["html"].lower()
        if len(found) >= 3:
            break

    result["emails"] = sorted(found)[:6]
    result["email_pages"] = [found[e] for e in result["emails"]]

    for css in css_urls[:3]:
        page = fetch(css)
        if page["ok"] and "@media" in page["html"]:
            result["media_queries"] = True
            break
    result["css_files"] = len(css_urls)
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()
    candidates = CANDIDATES[: args.limit] if args.limit else CANDIDATES

    results = []
    with ThreadPoolExecutor(max_workers=6) as pool:
        futures = {pool.submit(audit, c): c for c in candidates}
        for future in as_completed(futures):
            row = future.result()
            results.append(row)
            status = row["status"] if row["status"] else row["error"]
            email = row["emails"][0] if row["emails"] else "-"
            print(f"{row['name'][:34]:34} {str(status)[:18]:18} {email}")

    order = {c["name"]: i for i, c in enumerate(candidates)}
    results.sort(key=lambda r: order[r["name"]])
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nWrote {OUT.relative_to(ROOT)} ({len(results)} candidates)")


if __name__ == "__main__":
    main()

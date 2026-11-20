#!/usr/bin/env python3
"""Validate the lead dataset and generate the CSV, reports and dashboard.

Source of truth: leads/lead-data.json
Outputs:
    leads/leads.csv
    leads/reports/<slug>.md
    leads/reports/README.md
    leads/dashboard.html

No network access. No email is sent. All records are public business information.
"""

from __future__ import annotations

import csv
import json
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "leads" / "lead-data.json"
CSV_OUT = ROOT / "leads" / "leads.csv"
REPORTS = ROOT / "leads" / "reports"
DASHBOARD = ROOT / "leads" / "dashboard.html"

EMAIL_RE = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")
PLACEHOLDERS = {
    "filler@godaddy.com",
    "user@domain.com",
    "your@email.com",
    "info@indiantypefoundry.com",
    "hello@example.com",
}
REQUIRED = [
    "slug",
    "name",
    "country",
    "city",
    "category",
    "email",
    "priority",
    "score",
    "status",
    "project_type",
    "price_tier",
    "price_inr_low",
    "price_inr_high",
    "effort",
    "source_url",
    "source_label",
    "verified",
    "issues",
    "solution",
    "opportunity",
    "evidence",
    "draft_subject",
    "draft_observation",
    "draft_consequence",
    "draft_offer",
    "notes",
    "site_quality",
    "mobile_experience",
]
BANDS = {"HOT": 70, "WARM": 45, "LOW": 0}
RATE_INR_PER_USD = 93
PRICE_TIERS = {
    "Landing page": (3000, 3000, "3–5 working days"),
    "Small business website": (4000, 4000, "5–7 working days"),
    "Website redesign": (3000, 4000, "4–6 working days"),
}
FIELDS = [
    "Business name",
    "Country",
    "City",
    "Industry",
    "Official website",
    "Public business email",
    "Phone",
    "Contact person",
    "Website quality",
    "Mobile experience",
    "Website issues",
    "Suggested solution",
    "Why they'd benefit",
    "Lead priority",
    "Priority score",
    "Research source",
    "Source URL",
    "Contact status",
    "Date contacted",
    "Follow-up date",
    "Client response",
    "Project type",
    "Price tier",
    "Suggested price (INR)",
    "Suggested price (USD approx.)",
    "Estimated effort",
    "Last verified",
    "Notes",
]


def fail(message: str) -> None:
    raise SystemExit(f"VALIDATION FAILED: {message}")


def validate(rows: list[dict]) -> None:
    if len(rows) != 20:
        fail(f"expected 20 leads, found {len(rows)}")
    slugs, names, urls = set(), set(), set()
    for row in rows:
        missing = [key for key in REQUIRED if key not in row]
        if missing:
            fail(f"{row.get('slug', '?')}: missing {missing}")
        if row["slug"] in slugs:
            fail(f"duplicate slug {row['slug']}")
        if row["name"] in names:
            fail(f"duplicate name {row['name']}")
        slugs.add(row["slug"])
        names.add(row["name"])
        if row["priority"] not in BANDS:
            fail(f"{row['slug']}: invalid priority")
        minimum = BANDS[row["priority"]]
        if not isinstance(row["score"], int) or row["score"] < minimum:
            fail(f"{row['slug']}: score {row['score']} is below the {row['priority']} band")
        if row["priority"] == "HOT" and row["score"] < 70:
            fail(f"{row['slug']}: HOT score must be >= 70")
        if row["priority"] == "WARM" and not 45 <= row["score"] < 70:
            fail(f"{row['slug']}: WARM score must be 45-69")
        if row["priority"] == "LOW" and row["score"] >= 45:
            fail(f"{row['slug']}: LOW score must be under 45")
        email = row["email"].strip().lower()
        if email != "unavailable":
            if email in PLACEHOLDERS or not EMAIL_RE.match(email):
                fail(f"{row['slug']}: invalid or placeholder email {email!r}")
        if row["source_url"] and not row["source_url"].startswith("https://"):
            fail(f"{row['slug']}: source URL must use https")
        if row["source_url"] in urls:
            fail(f"duplicate source URL {row['source_url']}")
        urls.add(row["source_url"])
        if not isinstance(row["issues"], list) or len(row["issues"]) < 3:
            fail(f"{row['slug']}: needs at least 3 observed issues")
        if not isinstance(row["evidence"], list) or len(row["evidence"]) < 3:
            fail(f"{row['slug']}: needs at least 3 evidence bullets")
        if row["status"] != "not_contacted":
            fail(f"{row['slug']}: this dataset must not record contact")
        if row["date_contacted"] or row["follow_up"] or row["response"]:
            fail(f"{row['slug']}: contact fields must be empty")
        for key in ("date_contacted", "follow_up", "verified"):
            if row[key] and not re.match(r"^\d{4}-\d{2}-\d{2}$", row[key]):
                fail(f"{row['slug']}: {key} must be YYYY-MM-DD")
        tier = row["price_tier"]
        if tier not in PRICE_TIERS:
            fail(f"{row['slug']}: unknown price tier {tier!r}")
        expected_low, expected_high, expected_effort = PRICE_TIERS[tier]
        if (row["price_inr_low"], row["price_inr_high"]) != (expected_low, expected_high):
            fail(f"{row['slug']}: {tier} must be priced at ₹{expected_low}-₹{expected_high}")
        if row["effort"] != expected_effort:
            fail(f"{row['slug']}: {tier} effort must be {expected_effort!r}")


def usd(inr_value: int) -> int:
    return round(inr_value / RATE_INR_PER_USD)


def price_inr_text(row: dict) -> str:
    low, high = row["price_inr_low"], row["price_inr_high"]
    return f"₹{money(low)}" if low == high else f"₹{money(low)}–₹{money(high)}"


def price_usd_text(row: dict) -> str:
    low, high = usd(row["price_inr_low"]), usd(row["price_inr_high"])
    return f"${money(low)}" if low == high else f"${money(low)}–${money(high)}"


def money(value: int) -> str:
    return f"{value:,}"


def draft(row: dict) -> str:
    lines = [
        row.get("greeting") or f"Hello {row['name']} team,",
        "",
        f"I came across {row['name']} while looking at {row['category'].lower()} businesses in {row['city']}. {row['draft_observation']}",
        "",
        row["draft_consequence"],
        "",
        row["draft_offer"],
        "",
        "Would that be worth a look? If it is not relevant, just reply 'no' and I will not follow up.",
        "",
        "Best regards,",
        "Vishal Kumar",
        "Independent Web Developer",
        "firwall63@gmail.com",
        "[live portfolio URL — add before sending]",
    ]
    return "\n".join(lines)


def write_csv(rows: list[dict]) -> None:
    with CSV_OUT.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        for row in rows:
            writer.writerow(
                {
                    "Business name": row["name"],
                    "Country": row["country"],
                    "City": row["city"],
                    "Industry": row["category"],
                    "Official website": row["website"] or "none",
                    "Public business email": row["email"],
                    "Phone": row["phone"],
                    "Contact person": row["contact_person"],
                    "Website quality": row["site_quality"],
                    "Mobile experience": row["mobile_experience"],
                    "Website issues": " | ".join(row["issues"]),
                    "Suggested solution": row["solution"],
                    "Why they'd benefit": row["opportunity"],
                    "Lead priority": row["priority"],
                    "Priority score": row["score"],
                    "Research source": row["source_label"],
                    "Source URL": row["source_url"],
                    "Contact status": row["status"],
                    "Date contacted": row["date_contacted"],
                    "Follow-up date": row["follow_up"],
                    "Client response": row["response"],
                    "Project type": row["project_type"],
                    "Price tier": row["price_tier"],
                    "Suggested price (INR)": price_inr_text(row),
                    "Suggested price (USD approx.)": price_usd_text(row),
                    "Estimated effort": row["effort"],
                    "Last verified": row["verified"],
                    "Notes": row["notes"],
                }
            )


def report_markdown(row: dict) -> str:
    email = (
        "unavailable — none found on the public pages checked"
        if row["email"] == "unavailable"
        else row["email"]
    )
    website = row["website"] or "none found"
    badge = row["priority"]
    issues = "\n".join(f"- {item}" for item in row["issues"])
    evidence = "\n".join(f"- {item}" for item in row["evidence"])
    before = [
        "Confirm this is the right inbox and that the business still matches the brief.",
        "Replace `[live portfolio URL — add before sending]` with a live, working portfolio or concept link. No live portfolio URL was found when this was prepared.",
        "Get Vishal's explicit approval for this specific email. Do not send a batch.",
        "Do not mention a price in this email. Quote only after the business replies and Vishal approves the figure.",
        "Send one business at a time from Vishal's own email account. No attachments, tracking pixels or disguised links.",
        "Honour an opt-out immediately and record it.",
    ]
    if row["country"] in ("United States", "Canada"):
        before.insert(
            4,
            "Add a valid physical postal address to the signature. US CAN-SPAM and Canada's CASL generally require one in commercial email.",
        )
    before_text = "\n".join(f"- [ ] {item}" for item in before)
    return f"""# {row['name']}

**{badge} · priority score {row['score']}/100 · {row['city']}, {row['country']}**

| | |
| --- | --- |
| Category | {row['category']} |
| Website | {website} |
| Public email | {email} |
| Phone | {row['phone'] or 'not recorded'} |
| Contact person | {row['contact_person'] or 'not identified'} |
| Project type | {row['project_type']} |
| Price tier | {row['price_tier']} |
| Suggested price | {price_inr_text(row)} (≈ {price_usd_text(row)}) — a suggestion, not a quote |
| Estimated effort | {row['effort']} |
| Source | [{row['source_label']}]({row['source_url']}) |
| Last verified | {row['verified']} |
| Contact status | **Not contacted** |

## What I observed

{issues}

## Evidence

{evidence}

## Why it matters

{row['opportunity']}

## Suggested scope — what is included

{row['solution']}

## Price and effort

{price_inr_text(row)} (≈ {price_usd_text(row)} at a ₹93/USD planning rate), estimated {row['effort']} of build time, excluding waiting on content and feedback.

This is a suggestion from Vishal's beginner tiers — landing page ₹3,000, small business website ₹4,000, website redesign ₹3,000–₹4,000 — not a quote. It excludes domain registration, hosting, paid plugins or fonts, stock photography, copywriting, brand identity, transaction fees, taxes and ongoing maintenance; those are quoted separately. The final price follows a requirements review and needs Vishal's explicit approval before it is sent to the business.

## Draft first email — **not sent**

**Subject:** {row['draft_subject']}

```text
{draft(row)}
```

## Before sending

{before_text}

## Notes

{row['notes']}

No email has been sent. No business has been contacted. This report is based on public pages accessed on {row['verified']}.
"""


def write_reports(rows: list[dict]) -> None:
    REPORTS.mkdir(parents=True, exist_ok=True)
    for row in rows:
        (REPORTS / f"{row['slug']}.md").write_text(report_markdown(row), encoding="utf-8")
    table = "\n".join(
        f"| {row['priority']} | [{row['name']}]({row['slug']}.md) | {row['city']}, {row['country']} | {row['category']} | {price_inr_text(row)} | {row['effort']} | {('unavailable' if row['email'] == 'unavailable' else 'yes')} |"
        for row in rows
    )
    low = sum(row["price_inr_low"] for row in rows)
    high = sum(row["price_inr_high"] for row in rows)
    index = f"""# Opportunity reports

Twenty short, business-specific reports. Each one records only what was visible
on public pages, plus a suggested scope, a suggested price and a draft first
email. Nothing here has been sent, and no price has been quoted to anyone.

| Priority | Business | Market | Category | Suggested price (INR) | Effort | Public email |
| --- | --- | --- | --- | ---: | --- | --- |
{table}

## How to read these

- **HOT** means a clear, visible gap and a strong reason to act now (no site,
  a visible placeholder, a 2015-era build or a 101-word one-pager).
- **WARM** means a real improvement opportunity, but the current site works.
- **LOW** means the site is already polished; the opportunity is incremental.
- The score is a relative prioritisation score, not a probability of purchase.
- Prices follow Vishal's beginner tiers: landing page ₹3,000, small business
  website ₹4,000, redesign ₹3,000–₹4,000. They are suggestions for approval,
  not quotes. USD figures in each report use a ₹93/USD planning rate.
- All 20 together total ₹{money(low)}–₹{money(high)} only if every one converted
  — arithmetic, not a forecast. Hosting, domain, extras, fees and taxes are not
  included.
- Mobile notes are based on the viewport meta tag and responsive breakpoints in
  the checked stylesheets. Only Inside Cafe was visually checked in a narrow
  browser window. No site was pixel-tested at 390 px.

## The rule

No email is sent by any script. No price is quoted without Vishal's explicit
approval. Vishal reviews each draft and sends from his own account, one business
at a time. See [../README.md](../README.md) for the workflow.
"""
    (REPORTS / "README.md").write_text(index, encoding="utf-8")


def dashboard_data(rows: list[dict]) -> dict:
    leads = []
    for row in rows:
        item = {key: row[key] for key in (
            "slug", "name", "country", "city", "category", "website", "email",
            "phone", "contact_person", "priority", "score", "status",
            "project_type", "price_tier", "price_inr_low", "price_inr_high",
            "effort", "source_url", "source_label", "verified", "site_quality",
            "mobile_experience", "issues", "solution", "opportunity", "evidence",
            "notes",
        )}
        item["usd_low"] = usd(row["price_inr_low"])
        item["usd_high"] = usd(row["price_inr_high"])
        item["draft_subject"] = row["draft_subject"]
        item["draft_body"] = draft(row)
        leads.append(item)
    low = sum(row["price_inr_low"] for row in rows)
    high = sum(row["price_inr_high"] for row in rows)
    return {
        "generated": max(row["verified"] for row in rows),
        "total": len(rows),
        "goal_low": 70000,
        "goal_high": 80000,
        "rate_inr": RATE_INR_PER_USD,
        "pipeline_low": low,
        "pipeline_high": high,
        "pipeline_usd_low": usd(low),
        "pipeline_usd_high": usd(high),
        "leads": leads,
    }


HTML = r"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lead Desk — International Pipeline</title>
<style>
  :root{
    --bg:#06040c;--bg2:#0a0614;--panel:#0e0a1b;--panel2:#130d24;
    --line:rgba(255,255,255,.09);--line2:rgba(255,255,255,.15);
    --text:#f3f0fc;--soft:#cfc9e4;--muted:#9d96b8;
    --purple:#8b5cf6;--purple2:#b79bff;--blue:#4d8bff;
    --hot:#ff7a59;--warm:#e9b949;--low:#7fd1b9;
    --radius:18px;--shadow:0 24px 80px -30px rgba(0,0,0,.8);
  }
  *{box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{margin:0;background:var(--bg);color:var(--text);font:16px/1.6 "Segoe UI",system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden}
  body::before{content:"";position:fixed;inset:0;z-index:-2;background:
    radial-gradient(700px 420px at 12% -8%,rgba(139,92,246,.20),transparent 65%),
    radial-gradient(700px 420px at 92% 4%,rgba(77,139,255,.13),transparent 65%),
    linear-gradient(180deg,#080511,#06040c 55%)}
  body::after{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;opacity:.35;
    background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);
    background-size:64px 64px;mask-image:linear-gradient(180deg,#000,transparent 90%)}
  a{color:inherit;text-decoration:none}
  button,input,select{font:inherit;color:inherit}
  button{cursor:pointer}
  .wrap{width:min(1240px,calc(100% - 40px));margin:0 auto}
  .top{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:22px 0;border-bottom:1px solid var(--line)}
  .brand{display:flex;align-items:center;gap:10px;font-weight:700;letter-spacing:-.02em}
  .brand .dot{width:10px;height:10px;border-radius:50%;background:linear-gradient(135deg,var(--purple2),var(--blue));box-shadow:0 0 18px rgba(139,92,246,.9)}
  .brand .sep{color:var(--muted);font-weight:400}
  .meta{color:var(--muted);font-size:13px;text-align:right}
  .hero{display:grid;grid-template-columns:1.5fr .9fr;gap:34px;align-items:end;padding:64px 0 42px}
  .eyebrow{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--purple2);font-weight:700;margin:0 0 14px}
  h1{font-size:clamp(38px,5.4vw,72px);line-height:1.02;letter-spacing:-.055em;margin:0;font-weight:800;text-wrap:balance}
  h1 span{background:linear-gradient(110deg,#fff 0%,#c4a7ff 45%,#7fb0ff 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
  .lede{color:var(--soft);max-width:680px;margin:22px 0 0;font-size:17px}
  .goal{border:1px solid rgba(139,92,246,.35);background:linear-gradient(145deg,rgba(139,92,246,.16),rgba(77,139,255,.06));border-radius:24px;padding:24px;box-shadow:var(--shadow)}
  .goal-num{font-size:32px;font-weight:800;letter-spacing:-.04em;margin:2px 0 8px}
  .goal p{color:var(--soft);font-size:14px;margin:0}
  .goal .tiny{color:var(--muted);font-size:12px;margin-top:12px}
  .readiness{display:flex;gap:16px;align-items:flex-start;border:1px solid rgba(233,185,73,.3);background:linear-gradient(135deg,rgba(233,185,73,.10),rgba(233,185,73,.03));border-radius:18px;padding:18px 20px;margin-bottom:26px}
  .readiness .bang{flex:0 0 34px;width:34px;height:34px;border-radius:10px;background:rgba(233,185,73,.15);color:var(--warm);display:grid;place-items:center;font-weight:800}
  .readiness strong{color:#ffe6a6}
  .readiness p{margin:2px 0 0;color:var(--soft);font-size:14px}
  .readiness a{display:inline-block;margin-top:8px;color:#ffe6a6;font-size:13px;border-bottom:1px solid rgba(255,230,166,.4)}
  .stats{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin:0 0 34px}
  .stat{border:1px solid var(--line);background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.018));border-radius:16px;padding:16px}
  .stat .n{font-size:26px;font-weight:800;letter-spacing:-.04em;line-height:1.1}
  .stat .l{color:var(--muted);font-size:11px;letter-spacing:.1em;text-transform:uppercase;margin-top:6px}
  .stat.hot .n{color:var(--hot)}.stat.warm .n{color:var(--warm)}.stat.cool .n{color:var(--low)}
  .controls{display:flex;flex-wrap:wrap;gap:10px;align-items:center;padding:18px;border:1px solid var(--line);border-radius:18px;background:rgba(255,255,255,.025);margin-bottom:16px}
  .search{flex:1 1 260px;display:flex;align-items:center;gap:9px;border:1px solid var(--line2);border-radius:11px;padding:0 12px;background:rgba(0,0,0,.18)}
  .search svg{opacity:.55;flex:0 0 auto}
  .search input{width:100%;border:0;outline:0;background:transparent;padding:11px 0;font-size:14px}
  select{border:1px solid var(--line2);border-radius:11px;background:#0c0817;padding:10px 12px;font-size:13px;outline:0}
  .seg{display:flex;gap:4px;padding:4px;border:1px solid var(--line);border-radius:12px;background:rgba(0,0,0,.18)}
  .seg button{border:0;background:transparent;color:var(--muted);padding:7px 11px;border-radius:8px;font-size:12px;font-weight:700;letter-spacing:.03em}
  .seg button.on{background:rgba(139,92,246,.22);color:#fff;box-shadow:inset 0 0 0 1px rgba(139,92,246,.4)}
  .count{margin:10px 2px 12px;color:var(--muted);font-size:12px}
  .tablewrap{border:1px solid var(--line);border-radius:20px;overflow-x:auto;overflow-y:hidden;background:rgba(10,7,19,.75);box-shadow:var(--shadow);-webkit-overflow-scrolling:touch}
  .tablehint{display:none;color:var(--muted);font-size:11px;margin:0 2px 8px}
  table{width:100%;border-collapse:collapse;min-width:960px}
  th{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);text-align:left;padding:14px 16px;background:rgba(255,255,255,.035);border-bottom:1px solid var(--line)}
  td{padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.06);vertical-align:middle;font-size:13.5px}
  tr:last-child td{border-bottom:0}
  tbody tr{transition:background .15s}
  tbody tr:hover{background:rgba(139,92,246,.06)}
  .biz{font-weight:700;letter-spacing:-.01em}
  .sub{color:var(--muted);font-size:11.5px;margin-top:2px}
  .badge{display:inline-flex;align-items:center;gap:6px;font-size:10px;font-weight:800;letter-spacing:.08em;padding:5px 9px;border-radius:999px;border:1px solid}
  .badge.HOT{color:var(--hot);border-color:rgba(255,122,89,.35);background:rgba(255,122,89,.10)}
  .badge.WARM{color:var(--warm);border-color:rgba(233,185,73,.35);background:rgba(233,185,73,.10)}
  .badge.LOW{color:var(--low);border-color:rgba(127,209,185,.35);background:rgba(127,209,185,.10)}
  .muted{color:var(--muted)}
  .mail{font-size:12px;word-break:break-word}
  .est{font-variant-numeric:tabular-nums;font-weight:700}
  .est small{display:block;color:var(--muted);font-weight:400;font-size:10.5px}
  .open{border:1px solid var(--line2);background:rgba(255,255,255,.04);border-radius:9px;padding:7px 11px;font-size:12px;font-weight:700}
  .open:hover{background:rgba(139,92,246,.18);border-color:rgba(139,92,246,.5)}
  .empty{padding:50px 20px;text-align:center;color:var(--muted)}
  .foot{margin:34px 0 60px;color:var(--muted);font-size:12.5px;line-height:1.75}
  .foot strong{color:var(--soft)}
  .foot a{border-bottom:1px solid rgba(255,255,255,.2)}
  .overlay{position:fixed;inset:0;background:rgba(3,2,8,.72);backdrop-filter:blur(4px);z-index:40}
  .drawer{position:fixed;top:0;right:0;bottom:0;width:min(620px,100%);background:#0b0716;border-left:1px solid var(--line2);z-index:50;overflow-y:auto;padding:28px 30px 48px;box-shadow:-30px 0 90px rgba(0,0,0,.6);transform:translateX(0);animation:slide .22s ease}
  @keyframes slide{from{transform:translateX(30px);opacity:.4}to{transform:translateX(0);opacity:1}}
  .drawer .close{position:sticky;top:0;float:right;border:1px solid var(--line2);background:#0b0716;border-radius:10px;width:34px;height:34px;font-size:18px;line-height:1;z-index:2}
  .drawer h2{font-size:30px;letter-spacing:-.04em;line-height:1.1;margin:8px 0 6px;max-width:480px}
  .drawer h3{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--purple2);margin:26px 0 9px}
  .drawer p{margin:0 0 11px;color:var(--soft);font-size:14px}
  .drawer ul{margin:0;padding-left:18px;color:var(--soft);font-size:13.5px}
  .drawer li{margin-bottom:7px}
  .kv{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:18px 0 6px}
  .kv div{border:1px solid var(--line);border-radius:12px;padding:11px 13px;background:rgba(255,255,255,.025)}
  .kv .k{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
  .kv .v{font-size:13px;margin-top:3px;word-break:break-word}
  .box{border:1px solid var(--line);border-radius:14px;padding:14px;background:rgba(255,255,255,.025);margin:10px 0}
  .box.draft{background:rgba(139,92,246,.06);border-color:rgba(139,92,246,.25)}
  .box pre{white-space:pre-wrap;font:12.5px/1.6 "Cascadia Code",Consolas,monospace;color:#ded9f2;margin:0}
  .actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
  .btn{border:1px solid var(--line2);background:rgba(255,255,255,.05);border-radius:10px;padding:9px 12px;font-size:12px;font-weight:700}
  .btn.primary{background:linear-gradient(110deg,#8b5cf6,#4d8bff);border-color:transparent;color:#fff}
  .btn:hover{filter:brightness(1.12)}
  .note{color:var(--muted);font-size:11.5px;margin-top:10px}
  .toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);background:#f3f0fc;color:#100a1d;padding:10px 16px;border-radius:999px;font-size:12px;font-weight:700;z-index:60;opacity:0;pointer-events:none;transition:opacity .2s}
  .toast.show{opacity:1}
  @media (max-width:1000px){.stats{grid-template-columns:repeat(3,1fr)}.hero{grid-template-columns:1fr}.goal{max-width:520px}}
  @media (max-width:700px){.wrap{width:calc(100% - 28px)}.top{display:block}.meta{text-align:left;margin-top:6px}.hero{padding:44px 0 30px}.stats{grid-template-columns:repeat(2,1fr)}.controls{padding:14px}.seg{width:100%;overflow-x:auto}.drawer{padding:22px 18px 40px}.kv{grid-template-columns:1fr}.tablehint{display:block}}
  @media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
</style>
</head>
<body>
<header class="top wrap">
  <a class="brand" href="../index.html"><span class="dot"></span>Vishal Kumar <span class="sep">/</span> Lead Desk</a>
  <div class="meta">Prepared <span id="genDate"></span> · <span id="totalTop"></span> leads · public information only</div>
</header>

<main class="wrap">
  <section class="hero">
    <div>
      <p class="eyebrow">Client acquisition · research dashboard</p>
      <h1><span id="totalHero">20</span> qualified leads.<br><span>No outreach sent.</span></h1>
      <p class="lede">A working pipeline across the US, UK, Canada, Australia and New Zealand. Every row is based on a public website or public business page. Gaps are marked, not filled in.</p>
    </div>
    <aside class="goal">
      <p class="eyebrow">Savings target</p>
      <div class="goal-num">₹70k–₹80k</div>
      <p>A laptop fund, not a per-site price. At ₹3,000–₹4,000 per project, reaching it takes roughly 18–27 paid projects before fees and taxes.</p>
      <p class="tiny">If all 20 leads converted, their suggested prices total <strong id="pipelineValue">₹75,000–₹78,000</strong> (≈ <span id="pipelineUsd">$806–$839</span>). That is arithmetic, not a forecast.</p>
    </aside>
  </section>

  <section class="readiness" aria-label="Readiness warning">
    <div class="bang">!</div>
    <div>
      <strong>Portfolio link is still missing.</strong>
      <p>GitHub Pages is not enabled for Gorav64/web-development-portfolio, and no live site was found. Every draft contains a placeholder for a live portfolio URL. Deploy before sending, or replace it with a live concept link.</p>
      <a href="../docs/deployment.md">Read the deployment guide →</a>
    </div>
  </section>

  <section class="stats" aria-label="Pipeline statistics">
    <div class="stat"><div class="n" id="statTotal">20</div><div class="l">Total leads</div></div>
    <div class="stat hot"><div class="n" id="statHot">0</div><div class="l">Hot</div></div>
    <div class="stat warm"><div class="n" id="statWarm">0</div><div class="l">Warm</div></div>
    <div class="stat cool"><div class="n" id="statLow">0</div><div class="l">Low</div></div>
    <div class="stat"><div class="n" id="statEmail">0</div><div class="l">Public email</div></div>
    <div class="stat"><div class="n" id="statContacted">0</div><div class="l">Contacted</div></div>
  </section>

  <section class="controls" aria-label="Filters">
    <label class="search">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path></svg>
      <input id="q" type="search" placeholder="Search business, city, issue or email" autocomplete="off">
    </label>
    <select id="country" aria-label="Filter by country"><option value="">All countries</option></select>
    <select id="category" aria-label="Filter by industry"><option value="">All industries</option></select>
    <select id="emailFilter" aria-label="Filter by email availability">
      <option value="">Any email status</option>
      <option value="yes">Public email available</option>
      <option value="no">Email unavailable</option>
    </select>
    <select id="statusFilter" aria-label="Filter by contact status"><option value="">Any contact status</option></select>
    <div class="seg" role="group" aria-label="Filter by priority">
      <button data-p="" class="on">All</button>
      <button data-p="HOT">HOT</button>
      <button data-p="WARM">WARM</button>
      <button data-p="LOW">LOW</button>
    </div>
  </section>

  <div class="count" id="count" aria-live="polite"></div>
  <p class="tablehint">Swipe the table sideways on a phone to see email, price and the Brief button.</p>

  <section class="tablewrap" aria-label="Lead table">
    <table>
      <thead>
        <tr><th>Priority</th><th>Business</th><th>Market</th><th>Industry</th><th>Public email</th><th>Suggested price</th><th>Status</th><th></th></tr>
      </thead>
      <tbody id="rows"></tbody>
    </table>
    <div class="empty" id="empty" hidden>No leads match those filters.</div>
  </section>

  <footer class="foot">
    <p><strong>What this dashboard does:</strong> it filters and displays the real records in <a href="leads.csv">leads.csv</a>. Statistics are computed from those records; nothing is estimated or padded. All 20 leads are marked <strong>not contacted</strong>.</p>
    <p><strong>Prices:</strong> the three beginner tiers are ₹3,000 for a landing page, ₹4,000 for a small business website and ₹3,000–₹4,000 for a redesign. Every figure here is a suggestion from those tiers, not a quote, and none has been sent to a business. USD amounts use a ₹93/USD planning rate. Hosting, domain, extras, fees and taxes are excluded.</p>
    <p><strong>Limits:</strong> no site was pixel-tested at 390 px. Mobile notes come from the viewport meta tag and responsive breakpoints in the checked stylesheets; Inside Cafe was also checked in a narrow browser window. No performance, security or ranking claim is made.</p>
    <p><strong>Privacy:</strong> this file makes no network requests and sets no cookies. Opening a source link leaves this page. Business details are from public pages accessed on <span id="genDate2"></span>. Do not publish this pipeline.</p>
  </footer>
</main>

<div class="overlay" id="overlay" hidden></div>
<aside class="drawer" id="drawer" role="dialog" aria-modal="true" aria-labelledby="drawerTitle" hidden>
  <button class="close" id="close" aria-label="Close brief">×</button>
  <div id="drawerBody"></div>
</aside>
<div class="toast" id="toast" role="status" aria-live="polite"></div>

<script>
const DATA = /*__LEADS__*/{};
const LEADS = DATA.leads;
const state = { q: "", priority: "", country: "", category: "", email: "", status: "" };
const $ = (id) => document.getElementById(id);

function fmt(n){ return new Intl.NumberFormat("en-US").format(n); }
function usdMoney(n){ return "$" + fmt(n); }
function inr(n){ return "₹" + fmt(n); }
function priceInr(l){ return l.price_inr_low === l.price_inr_high ? inr(l.price_inr_low) : inr(l.price_inr_low) + "–" + inr(l.price_inr_high); }
function priceUsd(l){ const a = usdMoney(l.usd_low), b = usdMoney(l.usd_high); return l.usd_low === l.usd_high ? a : a + "–" + b; }
function badge(p){ return `<span class="badge ${p}">${p}</span>`; }
function emailLabel(l){ return l.email === "unavailable" ? '<span class="muted">unavailable</span>' : `<span class="mail">${escapeHtml(l.email)}</span>`; }
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

function init(){
  $("genDate").textContent = DATA.generated;
  $("genDate2").textContent = DATA.generated;
  $("totalTop").textContent = DATA.total;
  $("totalHero").textContent = DATA.total;
  $("statTotal").textContent = DATA.total;
  $("statHot").textContent = LEADS.filter(l => l.priority === "HOT").length;
  $("statWarm").textContent = LEADS.filter(l => l.priority === "WARM").length;
  $("statLow").textContent = LEADS.filter(l => l.priority === "LOW").length;
  $("statEmail").textContent = LEADS.filter(l => l.email !== "unavailable").length;
  $("statContacted").textContent = LEADS.filter(l => l.status !== "not_contacted").length;

  $("pipelineValue").textContent = DATA.pipeline_low === DATA.pipeline_high
    ? inr(DATA.pipeline_low)
    : inr(DATA.pipeline_low) + "–" + inr(DATA.pipeline_high);
  $("pipelineUsd").textContent = DATA.pipeline_usd_low === DATA.pipeline_usd_high
    ? usdMoney(DATA.pipeline_usd_low)
    : usdMoney(DATA.pipeline_usd_low) + "–" + usdMoney(DATA.pipeline_usd_high);

  fillSelect("country", [...new Set(LEADS.map(l => l.country))].sort());
  fillSelect("category", [...new Set(LEADS.map(l => l.category))].sort());
  fillSelect("statusFilter", [...new Set(LEADS.map(l => l.status))].sort(), (v) => v === "not_contacted" ? "Not contacted" : v);

  $("q").addEventListener("input", e => { state.q = e.target.value.toLowerCase(); render(); });
  ["country","category","emailFilter","statusFilter"].forEach(id => {
    $(id).addEventListener("change", e => {
      state[{country:"country",category:"category",emailFilter:"email",statusFilter:"status"}[id]] = e.target.value;
      render();
    });
  });
  document.querySelectorAll(".seg button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".seg button").forEach(b => b.classList.remove("on"));
      btn.classList.add("on");
      state.priority = btn.dataset.p;
      render();
    });
  });
  $("overlay").addEventListener("click", closeDrawer);
  $("close").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeDrawer(); });
  render();
}

function fillSelect(id, values, label){
  const el = $(id);
  values.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = label ? label(v) : v;
    el.appendChild(opt);
  });
}

function filtered(){
  return LEADS.filter(l => {
    if (state.priority && l.priority !== state.priority) return false;
    if (state.country && l.country !== state.country) return false;
    if (state.category && l.category !== state.category) return false;
    if (state.email === "yes" && l.email === "unavailable") return false;
    if (state.email === "no" && l.email !== "unavailable") return false;
    if (state.status && l.status !== state.status) return false;
    if (state.q) {
      const hay = [l.name,l.city,l.country,l.category,l.email,l.site_quality,l.price_tier,l.effort,...l.issues,l.opportunity].join(" ").toLowerCase();
      if (!hay.includes(state.q)) return false;
    }
    return true;
  });
}

function render(){
  const list = filtered();
  $("count").textContent = `${list.length} of ${LEADS.length} leads shown`;
  $("empty").hidden = list.length !== 0;
  $("rows").innerHTML = list.map((l, i) => {
    const idx = LEADS.indexOf(l);
    return `<tr>
      <td>${badge(l.priority)}</td>
      <td><div class="biz">${escapeHtml(l.name)}</div><div class="sub">Score ${l.score}/100</div></td>
      <td>${escapeHtml(l.city)}<div class="sub">${escapeHtml(l.country)}</div></td>
      <td>${escapeHtml(l.category)}</td>
      <td>${emailLabel(l)}</td>
      <td class="est">${priceInr(l)}<small>≈ ${priceUsd(l)}</small></td>
      <td><span class="muted">Not contacted</span></td>
      <td><button class="open" data-i="${idx}">Brief</button></td>
    </tr>`;
  }).join("");
  document.querySelectorAll(".open").forEach(btn => btn.addEventListener("click", () => openDrawer(Number(btn.dataset.i))));
}

function openDrawer(i){
  const l = LEADS[i];
  const emailBlock = l.email === "unavailable"
    ? '<div class="box"><strong>Public email</strong><div class="muted">Unavailable — none found on the public pages checked.</div></div>'
    : `<div class="box"><strong>Public email</strong><div class="mail">${escapeHtml(l.email)}</div><div class="note">Verify this is the right inbox before sending.</div></div>`;
  $("drawerBody").innerHTML = `
    ${badge(l.priority)}
    <h2 id="drawerTitle">${escapeHtml(l.name)}</h2>
    <p class="muted">${escapeHtml(l.city)}, ${escapeHtml(l.country)} · ${escapeHtml(l.category)} · score ${l.score}/100</p>
    <div class="kv">
      <div><div class="k">Suggested price</div><div class="v"><strong>${priceInr(l)}</strong> · ≈ ${priceUsd(l)}</div></div>
      <div><div class="k">Estimated effort</div><div class="v">${escapeHtml(l.effort)}</div></div>
      <div><div class="k">Price tier</div><div class="v">${escapeHtml(l.price_tier)}</div></div>
      <div><div class="k">Project type</div><div class="v">${escapeHtml(l.project_type)}</div></div>
      <div><div class="k">Website</div><div class="v">${l.website ? `<a href="${escapeHtml(l.website)}" target="_blank" rel="noopener">${escapeHtml(l.website.replace(/^https?:\/\//,""))}</a>` : "None found"}</div></div>
      <div><div class="k">Contact status</div><div class="v">Not contacted</div></div>
    </div>
    <p class="note">Tier price only. Hosting, domain, extras, transaction fees and taxes are excluded. No quote has been sent or approved.</p>
    ${emailBlock}
    <h3>What I observed</h3>
    <ul>${l.issues.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
    <h3>Why it matters</h3>
    <p>${escapeHtml(l.opportunity)}</p>
    <h3>Suggested first scope</h3>
    <p>${escapeHtml(l.solution)}</p>
    <h3>Evidence</h3>
    <ul>${l.evidence.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
    <h3>Website quality & mobile</h3>
    <p><strong>${escapeHtml(l.site_quality)}.</strong> ${escapeHtml(l.mobile_experience)}</p>
    <h3>Draft first email — not sent</h3>
    <div class="box draft"><strong>${escapeHtml(l.draft_subject)}</strong><pre id="draftText">${escapeHtml(l.draft_body)}</pre></div>
    <div class="actions">
      <button class="btn primary" id="copyDraft">Copy draft</button>
      ${l.email === "unavailable" ? "" : `<a class="btn" href="mailto:${encodeURIComponent(l.email)}?subject=${encodeURIComponent(l.draft_subject)}&body=${encodeURIComponent(l.draft_body)}">Open in email app</a>`}
      ${l.website ? `<a class="btn" href="${escapeHtml(l.website)}" target="_blank" rel="noopener">Visit website</a>` : ""}
      <a class="btn" href="${escapeHtml(l.source_url)}" target="_blank" rel="noopener">Source</a>
    </div>
    <p class="note">No email has been sent. Opening your email app does not send anything. Replace the portfolio placeholder and add a postal address where required before sending.</p>
  `;
  $("overlay").hidden = false;
  $("drawer").hidden = false;
  document.body.style.overflow = "hidden";
  $("close").focus();
  const copyBtn = $("copyDraft");
  if (copyBtn) copyBtn.addEventListener("click", () => copyText(l.draft_subject + "\n\n" + l.draft_body));
}

function closeDrawer(){
  $("overlay").hidden = true;
  $("drawer").hidden = true;
  document.body.style.overflow = "";
}

async function copyText(text){
  try {
    await navigator.clipboard.writeText(text);
    toast("Draft copied");
  } catch (err) {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); toast("Draft copied"); }
    catch (e) { toast("Select the draft text to copy"); }
    ta.remove();
  }
}
function toast(msg){
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 1800);
}
init();
</script>
</body>
</html>
"""


def write_dashboard(rows: list[dict]) -> None:
    payload = json.dumps(dashboard_data(rows), ensure_ascii=False).replace("</", "<\\/")
    html = HTML.replace("/*__LEADS__*/{}", payload)
    DASHBOARD.write_text(html, encoding="utf-8")


def main() -> None:
    rows = json.loads(DATA.read_text(encoding="utf-8"))
    validate(rows)
    write_csv(rows)
    write_reports(rows)
    write_dashboard(rows)
    low = sum(row["price_inr_low"] for row in rows)
    high = sum(row["price_inr_high"] for row in rows)
    print(f"Validated {len(rows)} leads.")
    print(f"HOT {sum(1 for r in rows if r['priority']=='HOT')} | WARM {sum(1 for r in rows if r['priority']=='WARM')} | LOW {sum(1 for r in rows if r['priority']=='LOW')}")
    print(f"Public emails: {sum(1 for r in rows if r['email'] != 'unavailable')}/{len(rows)}")
    print(f"Suggested pipeline: INR {low:,}-{high:,} (approx USD {usd(low):,}-{usd(high):,} at {RATE_INR_PER_USD}/USD). If all 20 converted; not a forecast.")
    print(f"Wrote {CSV_OUT.relative_to(ROOT)}")
    print(f"Wrote {REPORTS.relative_to(ROOT)}/ ({len(rows)} reports + index)")
    print(f"Wrote {DASHBOARD.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

# Lead database and dashboard

Twenty researched leads across the US, UK, Canada, Australia and New Zealand.
Every row is a real business whose public pages were checked on 2026-11-20.
Nothing has been sent, published or paid.

| File | What it is |
| --- | --- |
| `lead-data.json` | Source of truth. Edit this, never the generated files. |
| `leads.csv` | 28-column export for spreadsheets and the Studio import. |
| `dashboard.html` | Self-contained dashboard: search, filters, per-lead brief, draft text. |
| `reports/` | One short opportunity report per lead, plus an index. |
| `sample-leads.csv` | Fictional template rows labelled "Do not contact". Not leads. |

## Current numbers

- 20 leads: 5 HOT, 12 WARM, 3 LOW. Five US, three UK, four Canada, four Australia, four New Zealand.
- 12 of 20 have a public business email found on their own site; the other 8 are marked
  unavailable rather than guessed.
- All 20 are `not_contacted`, with no contact date, follow-up date or response.
- Suggested prices follow the beginner tiers: 15 small business websites at ₹4,000,
  3 redesigns at ₹3,000–₹4,000 and 2 landing pages at ₹3,000. All 20 together total
  ₹75,000–₹78,000 (about $806–$839 at a ₹93/USD planning rate) **only if every lead
  converted**. That is arithmetic, not a forecast, and it excludes fees and taxes.
- The ₹70,000–₹80,000 figure is the laptop savings target, not a per-site price. At
  ₹3,000–₹4,000 per project it takes roughly 18–27 paid projects to reach, before
  fees and taxes.

## Pricing rules

- Landing page ₹3,000. Small business website ₹4,000. Simple redesign ₹3,000–₹4,000.
- These are starting suggestions, not fixed prices. Analyse the requirement, estimate
  the effort, then propose a figure within the tier. Show INR and USD, list what is
  included and name hosting, domain, extra features, transaction fees and taxes as
  additional.
- Never put a price in a cold email. Quote only after the business replies.
- Never send or finalise a quote without Vishal's explicit approval.
- USD figures here use a ₹93/USD planning rate from 2026-11-20. Update the rate in
  `tools/build_lead_system.py` and `studio/js/data.js` when it drifts.

## Open the dashboard

The dashboard has no server side and makes no network requests. With the local
server running:

```bash
py tools/serve.py
```

Open <http://localhost:4173/leads/dashboard.html>. Opening the file directly from
disk also works. Filters, sorting and the brief panel run in the browser; lead
data never leaves the machine.

## Regenerate after editing

```bash
py tools/build_lead_system.py
```

The script validates the dataset before writing anything. It refuses to run if a
lead is missing required fields, has a duplicate name or source, sits in the wrong
priority band for its score, uses a known placeholder email (such as
`filler@godaddy.com`), claims to have been contacted, has fewer than three evidence
lines, or carries a price outside the approved tier. It then rewrites the CSV, all
20 reports and the dashboard.

## Sending rules

- Drafts in `reports/` are text only. No script in this repository sends email.
- No draft contains a price. Pricing is discussed only after the business replies.
- Every draft still contains `[live portfolio URL — add before sending]` because no
  live portfolio URL exists yet. Do not send a draft with that placeholder in it.
- Replace the placeholder, verify the recipient inbox, and get explicit approval for
  each individual email. One business at a time, no batch sends.
- US and Canadian drafts need a valid physical postal address in the signature.
- One follow-up after 4–7 days, then stop. Honour any opt-out immediately.

See [docs/outreach-guide.md](../docs/outreach-guide.md) for the full rules.

## Method and limits

Findings come from the public pages themselves: page titles, headings, navigation,
image alt text, forms, visible copyright years and publicly displayed emails. Mobile
notes are based on the viewport tag and responsive CSS except Inside Cafe, where the
first screen was checked visually. Nothing was scanned for security, and no page is
described as slow or broken because that was not measured. Sites behind a login,
CAPTCHA or anti-bot wall were left alone. The research helpers live in
[`research/`](../research/) and [`tools/`](../tools/).

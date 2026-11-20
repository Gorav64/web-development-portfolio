# Lead database and dashboard

Twenty researched leads across the US, UK, Canada, Australia and New Zealand.
Every row is a real business whose public pages were checked on 2026-11-20.
Nothing has been sent, published or paid.

| File | What it is |
| --- | --- |
| `lead-data.json` | Source of truth. Edit this, never the generated files. |
| `leads.csv` | 25-column export for spreadsheets and the Studio import. |
| `dashboard.html` | Self-contained dashboard: search, filters, per-lead brief, draft text. |
| `reports/` | One short opportunity report per lead, plus an index. |
| `sample-leads.csv` | Fictional template rows labelled "Do not contact". Not leads. |

## Current numbers

- 20 leads: 5 HOT, 12 WARM, 3 LOW. Five US, three UK, four Canada, four Australia, four New Zealand.
- 12 of 20 have a public business email found on their own site; the other 8 are marked
  unavailable rather than guessed.
- All 20 are `not_contacted`, with no contact date, follow-up date or response.
- Starting estimates total USD 13,740, about ₹11,54,160 at the fixed ₹84/USD research
  rate. These are per-project starting points from `docs/pricing-guide.md`, not a
  forecast of earnings or a promise that any lead will convert.

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
`filler@godaddy.com`), claims to have been contacted, or has fewer than three
evidence lines. It then rewrites the CSV, all 20 reports and the dashboard.

## Sending rules

- Drafts in `reports/` are text only. No script in this repository sends email.
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

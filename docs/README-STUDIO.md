# Studio — how it works

Studio is the client operations dashboard in `studio/`. It runs entirely in the
browser, needs no server and makes no network requests. Open it locally:

```bash
py tools/serve.py
# http://localhost:4173/studio/
```

> Opening `studio/index.html` directly from the file system also works in most
> browsers, but a local server is more reliable for downloads and printing.

---

## Storage model

| Item | Value |
| --- | --- |
| Storage | Browser `localStorage` |
| Key | `mwp.studio.v1` |
| Scope | This browser profile on this device only |
| Typical limit | About 5 MB |
| Encryption | None — do not store secrets |
| Cloud sync | None |

The store keeps three arrays and a settings object:

```json
{
  "version": 1,
  "leads": [],
  "projects": [],
  "settings": { "ownerName": "", "email": "", "portfolioUrl": "", "currency": "USD" },
  "meta": { "createdAt": "", "updatedAt": "" }
}
```

Records are normalised on load, so a hand-edited backup with missing fields will
not break the app.

### Backups are mandatory

1. Settings → **Backup & export** → Export (JSON).
2. Store the file somewhere you control (password manager, encrypted drive).
3. Restore with **Choose file** — this replaces all current records after a
   confirmation.

Clearing browser data, private browsing, a different browser or a different
profile will not show your records. JSON export is the only durable copy.

---

## Views

### Overview

Eight counters: total leads, new, contacted, replies, interested, proposals
sent, won, completed. The bars show the distribution across all lead statuses.
Follow-ups are sorted overdue-first, then by date.

**Sample records never affect the counters.** They are counted separately.

### Leads

Fields: business, country, category, official website, public email, public
phone, contact person, status, follow-up date, observed problems, suggested
improvements, opportunity and private notes.

- Search across business, email, website, city, notes and opportunity.
- Filter by country, category and status.
- Change status inline.
- Delete requires a confirmation dialog naming the business.
- Export CSV from the toolbar. The export includes a `Sample` column.

Lead statuses: New → Contacted → Replied → Interested → Proposal sent → Won /
Completed, plus **Not a fit**.

### Projects

Fields: name, client, linked lead, status, deadline, agreed budget and currency,
task checklist, approvals and notes.

- Progress is the share of completed tasks.
- Approvals have a Pending / Approved state.
- **Mark paid** always asks for confirmation and explains that Studio cannot
  verify a payment. Never mark a project paid before you have checked your own
  bank or payment account.
- Delivered / Completed do not imply payment. Payment is tracked separately and
  only changed by you.

Project statuses: New inquiry, Discussion, Proposal sent, Negotiation,
Confirmed, In development, Testing, Delivered, Completed.

### Outreach

1. Select a lead.
2. Select a template.
3. Generate draft.
4. Edit the subject and body — replace every `[bracketed]` placeholder with a
   real observation.
5. Either:
   - **Copy draft** and paste into your email client, or
   - **Open in email app** (uses a `mailto:` link), or
   - **Log draft & mark contacted** to record that you sent it. This does not
     send anything.

Logging a draft stores the subject and body on the lead and, if the lead is
still “New”, moves it to “Contacted”. If no follow-up date exists, one is set
five days ahead.

Template library: no website, outdated website, redesign, landing page,
follow-up. The wording deliberately asks you to supply the specific observation
— it never invents a problem with someone's business.

### Proposals

The estimate is calculated from:

```
base (project type)
+ extra pages × page price
+ selected add-ons
+ 25% if priority delivery
= total in USD → converted for display
```

- Prices are starting estimates, not fixed quotes.
- Currency rates are fixed approximations in `studio/js/data.js`; update them
  manually when they drift.
- Milestones: 50/50 below USD 700; 40/40/20 at or above USD 700.
- Revision policy: two rounds included; additional rounds at the configured
  price.
- **Print / Save as PDF** prints only the proposal paper.
- **Create project** creates a project in “Proposal sent” with a standard task
  checklist. It does not confirm, sign or send anything.

The proposal is a starting document. Read every line, adjust it to the actual
conversation, and never promise rankings, traffic or revenue.

### Site builder

Thirteen industry presets (restaurant, café, gym, fitness studio, real estate,
salon, consultant, local service, small business, startup, SaaS, portfolio,
agency) across three layout families (split, bold, centered), each with its own
palette and typography.

Output:

- `index.html` — semantic page with SEO meta and JSON-LD LocalBusiness schema
- `styles.css` — self-contained theme and responsive rules
- `script.js` — mobile menu, reveals and mailto contact form
- `README.md` — delivery notes and editing guide

The preview is sandboxed. Download files individually or all at once. Generated
sites are starting points: replace placeholder copy, confirm hours/contact
details, test on a real phone and get written sign-off before delivery.

### Settings

- Your details (used in proposal headers and email sign-offs).
- JSON backup/restore, CSV export.
- Load or remove sample data.
- Storage size and key.
- Delete all records with a typed `DELETE` confirmation. Settings are kept.

---

## Deliberate limitations

- Studio cannot send email, publish a site or verify a payment.
- There is no server, account system, multi-device sync or encryption.
- The browser storage limit is small. Long notes are fine; do not attach files.
- CSV import is not supported — CSV is an export/worksheet format. Use JSON to
  restore.
- `noindex` and `robots.txt` are not access control. Do not deploy Studio to a
  public URL with real lead data unless you understand that anyone with the URL
  can read what is in *their own* browser (the data itself is not on the
  server, but the app is public).

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| “No leads” after restart | Different browser/profile, or site data was cleared. Restore a JSON backup. |
| Import fails | File is not valid JSON or lacks a `leads`/`projects` array. |
| Quota error toast | Storage full. Export a backup, delete old records, or clear other site data. |
| Print shows the form | Use the proposal's own **Print / Save as PDF** button so the print styles apply. |
| Downloads blocked | Allow multiple downloads for `localhost`, then retry. |

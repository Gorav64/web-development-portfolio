# Modern Web Portfolio + Client Studio

A static portfolio site and a local-first client operations dashboard for an
independent web developer. No frameworks, no build step, no dependencies, no
backend. Everything runs from plain HTML, CSS and JavaScript.

**Live demo:** not published. Preview locally with the commands below.

---

## What is in this repository

```
modern-web-portfolio/
├── index.html                 Portfolio (single page)
├── assets/
│   ├── css/main.css           Design system and all portfolio styles
│   ├── js/config.js           Your name, email, GitHub, LinkedIn, form endpoint
│   ├── js/main.js             Navigation, reveals, tilt, case studies, form
│   └── img/favicon.svg
├── studio/                    Client operations dashboard (noindex)
│   ├── index.html
│   ├── css/studio.css
│   └── js/                    data.js · store.js · generator.js · app.js
├── docs/                      Business process and reference guides
├── leads/                     CSV templates for lead research
├── clients/                   Per-client brief example
├── tools/                     Local server, link checker, public-site builder
├── robots.txt
└── .gitignore
```

The public site is **only** `index.html`, `assets/` and `robots.txt`. Everything
else (`studio/`, `leads/`, `clients/`, `docs/`) is your working material and
should not be deployed publicly.

---

## Preview locally

Requires Python 3 (already available as `py` on Windows). No Node.js needed.

```bash
cd modern-web-portfolio
py tools/serve.py
```

Then open:

- Portfolio — <http://localhost:4173/>
- Studio — <http://localhost:4173/studio/>

The server serves the repository root with no caching. Stop it with `Ctrl+C`.
Use a different port with `py tools/serve.py 8080`.

Check that every local link resolves:

```bash
py tools/check_links.py
```

---

## Portfolio

Single page with sections: hero, about, services, selected work, skills,
process, contact.

### Edit your details

Open `assets/js/config.js`:

| Field | Purpose |
| --- | --- |
| `name`, `role` | Nav, footer, page title |
| `email` | Contact links and form fallback |
| `githubUsername` | GitHub link. Empty hides the link. |
| `linkedinUrl` | LinkedIn link. Empty shows a disabled “coming soon” item. |
| `location`, `timezone` | Availability panel |
| `formEndpoint` | Optional POST URL for the contact form |

### How the contact form works

- With `formEndpoint` empty (default), submitting opens the visitor's email
  client with the message pre-filled. This genuinely works with no backend.
- With a form service URL (Formspree, Getform, Basin…), the form POSTs as JSON
  and shows a success or error state.
- The form includes a honeypot field and client-side validation.
- The page clearly tells visitors that the email fallback is being used. Do not
  claim submissions are stored unless you have connected a service.

### Case studies

The three work cards — Nexora, Country Explorer, Zudoo — are described as
personal and learning projects, not paid client work. If that ever changes,
edit the content in `index.html`; do not upgrade the claims without evidence.

### Skills honesty

Skills are grouped into “Comfortable”, “Working knowledge” and “Currently
learning”. Keep React in the learning group until you can show real work with
it. Never list something you cannot discuss in an interview.

---

## Studio — client operations dashboard

Open <http://localhost:4173/studio/>. Studio is a separate single-page app that
keeps all records in this browser's `localStorage` under the key
`mwp.studio.v1`.

It does **not** send email, publish websites, process payments, sign anything
or contact anyone. It prepares work for you to review and act on.

**Views**

1. **Overview** — eight pipeline counters, lead pipeline bars, follow-ups,
   active project progress. Sample records are excluded from all counters.
2. **Leads** — add, edit, delete (with confirmation), search, filter by
   country/category/status, inline status changes, follow-up dates, CSV export.
3. **Projects** — nine delivery statuses, task checklist with progress,
   approval tracking, deadline, budget and explicit payment confirmation.
4. **Outreach** — choose a lead and one of five templates, generate an editable
   draft, copy it, open it in your mail client, or log it without sending.
5. **Proposals** — scope form with live estimate, printable paper, payment
   milestones, revision policy and exclusions. Can create a project from the
   estimate without confirming or signing anything.
6. **Site builder** — pick one of 13 industry presets, fill a brief, preview a
   complete responsive site, download `index.html`, `styles.css`, `script.js`
   and `README.md`.
7. **Settings** — your details, JSON backup/restore, CSV export, sample data,
   storage usage and a typed-confirmation reset.

**Data safety**

- Records live only in this browser profile. Clearing site data deletes them.
- Export a JSON backup from Settings after every working session.
- Demo records are labelled SAMPLE and never counted as real pipeline.
- Never store passwords, OTPs, banking details or private client information
  in notes.

Full details: [docs/README-STUDIO.md](docs/README-STUDIO.md).

---

## Build the deployable public site

```bash
py tools/build_public.py
```

This copies only the portfolio files into `site/` and writes a `.generated`
marker. It refuses to overwrite a `site/` folder it did not create. Deploy the
contents of `site/` — not the repository root.

Deployment steps for Netlify and Vercel: [docs/deployment.md](docs/deployment.md).

---

## Business processes

- [Client acquisition system](docs/client-acquisition.md)
- [Lead research worksheet](docs/lead-research-worksheet.md)
- [Outreach guide and templates](docs/outreach-guide.md)
- [Pricing guide](docs/pricing-guide.md)
- [Website development workflow](docs/website-workflow.md)
- [Proposal templates](docs/proposal-templates.md)
- [Project management](docs/project-management.md)
- [Deployment guide](docs/deployment.md)
- [Security and permissions](docs/security-and-permissions.md)

---

## Hard limits (built into this project)

- No email is sent by any script in this repository.
- No business is contacted automatically.
- No website is published automatically.
- No payment is made, requested through a payment processor, or marked received
  without your explicit confirmation.
- No contracts are signed or accepted on your behalf.
- No passwords, OTPs or banking credentials are handled anywhere.
- No personal data is scraped or bypassed; leads must come from information the
  business publishes publicly.

---

## Known limitations

- Studio storage is per-browser and per-device; there is no sync or multi-user
  access. Backups are manual.
- The contact form has no server-side spam protection beyond the honeypot; a
  form endpoint's own spam filtering applies when configured.
- Pricing tables are editable estimates, not market research; currency rates in
  `studio/js/data.js` are fixed approximations, not live rates.
- The site builder produces static marketing pages, not booking systems,
  e-commerce or authenticated portals.
- Google Fonts is the only external request on both pages. Remove the font
  links if you need a fully offline build.

---

## Before you go live

1. Fill in `assets/js/config.js` (GitHub, LinkedIn).
2. Run `py tools/check_links.py`.
3. Run `py tools/build_public.py`.
4. Deploy `site/` to Netlify or Vercel — after your approval.
5. Keep Studio local, or deploy it separately behind access control. It is
   marked `noindex` and disallowed in `robots.txt`, but that is not security.

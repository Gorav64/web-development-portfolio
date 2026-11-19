# Security and permissions

These rules are part of the project, not suggestions. Nothing in this repository
should make them optional.

---

## Hard limits

| Never | Why |
| --- | --- |
| Access banking credentials or banking apps | Financial harm; outside project scope |
| Access passwords, password managers or OTPs | Account takeover risk |
| Make payments or enter card/bank details | Irreversible; requires your identity |
| Purchase subscriptions or paid services | Spends money without consent |
| Sign contracts or accept terms | Legal commitment must be yours |
| Send emails without approval | Reputational and legal risk |
| Contact businesses without approval | Same, plus anti-spam law |
| Publish a website without approval | Public, hard to reverse |
| Delete important files without confirmation | Data loss |
| Expose private user or client information | Privacy harm |
| Scrape private data or bypass restrictions | Legal and ethical breach |

If a task seems to require any of these, stop and ask. Explain exactly which
permission is needed and why, rather than assuming it.

---

## Approvals

| Action | Who approves | Where it is recorded |
| --- | --- | --- |
| Sending an outreach email | You, per batch | Your email client |
| Sending a proposal | You, per client | Your email client |
| Publishing a site | You, per deployment | Deploy dashboard |
| Marking a project paid | You, after bank verification | Studio confirmation |
| Deleting records | You, via dialog | Studio |
| Connecting a repo or remote | You | Git/GitHub |

An approval covers the specific action described. It does not carry over to
later similar actions.

---

## What the code actually does

**Portfolio (`index.html`, `assets/`)**

- Reads its own static files.
- Loads Google Fonts from `fonts.googleapis.com` (remove those `<link>` tags for
  a fully offline build).
- On form submit: either a `fetch` POST to the URL you put in
  `config.formEndpoint`, or a `mailto:` navigation. No hidden submissions.
- Stores no visitor data, sets no cookies, uses no analytics by default.

**Studio (`studio/`)**

- Reads and writes `localStorage` key `mwp.studio.v1`.
- Makes no network requests.
- Generates files in memory and downloads them via Blob URLs.
- Opens a `mailto:` link only when you click **Open in email app**.
- Never sends email, publishes, pays or signs anything.

**Tools (`tools/`)**

- `serve.py` serves the repository folder on localhost.
- `check_links.py` reads HTML files and checks local targets.
- `build_public.py` copies portfolio files into `site/` and refuses to delete a
  folder it did not generate.

---

## Data classification

| Data | Where it may live | Rule |
| --- | --- | --- |
| Public business info (name, site, hours, published email) | Studio, CSV worksheet | Keep source URL and date |
| Private notes about a conversation | Studio notes | Minimum necessary; delete on request |
| Your own contact details | `config.js`, Studio settings | Public by design — only what you want shown |
| Passwords, OTPs, banking data, ID documents | **Nowhere** | Never collect or store |
| Client customer data | **Nowhere in this repo** | Not needed for marketing sites |
| Payment card numbers | **Nowhere** | Use an invoicing provider, never email |

Studio data is not encrypted. Anyone with access to your unlocked browser
profile can read it. Use full-disk encryption and a screen lock on your machine.

---

## Lead data hygiene

- Collect only what you need to write one relevant email.
- Record where each fact came from.
- Do not guess addresses or infer personal details.
- Honour deletion and opt-out requests promptly; note the date and remove the
  record.
- Do not sync lead data to public cloud drives or paste it into third-party AI
  tools without checking their data policies.
- Export JSON backups to storage you control; delete old exports you no longer
  need.

---

## Email and anti-spam

- Drafts only; you send from your own account.
- One business at a time; no purchased lists, no bulk tools.
- Identify yourself, use a truthful subject and honour opt-outs.
- Follow the rules of the recipient's country (GDPR/PECR, CAN-SPAM, CASL,
  Australian Spam Act) and include a postal address where required.
- No attachments, tracking pixels or disguised links on first contact.

See [outreach-guide.md](outreach-guide.md) for the full checklists.

---

## Publishing and files

- Do not overwrite unrelated files without reading them first.
- `build_public.py` protects a non-generated `site/` directory.
- Studio confirms lead and project deletion by name.
- Clearing all Studio records requires typing `DELETE`.
- Before deployment, verify the publish folder contains no Studio, leads or
  client material.
- Keep at least one backup of the repository and one JSON backup of Studio
  before any large change.

---

## Permissions used in this project

The build was completed with access limited to the project folder:

- Read and write files inside `web-development-portfolio/`.
- Run a local Python HTTP server on `localhost:4173`.
- Open the local site in a browser for testing.

No system-wide access, no credential stores, no email accounts, no payment
accounts and no remote services were used. If a future task needs more — for
example, deploying to your Netlify account — it should be requested explicitly
and scoped to that single action.

---

## Third parties

| Service | When | What it receives |
| --- | --- | --- |
| Google Fonts | Page load | IP, user agent, font request |
| Form endpoint (optional) | Form submit | The fields the visitor entered |
| Netlify / Vercel | Deployment | The static files you publish |

Check each provider's privacy policy if you deploy for a client, and mention
form processing in the site's privacy note.

---

## If something goes wrong

1. **Stop.** Do not keep retrying an action that may have partially succeeded.
2. **Contain.** Revoke exposed keys or access, take the site down if needed.
3. **Restore.** Use the last JSON backup, previous deploy, or Git history.
4. **Assess.** What data was exposed, to whom, for how long?
5. **Notify.** Tell affected people if personal data was involved, following
   local requirements.
6. **Document.** Record what happened and the fix, without copying sensitive
   details into notes.

---

## Reporting a problem

If you find a security issue in this project, do not open a public issue with
exploit details. Fix it locally, verify the fix, and document it in the commit
message without including secrets.

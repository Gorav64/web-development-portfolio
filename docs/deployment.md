# Deployment guide

Static site. No build step, no server, no environment variables required.
Deployment is a manual decision: **do not publish without approval.**

---

## 1. Build the deployable folder

```bash
cd web-development-portfolio
py tools/check_links.py
py tools/build_public.py
```

`site/` now contains only:

```
site/
├── index.html
├── robots.txt
└── assets/
```

Studio, leads, clients and docs are not included. The script refuses to delete a
`site/` folder it did not create (it checks for `.generated`).

Open `site/index.html` through the local server to sanity-check it:

```bash
py tools/serve.py
# http://localhost:4173/site/
```

---

## 2. Pre-publish checklist

- [ ] `assets/js/config.js` has your real email, GitHub and LinkedIn.
- [ ] No placeholder text or “coming soon” items you did not intend.
- [ ] Contact form behaviour is honest (mailto fallback or a working endpoint).
- [ ] All case studies are described as personal/learning work.
- [ ] Links check passes.
- [ ] Tested at 390 px and 1440 px.
- [ ] No console errors.
- [ ] `site/` contains no `studio/`, `leads/` or `clients/`.
- [ ] **You have explicitly approved publishing.**

---

## 3. Netlify

### Option A — drag and drop (simplest, no Node)

1. Sign in at <https://app.netlify.com>.
2. Open <https://app.netlify.com/drop>.
3. Drag the **`site` folder** onto the page.
4. Netlify gives you a `*.netlify.app` URL.
5. Open it and run the post-deploy checks below.

Every update: rebuild `site/`, then drag the folder again or use “Deploys → Drag
and drop”.

### Option B — Git integration

Only recommended if you commit the built folder or add a build step.

1. Push this repository to GitHub.
2. Netlify → Add new site → Import an existing project.
3. Build command: **empty**.
4. Publish directory: `site`.
5. Deploy.

If `site/` is gitignored (the default), the build will fail because the folder
is absent. To use this method, remove `site/` from `.gitignore`, commit the
generated folder, and remember to rebuild and commit after every content change.
A cleaner alternative is a separate public repository that contains only the
contents of `site/`.

### Option C — CLI

Requires Node.js, which is not installed on this machine by default.

```bash
npm install -g netlify-cli
netlify login
netlify deploy --dir=site --prod
```

---

## 4. Vercel

### Option A — dashboard with a Git repository

1. Push the repository to GitHub.
2. <https://vercel.com/new> → import the repository.
3. Framework preset: **Other**.
4. Build command: empty.
5. Output directory: `site`.
6. Deploy.

Same caveat as Netlify: `site/` must exist in the repository, or configure a
build step that runs `python3 tools/build_public.py` (not guaranteed on every
build image). The simplest reliable flow is a public repository containing only
the built files.

### Option B — CLI

Requires Node.js.

```bash
npm install -g vercel
vercel login
vercel site --prod
```

---

## 5. Custom domain

1. Buy or transfer the domain in the **client's or your own** account — decide
   ownership before work starts.
2. In Netlify/Vercel: Site settings → Domains → Add domain.
3. At the registrar, add the records the host shows (usually an `A` record for
   the apex and a `CNAME` for `www`).
4. Wait for DNS, then enable HTTPS (automatic on both platforms).
5. Choose one canonical host (`example.com` or `www.example.com`) and redirect
   the other.

Never put registrar or hosting passwords in the repository, Studio notes or
email.

---

## 6. Hosting Studio

**Default recommendation: keep Studio local.** It is a personal tool that stores
data in your browser; it does not need to be on the internet.

If you must host it:

- Deploy it as a **separate** site, never inside the public portfolio.
- Use real access control (Cloudflare Access, a private network, or the host's
  paid password protection). `noindex` and `robots.txt` are not security.
- Remember that records still live only in the browser of whoever opens it. A
  hosted Studio does not sync data between devices.
- Do not deploy `leads/` or `clients/` at all.

---

## 7. Environment variables

None are required. This is intentional.

| Variable | Needed? | Notes |
| --- | --- | --- |
| Form endpoint | No | Set `formEndpoint` in `assets/js/config.js`; it is public client-side config, not a secret. |
| API keys | No | No API is called by this site. |
| Analytics ID | Optional | Add only if the client agrees and privacy rules are met. |

Never commit a `.env` file. `.gitignore` already excludes `.env` and `.env.*`.

If you later add a form service, check its spam settings, data retention and
privacy policy, and mention the service in the site's privacy note.

---

## 8. Post-deploy checks

- [ ] Home page loads over HTTPS with no certificate warning.
- [ ] Mobile layout at 390 px; menu opens and closes.
- [ ] All navigation and footer links work.
- [ ] Contact form either opens the mail client with a pre-filled message or
      posts successfully to the configured endpoint.
- [ ] Case study dialogs open/close and are keyboard accessible.
- [ ] Console is free of errors.
- [ ] `https://your-domain/studio/` returns 404.
- [ ] Social preview (title/description) looks correct.
- [ ] `robots.txt` is reachable.

---

## 9. Rollback

- **Netlify:** Deploys → select the previous deploy → “Publish deploy”.
- **Vercel:** Deployments → previous deployment → “Promote to Production”.

Keep the JSON Studio backup separate from deployment. Hosting rollback does not
restore lead data.

---

## 10. What this repository does not do

- It does not create accounts, buy domains or configure DNS for you.
- It does not publish automatically.
- It does not send email or process payments.
- It does not guarantee uptime, performance scores or search rankings.

Deployment is a shared, externally visible action. Confirm the target, the
account owner and the content before you press deploy.

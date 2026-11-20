# Research evidence

Working files behind the 20 leads in [`leads/`](../leads/). They exist so a claim
in a report can be traced back to something observed on a public page, instead of
being remembered or guessed.

| File | What it holds |
| --- | --- |
| `collect_evidence.py` | Fetches each lead's public home page with Python's standard library and records observable signals. |
| `lead_evidence.json` | Raw output: title, meta description, headings, nav labels, image and alt-text counts, forms, visible copyright text, public emails (after blocklist), builder hints. |
| `site_audit.json` | Second-pass audit notes. |
| `screenshots/` | Dashboard captures taken in the browser, plus one visual spot-check of Inside Cafe's first screen. |

## What the collector looks at

Only what any visitor sees without logging in:

- `<title>` and meta description
- viewport meta tag and `@media` rules in same-origin stylesheets
- heading structure and navigation labels
- contact forms and their fields
- image count versus images missing `alt` text
- visible copyright line
- publicly displayed email addresses, minus known placeholders
- ordering, booking, hours and social links
- plain `http://` asset references

It does not log in, solve CAPTCHAs, defeat anti-bot protection, or fetch anything
behind an access control. Two sites blocked plain fetches; those two were read with
a browser fetch instead and their evidence noted separately.

## Reading the output carefully

- A missing H1 or missing `alt` text is a structural observation, not proof of
  poor search performance.
- A copyright year is only recorded when it appears in the page's visible footer,
  not when it appears inside bundled CSS (font and animation libraries carry their
  own years and caused false positives during this research).
- Lack of a form or email on the home page is not proof the business has none
  elsewhere.
- No measurement of speed, uptime, security or accessibility compliance was made,
  so none is claimed.
- Mobile notes are inferred from the viewport tag and checked CSS, except where a
  screenshot is explicitly cited.

## Regenerate

```bash
py research/collect_evidence.py
```

This refetches every site and rewrites `lead_evidence.json`. It needs a working
internet connection and takes a couple of minutes. Lead conclusions live in
`leads/lead-data.json`; this folder supplies the raw observation trail.

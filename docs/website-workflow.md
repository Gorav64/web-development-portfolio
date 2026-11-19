# Website development workflow

A 12-step process that takes a signed scope to a delivered, tested site. Studio's
site builder covers steps 5–8 for small static projects; the rest is human work.

---

## The 12 steps

### 1. Discovery

A 20–30 minute conversation. Ask:

- What should the site make a visitor *do*?
- Who is the visitor, and what do they need to decide?
- What exists today (content, photos, logo, domain, hosting)?
- Who approves the work, and what is the deadline?
- What is explicitly out of scope?

Write the answers down and send a short summary to the client. **Do not accept a
project, sign anything or agree to payment terms on their behalf.**

### 2. Research and content inventory

- Study three competitors the client respects (structure, not copying).
- List every page, section and asset.
- Mark what exists, what is missing and who supplies it.
- Decide the single primary conversion action.

### 3. Sitemap and page plan

- One page per real user need — usually 3–5 pages for a small business.
- Define navigation labels in the client's language.
- Agree what is *not* included before design starts.

### 4. Direction and wireframe

- Choose a layout family and palette that fit the industry and brand.
- Wireframe the homepage and one interior page.
- Get written approval of the direction before detailed design.

### 5. Visual design

- Apply type scale, spacing, colour tokens and imagery.
- Design mobile and desktop together, not desktop then shrink.
- Keep contrast accessible; do not rely on colour alone.

### 6. Content integration

- Use the client's real copy; polish, do not invent claims.
- Confirm hours, prices, addresses and phone numbers in writing.
- Replace all placeholder text and images before review.

### 7. Responsive build

- Semantic HTML, modern CSS, minimal JavaScript.
- Mobile-first breakpoints; no horizontal scrolling at any width.
- Real form behaviour, focus states and keyboard navigation.

### 8. Interactions and accessibility

- Menus, reveals, hover states and form validation.
- Respect `prefers-reduced-motion`.
- Visible focus, labelled controls, alt text, correct heading order.

### 9. QA and testing

Run the checklist below on a real phone as well as desktop. Fix everything you
find before showing the client.

### 10. Client review and revisions

- Send a review link and a written list of what to check.
- Collect feedback in **one consolidated list** per round.
- Two rounds are included; further rounds are quoted.
- Record approvals and scope changes in the project notes.

### 11. Deployment preparation and handover

- Client owns the domain and hosting account. Do not put their credentials in
  your notes.
- Confirm the final content, contact details and form destination.
- Publish only after written approval.
- Hand over files, a short README and a walkthrough.

### 12. Post-launch check

- Re-test the live site on mobile and desktop.
- Confirm the form delivers to the right inbox.
- Check that analytics (if any) is installed and privacy-compliant.
- Agree what happens after delivery — no ongoing support unless separately
  agreed.

---

## The eight site types

| Type | Primary goal | Key sections | Studio preset |
| --- | --- | --- | --- |
| Business website | Build trust and generate enquiries | Hero, services, proof, about, contact | `small-business` / `consultant` |
| Restaurant | Show menu, hours, location, bookings | Hero, menu, hours, location, gallery | `restaurant` / `cafe` |
| Gym / fitness | Fill classes and sign-ups | Hero, timetable, trainers, pricing, trial CTA | `gym` / `fitness` |
| Real estate | Showcase listings and capture enquiries | Search/featured listings, areas, about, contact | `real-estate` |
| SaaS landing | Explain a product and drive one action | Hero, problem/solution, features, pricing, FAQ | `saas` |
| Portfolio | Demonstrate work and attract opportunities | Hero, selected work, about, skills, contact | `portfolio` |
| Startup | Explain the idea and build credibility | Hero, product, traction, team, contact | `startup` |
| Agency | Communicate services and win briefs | Hero, services, work, process, contact | `agency` |

Additional presets: `salon`, `local-service`. Each preset has its own palette,
typography, section labels and one of three layout families (`split`, `bold`,
`centered`).

**No two sites should look identical.** Vary layout family, palette, type
scale, section order and imagery. Never send the same generated page to two
clients with only the name changed.

---

## QA checklist

### Layout

- [ ] 320, 375, 390, 768, 1024, 1280 and 1440 px widths.
- [ ] No horizontal scrolling at any width.
- [ ] Tap targets at least 44×44 px.
- [ ] Long words, long business names and missing images do not break layout.
- [ ] Sticky headers do not cover anchored content.

### Content

- [ ] Every word is spelled correctly and approved by the client.
- [ ] Phone, email, address and hours match the client's confirmation.
- [ ] No lorem ipsum, placeholder names or stock watermarks.
- [ ] Links open the right destination; external links use `rel="noopener"`.
- [ ] Copyright year is current.

### Accessibility

- [ ] Keyboard-only navigation works, with a visible focus ring.
- [ ] Colour contrast meets WCAG AA for text.
- [ ] Images have meaningful alt text (or empty alt if decorative).
- [ ] One `<h1>`; headings are in order.
- [ ] Forms have labels, clear errors and no colour-only feedback.
- [ ] Mobile menu reports `aria-expanded` and closes with Escape.
- [ ] Motion respects `prefers-reduced-motion`.

### Technical

- [ ] Title and meta description on every page.
- [ ] Favicon present.
- [ ] JSON-LD validates (if present).
- [ ] No console errors.
- [ ] Images compressed and sized appropriately.
- [ ] HTTPS and the correct canonical domain.
- [ ] 404 page behaves sensibly.

### Performance

Measure, do not promise a score. Run Lighthouse on mobile and record the
numbers. Typical wins: compress images, avoid web-font bloat, remove unused
CSS, defer non-critical scripts.

### Forms

- [ ] Required fields validate inline.
- [ ] The success state is clear.
- [ ] The destination inbox receives a real test submission.
- [ ] Spam protection is active (honeypot at minimum).
- [ ] Privacy note explains what happens to the data.

---

## Delivery package

For a static site:

```
client-name/
├── index.html
├── styles.css
├── script.js
├── README.md          (editing and deployment notes)
└── assets/            (images, fonts — if used)
```

Plus, in your own records:

- Final scope and revision count.
- Approval messages.
- Deployment URL and date.
- Payment status — updated only after verification.

**Handover checklist**

- [ ] Final files delivered.
- [ ] Client owns domain and hosting.
- [ ] Deployment documented, or performed with approval.
- [ ] A short walkthrough call or written guide.
- [ ] Contact for future work, without promising free ongoing support.

---

## Scope changes

When a client asks for something outside the agreed scope:

1. Acknowledge the request.
2. Describe the impact on timeline and price.
3. Send a written update (message or revised proposal).
4. Continue only after written approval.

Do not absorb large additions silently. It trains the client to expect free
work and puts the deadline at risk.

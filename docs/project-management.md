# Project management

A small, honest system for running website projects without a project manager.
Everything lives in Studio → Projects, with this page as the reference.

---

## Project fields

| Field | Meaning |
| --- | --- |
| Name | What you will call it in conversation |
| Client | Business or contact |
| Linked lead | Optional link back to the lead record |
| Status | One of the nine states below |
| Deadline | Agreed delivery date |
| Budget | Agreed amount, in its own currency |
| Tasks | Checklist; progress is completed tasks ÷ total |
| Approvals | Design, content, deployment — each Pending or Approved |
| Notes | Scope changes, decisions, blockers |
| Paid | Boolean, changed only by you after verification |

---

## The nine statuses

| Status | Definition | Exit condition |
| --- | --- | --- |
| **New inquiry** | Someone expressed interest | You have enough context to discuss |
| **Discussion** | Questions answered, goals clarified | Both sides want a proposal |
| **Proposal sent** | Estimate delivered | Client responds |
| **Negotiation** | Scope/price/timing under discussion | Agreement or decline |
| **Confirmed** | Scope accepted in writing | Deposit received / kickoff scheduled |
| **In development** | Design and build underway | Build ready for review |
| **Testing** | QA, client review, revisions | Sign-off received |
| **Delivered** | Handed over and deployed | Final payment settled |
| **Completed** | Project closed, paid and archived | — |

**Delivered does not mean paid.** Payment is tracked separately. Never mark a
project paid because the site went live; verify the money first.

If a project stops, move it to **Not a fit** on the lead side (or leave a clear
note) rather than letting a stale project sit in “In development” for months.

---

## Task templates

### Landing page

- [ ] Discovery notes and goal
- [ ] Content and assets received
- [ ] Wireframe / direction approved
- [ ] Responsive build
- [ ] Form or CTA tested
- [ ] Cross-device QA
- [ ] Client sign-off
- [ ] Deploy and handover

### Business website (3–5 pages)

- [ ] Discovery notes and sitemap
- [ ] Content inventory
- [ ] Homepage direction approved
- [ ] Interior pages built
- [ ] Navigation and mobile menu
- [ ] Contact form destination confirmed
- [ ] SEO basics on every page
- [ ] Cross-device QA
- [ ] Review round 1
- [ ] Review round 2
- [ ] Final sign-off
- [ ] Deploy and handover

### Redesign

- [ ] Audit current site (mobile, speed, content)
- [ ] Agree what stays / what changes
- [ ] Redirect map for changed URLs
- [ ] Build and content migration
- [ ] Pre-launch backup of old site
- [ ] Cross-device QA
- [ ] Deploy, verify redirects, monitor

Studio's “Create project from proposal” adds a generic six-task checklist; edit
it to match the real scope.

---

## Approvals

Track the moments where work cannot continue without a decision:

- Homepage/design direction
- Final content (hours, prices, contact details)
- Deployment

Each approval has a Pending / Approved state. Do not start the next stage on a
verbal “looks good” if the scope or price is affected — write it down. Keep the
approval message in your own records.

---

## Payment confirmation

Rules:

1. Only mark **Paid** after seeing the money in your own account.
2. Studio asks for confirmation every time; read the message.
3. **Mark unpaid** if a payment is reversed or a milestone is refunded.
4. Do not record card numbers, bank details or security codes anywhere.
5. Do not mark a project **Completed** purely because it is paid — delivery and
   payment are separate facts.

There is no payment integration. Studio cannot verify a transfer, and neither
can a screenshot.

---

## Weekly review (20 minutes)

- [ ] Which projects moved status this week?
- [ ] Which deadlines are at risk, and who needs to know?
- [ ] Which approvals are pending, and for how long?
- [ ] Which payments are due or overdue?
- [ ] Which tasks are stale for more than seven days?
- [ ] Export a JSON backup.

---

## Scope changes

1. Write down the request in the project notes with the date.
2. Estimate the extra work in hours or days.
3. Send the client the impact on price and timeline.
4. Get written approval.
5. Update the project budget and tasks; update the proposal if needed.

Do not silently absorb additions. If the change is large, create a separate
project or milestone.

---

## Client communication

| Moment | What to send |
| --- | --- |
| Kickoff | Scope summary, what you need, timeline |
| Mid-build | A preview link and what to look at |
| Review | One consolidated feedback request |
| Pre-launch | Final checklist and approval request |
| Handover | Files, access notes, walkthrough, next steps |
| After delivery | Invoice status and how to request changes |

Keep messages short and specific. Never promise a launch date you cannot hold.
If a client becomes unresponsive, pause the deadline in writing rather than
guessing.

---

## Definition of done

A project is complete when:

- [ ] Every agreed page and feature is delivered.
- [ ] QA checklist passed on a real phone and desktop.
- [ ] Client has signed off in writing.
- [ ] Site is deployed (or files handed over) with approval.
- [ ] Final payment has been verified.
- [ ] Files and credentials ownership are with the client.
- [ ] Project notes record the outcome and any open items.

Only then change the status to **Completed**.

# Pricing guide

All figures are **starting estimates in USD**, used by the proposal builder in
Studio. They are not market research and not a promise of value. Adjust
`studio/js/data.js` when your real costs, experience or market change.

---

## Base project types

| Project type | Base (USD) | Included pages | Target days |
| --- | ---: | ---: | ---: |
| Landing page | 300 | 1 | 5 |
| Business website | 650 | 4 | 10 |
| Restaurant website | 600 | 4 | 9 |
| Gym / fitness website | 620 | 4 | 9 |
| Real estate website | 700 | 4 | 11 |
| SaaS landing page | 800 | 1 | 12 |
| Personal portfolio | 350 | 3 | 6 |
| Startup website | 750 | 4 | 11 |
| Agency website | 900 | 5 | 12 |
| Website redesign | 550 | 4 | 9 |
| Figma to website | 450 | 1 | 7 |
| Frontend development | 400 | 1 | 6 |

Each extra page: **USD 70**. Each extra page also adds two calendar days.

---

## Add-ons

| Add-on | USD |
| --- | ---: |
| API integration | 120 |
| Advanced animations | 80 |
| On-page SEO setup | 70 |
| Analytics setup | 40 |
| Booking / calendar embed | 80 |
| Second language | 120 |
| Speed optimization pass | 90 |
| Copy polishing | 60 |

Priority delivery: **+25%** of the subtotal, with the timeline reduced to about
70% of the standard estimate.

---

## How the estimate is calculated

```
subtotal = base + (extra pages × 70) + add-ons
total    = subtotal + (subtotal × 0.25 if priority)
```

Worked example — business website, 5 pages, SEO + analytics, standard delivery:

```
650 + (1 × 70) + (70 + 40) = 830 USD
```

At GBP 0.79, the proposal displays **£656**.

---

## Currencies

The dashboard converts from USD with fixed rates:

| Code | Symbol | Rate (per USD) |
| --- | --- | ---: |
| USD | $ | 1.00 |
| GBP | £ | 0.79 |
| EUR | € | 0.92 |
| AUD | A$ | 1.52 |
| CAD | C$ | 1.37 |
| INR | ₹ | 84.00 |

These are **not live rates.** Update them in `studio/js/data.js` before sending
a proposal if they have drifted, and state the currency clearly in the proposal.

---

## Milestones

- Total below USD 700: **50% deposit / 50% on delivery**
- Total at or above USD 700: **40% deposit / 40% at design-and-build milestone /
  20% on final delivery**

Milestones are a starting structure. Never collect or mark a payment as received
until you have verified it in your own bank or payment account.

---

## Revisions

- Two rounds included, one consolidated list per round.
- Additional rounds: **USD 60** each.
- A round includes small changes to approved direction; it does not include a
  new page, a new concept, or a change of scope.
- Major direction changes become a written scope update with a revised estimate.

---

## What the price excludes

State these in every proposal:

- Domain registration and hosting fees (paid by the client, in their name).
- Paid plugins, fonts, stock images, booking/CRM subscriptions.
- Content writing beyond light polishing of supplied copy.
- Logo, brand identity or photography.
- Ongoing maintenance, retainer work or emergency support, unless agreed
  separately.
- Taxes and bank/payment fees. Mention that invoices follow local rules; do not
  give tax advice.

---

## How to quote responsibly

1. **Start from the scope, not the price.** Use the estimate as a floor, then
   adjust for content readiness, decision speed and the number of stakeholders.
2. **Give a range** if key details are unknown: “Estimated at $650–$850
   depending on the final page count and content.”
3. **Say it is an estimate** and that the final quote is confirmed after a
   discovery call and content review.
4. **Do not promise results** — no “rank #1”, “double your bookings”, “10×
   conversions”. You control the site, not the market.
5. **Do not underprice to win.** A project that cannot be delivered well damages
   your reputation more than a declined quote.
6. **Put the scope in writing.** Changes after approval are new work, quoted
   separately.

---

## Invoicing and payment (you, not Studio)

Studio records an agreed budget and a paid/unpaid flag. It does not generate
invoices, charge cards or connect to banks.

Before starting work, decide with the client:

- Currency and payment method.
- Deposit amount and when it is due.
- What triggers the next milestone.
- What happens if the project pauses.
- Who pays transaction fees.

Use your own invoicing tool and bank. Never ask a client for card details or
security codes by email, and never handle their banking credentials.

---

## When to change these numbers

Review after every three projects. If you consistently lose deals at the same
price, the problem is usually the offer or the targeting, not only the number.
If you win every deal instantly, your price may be too low.

Update the `PRICING`, `PROJECT_TYPES` and `FEATURES` objects in
`studio/js/data.js`; the proposal builder and add-on chips read from them
directly.

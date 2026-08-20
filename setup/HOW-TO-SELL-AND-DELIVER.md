# How to sell the packs and deliver the free tools

*Revised August 2026, now that Stripe is already connected for the SaaS. Platform facts verified this month — re-check fees before you go live.*

---

## The recommendation

**Sell everything through your existing Stripe account using Stripe Managed Payments. Hold the email list in Kit. Build the file delivery yourself — it's the one piece nobody does for you.**

Having Stripe already connected changes the earlier answer, and for the better.

---

## Why Stripe now, and not Lemon Squeezy

**Stripe Managed Payments went generally available in 2026.** It is Stripe's own merchant-of-record product, built specifically for selling digital goods, and it does the thing that made me recommend Lemon Squeezy last time:

- **Stripe becomes the merchant of record.** It calculates, collects, *files and remits* sales tax, VAT and GST in 80+ countries. Not just calculation — actual remittance. The EU VAT problem disappears.
- **It handles fraud, disputes and transaction-level customer support** — including submitting dispute evidence on your behalf.
- **It works on your existing account, per transaction.** You apply it to the digital products and leave your SaaS subscriptions exactly as they are. One line of code on a Checkout session, or a Payment Link with it enabled.
- **Adaptive Pricing is on by default**, so a buyer in Berlin sees euros and a local payment method without you configuring anything.

### The reason this matters more than fees

Your whole thesis is that a book reader becomes a pack buyer becomes a subscriber, at an acquisition cost no ordinary SaaS can match. **If the packs and the subscription live in the same Stripe account, that ladder is one customer record.** You can query it. With a separate checkout provider you'd be stitching identities together by email address forever, and the number that proves your entire strategy would be a manual spreadsheet exercise.

That's worth more than any fee difference.

### What to know before you commit

Four honest trade-offs:

1. **Your PDFs qualify; some of your other revenue does not.** Managed Payments covers digital products — e-books, digital documents, downloadable software, online courses. It explicitly **excludes physical goods, professional services (consulting, coaching), and live in-person events.** So retreat tickets, 1:1 audits, speaking fees and printed books cannot go through it. Those stay on normal Stripe, where tax is your responsibility (Stripe Tax can calculate it for you at no extra charge on those transactions).
2. **The customer sees "Sold through Link."** Their statement reads `LINK.COM* HEADLINE`. Receipts and invoices come from Link, not from you. Custom domains aren't supported on Managed Payments checkout. It's slightly less yours than a fully branded checkout — that's the price of Stripe carrying the tax liability.
3. **Support has a clock on it.** Stripe handles payment-level support, but if they escalate something to you and you don't respond within 48 hours, they may issue a refund without your approval. Make sure the support email in your Stripe business settings is one you actually read.
4. **Every product needs a tax code.** I've pre-filled these in `products.ts`: `txcd_10503000` for the packs (digital documents, downloaded, permanent rights), `txcd_10302000` for the book and Playbook (digital books). Worth confirming the mapping with an accountant, but those are the right neighbourhoods.

*None of this is tax advice.*

---

## Where emails should go — your admin, Flodesk, or Kit

**Short answer: capture into your own database, send through Kit.** Not Flodesk, and not your own sending infrastructure.

### Don't build the sending yourself

Capturing an address in your admin is easy. *Sending* is not. Bulk email requires SPF, DKIM and DMARC configured correctly, IP or domain reputation warmed slowly, bounce and complaint handling wired to a feedback loop, list hygiene, and one-click unsubscribe that satisfies CAN-SPAM and GDPR. Get any of it wrong and you don't get an error — **you quietly land in spam and never find out.** A funnel that dies silently is the worst possible failure mode for the thing your whole strategy rests on.

**But do capture into your own Supabase table as well.** That's your source of truth, it's exportable, and it means no platform ever holds your list hostage. It's also the only version of "own it" that's honest — you tell artists their fan list should be theirs; the same should be true of yours. Write to your table first, then push to Kit for sending. If Kit ever disappoints you, you migrate in an afternoon.

### Kit over Flodesk

Flodesk's historic appeal was flat-rate unlimited pricing and beautiful templates. **Flodesk retired the flat-rate unlimited plan for new users in December 2025**, so that advantage is gone for you. At 5,000 subscribers, Flodesk Lite runs about $48/month and gives you *one* automation workflow; unlimited workflows require Pro. Kit is **free to 10,000 subscribers** with full tagging and segmentation on the free plan.

More importantly: your funnel is a *logic* problem, not a design problem. Which of four lead magnets someone downloaded determines which sequence they get and which pack you eventually offer them. Flodesk is design-first. Kit is built for exactly that branching. Your emails should look like plain letters from a person anyway — the book's whole voice argues against a designed newsletter template.

**The one Kit limitation to plan around:** the free plan gives you one basic automation and no multi-email sequences. Broadcasts — your every-other-week letter — work fine on free. The three welcome sequences need the paid tier. Start free, and upgrade when you have enough subscribers that sequences will pay for themselves.

### Your every-other-week letter

That cadence is right, and it's a broadcast, not an automation — so it works on Kit's free plan from day one. Two things make it work:

- **Write it as a letter, not a newsletter.** The Story Email in your own Swipe File is the template. This audience gets enough designed marketing.
- **Segment occasionally, not always.** Most letters go to everyone. But when you have something for the money crowd, send it to `int:money` only. Nothing burns a list faster than pitching people things that have nothing to do with why they joined.

---

## How each flow works

### Free tool

```
Ad / search / QR code
   ↓
/free/booking-pipeline                         your page, your design
   ↓
Email field → POST /api/subscribe
   ↓
   ├─→ Supabase `subscribers` table            YOUR source of truth
   ├─→ Kit: subscriber + tags                  Kit sends the incentive email
   └─→ Redirect to /free/booking-pipeline/thanks  instant download
```

Deliver both ways — inbox *and* immediate download. Email alone loses people to spam folders and typos; download alone weakens the reason the email matters. Free files are served from public URLs; there's nothing to protect.

### Paid pack

```
/artist-operator/packs/money-year               your page, your design
   ↓
"Buy — $19" → POST /api/checkout → Stripe Checkout Session
                                    (Managed Payments enabled, tax code set)
   ↓
Stripe-hosted checkout, buyer's local currency
   ↓
Payment succeeds
   ↓
   ├─→ Stripe emails the receipt (from Link, automatic)
   └─→ Webhook: checkout.session.completed → POST /api/webhooks/stripe
         ├─→ record the order in Supabase
         ├─→ generate 7-day signed URLs for the files
         ├─→ email the buyer their download links      ← YOU build this
         └─→ tag the buyer in Kit: own:pack-money-year + int:money
```

**Stripe does not deliver your files.** It sends a receipt; the product is your job. That webhook is the single most important thing to get right and test, because a buyer who pays and receives nothing is a refund and a lost customer in one move.

---

## Five businesses doing this well, and what to take from each

**Ari's Take — Ari Herstand.** Your closest comp: a music-business book that became a workbook, then a course, then coaching. He proved this ladder works in this exact audience. *Steal:* the ladder, and that the book stays the front door. *Note where he stopped:* he never built software. That's your lane.

**Justin Welsh.** A store of individual digital products plus a bundle. *Steal:* the bundle anchor — the à-la-carte total struck through beside the bundle price. Your Vault at $89 against $203 is a stronger version of the same move, and the maths should be on the page, not implied.

**Refactoring UI.** Three tiers on one page, with absurdly specific "what's inside" — page counts, chapter lists, sample spreads. *Steal:* the specificity. "15 pages, 24 audit prompts, a five-point score per job" outsells "a comprehensive audit workbook" every time. Your data file already reads this way.

**Josh Comeau.** Free tools better than most people's paid products, feeding a paid course. *Steal:* the principle that **the free thing is the proof.** Your four free tools are real and printable and useful alone — which is exactly why they'll convert.

**James Clear.** One free resource, gated by email, became a list of millions and then a book that sold twenty million copies. *Steal:* the ruthlessness. He didn't run twelve lead magnets; he ran the best one everywhere. Once you can see which of your four converts best, put that one in the ads.

---

## Before Claude Code starts

1. **Stripe** — request Managed Payments access in your dashboard (there's an eligibility review). Create 14 products + 2 bundles, set each one's tax code, copy the Price IDs into `products.ts`. Confirm the support email in your business settings is one you read daily.
2. **Stripe's agent tooling** — run `npm install -g @stripe/cli` then `stripe agent setup` in the repo. Stripe ships skills for coding agents; this gives Claude Code current, accurate Stripe docs instead of working from memory. Do this before pasting the brief.
3. **Kit** — free account, five forms (one per free tool plus an all-tools form), upload each incentive file, grab the API key.
4. **Resend** (or similar) for the delivery email — Stripe's receipt is not your product email.
5. **Storage** — put the paid files in a private Supabase bucket. Never a public URL.
6. Drop in `content/products.ts`, `public/covers/`, `public/downloads/`. Confirm the brand kit is at `.claude/skills/headline-brand/`.

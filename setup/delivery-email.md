# The delivery email

Sent by `/api/webhooks/stripe` via Resend the moment a payment completes.
Plain text on purpose — this audience gets enough designed marketing, and the
brand's voice is a letter, not a newsletter. `{{ }}` fields are filled by the
webhook handler.

---

**From:** Jamil at Headline `<orders@headline.world>`
**Reply-to:** support@headline.world
**Subject:** Your {{productTitle}} — download inside

---

Hey —

Thank you. Your copy of **{{productTitle}}** is ready:

{{#each files}}
→ {{this.name}}
   {{this.signedUrl}}
{{/each}}

Two things worth knowing:

1. **Save the files somewhere real.** These links work for 7 days — the files are yours forever, the links aren't. If a link expires before you get to it, just reply to this email and I'll send a fresh one.

2. **This pack works best on paper.** Print it, put it where the work happens, and write in it. A worksheet on a screen is a suggestion; a worksheet with pen marks on it is an operation.

If anything's broken — wrong file, dead link, purchase trouble — reply to this email and a human (me) will fix it.

Go build the machine behind the music.

— Jamil

THE ARTIST OPERATOR · HEADLINE.WORLD
Book it. Run it. Own it.

---

## Variant lines (the handler swaps paragraph 2 by product type)

**For the Contract Vault:**
2. **Read `00-READ-THIS-FIRST.pdf` before you send anything.** It covers the rules of paper — and remember these are templates, not legal advice; anything with real money or exclusivity in it deserves a lawyer who knows your territory.

**For the Budget Spreadsheet / anything XLSX:**
2. **Open it in Excel, Numbers, or Google Sheets.** Yellow cells with blue text are yours to edit; everything else calculates. Start with The Split tab.

**For bundles:**
2. **Start with the Six Jobs Audit.** It tells you which of the other twelve packs your career needs first. The rest will still be there when the audit says so.

## Implementation notes

- Send as both `text` and a minimal `html` version (same words, links as anchors). No images, no buttons — deliverability over design on transactional mail.
- Set `Idempotency-Key` on the Resend call to the Stripe session id, mirroring the webhook's own idempotency.
- Mark `orders.delivery_email_sent = true` only after Resend accepts the send.
- Domain setup in Resend: verify headline.world, send from orders@headline.world. Do this before launch — an unverified domain lands in spam.

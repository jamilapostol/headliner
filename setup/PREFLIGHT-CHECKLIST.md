# Preflight — what's done, what's left

*The shortest path from this zip to a live store. Everything Claude (this session) could do is done; what remains needs your logins.*

---

## ✅ Already done for you

| | |
|---|---|
| **Supabase schema + bucket** | Written as one paste-and-run file: `setup/migration.sql` creates `subscribers`, `orders`, `webhook_log` (RLS locked to service-role, idempotency constraints) **and** the private `artist-operator-files` bucket |
| **Product files** | All 25 deliverables assembled in `paid-files/`, mirroring the exact bucket paths the code expects — including `vault/The-Artists-Contract-Vault.zip` and both bundle zips |
| **Catalogue** | `content/products.ts` — 14 products + 2 bundles with copy, prices, tax codes, file paths |
| **Stripe setup script** | `setup/create-stripe-products.mjs` — creates every product + price in Stripe and writes the Price IDs back into products.ts. Idempotent. |
| **Delivery email** | `setup/delivery-email.md` — full copy with per-product variants and implementation notes |
| **Env template** | `.env.example` — every key documented |
| **Covers & free files** | `public/covers/` (20) and `public/downloads/` (4) |
| **The brief** | `CLAUDE-CODE-BRIEF.md` — updated to know all of the above is done |

## 🔲 Your part — ~50 minutes of logins, in order

**1 · Supabase (~8 min) — in your jamilapostol account**
- Open (or create) the project → SQL Editor → paste all of `setup/migration.sql` → Run. That creates the three tables and the private bucket in one shot.
- Storage → `artist-operator-files` → upload the **contents** of `paid-files/` (keep the `vault/` and `bundles/` folder structure — drag the folders in)
- Settings → API → copy the project URL and the **service_role** key into `.env`

**2 · Stripe (~10 min)**
- Dashboard → search "Managed Payments" → request access (there's an eligibility review — do this first, it may take days to clear; everything else can proceed in the meantime)
- Developers → API keys → copy test + live secret keys
- Run the product creator: `npm i stripe && STRIPE_SECRET_KEY=sk_test_... WRITE_BACK=1 node setup/create-stripe-products.mjs` — 16 products appear in Stripe and the Price IDs land in `products.ts` automatically
- Settings → Business details → make sure the **support email** is one you read daily (Stripe can auto-refund if an escalation sits 48h)

**3 · Kit (~15 min)** — kit.com, free plan
- Create 5 forms: `free-booking-pipeline`, `free-tour-checklist`, `free-monthly-checkin`, `free-budget-spreadsheet`, `free-all-tools`
- On each form: Settings → Incentive → attach the matching file from `public/downloads/` (the all-tools form gets all four)
- Settings → Developer → copy the API key; copy each form's ID (it's in the form's URL) into `.env`

**4 · Resend (~10 min)** — resend.com
- Add domain `headline.world` → add the DNS records it gives you → wait for verify (minutes to hours)
- Create an API key → `.env`
- ⚠️ Don't skip domain verification — an unverified sender lands in spam, and the delivery email *is* the product

**5 · The repo (~5 min)**
- Copy into it: `content/products.ts` · `public/covers/` · `public/downloads/` · `setup/` · `.env.example` (fill as `.env.local`)
- Confirm the brand kit sits at `.claude/skills/headline-brand/` (from headline-brand-kit.zip)
- Run `npm install -g @stripe/cli && stripe agent setup` in the repo

**6 · Paste `CLAUDE-CODE-BRIEF.md` into Claude Code.**

## 🔬 Before real money

- Full test purchase in Stripe test mode: pay → webhook fires → `orders` row → delivery email with working links → buyer tagged in Kit
- Replay the webhook event (Stripe dashboard → resend) → still exactly one order, one email
- Buy the Vault with a second test email → confirm 13 `own:` tags land
- Free tool with a real address → Supabase row + Kit incentive email + instant download
- Then swap to live keys, re-run the product script with `sk_live_...` + `WRITE_BACK=1`, and point the webhook at the production URL

## 📇 Reference

- Supabase: your jamilapostol project · bucket: `artist-operator-files` (created by the migration)
- Tax codes in use: `txcd_10503000` (packs/docs) · `txcd_10302000` (book-format) — confirm with your accountant
- Managed Payments covers digital only: retreats, 1:1s, speaking and print stay on normal Stripe

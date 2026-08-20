#!/usr/bin/env node
/**
 * Creates all Artist Operator products + prices in Stripe and writes the
 * Price IDs back into content/products.ts automatically.
 *
 * Usage:
 *   npm i stripe                       (once, anywhere)
 *   STRIPE_SECRET_KEY=sk_test_... node setup/create-stripe-products.mjs
 *
 * Run it FIRST with your TEST key (sk_test_...) to build against, then once
 * more with your LIVE key (sk_live_...) before launch — it prints a mapping
 * both times and only writes products.ts when WRITE_BACK=1 is set:
 *
 *   STRIPE_SECRET_KEY=sk_live_... WRITE_BACK=1 node setup/create-stripe-products.mjs
 *
 * Idempotent: products are looked up by metadata.slug before creating, so
 * running it twice never duplicates anything.
 */
import Stripe from 'stripe';
import { readFileSync, writeFileSync } from 'node:fs';

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error('Set STRIPE_SECRET_KEY (sk_test_... or sk_live_...)');
  process.exit(1);
}
const stripe = new Stripe(key);
const WRITE_BACK = process.env.WRITE_BACK === '1';
const PRODUCTS_TS = new URL('../content/products.ts', import.meta.url).pathname;

/* Catalogue — keep in sync with content/products.ts (slug, name, price, taxCode) */
const CATALOGUE = [
  ['six-jobs-audit', 'The Six Jobs Audit', 17, 'txcd_10503000'],
  ['50-prompts', '50 Prompts Every Artist Operator Should Use', 17, 'txcd_10503000'],
  ['ai-leverage-ladder', 'The AI Leverage Ladder', 19, 'txcd_10503000'],
  ['money-year', "The Artist's Money Year", 19, 'txcd_10503000'],
  ['30-day-sprint', 'The 30-Day Operator Sprint', 17, 'txcd_10503000'],
  ['direct-line', 'Direct Line', 17, 'txcd_10503000'],
  ['email-swipe-file', 'The Email Swipe File', 14, 'txcd_10503000'],
  ['merch-math', 'Merch Math for Musicians', 14, 'txcd_10503000'],
  ['operators-week', "The Operator's Week", 14, 'txcd_10503000'],
  ['five-artist-assets', 'The Five Artist Assets', 14, 'txcd_10503000'],
  ['what-stays-human', 'What Stays Human', 14, 'txcd_10503000'],
  ['retreat-playbook', 'The Retreat Playbook', 12, 'txcd_10503000'],
  ['playbook', 'The Artist Operator Playbook', 14.99, 'txcd_10302000'],
  ['contract-vault', "The Artist's Contract Vault", 59, 'txcd_10503000'],
  // bundles
  ['operators-vault', "The Operator's Vault — All Thirteen Packs", 89, 'txcd_10503000'],
  ['complete-library', 'The Complete Library — Everything', 129, 'txcd_10503000'],
];

async function findBySlug(slug) {
  const res = await stripe.products.search({ query: `metadata['slug']:'${slug}'` });
  return res.data[0] ?? null;
}

const mapping = {};
for (const [slug, name, price, taxCode] of CATALOGUE) {
  let product = await findBySlug(slug);
  if (!product) {
    product = await stripe.products.create({
      name,
      tax_code: taxCode,
      metadata: { slug, series: 'artist-operator' },
    });
    console.log(`created product  ${slug}  ${product.id}`);
  } else {
    console.log(`exists  product  ${slug}  ${product.id}`);
  }

  // one active USD price at the catalogue amount; reuse if it already exists
  const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
  const cents = Math.round(price * 100);
  let priceObj = prices.data.find((p) => p.unit_amount === cents && p.currency === 'usd');
  if (!priceObj) {
    priceObj = await stripe.prices.create({
      product: product.id,
      unit_amount: cents,
      currency: 'usd',
      metadata: { slug },
    });
    console.log(`created price    ${slug}  ${priceObj.id}  $${price}`);
  } else {
    console.log(`exists  price    ${slug}  ${priceObj.id}  $${price}`);
  }
  mapping[slug] = priceObj.id;
}

console.log('\n--- price id mapping ---');
console.log(JSON.stringify(mapping, null, 2));

if (WRITE_BACK) {
  let src = readFileSync(PRODUCTS_TS, 'utf8');
  let patched = 0;
  for (const [slug, priceId] of Object.entries(mapping)) {
    // insert or replace stripePriceId within the object that has this slug
    const slugRe = new RegExp(`(slug: '${slug}',[\\s\\S]*?)(\\n    stripePriceId:.*?,|(?=\\n    taxCode:))`);
    if (slugRe.test(src)) {
      src = src.replace(slugRe, (_, head) => `${head}\n    stripePriceId: '${priceId}',`);
      patched++;
    }
  }
  writeFileSync(PRODUCTS_TS, src);
  console.log(`\nwrote ${patched} stripePriceId values into content/products.ts`);
} else {
  console.log('\n(dry run — set WRITE_BACK=1 to write the ids into content/products.ts)');
}

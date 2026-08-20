#!/usr/bin/env bash
# Finishes the Stripe half of the store in one command.
#
#   bash setup/finish-stripe.sh sk_test_xxxxx
#
# Your key goes straight into .env.local and into Stripe's API. It is never
# printed, never echoed, and never leaves this machine.
set -euo pipefail
cd "$(dirname "$0")/.."

KEY="${1:-}"
if [ -z "$KEY" ]; then echo "Usage: bash setup/finish-stripe.sh sk_test_..."; exit 1; fi
case "$KEY" in
  sk_test_*) MODE="TEST" ;;
  sk_live_*) MODE="LIVE" ;;
  *) echo "That does not look like a Stripe secret key (expected sk_test_ or sk_live_)."; exit 1 ;;
esac

echo "→ Checking the key works…"
if ! curl -s -o /dev/null -w '' -u "$KEY:" https://api.stripe.com/v1/balance --fail; then
  echo "  Stripe rejected that key. Check you copied the whole thing."; exit 1
fi
echo "  OK ($MODE mode)"

# .env.local wins over .env in Next, so writing here retires the old value
# without touching .env.
touch .env.local
if grep -q '^STRIPE_SECRET_KEY=' .env.local; then
  # Portable in-place edit: BSD and GNU sed disagree about -i.
  grep -v '^STRIPE_SECRET_KEY=' .env.local > .env.local.tmp && mv .env.local.tmp .env.local
fi
printf 'STRIPE_SECRET_KEY=%s\n' "$KEY" >> .env.local
echo "→ Key stored in .env.local (gitignored)"

echo "→ Creating products and prices, writing IDs back into content/products.ts…"
STRIPE_SECRET_KEY="$KEY" WRITE_BACK=1 node setup/create-stripe-products.mjs

echo
echo "→ Done. Price IDs written. Tell Claude and it will verify and finish."

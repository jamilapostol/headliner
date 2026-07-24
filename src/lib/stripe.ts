import Stripe from "stripe";

export const stripeEnabled = !!process.env.STRIPE_SECRET_KEY;

export const stripe = stripeEnabled
  ? new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: "2026-06-24.dahlia" })
  : null;

// Price IDs are provisioned in the Stripe dashboard for each plan/cycle
// combination and injected via env vars. Unset in local/mock mode.
export const PRICE_IDS: Record<string, Record<string, string | undefined>> = {
  pro: { monthly: process.env.STRIPE_PRICE_PRO_MONTHLY, annual: process.env.STRIPE_PRICE_PRO_ANNUAL },
  touring: { monthly: process.env.STRIPE_PRICE_TOURING_MONTHLY, annual: process.env.STRIPE_PRICE_TOURING_ANNUAL },
  team: { monthly: process.env.STRIPE_PRICE_TEAM_MONTHLY, annual: process.env.STRIPE_PRICE_TEAM_ANNUAL },
};

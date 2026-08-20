import { NextResponse } from "next/server";
import Stripe from "stripe";
import { BUNDLES, bySlug } from "@content/products";
import { stripe } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/site-url";

export const runtime = "nodejs";

// Checkout with Managed Payments — Stripe as merchant of record, which is
// what handles indirect tax in 80+ countries for a digital-goods catalogue
// sold worldwide.
//
// Parameters deliberately ABSENT, because Managed Payments forbids them and
// the session errors if they are sent (docs.stripe.com/payments/
// managed-payments/update-checkout): automatic_tax, tax_id_collection,
// payment_method_types, payment_method_configuration, adaptive_pricing,
// excluded_payment_method_types, invoice_creation, shipping_*, and the
// payment_intent_data statement_descriptor / receipt_email / setup_future_usage
// fields. Tax codes live on the Stripe PRODUCT, not here — the setup script
// sets them from products.ts.

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json({ ok: false, error: "Payments are not configured." }, { status: 503 });
  }

  let body: { slug?: unknown; type?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  const slug = String(body.slug ?? "");
  const type = body.type === "bundle" ? "bundle" : "pack";

  // Resolved from the catalogue, never from the request — a price sent by a
  // client is a suggestion, and honouring one is how a $129 bundle sells for
  // a dollar.
  const product = type === "bundle" ? BUNDLES.find((b) => b.slug === slug) : bySlug(slug);
  if (!product) {
    return NextResponse.json({ ok: false, error: "Unknown product." }, { status: 404 });
  }
  if (!product.stripePriceId) {
    return NextResponse.json(
      { ok: false, error: "This product isn't available for purchase yet." },
      { status: 503 }
    );
  }

  const cancelPath = type === "bundle" ? `/artist-operator/bundles/${slug}` : `/artist-operator/packs/${slug}`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: product.stripePriceId, quantity: 1 }],
      // The SDK pinned here (22.3.2) predates Managed Payments in its types,
      // though the pinned API version (2026-06-24.dahlia) supports it. The
      // cast is deliberate and narrow: drop it when the SDK types catch up.
      ...({ managed_payments: { enabled: true } } as unknown as Stripe.Checkout.SessionCreateParams),
      success_url: absoluteUrl("/artist-operator/purchase/success?session_id={CHECKOUT_SESSION_ID}"),
      cancel_url: absoluteUrl(cancelPath),
      // The webhook resolves the product from here rather than from line
      // items, so a renamed Stripe price can never misdeliver.
      metadata: { slug, type },
    });

    if (!session.url) {
      return NextResponse.json({ ok: false, error: "Could not start checkout." }, { status: 502 });
    }
    return NextResponse.json({ ok: true, url: session.url });
  } catch (err) {
    console.error("checkout: session create failed", err);
    const message =
      err instanceof Stripe.errors.StripeError ? err.message : "Could not start checkout. Try again.";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}

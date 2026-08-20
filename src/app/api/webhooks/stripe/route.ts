import { NextResponse } from "next/server";
import Stripe from "stripe";
import { BUNDLES, bySlug } from "@content/products";
import { stripe } from "@/lib/stripe";
import { storeClient, signProductFiles } from "@/lib/store/supabase";
import { buildDeliveryEmail, deliveryVariant, sendDeliveryEmail, type DeliveryFile } from "@/lib/store/delivery-email";
import { upsertSubscriber, kitConfigured } from "@/lib/store/kit";

export const runtime = "nodejs";

// The most important route in the build. A buyer who pays and receives
// nothing is a refund and a lost customer in one move, so the order of
// operations here is deliberate:
//
//   verify signature → log → insert order (idempotent) → 200
//
// with delivery and list-tagging running after the response. Stripe retries
// anything slow or non-200, and a retry that re-sends an email is its own
// bug — so the order insert is the idempotency gate and everything
// afterwards is keyed off whether it actually inserted.

function resolveProduct(slug: string, type: string) {
  if (type === "bundle") {
    const bundle = BUNDLES.find((b) => b.slug === slug);
    if (!bundle) return null;
    return {
      title: bundle.title,
      files: bundle.files,
      tag: bundle.tag,
      // Every included pack gets an own: tag too, so a bundle buyer is never
      // later sold something they already have.
      ownTags: [`own:pack-${bundle.slug}`, bundle.tag, ...bundle.includes.map((s) => `own:pack-${s}`)],
      variant: deliveryVariant(slug, "BUNDLE", "bundle"),
    };
  }
  const pack = bySlug(slug);
  if (!pack) return null;
  return {
    title: pack.title,
    files: pack.files,
    tag: pack.tag,
    ownTags: [`own:pack-${pack.slug}`, pack.tag],
    variant: deliveryVariant(slug, pack.format, "pack"),
  };
}

export async function POST(request: Request) {
  if (!stripe) return NextResponse.json({ error: "not configured" }, { status: 503 });

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) {
    // Unsigned is rejected outright — anyone can POST this URL.
    return NextResponse.json({ error: "unsigned" }, { status: 400 });
  }

  const raw = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, secret);
  } catch (err) {
    console.error("stripe webhook: bad signature", err);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const supabase = storeClient();

  // Log every event. When a customer says they never got their files, this
  // is the only record that answers them.
  await supabase
    .from("webhook_log")
    .insert({ provider: "stripe", event_type: event.type, event_id: event.id, payload: event as unknown as object })
    .then(
      () => undefined,
      (err) => console.error("stripe webhook: log insert failed", err)
    );

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const sessionId = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
    await supabase.from("orders").update({ status: "refunded" }).eq("stripe_session_id", sessionId ?? "");
    return NextResponse.json({ received: true });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const slug = session.metadata?.slug ?? "";
  const type = session.metadata?.type ?? "pack";
  const email = session.customer_details?.email ?? session.customer_email ?? "";
  const product = resolveProduct(slug, type);

  if (!product || !email) {
    console.error("stripe webhook: unresolvable purchase", { slug, type, hasEmail: Boolean(email) });
    // 200 anyway: retrying will not make an unknown slug resolvable, and the
    // event is already in webhook_log for a human to chase.
    return NextResponse.json({ received: true });
  }

  // Idempotency gate. stripe_session_id is UNIQUE, so a redelivered event
  // conflicts here and returns zero rows — which is exactly how we know not
  // to email twice.
  const { data: inserted, error: insertError } = await supabase
    .from("orders")
    .upsert(
      {
        email,
        stripe_session_id: session.id,
        slug,
        product_type: type,
        amount_cents: session.amount_total ?? 0,
        currency: session.currency ?? "usd",
        status: "paid",
      },
      { onConflict: "stripe_session_id", ignoreDuplicates: true }
    )
    .select("id");

  if (insertError) {
    // Let Stripe retry — the order is the thing we cannot afford to lose.
    console.error("stripe webhook: order insert failed", insertError);
    return NextResponse.json({ error: "order insert failed" }, { status: 500 });
  }

  const isFirstDelivery = (inserted?.length ?? 0) > 0;

  // Return fast; deliver after. Stripe times out slow handlers and retries
  // them, which would double-send if this were inline.
  if (isFirstDelivery) {
    void deliver({ session, email, slug, product }).catch((err) =>
      console.error("stripe webhook: delivery failed", err)
    );
  }

  return NextResponse.json({ received: true, duplicate: !isFirstDelivery });
}

async function deliver({
  session,
  email,
  slug,
  product,
}: {
  session: Stripe.Checkout.Session;
  email: string;
  slug: string;
  product: NonNullable<ReturnType<typeof resolveProduct>>;
}) {
  const supabase = storeClient();

  const signed = await signProductFiles(product.files);
  const files: DeliveryFile[] = signed
    .filter((f): f is { path: string; url: string } => Boolean(f.url))
    .map((f) => ({ name: f.path.split("/").pop() ?? f.path, signedUrl: f.url }));

  if (files.length === 0) {
    // Loud, because the buyer has paid and there is nothing to send. Better a
    // logged alarm than a silent empty email.
    console.error("stripe webhook: NO FILES could be signed", { slug, paths: product.files });
  }

  if (files.length > 0) {
    const { subject, text, html } = buildDeliveryEmail({
      productTitle: product.title,
      files,
      variant: product.variant,
    });
    const sent = await sendDeliveryEmail({ to: email, subject, text, html, idempotencyKey: session.id });
    if (sent.ok) {
      // Flagged only after Resend accepts it — marking it earlier would
      // claim a delivery that never left.
      await supabase.from("orders").update({ delivery_email_sent: true }).eq("stripe_session_id", session.id);
    } else {
      console.error("stripe webhook: delivery email not sent", sent.detail);
    }
  }

  if (kitConfigured()) {
    const tagged = await upsertSubscriber(email, product.ownTags);
    if (tagged) {
      await supabase.from("orders").update({ kit_tagged: true }).eq("stripe_session_id", session.id);
    }
  }
}

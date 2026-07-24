import type Stripe from "stripe";
import { db } from "@/lib/db";
import { stripe, stripeEnabled } from "@/lib/stripe";

// Handles subscription.updated (sync plan flags) and payment_failed
// (grace banner) per the billing spec. No-op if Stripe isn't configured.
export async function POST(request: Request) {
  if (!stripeEnabled || !stripe) {
    return new Response("Stripe not configured", { status: 501 });
  }

  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const body = await request.text();

  if (!signature || !webhookSecret) {
    return new Response("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const sub = event.data.object as Stripe.Subscription;
      const workspaceId = sub.metadata?.workspaceId;
      const plan = sub.metadata?.plan;
      if (workspaceId && plan) {
        await db.workspace.update({
          where: { id: workspaceId },
          data: { plan: plan as "free" | "pro" | "touring" | "team", stripeSubId: sub.id },
        });
      }
      break;
    }
    case "invoice.payment_failed": {
      // A grace-period banner would be driven off of a workspace flag here;
      // left as a no-op in the MVP scaffold.
      break;
    }
    default:
      break;
  }

  return new Response("ok", { status: 200 });
}

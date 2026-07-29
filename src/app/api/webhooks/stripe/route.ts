import type Stripe from "stripe";
import { db } from "@/lib/db";
import { stripe, stripeEnabled } from "@/lib/stripe";

function subId(sub: string | Stripe.Subscription): string {
  return typeof sub === "string" ? sub : sub.id;
}

async function findWorkspaceForSub(sub: Stripe.Subscription) {
  const workspaceId = sub.metadata?.workspaceId;
  if (workspaceId) {
    const byMetadata = await db.workspace.findUnique({ where: { id: workspaceId } });
    if (byMetadata) return byMetadata;
  }
  return db.workspace.findFirst({ where: { stripeSubId: sub.id } });
}

async function findWorkspaceForInvoice(invoice: Stripe.Invoice) {
  const subscription = invoice.parent?.subscription_details?.subscription;
  if (!subscription) return null;
  return db.workspace.findFirst({ where: { stripeSubId: subId(subscription) } });
}

// Handles subscription create/update/delete (sync plan + stripeSubId) and
// invoice payment failed/succeeded (grace-period flag). No-op if Stripe
// isn't configured.
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
    case "customer.subscription.deleted": {
      // Fires on cancellation from any source — our own changePlan() call,
      // Stripe's customer portal, or Stripe auto-canceling after repeated
      // payment failures. Sync the workspace back down to free either way.
      const sub = event.data.object as Stripe.Subscription;
      const workspace = await findWorkspaceForSub(sub);
      if (workspace) {
        await db.workspace.update({
          where: { id: workspace.id },
          data: { plan: "free", stripeSubId: null, paymentPastDue: false },
        });
      }
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const workspace = await findWorkspaceForInvoice(invoice);
      if (workspace) {
        await db.workspace.update({ where: { id: workspace.id }, data: { paymentPastDue: true } });
      }
      break;
    }
    case "invoice.payment_succeeded": {
      // Clears the grace-period flag once a retried charge (or the next
      // cycle's charge) goes through.
      const invoice = event.data.object as Stripe.Invoice;
      const workspace = await findWorkspaceForInvoice(invoice);
      if (workspace?.paymentPastDue) {
        await db.workspace.update({ where: { id: workspace.id }, data: { paymentPastDue: false } });
      }
      break;
    }
    default:
      break;
  }

  return new Response("ok", { status: 200 });
}

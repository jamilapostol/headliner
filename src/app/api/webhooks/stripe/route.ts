import type Stripe from "stripe";
import { db } from "@/lib/db";
import { stripe, stripeEnabled } from "@/lib/stripe";
import { logAdminAction } from "@/lib/audit";
import { REFERRAL_REWARD_CENTS } from "@/lib/referral";

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
        const item = sub.items.data[0];
        await db.workspace.update({
          where: { id: workspaceId },
          data: {
            plan: plan as "free" | "pro" | "touring" | "team",
            stripeSubId: sub.id,
            // Keeps the "downgrade scheduled for <date>" banner in sync
            // regardless of what triggered the update — our own
            // cancel_at_period_end call, or a change made in Stripe directly.
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : null,
          },
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
          data: { plan: "free", stripeSubId: null, paymentPastDue: false, cancelAtPeriodEnd: false, currentPeriodEnd: null },
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

      // Referral reward: the first real payment from a referred workspace
      // is what "getting someone to pay" means. referralRewardIssuedAt
      // guards against granting it again on every renewal invoice.
      if (workspace?.referredByWorkspaceId && !workspace.referralRewardIssuedAt) {
        const referrer = await db.workspace.findUnique({ where: { id: workspace.referredByWorkspaceId } });
        if (referrer) {
          try {
            let referrerCustomerId = referrer.stripeCustomerId;
            if (!referrerCustomerId) {
              const customer = await stripe.customers.create({ name: referrer.name, metadata: { workspaceId: referrer.id } });
              referrerCustomerId = customer.id;
              await db.workspace.update({ where: { id: referrer.id }, data: { stripeCustomerId: referrerCustomerId } });
            }
            await stripe.customers.createBalanceTransaction(referrerCustomerId, {
              amount: -REFERRAL_REWARD_CENTS,
              currency: "usd",
              description: `Referral reward — ${workspace.name} became a paying customer`,
            });
          } catch (err) {
            console.error("[stripe webhook] failed to issue referral balance credit", err);
          }
          await db.workspace.update({ where: { id: referrer.id }, data: { referralCreditsEarned: { increment: 1 } } });
          await logAdminAction({
            adminEmail: "stripe-webhook",
            action: "referral.reward_issued",
            targetType: "workspace",
            targetId: referrer.id,
            detail: `${workspace.name} converted to paid`,
          });
        }
        await db.workspace.update({ where: { id: workspace.id }, data: { referralRewardIssuedAt: new Date() } });
      }
      break;
    }
    default:
      break;
  }

  return new Response("ok", { status: 200 });
}

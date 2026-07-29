"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { stripe, stripeEnabled, PRICE_IDS } from "@/lib/stripe";
import { withErrorLog } from "@/lib/action-error";

export type PlanChoice = "free" | "pro" | "touring" | "team";
export type Cycle = "monthly" | "annual";

export async function changePlan(plan: PlanChoice, cycle: Cycle) {
  return withErrorLog("changePlan", async () => {
    const session = await getSession();
    if (!session) redirect("/login");

    const workspace = await db.workspace.findUniqueOrThrow({ where: { id: session.workspaceId } });

    if (plan === "free") {
      // Downgrading in-app must also stop the real subscription — otherwise
      // Stripe keeps billing a card for a plan the workspace no longer has.
      if (workspace.stripeSubId && stripeEnabled && stripe) {
        await stripe.subscriptions.cancel(workspace.stripeSubId).catch((err) => {
          console.error("[billing] failed to cancel Stripe subscription on downgrade", err);
        });
      }
      await db.workspace.update({
        where: { id: workspace.id },
        data: { plan: "free", billingCycle: cycle, trialEndsAt: null, stripeSubId: null, paymentPastDue: false },
      });
      revalidatePath("/app", "layout");
      redirect("/app/billing?updated=1");
    }

    if (stripeEnabled && stripe) {
      const priceId = PRICE_IDS[plan]?.[cycle];
      if (!priceId) {
        throw new Error(`Missing Stripe price id for ${plan}/${cycle}. Set the STRIPE_PRICE_* env vars.`);
      }

      let customerId = workspace.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({ name: workspace.name, metadata: { workspaceId: workspace.id } });
        customerId = customer.id;
        await db.workspace.update({ where: { id: workspace.id }, data: { stripeCustomerId: customerId } });
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        subscription_data: { trial_period_days: 14, metadata: { workspaceId: workspace.id, plan } },
        success_url: `${baseUrl}/app/billing?success=1`,
        cancel_url: `${baseUrl}/app/billing?canceled=1`,
      });

      if (checkoutSession.url) redirect(checkoutSession.url);
      return;
    }

    // Mock checkout — no Stripe keys configured. Simulate a successful
    // subscription + trial directly so the app is fully usable locally.
    await db.workspace.update({
      where: { id: workspace.id },
      data: { plan, billingCycle: cycle, trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
    });
    revalidatePath("/app", "layout");
    redirect("/app/billing?mock=1");
  });
}

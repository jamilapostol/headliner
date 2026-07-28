import { requireWorkspace } from "@/lib/workspace";
import { stripeEnabled } from "@/lib/stripe";
import { BillingPlans } from "@/components/billing-plans";

export default async function BillingPage() {
  const { workspace } = await requireWorkspace();

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-5 sm:px-8 sm:py-7">
      <h1 className="mb-1 text-[22px] tracking-[-.02em] sm:text-[26px]">Billing</h1>
      <div className="mb-6 text-[13px] text-text/50">
        {workspace.trialEndsAt && workspace.trialEndsAt > new Date()
          ? `Trial active — ends ${workspace.trialEndsAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}.`
          : "Manage your subscription."}
      </div>
      <BillingPlans currentPlan={workspace.plan} stripeEnabled={stripeEnabled} />
    </div>
  );
}

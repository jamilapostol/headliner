import { requireWorkspace } from "@/lib/workspace";
import { stripeEnabled } from "@/lib/stripe";
import { BillingPlans } from "@/components/billing-plans";
import { resumeSubscription } from "@/lib/actions/billing";

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

      {workspace.cancelAtPeriodEnd && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-orange/25 bg-orange-soft px-4 py-3 text-[13px] text-text/75">
          <span>
            Your plan downgrades to Free
            {workspace.currentPeriodEnd
              ? ` on ${workspace.currentPeriodEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
              : " at the end of your current billing period"}
            . You keep full access until then.
          </span>
          <form action={resumeSubscription}>
            <button type="submit" className="cursor-pointer rounded-md bg-accent px-3 py-1.5 text-[12px] font-semibold text-ink">
              Keep my plan
            </button>
          </form>
        </div>
      )}

      <BillingPlans currentPlan={workspace.plan} stripeEnabled={stripeEnabled} cancelAtPeriodEnd={workspace.cancelAtPeriodEnd} />
    </div>
  );
}

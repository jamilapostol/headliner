import { requireWorkspace } from "@/lib/workspace";
import { stripeEnabled } from "@/lib/stripe";
import { BillingPlans } from "@/components/billing-plans";
import { resumeSubscription } from "@/lib/actions/billing";
import { FEATURE_LABEL, MIN_PLAN } from "@/lib/plan-limits";

const REDIRECT_MESSAGE: Record<string, string> = {
  success: "Your plan is now active.",
  mock: "Plan updated — running in local mock-checkout mode, no real charge was made.",
  updated: "Plan updated.",
  canceled: "Checkout was canceled — your plan hasn't changed.",
  resumed: "Your scheduled downgrade was canceled — you're keeping your current plan.",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ locked?: string; success?: string; mock?: string; updated?: string; canceled?: string; resumed?: string }>;
}) {
  const { workspace } = await requireWorkspace();
  const params = await searchParams;
  const lockedFeature = params.locked && params.locked in MIN_PLAN ? (params.locked as keyof typeof MIN_PLAN) : null;
  const redirectKey = (["success", "mock", "updated", "canceled", "resumed"] as const).find((k) => params[k]);
  const redirectMessage = redirectKey ? REDIRECT_MESSAGE[redirectKey] : null;

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-5 sm:px-8 sm:py-7">
      <h1 className="mb-1 text-[22px] tracking-[-.02em] sm:text-[26px]">Billing</h1>
      <div className="mb-6 text-[13px] text-text/50">
        {workspace.trialEndsAt && workspace.trialEndsAt > new Date()
          ? `Trial active — ends ${workspace.trialEndsAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}.`
          : "Manage your subscription."}
      </div>

      {redirectMessage && (
        <div
          className="mb-6 rounded-[10px] border px-4 py-3 text-[13px]"
          style={
            redirectKey === "canceled"
              ? { borderColor: "rgba(var(--border-rgb),.15)", color: "rgba(var(--fg-rgb),.6)" }
              : { borderColor: "rgba(63,203,134,.3)", background: "rgba(63,203,134,.07)", color: "rgba(var(--fg-rgb),.8)" }
          }
        >
          {redirectMessage}
        </div>
      )}

      {lockedFeature && (
        <div className="mb-6 rounded-[10px] border border-orange/25 bg-orange-soft px-4 py-3 text-[13px] text-text/75">
          {FEATURE_LABEL[lockedFeature]} requires the <strong className="capitalize">{MIN_PLAN[lockedFeature]}</strong> plan or
          higher — upgrade below to unlock it.
        </div>
      )}

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

      {workspace.plan === "beta" && (
        <div className="mb-6 rounded-[10px] border border-accent/25 bg-accent/[.06] px-4 py-3 text-[13px] text-text/75">
          You&rsquo;re on complimentary beta access with full Pro-tier features — no charge, no expiration date set by us.
        </div>
      )}

      <BillingPlans currentPlan={workspace.plan} stripeEnabled={stripeEnabled} cancelAtPeriodEnd={workspace.cancelAtPeriodEnd} />
    </div>
  );
}

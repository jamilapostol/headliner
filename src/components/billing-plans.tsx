"use client";

import { useState, useTransition } from "react";
import { changePlan, type PlanChoice, type Cycle } from "@/lib/actions/billing";

const TIERS: Array<{ key: PlanChoice; name: string; tagline: string; monthly: number; feats: string[]; popular?: boolean }> = [
  { key: "free", name: "Free", tagline: "Test the waters — your first bookings on us.", monthly: 0, feats: ["5 active bookings", "Contacts CRM (50)", "Unified calendar", "1 user"] },
  { key: "pro", name: "Pro Artist", tagline: "For working artists gigging every month.", monthly: 24, feats: ["Unlimited bookings", "Full CRM + reminders", "Merch inventory", "Financial hub", "Email campaigns (2k)"] },
  { key: "touring", name: "Touring Artist", tagline: "For artists living on the road.", monthly: 59, popular: true, feats: ["Everything in Pro", "Tour routing + day sheets", "Roadie AI (drafts, summaries)", "Contracts + e-sign", "3 team seats"] },
  { key: "team", name: "Management Team", tagline: "For managers running multiple artists.", monthly: 129, feats: ["Everything in Touring", "Multi-artist workspaces", "Role-based permissions", "Accountant exports", "10 team seats"] },
];

export function BillingPlans({
  currentPlan,
  stripeEnabled,
  cancelAtPeriodEnd,
}: {
  currentPlan: string;
  stripeEnabled: boolean;
  cancelAtPeriodEnd: boolean;
}) {
  const [annual, setAnnual] = useState(false);
  const [pending, startTransition] = useTransition();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  function pick(plan: PlanChoice) {
    setLoadingPlan(plan);
    startTransition(() => changePlan(plan, (annual ? "annual" : "monthly") as Cycle));
  }

  const price = (m: number) => (m === 0 ? "$0" : annual ? "$" + Math.round((m * 10) / 12) : "$" + m);

  return (
    <div>
      {!stripeEnabled && (
        <div className="mb-5 rounded-[10px] border border-yellow/25 bg-yellow-soft px-4 py-3 text-[13px] text-text/75">
          Running in local mock-checkout mode — plan changes apply instantly without a real charge. Set{" "}
          <code className="font-mono text-yellow">STRIPE_SECRET_KEY</code> to enable real Stripe Checkout.
        </div>
      )}
      <div className="mb-6 flex justify-center">
        <div className="flex gap-1 rounded-[10px] border border-text/10 bg-surface p-1">
          <button
            onClick={() => setAnnual(false)}
            className="cursor-pointer rounded-[7px] px-4 py-1.5 text-[12.5px] font-semibold"
            style={{ background: annual ? "transparent" : "#3fe87a", color: annual ? "rgba(var(--fg-rgb),.6)" : "#0d110e" }}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className="cursor-pointer rounded-[7px] px-4 py-1.5 text-[12.5px] font-semibold"
            style={{ background: annual ? "#3fe87a" : "transparent", color: annual ? "#0d110e" : "rgba(var(--fg-rgb),.6)" }}
          >
            Annual · −17%
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((t) => {
          const isCurrent = t.key === currentPlan;
          return (
            <div
              key={t.key}
              className="relative flex flex-col rounded-2xl p-6 px-[22px]"
              style={{
                background: t.popular ? "rgba(63,232,122,.06)" : "var(--surface)",
                border: `1px solid ${isCurrent ? "#3fe87a" : t.popular ? "rgba(63,232,122,.45)" : "rgba(var(--border-rgb),.08)"}`,
              }}
            >
              {t.popular && !isCurrent && (
                <div className="absolute -top-[11px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[20px] bg-yellow px-3 py-1 font-mono text-[10px] font-semibold tracking-[.1em] text-ink">
                  MOST POPULAR
                </div>
              )}
              {isCurrent && (
                <div
                  className="absolute -top-[11px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[20px] px-3 py-1 font-mono text-[10px] font-semibold tracking-[.1em] text-ink"
                  style={{ background: cancelAtPeriodEnd ? "#e8983f" : "#3fe87a" }}
                >
                  {cancelAtPeriodEnd ? "DOWNGRADING SOON" : "CURRENT PLAN"}
                </div>
              )}
              <div className="mb-1 text-[15px] font-semibold">{t.name}</div>
              <div className="mb-4 min-h-8 text-[12px] text-text/50">{t.tagline}</div>
              <div className="mb-[18px] flex items-baseline gap-[5px]">
                <span className="text-[34px] font-bold tracking-[-.03em]">{price(t.monthly)}</span>
                <span className="text-[12px] text-text/45">{t.monthly === 0 ? "forever" : "/mo"}</span>
              </div>
              <div className="mb-[22px] flex flex-col gap-[9px]">
                {t.feats.map((f) => (
                  <div key={f} className="flex gap-[9px] text-[12.5px] leading-[1.4]">
                    <span className="flex-none text-accent">✓</span>
                    <span className="text-text/75">{f}</span>
                  </div>
                ))}
              </div>
              {(() => {
                const downgradeAlreadyScheduled = t.key === "free" && cancelAtPeriodEnd;
                const disabled = isCurrent || pending || downgradeAlreadyScheduled;
                return (
                  <button
                    disabled={disabled}
                    onClick={() => pick(t.key)}
                    className="mt-auto cursor-pointer rounded-[9px] p-[11px] text-center text-[13.5px] font-semibold disabled:cursor-default disabled:opacity-70"
                    style={{
                      background: isCurrent ? "transparent" : t.popular ? "#3fe87a" : "transparent",
                      color: isCurrent ? "rgba(var(--fg-rgb),.5)" : t.popular ? "#0d110e" : "rgba(var(--fg-rgb),.85)",
                      border: `1px solid ${isCurrent ? "rgba(var(--border-rgb),.12)" : t.popular ? "#3fe87a" : "rgba(var(--border-rgb),.18)"}`,
                    }}
                  >
                    {isCurrent
                      ? "Current plan"
                      : downgradeAlreadyScheduled
                        ? "Downgrade scheduled"
                        : pending && loadingPlan === t.key
                          ? "Redirecting…"
                          : t.key === "free"
                            ? "Downgrade"
                            : "Choose " + t.name.split(" ")[0]}
                  </button>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Free-plan caps advertised on the pricing page — enforced here so they're
// not just marketing copy. Paid plans are uncapped. "beta" is an
// admin-granted, unbilled plan with full feature access — testers need to
// reach every module, including the Touring/Team ones, or their feedback
// only covers half the product.
//
// Feature access and spend are separated on purpose: beta unlocks every
// module, but keeps conservative volume ceilings (see MONTHLY_EMAIL_CAP and
// MONTHLY_AI_CAP), because a beta workspace is unbilled and every Roadie
// call and campaign send costs real money.
export const BOOKING_LIMITS: Record<string, number> = { free: 5, pro: Infinity, touring: Infinity, team: Infinity, beta: Infinity };
export const CONTACT_LIMITS: Record<string, number> = { free: 50, pro: Infinity, touring: Infinity, team: Infinity, beta: Infinity };

export type PlanKey = "free" | "pro" | "touring" | "team" | "beta";

const PLAN_RANK: Record<PlanKey, number> = { free: 0, pro: 1, touring: 2, team: 3, beta: 3 };

// Pure — no server-only dependencies — safe to import from client components
// (e.g. to decide whether to render an "Export CSV" button as locked).
export function planAtLeast(plan: string, min: PlanKey): boolean {
  return (PLAN_RANK[plan as PlanKey] ?? 0) >= PLAN_RANK[min];
}

// Minimum plan required per module, matching the pricing page's feature
// lists (Merch/Finance/Campaigns at Pro, Contracts at Touring, export at Team).
export const MIN_PLAN = {
  merch: "pro",
  finance: "pro",
  settlement: "pro",
  campaigns: "pro",
  contracts: "touring",
  export: "team",
} as const satisfies Record<string, PlanKey>;

export const FEATURE_LABEL: Record<keyof typeof MIN_PLAN, string> = {
  merch: "Merch inventory",
  finance: "The financial hub",
  settlement: "Tour settlement",
  campaigns: "Email campaigns",
  contracts: "Contracts",
  export: "CSV export",
};

// Pro's "Email campaigns (2k)" cap — Touring/Team are uncapped. Beta mirrors Pro.
export const CAMPAIGN_RECIPIENT_CAP: Record<string, number> = { pro: 2000, beta: 2000, touring: Infinity, team: Infinity };

// Monthly outbound-email ceilings per workspace. These bound the platform's
// Resend bill and its sender reputation no matter how enthusiastically a
// workspace blasts — enforced server-side in sendCampaign.
export const MONTHLY_EMAIL_CAP: Record<string, number> = { pro: 5000, beta: 5000, touring: 20000, team: 50000 };

// Monthly Roadie AI action ceilings (drafts + contract reviews combined) —
// bounds the platform's Anthropic bill per workspace. Roadie is Touring+
// only, so Free/Pro have no quota. Beta gets the Touring allowance rather
// than Team's: enough to exercise the feature and report on it, without an
// unbilled workspace running up an uncapped bill. Advertised on the
// pricing page.
export const MONTHLY_AI_CAP: Record<string, number> = { touring: 200, team: 500, beta: 200 };

/** A missing or zero cap means "not entitled", not "unlimited" — this table
 *  gates access to Roadie as well as bounding spend, so the default has to
 *  fail closed. */
export function aiCapFor(plan: string): number {
  return MONTHLY_AI_CAP[plan] ?? 0;
}

/** consumeAiQuota increments first, then checks, so a burst of parallel
 *  requests can't slip past the cap. That makes the nth call the last
 *  allowed one: count === cap is still inside the allowance. */
export function aiQuotaExceeded(countAfterIncrement: number, cap: number): boolean {
  return countAfterIncrement > cap;
}

/** The calendar month key used for per-workspace usage rows ("2026-08"). */
export function usageMonth(now: Date = new Date()): string {
  return now.toISOString().slice(0, 7);
}

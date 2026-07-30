// Free-plan caps advertised on the pricing page — enforced here so they're
// not just marketing copy. Paid plans are uncapped.
export const BOOKING_LIMITS: Record<string, number> = { free: 5, pro: Infinity, touring: Infinity, team: Infinity };
export const CONTACT_LIMITS: Record<string, number> = { free: 50, pro: Infinity, touring: Infinity, team: Infinity };

export type PlanKey = "free" | "pro" | "touring" | "team";

const PLAN_RANK: Record<PlanKey, number> = { free: 0, pro: 1, touring: 2, team: 3 };

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
  campaigns: "pro",
  contracts: "touring",
  export: "team",
} as const satisfies Record<string, PlanKey>;

export const FEATURE_LABEL: Record<keyof typeof MIN_PLAN, string> = {
  merch: "Merch inventory",
  finance: "The financial hub",
  campaigns: "Email campaigns",
  contracts: "Contracts",
  export: "CSV export",
};

// Pro's "Email campaigns (2k)" cap — Touring/Team are uncapped.
export const CAMPAIGN_RECIPIENT_CAP: Record<string, number> = { pro: 2000, touring: Infinity, team: Infinity };

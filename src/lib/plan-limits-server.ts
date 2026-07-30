import { db } from "@/lib/db";
import { planAtLeast, type PlanKey } from "@/lib/plan-limits";

// Defense in depth for server actions behind a gated module — the page
// itself already redirects unqualified plans away, so a normal user never
// hits this; it only matters against a direct call bypassing the UI. Split
// out from plan-limits.ts (which stays pure/client-safe) because this needs
// db access.
export async function requireMinPlan(workspaceId: string, min: PlanKey): Promise<void> {
  const workspace = await db.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: { plan: true } });
  if (!planAtLeast(workspace.plan, min)) {
    throw new Error(`This feature requires the ${min} plan or higher.`);
  }
}

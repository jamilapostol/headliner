"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { withErrorLog } from "@/lib/action-error";
import { TRIAL_MS } from "@/lib/trial";

export type PlanChoice = "free" | "pro" | "touring" | "team";

export async function completeOnboarding(plan: PlanChoice, billingCycle: "monthly" | "annual") {
  return withErrorLog("completeOnboarding", async () => {
    const session = await getSession();
    if (!session) redirect("/login");

    const trialEndsAt = plan === "free" ? null : new Date(Date.now() + TRIAL_MS);

    await db.workspace.update({
      where: { id: session.workspaceId },
      data: { plan, billingCycle, trialEndsAt },
    });

    revalidatePath("/app", "layout");
    redirect("/app");
  });
}

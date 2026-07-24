"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export type PlanChoice = "free" | "pro" | "touring" | "team";

export async function completeOnboarding(plan: PlanChoice, billingCycle: "monthly" | "annual") {
  const session = await getSession();
  if (!session) redirect("/login");

  const trialEndsAt = plan === "free" ? null : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  await db.workspace.update({
    where: { id: session.workspaceId },
    data: { plan, billingCycle, trialEndsAt },
  });

  revalidatePath("/app", "layout");
  redirect("/app");
}

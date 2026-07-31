"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { withErrorLog } from "@/lib/action-error";
import { requireMinPlan } from "@/lib/plan-limits-server";

export async function createLiability(formData: FormData) {
  return withErrorLog("createLiability", async () => {
    const session = await getSession();
    if (!session) return;

    const name = String(formData.get("name") ?? "").trim();
    const amount = Number(formData.get("amount") ?? 0);
    if (!name || !amount || amount <= 0) return;

    await requireMinPlan(session.workspaceId, "pro");

    await db.liability.create({
      data: { workspaceId: session.workspaceId, name, amount: Math.round(amount * 100) },
    });
    revalidatePath("/app/finance");
  });
}

export async function deleteLiability(id: string) {
  return withErrorLog("deleteLiability", async () => {
    const session = await getSession();
    if (!session) return;

    const existing = await db.liability.findUnique({ where: { id } });
    if (!existing || existing.workspaceId !== session.workspaceId) return;

    await requireMinPlan(session.workspaceId, "pro");

    await db.liability.delete({ where: { id } });
    revalidatePath("/app/finance");
  });
}

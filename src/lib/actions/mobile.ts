"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { withErrorFallback } from "@/lib/action-error";

export async function logExpense(amountDollars: number, note: string) {
  return withErrorFallback("logExpense", { ok: false as const }, async () => {
    const session = await getSession();
    if (!session) return { ok: false as const };
    if (!amountDollars || amountDollars <= 0) return { ok: false as const };

    await db.transaction.create({
      data: {
        workspaceId: session.workspaceId,
        kind: "expense",
        category: "Tour expenses",
        amount: Math.round(amountDollars * 100),
        source: note || "Mobile quick capture",
        occurredAt: new Date(),
      },
    });
    revalidatePath("/mobile");
    revalidatePath("/app/finance");
    return { ok: true as const };
  });
}

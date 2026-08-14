"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { withErrorFallback } from "@/lib/action-error";
import { uploadReceiptImage } from "@/lib/receipt-upload";

export async function logExpense(formData: FormData) {
  return withErrorFallback("logExpense", { ok: false as const }, async () => {
    const session = await getSession();
    if (!session) return { ok: false as const };

    const amountDollars = Number(formData.get("amount") ?? 0);
    const note = String(formData.get("note") ?? "");
    if (!amountDollars || amountDollars <= 0) return { ok: false as const };

    const receipt = formData.get("receipt") as File | null;
    const { path: receiptUrl, error } = await uploadReceiptImage(receipt, session.workspaceId);
    if (error) return { ok: false as const };

    await db.transaction.create({
      data: {
        workspaceId: session.workspaceId,
        kind: "expense",
        category: "Tour expenses",
        amount: Math.round(amountDollars * 100),
        source: note || "Mobile quick capture",
        occurredAt: new Date(),
        receiptUrl,
      },
    });
    revalidatePath("/mobile");
    revalidatePath("/app/finance");
    return { ok: true as const };
  });
}

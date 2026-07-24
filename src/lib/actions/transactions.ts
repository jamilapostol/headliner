"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function createTransaction(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  const kind = String(formData.get("kind") ?? "income") === "expense" ? "expense" : "income";
  const category = String(formData.get("category") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const source = String(formData.get("source") ?? "").trim();
  const occurredAt = String(formData.get("occurredAt") ?? "");

  if (!category || !amount || !occurredAt) return;

  await db.transaction.create({
    data: {
      workspaceId: session.workspaceId,
      kind,
      category,
      amount: Math.round(amount * 100),
      source,
      occurredAt: new Date(occurredAt),
    },
  });
  revalidatePath("/app/finance");
  revalidatePath("/app");
}

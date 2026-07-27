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

export async function importTransactions(rows: Record<string, string>[]) {
  const session = await getSession();
  if (!session) return { imported: 0, skipped: rows.length };

  const data = [];
  for (const r of rows) {
    const category = (r.category ?? "").trim();
    const amountNum = Number(r.amount ?? "");
    const occurredAtRaw = (r.occurredAt ?? "").trim();
    const occurredAt = occurredAtRaw ? new Date(occurredAtRaw) : null;
    if (!category || !amountNum || !occurredAt || Number.isNaN(occurredAt.getTime())) continue;

    const kind: "income" | "expense" = (r.kind ?? "").trim().toLowerCase() === "expense" ? "expense" : "income";
    data.push({
      workspaceId: session.workspaceId,
      kind,
      category,
      amount: Math.round(Math.abs(amountNum) * 100),
      source: (r.source ?? "").trim() || null,
      occurredAt,
    });
  }
  if (data.length > 0) await db.transaction.createMany({ data });

  revalidatePath("/app/finance");
  revalidatePath("/app");
  return { imported: data.length, skipped: rows.length - data.length };
}

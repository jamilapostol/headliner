"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { withErrorLog, withErrorFallback } from "@/lib/action-error";
import { MAX_IMPORT_ROWS } from "@/lib/import-limits";
import { requireMinPlan } from "@/lib/plan-limits-server";
import { categoriesFor } from "@/lib/transaction-categories";
import { uploadReceiptImage } from "@/lib/receipt-upload";

export async function createTransaction(formData: FormData) {
  return withErrorLog("createTransaction", async () => {
    const session = await getSession();
    if (!session) return;

    const kind = String(formData.get("kind") ?? "income") === "expense" ? "expense" : "income";
    const category = String(formData.get("category") ?? "").trim();
    const amount = Number(formData.get("amount") ?? 0);
    const source = String(formData.get("source") ?? "").trim();
    const occurredAt = String(formData.get("occurredAt") ?? "");

    if (!categoriesFor(kind).includes(category) || !amount || !occurredAt) return;

    await requireMinPlan(session.workspaceId, "pro");

    const receipt = formData.get("receipt") as File | null;
    const { path: receiptUrl } = await uploadReceiptImage(receipt, session.workspaceId);

    await db.transaction.create({
      data: {
        workspaceId: session.workspaceId,
        kind,
        category,
        amount: Math.round(amount * 100),
        source,
        occurredAt: new Date(occurredAt),
        receiptUrl,
      },
    });
    revalidatePath("/app/finance");
    revalidatePath("/app");
    revalidatePath("/mobile");
  });
}

export async function updateTransaction(id: string, formData: FormData) {
  return withErrorLog("updateTransaction", async () => {
    const session = await getSession();
    if (!session) return;

    const existing = await db.transaction.findUnique({ where: { id } });
    if (!existing || existing.workspaceId !== session.workspaceId) return;

    const kind = String(formData.get("kind") ?? "income") === "expense" ? "expense" : "income";
    const category = String(formData.get("category") ?? "").trim();
    const amount = Number(formData.get("amount") ?? 0);
    const source = String(formData.get("source") ?? "").trim();
    const occurredAt = String(formData.get("occurredAt") ?? "");

    if (!categoriesFor(kind).includes(category) || !amount || !occurredAt) return;

    await requireMinPlan(session.workspaceId, "pro");

    const receipt = formData.get("receipt") as File | null;
    const { path: newReceiptUrl } = await uploadReceiptImage(receipt, session.workspaceId);

    await db.transaction.update({
      where: { id },
      data: {
        kind,
        category,
        amount: Math.round(amount * 100),
        source,
        occurredAt: new Date(occurredAt),
        receiptUrl: newReceiptUrl ?? existing.receiptUrl,
      },
    });
    revalidatePath("/app/finance");
    revalidatePath("/app");
    revalidatePath("/mobile");
  });
}

// Returns the deleted row's fields so the caller can offer an "Undo" toast
// that recreates it via restoreTransaction — deleting first (rather than
// confirm()-then-delete) keeps the action instant while still forgiving.
export async function deleteTransaction(id: string) {
  return withErrorLog("deleteTransaction", async () => {
    const session = await getSession();
    if (!session) return null;

    const existing = await db.transaction.findUnique({ where: { id } });
    if (!existing || existing.workspaceId !== session.workspaceId) return null;

    await requireMinPlan(session.workspaceId, "pro");

    await db.transaction.delete({ where: { id } });
    revalidatePath("/app/finance");
    revalidatePath("/app");
    revalidatePath("/mobile");

    return {
      kind: existing.kind,
      category: existing.category,
      amount: existing.amount,
      source: existing.source,
      occurredAt: existing.occurredAt.toISOString(),
      receiptUrl: existing.receiptUrl,
    };
  });
}

// Re-creates a transaction from known field values — backs the "Undo" toast
// after a delete. A fresh row (new id) is fine; nothing else references a
// deleted transaction's id.
export async function restoreTransaction(fields: {
  kind: "income" | "expense";
  category: string;
  amount: number;
  source: string | null;
  occurredAt: string;
  receiptUrl: string | null;
}) {
  return withErrorLog("restoreTransaction", async () => {
    const session = await getSession();
    if (!session) return;

    await db.transaction.create({
      data: {
        workspaceId: session.workspaceId,
        kind: fields.kind,
        category: fields.category,
        amount: fields.amount,
        source: fields.source,
        occurredAt: new Date(fields.occurredAt),
        receiptUrl: fields.receiptUrl,
      },
    });
    revalidatePath("/app/finance");
    revalidatePath("/app");
    revalidatePath("/mobile");
  });
}

export async function importTransactions(rows: Record<string, string>[]) {
  return withErrorFallback("importTransactions", { imported: 0, skipped: rows.length }, async () => {
    const session = await getSession();
    if (!session) return { imported: 0, skipped: rows.length };

    await requireMinPlan(session.workspaceId, "pro");

    const capped = rows.slice(0, MAX_IMPORT_ROWS);
    const data = [];
    for (const r of capped) {
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
  });
}

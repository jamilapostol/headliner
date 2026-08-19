"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { withErrorLog, withErrorState } from "@/lib/action-error";
import { isAllowedImage } from "@/lib/file-validation";
import { requireMinPlan } from "@/lib/plan-limits-server";
import type { AdjustStockResult, CompleteSaleResult, MerchSyncOutcome } from "@/lib/merch-sync";

const GLYPH_COLORS = ["#3fe87a", "#e8e43f", "#e8983f", "#7ab8e8", "#c99df5", "#e87a9a"];

export type ActionState = { error?: string; success?: string };

export async function createMerchItem(formData: FormData) {
  return withErrorLog("createMerchItem", async () => {
    const session = await getSession();
    if (!session) return;

    const name = String(formData.get("name") ?? "").trim();
    const variant = String(formData.get("variant") ?? "").trim();
    const price = Number(formData.get("price") ?? 0);
    const margin = Number(formData.get("margin") ?? 50) / 100;
    const stock = Number(formData.get("stock") ?? 0);
    const maxStock = Math.max(Number(formData.get("maxStock") ?? stock), stock, 1);

    if (!name || !price) return;

    await requireMinPlan(session.workspaceId, "pro");

    await db.merchItem.create({
      data: {
        workspaceId: session.workspaceId,
        name,
        variant,
        price: Math.round(price * 100),
        cogs: Math.round(price * 100 * (1 - margin)),
        stock,
        maxStock,
        glyph: name.trim()[0]?.toUpperCase() ?? "M",
        color: GLYPH_COLORS[Math.floor(Math.random() * GLYPH_COLORS.length)],
      },
    });
    revalidatePath("/app/merch");
  });
}

export async function uploadMerchImage(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return withErrorState("uploadMerchImage", async () => {
    const session = await getSession();
    if (!session) return { error: "Not signed in." };

    const itemId = String(formData.get("itemId") ?? "");
    const file = formData.get("file") as File | null;
    if (!itemId) return { error: "Missing item." };
    if (!file || file.size === 0) return { error: "Choose an image first." };
    if (file.size > 5 * 1024 * 1024) return { error: "Image must be under 5MB." };
    if (!isAllowedImage(file)) return { error: "Please upload a JPG, PNG, GIF, or WEBP image." };

    const item = await db.merchItem.findUnique({ where: { id: itemId } });
    if (!item || item.workspaceId !== session.workspaceId) return { error: "Item not found." };

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${session.workspaceId}/${itemId}.${ext}`;

    const admin = createAdminClient();
    const { error: uploadError } = await admin.storage.from("merch").upload(path, file, { upsert: true });
    if (uploadError) return { error: uploadError.message };

    const {
      data: { publicUrl },
    } = admin.storage.from("merch").getPublicUrl(path);

    await db.merchItem.update({ where: { id: itemId }, data: { imageUrl: `${publicUrl}?t=${Date.now()}` } });
    revalidatePath("/app/merch");
    return { success: "Photo updated." };
  });
}

// --- Idempotent, delta-based mutations ---------------------------------
//
// adjustStock and completeSale are the two flows a device queues while
// offline at a merch table (see src/lib/merch-offline.ts) and replays on
// reconnect. Both properties below are what make replay safe:
//
// 1. Idempotent: every call carries a client-generated key. claimOrReplay
//    claims it once via `INSERT ... ON CONFLICT DO NOTHING` — never a
//    Prisma .create() + catch, because a thrown Postgres error aborts every
//    later statement in the same transaction, and this whole claim needs to
//    share a transaction with the effect it guards. A second call with the
//    same key finds the row already claimed and returns the stored result
//    instead of re-running the effect, so a retried "sell one" can't sell
//    two, and a retried sale can't log revenue twice.
//
// 2. Delta-based: the stock write is one atomic `UPDATE ... SET stock =
//    stock + $delta` (or the LEAST/GREATEST-clamped equivalent), not a
//    read-in-application-code-then-write. Postgres evaluates the SET
//    expression against the pre-statement row under that row's lock, so two
//    concurrent updates to the same item — from two different devices both
//    coming back online at once — serialize correctly instead of one
//    clobbering the other.

async function claimOrReplay<T>(
  tx: Prisma.TransactionClient,
  workspaceId: string,
  key: string,
  action: string
): Promise<{ claimed: true; opId: string } | { claimed: false; result: T | null }> {
  const opId = randomUUID();
  const rows = await tx.$queryRaw<Array<{ id: string }>>`
    INSERT INTO "MerchSyncOperation" ("id", "workspaceId", "key", "action", "resultJson", "createdAt")
    VALUES (${opId}, ${workspaceId}, ${key}, ${action}, '', now())
    ON CONFLICT ("workspaceId", "key") DO NOTHING
    RETURNING "id"
  `;
  if (rows.length > 0) return { claimed: true, opId: rows[0].id };

  const existing = await tx.merchSyncOperation.findUnique({ where: { workspaceId_key: { workspaceId, key } } });
  if (existing?.resultJson) return { claimed: false, result: JSON.parse(existing.resultJson) as T };
  // Claimed by an attempt that hasn't written its result yet — another tab
  // mid-flight, or a crash between claiming and finishing. Either way this
  // call didn't do the work; the caller reports retryable, not success.
  return { claimed: false, result: null };
}

export async function adjustStock(
  itemId: string,
  delta: number,
  idempotencyKey: string
): Promise<MerchSyncOutcome<AdjustStockResult>> {
  const outcome = await withErrorLog("adjustStock", async (): Promise<MerchSyncOutcome<AdjustStockResult>> => {
    const session = await getSession();
    if (!session) return { ok: false, kind: "permanent", error: "Not signed in." };

    return db.$transaction(async (tx) => {
      const claim = await claimOrReplay<AdjustStockResult>(tx, session.workspaceId, idempotencyKey, "adjustStock");
      if (!claim.claimed) {
        if (claim.result) return { ok: true, result: claim.result, replayed: true };
        return { ok: false, kind: "retryable", error: "Sync already in progress — retry shortly." };
      }

      // GREATEST(stock + delta, 0): the SET expression's `stock` reads the
      // pre-update value, so this is a single atomic delta write, not a
      // read-then-write — see the module comment.
      const rows = await tx.$queryRaw<Array<{ stock: number }>>`
        UPDATE "MerchItem"
        SET stock = GREATEST(stock + ${delta}, 0)
        WHERE id = ${itemId} AND "workspaceId" = ${session.workspaceId}
        RETURNING stock
      `;
      if (rows.length === 0) {
        return { ok: false, kind: "permanent", error: "Item not found." };
      }

      const result: AdjustStockResult = { itemId, stock: rows[0].stock };
      await tx.merchSyncOperation.update({ where: { id: claim.opId }, data: { resultJson: JSON.stringify(result) } });
      return { ok: true, result };
    });
  });

  if (outcome) revalidatePath("/app/merch");
  return outcome ?? { ok: false, kind: "retryable", error: "Unexpected server error." };
}

export async function completeSale(
  cart: Array<{ itemId: string; qty: number }>,
  idempotencyKey: string,
  bookingId: string | null = null
): Promise<MerchSyncOutcome<CompleteSaleResult>> {
  const outcome = await withErrorLog("completeSale", async (): Promise<MerchSyncOutcome<CompleteSaleResult>> => {
    const session = await getSession();
    if (!session) return { ok: false, kind: "permanent", error: "Not signed in." };

    const items = cart.filter((c) => c.qty > 0);
    if (items.length === 0) return { ok: false, kind: "permanent", error: "Nothing in the cart." };

    try {
      await requireMinPlan(session.workspaceId, "pro");
    } catch {
      return { ok: false, kind: "permanent", error: "Merch requires the Pro plan or higher." };
    }

    // Which show this sale belongs to, for the settlement screens. Checked
    // against this workspace so a stale or forged id can't attribute income
    // to someone else's night. A failed check drops the attribution and
    // keeps the sale: the money physically changed hands, and refusing to
    // record it because a tag didn't resolve would lose real revenue over
    // bookkeeping.
    let attributedBookingId: string | null = null;
    if (bookingId) {
      const booking = await db.booking.findFirst({
        where: { id: bookingId, workspaceId: session.workspaceId },
        select: { id: true },
      });
      attributedBookingId = booking?.id ?? null;
    }

    return db.$transaction(async (tx) => {
      const claim = await claimOrReplay<CompleteSaleResult>(tx, session.workspaceId, idempotencyKey, "completeSale");
      if (!claim.claimed) {
        if (claim.result) return { ok: true, result: claim.result, replayed: true };
        return { ok: false, kind: "retryable", error: "Sync already in progress — retry shortly." };
      }

      const sold: CompleteSaleResult["sold"] = [];
      // One line per item that actually moved, priced as it was priced at
      // this moment. Written inside this transaction, so it inherits the
      // idempotency claim above — a replayed sale cannot double the goods
      // any more than it can double the money.
      const lines: Array<{ merchItemId: string; qty: number; unitPrice: number; unitCogs: number }> = [];
      let total = 0;

      // Every completeSale locks its cart's rows in the same order
      // (itemId ascending) regardless of the order they were added to the
      // cart. Two concurrent multi-item sales sharing items but adding them
      // in different orders would otherwise be a textbook deadlock: A holds
      // item1's lock wanting item2, B holds item2's lock wanting item1.
      // Postgres would detect and abort one — a fixed lock order prevents
      // the circular wait instead of just recovering from it.
      const ordered = [...items].sort((a, b) => a.itemId.localeCompare(b.itemId));

      for (const c of ordered) {
        // The `before` CTE takes a row lock (FOR UPDATE) and captures the
        // pre-update stock. Without it, referencing `stock` inside RETURNING
        // would read the just-updated (post-decrement) value — RETURNING
        // reflects the new row, unlike a SET clause's right-hand side, which
        // reads the old one. Capturing the old value explicitly is what lets
        // one statement do an atomic, stock-clamped decrement and report how
        // much it actually sold.
        const rows = await tx.$queryRaw<Array<{ price: number; cogs: number; sold: number }>>`
          WITH before AS (
            SELECT stock, price, cogs FROM "MerchItem"
            WHERE id = ${c.itemId} AND "workspaceId" = ${session.workspaceId}
            FOR UPDATE
          )
          UPDATE "MerchItem"
          SET stock = "MerchItem".stock - LEAST(${c.qty}, before.stock)
          FROM before
          WHERE "MerchItem".id = ${c.itemId} AND "MerchItem"."workspaceId" = ${session.workspaceId}
          RETURNING before.price, before.cogs, LEAST(${c.qty}, before.stock) AS sold
        `;
        if (rows.length === 0) continue; // item deleted or not this workspace's — skip, don't fail the whole sale

        const qtySold = rows[0].sold;
        if (qtySold > 0) {
          total += qtySold * rows[0].price;
          lines.push({ merchItemId: c.itemId, qty: qtySold, unitPrice: rows[0].price, unitCogs: rows[0].cogs });
        }
        if (qtySold !== c.qty) {
          sold.push({ itemId: c.itemId, requested: c.qty, sold: qtySold });
        }
      }

      if (total === 0) {
        // Still store this under the claimed key: a replay of this exact
        // key must keep returning "nothing was sellable", not silently
        // re-attempt against whatever stock exists by the time it retries.
        const result: CompleteSaleResult = { total: 0, sold: items.map((c) => ({ itemId: c.itemId, requested: c.qty, sold: 0 })) };
        await tx.merchSyncOperation.update({ where: { id: claim.opId }, data: { resultJson: JSON.stringify(result) } });
        return { ok: false, kind: "permanent", error: "Everything in this sale is out of stock." };
      }

      const incomeTxn = await tx.transaction.create({
        data: {
          workspaceId: session.workspaceId,
          kind: "income",
          category: "Merchandise",
          amount: total,
          source: "Point of sale",
          bookingId: attributedBookingId,
        },
      });

      await tx.merchSale.createMany({
        data: lines.map((l) => ({
          workspaceId: session.workspaceId,
          merchItemId: l.merchItemId,
          bookingId: attributedBookingId,
          transactionId: incomeTxn.id,
          qty: l.qty,
          unitPrice: l.unitPrice,
          unitCogs: l.unitCogs,
        })),
      });

      const result: CompleteSaleResult = { total, sold };
      await tx.merchSyncOperation.update({ where: { id: claim.opId }, data: { resultJson: JSON.stringify(result) } });
      return { ok: true, result };
    });
  });

  if (outcome) {
    revalidatePath("/app/merch");
    revalidatePath("/app/finance");
    revalidatePath("/app/settlement");
    revalidatePath("/app");
  }
  return outcome ?? { ok: false, kind: "retryable", error: "Unexpected server error." };
}

/**
 * Record a physical count of the van against what the system believed.
 *
 * `expected` is captured in the SAME statement that writes the new stock,
 * using the FOR UPDATE CTE pattern the sale path already uses. Reading the
 * stock first and writing it second would let a sale land in between: the
 * variance would absorb that sale as if it were shrinkage, and the sale's
 * decrement would then be clobbered by the count. One statement makes a
 * concurrent sale land cleanly on one side or the other.
 *
 * Deliberately NOT routed through the offline queue. A count is not a
 * customer waiting at a table — it can be redone when there is signal —
 * and a queued count replayed hours later would compare against a stock
 * level that has since moved.
 */
export async function recordStockCount(formData: FormData) {
  return withErrorLog("recordStockCount", async () => {
    const session = await getSession();
    if (!session) return;
    await requireMinPlan(session.workspaceId, "pro");

    const note = String(formData.get("note") ?? "").trim();
    const bookingIdRaw = String(formData.get("bookingId") ?? "").trim();

    // Only count items the form actually carried a number for — a blank
    // field means "did not count this", which is different from zero.
    const entries: Array<{ itemId: string; counted: number }> = [];
    for (const [key, raw] of formData.entries()) {
      if (!key.startsWith("count-")) continue;
      const value = String(raw).trim();
      if (value === "") continue;
      const counted = Number(value);
      if (!Number.isFinite(counted) || counted < 0) continue;
      entries.push({ itemId: key.slice("count-".length), counted: Math.round(counted) });
    }
    if (entries.length === 0) return;

    let bookingId: string | null = null;
    if (bookingIdRaw) {
      const booking = await db.booking.findFirst({
        where: { id: bookingIdRaw, workspaceId: session.workspaceId },
        select: { id: true },
      });
      bookingId = booking?.id ?? null;
    }

    await db.$transaction(async (tx) => {
      for (const entry of entries) {
        const rows = await tx.$queryRaw<Array<{ expected: number; cogs: number }>>`
          WITH before AS (
            SELECT stock, cogs FROM "MerchItem"
            WHERE id = ${entry.itemId} AND "workspaceId" = ${session.workspaceId}
            FOR UPDATE
          )
          UPDATE "MerchItem"
          SET stock = ${entry.counted}
          FROM before
          WHERE "MerchItem".id = ${entry.itemId} AND "MerchItem"."workspaceId" = ${session.workspaceId}
          RETURNING before.stock AS expected, before.cogs AS cogs
        `;
        if (rows.length === 0) continue; // not this workspace's item

        await tx.stockCount.create({
          data: {
            workspaceId: session.workspaceId,
            merchItemId: entry.itemId,
            bookingId,
            expected: rows[0].expected,
            counted: entry.counted,
            unitCogs: rows[0].cogs,
            note: note || null,
          },
        });
      }
    });

    revalidatePath("/app/merch");
    revalidatePath("/app/merch/economics");
  });
}

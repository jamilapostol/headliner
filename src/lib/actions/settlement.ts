"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { withErrorLog } from "@/lib/action-error";
import { requireMinPlan } from "@/lib/plan-limits-server";
import { isValidTimeZone } from "@/lib/format";
import { BPS } from "@/lib/settlement";

/** Percent (possibly fractional, as typed) to integer basis points. */
function pctToBps(pct: number): number {
  return Math.max(0, Math.min(BPS, Math.round(pct * 100)));
}

export async function addSplit(formData: FormData) {
  return withErrorLog("addSplit", async () => {
    const session = await getSession();
    if (!session) return;
    await requireMinPlan(session.workspaceId, "pro");

    const name = String(formData.get("name") ?? "").trim();
    const role = String(formData.get("role") ?? "").trim();
    const share = Number(formData.get("share") ?? 0);
    if (!name || !Number.isFinite(share) || share <= 0) return;

    await db.split.create({
      data: { workspaceId: session.workspaceId, name, role: role || null, shareBps: pctToBps(share) },
    });
    revalidatePath("/app/settlement/splits");
  });
}

export async function updateSplitShare(splitId: string, sharePct: number) {
  return withErrorLog("updateSplitShare", async () => {
    const session = await getSession();
    if (!session || !Number.isFinite(sharePct)) return;

    // Scope the write by workspace so a guessed id from another workspace
    // updates nothing rather than someone else's payout.
    await db.split.updateMany({
      where: { id: splitId, workspaceId: session.workspaceId },
      data: { shareBps: pctToBps(sharePct) },
    });
    revalidatePath("/app/settlement/splits");
  });
}

export async function removeSplit(splitId: string) {
  return withErrorLog("removeSplit", async () => {
    const session = await getSession();
    if (!session) return;

    await db.split.deleteMany({ where: { id: splitId, workspaceId: session.workspaceId } });
    revalidatePath("/app/settlement/splits");
  });
}

export async function setSplitsIncludeMerch(include: boolean) {
  return withErrorLog("setSplitsIncludeMerch", async () => {
    const session = await getSession();
    if (!session) return;

    await db.workspace.update({ where: { id: session.workspaceId }, data: { splitsIncludeMerch: include } });
    revalidatePath("/app/settlement/splits");
    revalidatePath("/app/settlement");
  });
}

export async function setMerchCut(bookingId: string, cutPct: number) {
  return withErrorLog("setMerchCut", async () => {
    const session = await getSession();
    if (!session || !Number.isFinite(cutPct)) return;

    await db.booking.updateMany({
      where: { id: bookingId, workspaceId: session.workspaceId },
      data: { merchCutBps: pctToBps(cutPct) },
    });
    revalidatePath("/app/settlement");
    revalidatePath(`/app/settlement/show/${bookingId}`);
  });
}

/**
 * Set (or clear) the venue's IANA timezone.
 *
 * Validated server-side because the read path fails SILENTLY: dayKeyInZone
 * falls back to UTC on a zone it cannot use, so a typo would not surface as
 * an error — it would just quietly move when "tonight" starts at that
 * venue, which is exactly the bug this field exists to fix.
 */
export async function setBookingTimezone(bookingId: string, timezone: string | null) {
  return withErrorLog("setBookingTimezone", async () => {
    const session = await getSession();
    if (!session) return;
    if (timezone !== null && !isValidTimeZone(timezone)) return;

    await db.booking.updateMany({
      where: { id: bookingId, workspaceId: session.workspaceId },
      data: { timezone },
    });
    revalidatePath(`/app/settlement/show/${bookingId}`);
    revalidatePath("/app/merch");
  });
}

/**
 * Attribute a transaction to a show, or clear it back to tour-wide.
 *
 * Both the transaction and the target booking are re-checked against the
 * session's workspace: without the booking check, a valid transaction id
 * could be pointed at another workspace's show.
 */
export async function tagTransaction(transactionId: string, bookingId: string | null) {
  return withErrorLog("tagTransaction", async () => {
    const session = await getSession();
    if (!session) return;

    if (bookingId) {
      const booking = await db.booking.findFirst({
        where: { id: bookingId, workspaceId: session.workspaceId },
        select: { id: true },
      });
      if (!booking) return;
    }

    await db.transaction.updateMany({
      where: { id: transactionId, workspaceId: session.workspaceId },
      data: { bookingId },
    });
    revalidatePath("/app/settlement");
    revalidatePath("/app/finance");
  });
}

"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { withErrorLog } from "@/lib/action-error";
import { requireMinPlan } from "@/lib/plan-limits-server";
import { isValidTimeZone } from "@/lib/format";
import { BPS, VENUE_MERCH_CUT } from "@/lib/settlement";

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
 * Record the venue's merch cut as actually paid.
 *
 * Writes a real expense against the show, which is what turns the derived
 * estimate on the P&L into a settled figure — computeShowPnl stops deriving
 * the cut the moment one exists under this category, so the money is never
 * counted twice.
 *
 * The amount is entered rather than assumed: what a venue actually takes at
 * the table and what their percentage says it should be are not reliably
 * the same number, and the gap between them is the point of reconciling.
 */
export async function settleVenueMerchCut(formData: FormData) {
  return withErrorLog("settleVenueMerchCut", async () => {
    const session = await getSession();
    if (!session) return;
    await requireMinPlan(session.workspaceId, "pro");

    const bookingId = String(formData.get("bookingId") ?? "").trim();
    const amountDollars = Number(formData.get("amount") ?? 0);
    if (!bookingId || !Number.isFinite(amountDollars) || amountDollars <= 0) return;

    const booking = await db.booking.findFirst({
      where: { id: bookingId, workspaceId: session.workspaceId },
      select: { id: true, venue: true, date: true },
    });
    if (!booking) return;

    await db.transaction.create({
      data: {
        workspaceId: session.workspaceId,
        kind: "expense",
        category: VENUE_MERCH_CUT,
        amount: Math.round(amountDollars * 100),
        source: booking.venue,
        bookingId: booking.id,
        // Dated to the show, not to when it was entered — a cut settled
        // three days later still belongs to the night it came off.
        occurredAt: booking.date,
      },
    });
    revalidatePath(`/app/settlement/show/${bookingId}`);
    revalidatePath("/app/settlement");
    revalidatePath("/app/finance");
  });
}

/**
 * Record that a share was actually handed over.
 *
 * Takes the name as a snapshot rather than relying on the split row, so
 * removing someone from the split table later does not erase the record of
 * money that moved.
 */
export async function recordPayout(formData: FormData) {
  return withErrorLog("recordPayout", async () => {
    const session = await getSession();
    if (!session) return;
    await requireMinPlan(session.workspaceId, "pro");

    const splitId = String(formData.get("splitId") ?? "").trim() || null;
    const amountDollars = Number(formData.get("amount") ?? 0);
    const method = String(formData.get("method") ?? "").trim();
    const note = String(formData.get("note") ?? "").trim();
    const tourId = String(formData.get("tourId") ?? "").trim() || null;
    if (!Number.isFinite(amountDollars) || amountDollars <= 0) return;

    // Resolve the name from the split, scoped to this workspace — never
    // from the form, so a crafted post can't attach a payout to a name
    // that was never in the split table.
    let name = "";
    if (splitId) {
      const split = await db.split.findFirst({
        where: { id: splitId, workspaceId: session.workspaceId },
        select: { name: true },
      });
      if (!split) return;
      name = split.name;
    }
    if (!name) return;

    await db.payout.create({
      data: {
        workspaceId: session.workspaceId,
        splitId,
        name,
        tourId,
        amount: Math.round(amountDollars * 100),
        method: method || null,
        note: note || null,
      },
    });
    revalidatePath("/app/settlement/splits");
    revalidatePath("/app/settlement");
  });
}

export async function removePayout(payoutId: string) {
  return withErrorLog("removePayout", async () => {
    const session = await getSession();
    if (!session) return;

    await db.payout.deleteMany({ where: { id: payoutId, workspaceId: session.workspaceId } });
    revalidatePath("/app/settlement/splits");
    revalidatePath("/app/settlement");
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

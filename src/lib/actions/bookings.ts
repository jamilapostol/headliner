"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { withErrorLog, withErrorState } from "@/lib/action-error";
import { BOOKING_LIMITS } from "@/lib/plan-limits";

const STAGES = ["Lead", "Contacted", "Negotiating", "Offer_Sent", "Confirmed", "Paid"] as const;
export type Stage = (typeof STAGES)[number];

export async function updateBookingStage(bookingId: string, stage: Stage) {
  return withErrorLog("updateBookingStage", async () => {
    const session = await getSession();
    if (!session) return;
    if (!STAGES.includes(stage)) return;

    const booking = await db.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.workspaceId !== session.workspaceId) return;

    // Moving a booking into "Paid" is the real-world signal that the fee
    // was actually collected — auto-log it as revenue right here instead
    // of relying on someone to separately remember to add a transaction.
    // feeTransactionId makes this idempotent: re-entering "Paid" (or
    // toggling back and forth) never logs the same fee twice.
    const justPaid = stage === "Paid" && booking.stage !== "Paid" && !booking.feeTransactionId && booking.fee > 0;

    if (justPaid) {
      const transaction = await db.transaction.create({
        data: {
          workspaceId: session.workspaceId,
          kind: "income",
          category: "Performance fees",
          amount: booking.fee,
          source: booking.venue,
          occurredAt: booking.date,
        },
      });
      await db.booking.update({ where: { id: bookingId }, data: { stage, feeTransactionId: transaction.id } });
      revalidatePath("/app/finance");
    } else {
      await db.booking.update({ where: { id: bookingId }, data: { stage } });
    }

    revalidatePath("/app/bookings");
    revalidatePath("/app");
    revalidatePath("/app/calendar");
  });
}

export async function updateBookingDetails(bookingId: string, fields: { fee?: number; contactName?: string; contactPhone?: string }) {
  return withErrorLog("updateBookingDetails", async () => {
    const session = await getSession();
    if (!session) return;

    const booking = await db.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.workspaceId !== session.workspaceId) return;

    await db.booking.update({
      where: { id: bookingId },
      data: {
        ...(fields.fee !== undefined ? { fee: Math.max(0, Math.round(fields.fee * 100)) } : {}),
        ...(fields.contactName !== undefined ? { contactName: fields.contactName || null } : {}),
        ...(fields.contactPhone !== undefined ? { contactPhone: fields.contactPhone || null } : {}),
      },
    });
    revalidatePath("/app/bookings");
  });
}

const CHECKLIST_FIELDS = ["offerConfirmed", "contractSigned", "depositReceived", "riderSent"] as const;
export type ChecklistField = (typeof CHECKLIST_FIELDS)[number];

export async function toggleBookingChecklist(bookingId: string, field: ChecklistField) {
  return withErrorLog("toggleBookingChecklist", async () => {
    const session = await getSession();
    if (!session) return;
    if (!CHECKLIST_FIELDS.includes(field)) return;

    const booking = await db.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.workspaceId !== session.workspaceId) return;

    await db.booking.update({ where: { id: bookingId }, data: { [field]: !booking[field] } });
    revalidatePath("/app/bookings");
  });
}

export async function createBooking(formData: FormData): Promise<{ error?: string }> {
  return withErrorState("createBooking", async () => {
    const session = await getSession();
    if (!session) return { error: "Not signed in." };

    const venue = String(formData.get("venue") ?? "").trim();
    const city = String(formData.get("city") ?? "").trim();
    const date = String(formData.get("date") ?? "");
    const endDateRaw = String(formData.get("endDate") ?? "").trim();
    const fee = Number(formData.get("fee") ?? 0);
    const contactName = String(formData.get("contactName") ?? "").trim();
    const contactPhone = String(formData.get("contactPhone") ?? "").trim();

    if (!venue || !city || !date) return {};

    const workspace = await db.workspace.findUniqueOrThrow({ where: { id: session.workspaceId } });
    const limit = BOOKING_LIMITS[workspace.plan] ?? Infinity;
    if (Number.isFinite(limit)) {
      const count = await db.booking.count({ where: { workspaceId: session.workspaceId } });
      if (count >= limit) {
        return { error: `Free plan is limited to ${limit} active bookings. Upgrade to add more.` };
      }
    }

    const endDate = endDateRaw && endDateRaw >= date ? new Date(endDateRaw) : null;

    await db.booking.create({
      data: {
        workspaceId: session.workspaceId,
        venue,
        city,
        date: new Date(date),
        endDate,
        fee: Math.round(fee * 100),
        contactName,
        contactPhone,
        stage: "Lead",
      },
    });
    revalidatePath("/app/bookings");
    revalidatePath("/app");
    revalidatePath("/app/calendar");
    return {};
  });
}

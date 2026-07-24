"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const STAGES = ["Lead", "Contacted", "Negotiating", "Offer_Sent", "Confirmed", "Paid"] as const;
export type Stage = (typeof STAGES)[number];

export async function updateBookingStage(bookingId: string, stage: Stage) {
  const session = await getSession();
  if (!session) return;
  if (!STAGES.includes(stage)) return;

  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.workspaceId !== session.workspaceId) return;

  await db.booking.update({ where: { id: bookingId }, data: { stage } });
  revalidatePath("/app/bookings");
  revalidatePath("/app");
  revalidatePath("/app/calendar");
}

export async function createBooking(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  const venue = String(formData.get("venue") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  const fee = Number(formData.get("fee") ?? 0);
  const promoter = String(formData.get("promoter") ?? "").trim();

  if (!venue || !city || !date) return;

  await db.booking.create({
    data: {
      workspaceId: session.workspaceId,
      venue,
      city,
      date: new Date(date),
      fee: Math.round(fee * 100),
      promoter,
      stage: "Lead",
    },
  });
  revalidatePath("/app/bookings");
  revalidatePath("/app");
  revalidatePath("/app/calendar");
}

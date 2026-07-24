"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function createTour(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  const name = String(formData.get("name") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  if (!name || !startDate || !endDate) return;

  await db.tour.create({
    data: { workspaceId: session.workspaceId, name, startDate: new Date(startDate), endDate: new Date(endDate) },
  });
  revalidatePath("/app/tour");
}

export async function addStop(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  const tourId = String(formData.get("tourId") ?? "");
  const bookingId = String(formData.get("bookingId") ?? "");
  if (!tourId || !bookingId) return;

  const tour = await db.tour.findUnique({ where: { id: tourId } });
  if (!tour || tour.workspaceId !== session.workspaceId) return;

  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.workspaceId !== session.workspaceId) return;

  const driveMiles = formData.get("driveMiles") ? Number(formData.get("driveMiles")) : null;
  const hotel = String(formData.get("hotel") ?? "").trim() || null;
  const hotelConfNo = String(formData.get("hotelConfNo") ?? "").trim() || null;
  const merchNote = String(formData.get("merchNote") ?? "").trim() || null;
  const perDiemDollars = formData.get("perDiem") ? Number(formData.get("perDiem")) : null;

  const maxSeq = await db.tourStop.aggregate({ where: { tourId }, _max: { seq: true } });

  await db.tourStop.create({
    data: {
      tourId,
      bookingId,
      seq: (maxSeq._max.seq ?? 0) + 1,
      driveMiles,
      hotel,
      hotelConfNo,
      merchNote,
      perDiemCents: perDiemDollars != null ? Math.round(perDiemDollars * 100) : null,
      schedule: "[]",
    },
  });
  revalidatePath("/app/tour");
}

async function requireOwnedStop(stopId: string, workspaceId: string) {
  const stop = await db.tourStop.findUnique({ where: { id: stopId }, include: { tour: true } });
  if (!stop || stop.tour.workspaceId !== workspaceId) return null;
  return stop;
}

export async function updateStop(stopId: string, fields: { driveMiles?: number | null; hotel?: string; hotelConfNo?: string; merchNote?: string; perDiem?: number }) {
  const session = await getSession();
  if (!session) return;

  const stop = await requireOwnedStop(stopId, session.workspaceId);
  if (!stop) return;

  await db.tourStop.update({
    where: { id: stopId },
    data: {
      ...(fields.driveMiles !== undefined ? { driveMiles: fields.driveMiles } : {}),
      ...(fields.hotel !== undefined ? { hotel: fields.hotel || null } : {}),
      ...(fields.hotelConfNo !== undefined ? { hotelConfNo: fields.hotelConfNo || null } : {}),
      ...(fields.merchNote !== undefined ? { merchNote: fields.merchNote || null } : {}),
      ...(fields.perDiem !== undefined ? { perDiemCents: Math.round(fields.perDiem * 100) } : {}),
    },
  });
  revalidatePath("/app/tour");
}

export async function removeStop(stopId: string) {
  const session = await getSession();
  if (!session) return;

  const stop = await requireOwnedStop(stopId, session.workspaceId);
  if (!stop) return;

  await db.tourStop.delete({ where: { id: stopId } });
  revalidatePath("/app/tour");
}

export async function moveStop(stopId: string, direction: "up" | "down") {
  const session = await getSession();
  if (!session) return;

  const stop = await requireOwnedStop(stopId, session.workspaceId);
  if (!stop) return;

  const neighbor = await db.tourStop.findFirst({
    where: { tourId: stop.tourId, seq: direction === "up" ? { lt: stop.seq } : { gt: stop.seq } },
    orderBy: { seq: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbor) return;

  await db.$transaction([
    db.tourStop.update({ where: { id: stop.id }, data: { seq: neighbor.seq } }),
    db.tourStop.update({ where: { id: neighbor.id }, data: { seq: stop.seq } }),
  ]);
  revalidatePath("/app/tour");
}

export async function addScheduleEvent(stopId: string, time: string, what: string, who: string) {
  const session = await getSession();
  if (!session) return;
  if (!time.trim() || !what.trim()) return;

  const stop = await requireOwnedStop(stopId, session.workspaceId);
  if (!stop) return;

  const schedule = JSON.parse(stop.schedule) as Array<{ time: string; what: string; who: string }>;
  schedule.push({ time: time.trim(), what: what.trim(), who: who.trim() });
  schedule.sort((a, b) => a.time.localeCompare(b.time));

  await db.tourStop.update({ where: { id: stopId }, data: { schedule: JSON.stringify(schedule) } });
  revalidatePath("/app/tour");
}

export async function removeScheduleEvent(stopId: string, index: number) {
  const session = await getSession();
  if (!session) return;

  const stop = await requireOwnedStop(stopId, session.workspaceId);
  if (!stop) return;

  const schedule = JSON.parse(stop.schedule) as Array<{ time: string; what: string; who: string }>;
  schedule.splice(index, 1);

  await db.tourStop.update({ where: { id: stopId }, data: { schedule: JSON.stringify(schedule) } });
  revalidatePath("/app/tour");
}

import { requireWorkspace } from "@/lib/workspace";
import { db } from "@/lib/db";
import { calendarDay, fmtDateUTC } from "@/lib/format";
import { MobileDayView, type NextShowDTO, type ScheduleEvent } from "@/components/mobile-day-view";

function findTime(schedule: ScheduleEvent[], match: string) {
  return schedule.find((e) => e.what.toLowerCase().includes(match))?.time ?? null;
}

export default async function MobilePage() {
  const { workspace } = await requireWorkspace();
  const now = new Date();
  const todayKey = calendarDay(now);

  const stops = await db.tourStop.findMany({
    where: { tour: { workspaceId: workspace.id } },
    include: { booking: true },
    orderBy: { seq: "asc" },
  });

  const upcoming = stops.filter((s) => s.booking && calendarDay(s.booking.date) >= todayKey);
  const stop = upcoming[0] ?? null;

  let nextShow: NextShowDTO | null = null;
  if (stop && stop.booking) {
    const stopDay = calendarDay(stop.booking.date);
    const daysUntil = Math.round((stopDay.getTime() - todayKey.getTime()) / 86400000);
    const isToday = daysUntil === 0;
    const daySchedule: ScheduleEvent[] = JSON.parse(stop.schedule);

    const schedule: ScheduleEvent[] = isToday
      ? daySchedule
      : [
          ...(stop.driveMiles
            ? [{ time: "—", what: `Drive to ${stop.booking.city}`, who: `${stop.driveMiles} mi` }]
            : []),
          ...(stop.hotel ? [{ time: "—", what: `Check in — ${stop.hotel}`, who: stop.hotelConfNo ? `Conf #${stop.hotelConfNo}` : "" }] : []),
        ];

    nextShow = {
      venue: stop.booking.venue,
      city: stop.booking.city,
      dateLabel: fmtDateUTC(stop.booking.date, { weekday: "short", month: "short", day: "numeric" }).toUpperCase(),
      daysUntil,
      isToday,
      loadIn: findTime(daySchedule, "load-in"),
      doors: findTime(daySchedule, "doors"),
      set: findTime(daySchedule, "set"),
      driveMiles: stop.driveMiles,
      hotel: stop.hotel,
      hotelConfNo: stop.hotelConfNo,
      schedule,
    };
  }

  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayEnd = new Date(dayStart.getTime() + 86400000);

  const [todaysExpenses, allExpenses] = await Promise.all([
    db.transaction.aggregate({
      where: { workspaceId: workspace.id, kind: "expense", category: "Tour expenses", occurredAt: { gte: dayStart, lt: dayEnd } },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: { workspaceId: workspace.id, kind: "expense", category: "Tour expenses" },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const perDiemTotal = stop?.perDiemCents ?? 4500;
  const perDiemLeft = Math.max(0, perDiemTotal - (todaysExpenses._sum.amount ?? 0));

  return (
    <MobileDayView
      todayLabel={fmtDateUTC(now, { weekday: "short", month: "short", day: "numeric" }).toUpperCase()}
      nextShow={nextShow}
      perDiemLeft={perDiemLeft}
      perDiemTotal={perDiemTotal}
      tourExpensesTotal={allExpenses._sum.amount ?? 0}
      receiptCount={allExpenses._count}
    />
  );
}

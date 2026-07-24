import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { requireWorkspace } from "@/lib/workspace";
import { db } from "@/lib/db";
import { money, calendarDay } from "@/lib/format";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string }>;
}) {
  const { workspace } = await requireWorkspace();
  const { y, m } = await searchParams;

  const now = new Date();
  const anchor = y && m ? new Date(Number(y), Number(m) - 1, 1) : new Date(now.getFullYear(), now.getMonth(), 1);

  const gridStart = startOfWeek(startOfMonth(anchor));
  const gridEnd = endOfWeek(endOfMonth(anchor));
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  // Pad by a day on each side: booking dates are stored at UTC midnight, so
  // in negative-offset timezones a local grid boundary can fall a few hours
  // after that UTC instant and miss the row without this padding.
  const bookings = await db.booking.findMany({
    where: {
      workspaceId: workspace.id,
      date: { gte: new Date(gridStart.getTime() - 86400000), lte: new Date(gridEnd.getTime() + 86400000) },
    },
    orderBy: { date: "asc" },
  });

  const byDay = new Map<string, typeof bookings>();
  for (const b of bookings) {
    const key = format(calendarDay(b.date), "yyyy-MM-dd");
    byDay.set(key, [...(byDay.get(key) ?? []), b]);
  }

  const prev = subMonths(anchor, 1);
  const next = addMonths(anchor, 1);

  return (
    <div className="max-w-[1150px] px-8 py-7">
      <div className="mb-1 flex items-baseline justify-between">
        <h1 className="text-[26px] tracking-[-.02em]">Calendar</h1>
        <div className="flex items-center gap-3">
          <Link href={`/app/calendar?y=${prev.getFullYear()}&m=${prev.getMonth() + 1}`} className="rounded-lg border border-border px-2.5 py-1 text-[13px] text-white/70 hover:border-white/25">
            ←
          </Link>
          <div className="w-[140px] text-center text-[14px] font-semibold">{format(anchor, "MMMM yyyy")}</div>
          <Link href={`/app/calendar?y=${next.getFullYear()}&m=${next.getMonth() + 1}`} className="rounded-lg border border-border px-2.5 py-1 text-[13px] text-white/70 hover:border-white/25">
            →
          </Link>
        </div>
      </div>
      <div className="mb-5 text-[13px] text-white/50">Every booking on your calendar, in one grid.</div>

      <div className="overflow-hidden rounded-card border border-border bg-surface">
        <div className="grid grid-cols-7 border-b border-border">
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
            <div key={d} className="px-3 py-2 font-mono text-[10.5px] tracking-[.1em] text-white/40">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayBookings = byDay.get(key) ?? [];
            const inMonth = isSameMonth(day, anchor);
            return (
              <div
                key={key}
                className="min-h-[104px] border-b border-r border-white/[.05] p-2 last:border-r-0"
                style={{ background: isToday(day) ? "rgba(63,232,122,.05)" : "transparent" }}
              >
                <div className="mb-1.5 font-mono text-[11px]" style={{ color: inMonth ? (isToday(day) ? "#3fe87a" : "rgba(233,236,232,.6)") : "rgba(233,236,232,.2)" }}>
                  {format(day, "d")}
                </div>
                <div className="flex flex-col gap-1">
                  {dayBookings.map((b) => (
                    <Link
                      key={b.id}
                      href="/app/bookings"
                      className="block truncate rounded-[6px] bg-accent-soft px-1.5 py-0.5 text-[10.5px] text-accent hover:bg-accent/20"
                      title={`${b.venue} — ${money(b.fee)}`}
                    >
                      {b.venue}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

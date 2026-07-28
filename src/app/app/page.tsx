import { requireWorkspace } from "@/lib/workspace";
import { db } from "@/lib/db";
import { money, fmtDateUTC } from "@/lib/format";
import { TaskList } from "@/components/task-list";

export default async function DashboardPage() {
  const { user, workspace } = await requireWorkspace();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [upcomingShows, tasks, contactsCount, monthIncome, outstandingBookings, pastMonthIncome] = await Promise.all([
    db.booking.findMany({ where: { workspaceId: workspace.id, date: { gte: now } }, orderBy: { date: "asc" }, take: 5 }),
    db.task.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: "asc" } }),
    db.contact.count({ where: { workspaceId: workspace.id } }),
    db.transaction.aggregate({
      where: { workspaceId: workspace.id, kind: "income", occurredAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
    db.booking.findMany({ where: { workspaceId: workspace.id, stage: "Confirmed" } }),
    db.transaction.aggregate({
      where: {
        workspaceId: workspace.id,
        kind: "income",
        occurredAt: { gte: new Date(now.getFullYear(), now.getMonth() - 1, 1), lt: monthStart },
      },
      _sum: { amount: true },
    }),
  ]);

  const outstandingTotal = outstandingBookings.reduce((a, b) => a + b.fee, 0);
  const thisMonth = monthIncome._sum.amount ?? 0;
  const lastMonth = pastMonthIncome._sum.amount ?? 0;
  const revenueDelta = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;

  const nextShow = upcomingShows[0];
  const daysToNext = nextShow ? Math.max(0, Math.ceil((nextShow.date.getTime() - now.getTime()) / 86400000)) : null;

  const stats = [
    {
      label: "REVENUE · THIS MONTH",
      value: money(thisMonth),
      delta: revenueDelta === null ? "No data last month" : `${revenueDelta >= 0 ? "▲" : "▼"} ${Math.abs(revenueDelta)}% vs last mo.`,
      color: revenueDelta === null || revenueDelta >= 0 ? "text-accent" : "text-orange",
    },
    {
      label: "UPCOMING SHOWS",
      value: String(upcomingShows.length),
      delta: `${outstandingBookings.length} confirmed, unpaid`,
      color: "text-text/50",
    },
    { label: "OUTSTANDING", value: money(outstandingTotal), delta: `${outstandingBookings.length} confirmed bookings`, color: "text-orange" },
    { label: "CONTACTS", value: String(contactsCount), delta: "in your CRM", color: "text-text/50" },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5 sm:px-8 sm:py-7">
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h1 className="text-[22px] tracking-[-.02em] sm:text-[26px]">Good morning, {user.name.split(" ")[0]}</h1>
        <div className="font-mono text-[12px] text-text/45">
          {now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
        </div>
      </div>
      <div className="mb-[22px] text-[14px] text-text/55">
        {workspace.name} · {upcomingShows.length} shows upcoming
        {nextShow ? ` · next show in ${daysToNext} day${daysToNext === 1 ? "" : "s"}` : ""}
      </div>

      <div className="mb-[22px] flex items-center gap-3 rounded-[10px] border border-accent/25 bg-accent-soft px-4 py-3">
        <span className="h-2 w-2 flex-none rounded-full bg-accent animate-tp-pulse" />
        <div className="text-[13.5px]">
          <strong className="text-accent">Roadie AI:</strong> Available on the Touring plan — draft follow-ups, summarize contracts and
          forecast restocks straight from your pipeline.
        </div>
      </div>

      <div className="mb-[22px] grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-card border border-border bg-surface px-[18px] py-4">
            <div className="mb-2 font-mono text-[10.5px] tracking-[.1em] text-text/45">{s.label}</div>
            <div className="text-[24px] font-bold tracking-[-.02em]">{s.value}</div>
            <div className={`mt-1 text-[11.5px] ${s.color}`}>{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-card border border-border bg-surface px-5 py-[18px]">
          <div className="mb-3.5 flex items-center justify-between">
            <div className="text-[14.5px] font-semibold">Upcoming shows</div>
            <a href="/app/bookings" className="text-[12px] text-accent">
              Bookings →
            </a>
          </div>
          <div className="flex flex-col gap-0.5">
            {upcomingShows.length === 0 && <div className="py-6 text-center text-[13px] text-text/40">No upcoming shows yet.</div>}
            {upcomingShows.map((sh) => {
              const advanced = sh.stage === "Confirmed" || sh.stage === "Paid";
              return (
                <div key={sh.id} className="flex items-center gap-3.5 rounded-lg px-2.5 py-2.5 hover:bg-text/[.04]">
                  <div className="w-11 flex-none text-center">
                    <div className="font-mono text-[10px] text-text/45">{fmtDateUTC(sh.date, { month: "short" }).toUpperCase()}</div>
                    <div className="text-[18px] font-bold">{sh.date.getUTCDate()}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-semibold">{sh.venue}</div>
                    <div className="text-[12px] text-text/50">{sh.city}</div>
                  </div>
                  <div className="font-mono text-[12px] text-accent">{money(sh.fee)}</div>
                  <div
                    className="rounded-full px-2 py-[3px] font-mono text-[10.5px]"
                    style={{
                      background: advanced ? "rgba(63,232,122,.12)" : "rgba(232,228,63,.1)",
                      color: advanced ? "#3fe87a" : "#e8e43f",
                    }}
                  >
                    {advanced ? "ADVANCED" : "PENDING"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="rounded-card border border-border bg-surface px-5 py-[18px]">
            <div className="mb-3 text-[14.5px] font-semibold">Tasks</div>
            <TaskList tasks={tasks} />
          </div>
        </div>
      </div>
    </div>
  );
}

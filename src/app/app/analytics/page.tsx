import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { requireWorkspace } from "@/lib/workspace";
import { db } from "@/lib/db";
import { money } from "@/lib/format";

const CONFIRMED_STAGES = ["Confirmed", "Paid"] as const;
const OFFER_STAGES = ["Negotiating", "Offer_Sent", "Confirmed", "Paid"] as const;

export default async function AnalyticsPage() {
  const { workspace } = await requireWorkspace();
  const now = new Date();
  const rangeStart = startOfMonth(subMonths(now, 11));

  const [bookings, transactions, fanCount] = await Promise.all([
    db.booking.findMany({ where: { workspaceId: workspace.id } }),
    db.transaction.findMany({ where: { workspaceId: workspace.id, occurredAt: { gte: rangeStart } } }),
    db.fan.count({ where: { workspaceId: workspace.id } }),
  ]);

  const income = transactions.filter((t) => t.kind === "income");
  const expense = transactions.filter((t) => t.kind === "expense");
  const netTotal = income.reduce((a, t) => a + t.amount, 0) - expense.reduce((a, t) => a + t.amount, 0);

  const confirmedBookings = bookings.filter((b) => (CONFIRMED_STAGES as readonly string[]).includes(b.stage));
  const avgGuarantee = confirmedBookings.length ? Math.round(confirmedBookings.reduce((a, b) => a + b.fee, 0) / confirmedBookings.length) : 0;

  const months = Array.from({ length: 12 }, (_, i) => startOfMonth(subMonths(now, 11 - i)));
  const monthlyBars = months.map((m) => {
    const end = endOfMonth(m);
    const inMonth = income.filter((t) => t.occurredAt >= m && t.occurredAt <= end);
    const performance = inMonth.filter((t) => t.category === "Performance fees").reduce((a, t) => a + t.amount, 0);
    const merch = inMonth.filter((t) => t.category === "Merchandise").reduce((a, t) => a + t.amount, 0);
    return { label: format(m, "MMM"), performance, merch };
  });
  const maxMonthly = Math.max(...monthlyBars.map((b) => b.performance + b.merch), 1);

  const cityTotals = new Map<string, number>();
  for (const b of bookings) cityTotals.set(b.city, (cityTotals.get(b.city) ?? 0) + b.fee);
  const bestCities = [...cityTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const funnel = [
    { label: "Outreach sent", n: bookings.length },
    { label: "Replied", n: bookings.filter((b) => b.stage !== "Lead").length },
    { label: "Offer received", n: bookings.filter((b) => (OFFER_STAGES as readonly string[]).includes(b.stage)).length },
    { label: "Confirmed", n: confirmedBookings.length },
  ];
  const funnelMax = funnel[0]?.n || 1;
  const funnelColors = ["rgba(233,236,232,.25)", "#7ab8e8", "#e8e43f", "#3fe87a"];

  const stats = [
    { label: "NET · 12 MO", value: money(netTotal), delta: `${income.length + expense.length} transactions logged`, color: netTotal >= 0 ? "text-accent" : "text-orange" },
    { label: "SHOWS CONFIRMED", value: String(confirmedBookings.length), delta: `of ${bookings.length} in pipeline`, color: "text-white/50" },
    { label: "AVG GUARANTEE", value: money(avgGuarantee), delta: "confirmed + paid bookings", color: "text-white/50" },
    { label: "FANS TRACKED", value: String(fanCount), delta: "in your CRM", color: "text-white/50" },
  ];

  return (
    <div className="max-w-[1150px] px-4 py-5 sm:px-8 sm:py-7">
      <h1 className="mb-1 text-[22px] tracking-[-.02em] sm:text-[26px]">Analytics</h1>
      <div className="mb-5 text-[13px] text-white/50">Last 12 months across shows, merch and audience.</div>

      <div className="mb-[18px] grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-card border border-border bg-surface px-[18px] py-4">
            <div className="mb-2 font-mono text-[10.5px] tracking-[.1em] text-white/45">{s.label}</div>
            <div className="text-[24px] font-bold tracking-[-.02em]">{s.value}</div>
            <div className={`mt-1 text-[11.5px] ${s.color}`}>{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-3.5 lg:grid-cols-[1.5fr_1fr]">
        <div className="overflow-hidden rounded-card border border-border bg-surface px-5 py-[18px]">
          <div className="mb-4 text-[14.5px] font-semibold">Monthly revenue</div>
          <div className="flex h-[150px] items-end gap-1 sm:gap-2">
            {monthlyBars.map((b, i) => (
              <div key={i} className="flex h-full flex-1 flex-col justify-end gap-0.5">
                <div className="rounded-t-[3px]" style={{ background: i === 11 ? "#3fe87a" : "rgba(63,232,122,.35)", height: `${Math.round((b.performance / maxMonthly) * 100)}%` }} />
                <div className="rounded-b-[2px]" style={{ background: "rgba(232,228,63,.35)", height: `${Math.round((b.merch / maxMonthly) * 100)}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between font-mono text-[10px] text-white/40">
            <span>{monthlyBars[0]?.label}</span>
            <span>{monthlyBars[monthlyBars.length - 1]?.label}</span>
          </div>
          <div className="mt-3 flex gap-4 text-[11.5px] text-white/55">
            <span>
              <span className="mr-1.5 inline-block h-[9px] w-[9px] rounded-[2px] bg-accent" />
              Performance
            </span>
            <span>
              <span className="mr-1.5 inline-block h-[9px] w-[9px] rounded-[2px]" style={{ background: "rgba(232,228,63,.6)" }} />
              Merch
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="rounded-card border border-border bg-surface px-5 py-[18px]">
            <div className="mb-3 text-[14.5px] font-semibold">Best cities</div>
            {bestCities.length === 0 && <div className="text-[13px] text-white/40">No bookings yet.</div>}
            {bestCities.map(([city, total], i) => (
              <div key={city} className="flex items-center gap-2.5 py-1.5">
                <span className="w-4 font-mono text-[11px] text-white/35">{i + 1}</span>
                <span className="flex-1 text-[13px]">{city}</span>
                <span className="font-mono text-[12px] text-accent">{money(total)}</span>
              </div>
            ))}
          </div>
          <div className="rounded-card border border-border bg-surface px-5 py-[18px]">
            <div className="mb-3 text-[14.5px] font-semibold">Booking funnel</div>
            {funnel.map((f, i) => (
              <div key={f.label} className="mb-2.5">
                <div className="mb-1 flex justify-between text-[11.5px]">
                  <span className="text-white/65">{f.label}</span>
                  <span className="font-mono text-white/50">{f.n}</span>
                </div>
                <div className="h-[7px] rounded-full bg-white/[.06]">
                  <div className="h-[7px] rounded-full" style={{ width: `${Math.round((f.n / funnelMax) * 100)}%`, background: funnelColors[i] }} />
                </div>
              </div>
            ))}
            <div className="mt-1 text-[11.5px] text-white/50">
              {funnelMax ? Math.round((funnel[3].n / funnelMax) * 100) : 0}% outreach → confirmed
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

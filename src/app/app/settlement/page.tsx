import Link from "next/link";
import { redirect } from "next/navigation";
import { requireWorkspace } from "@/lib/workspace";
import { db } from "@/lib/db";
import { planAtLeast } from "@/lib/plan-limits";
import { money, fmtDateUTC } from "@/lib/format";
import { computeTourSettlement, forecastTour, allocateSplits, type BookingLike } from "@/lib/settlement";

export const dynamic = "force-dynamic";

// Tour settlement: what a run of shows actually earned, per night and in
// total. The gap this closes is that booking data and money data never met —
// a venue fee lived on a Booking, the costs lived in Transactions, and
// nothing joined them, so "did this tour make money" was a spreadsheet
// question. Everything here is computed in lib/settlement.ts.

export default async function SettlementPage() {
  const { workspace } = await requireWorkspace();
  if (!planAtLeast(workspace.plan, "pro")) redirect("/app/billing?locked=settlement");

  const tour = await db.tour.findFirst({
    where: { workspaceId: workspace.id },
    orderBy: { startDate: "desc" },
    include: { stops: { include: { booking: true }, orderBy: { seq: "asc" } } },
  });

  if (!tour) {
    return (
      <div className="mx-auto max-w-[1100px] px-4 py-5 sm:px-8 sm:py-7">
        <h1 className="mb-1 text-[22px] tracking-[-.02em] sm:text-[26px]">Settlement</h1>
        <div className="mb-6 text-[13px] text-text/50">Per-show profit for a tour, once there is a tour to settle.</div>
        <div className="rounded-card border border-border bg-surface px-5 py-10 text-center">
          <div className="mb-1.5 text-[14px] font-semibold">No tour yet</div>
          <div className="mx-auto mb-5 max-w-[420px] text-[13px] leading-relaxed text-text/50">
            Settlement works a tour at a time — it groups your shows, matches each night&rsquo;s costs against what it
            brought in, and tells you which legs paid for themselves.
          </div>
          <Link href="/app/tour" className="inline-block rounded-lg bg-accent px-4 py-2 text-[12.5px] font-semibold text-ink">
            Plan a tour
          </Link>
        </div>
      </div>
    );
  }

  const bookings: BookingLike[] = tour.stops
    .map((s) => s.booking)
    .filter((b): b is NonNullable<typeof b> => b !== null)
    .map((b) => ({
      id: b.id,
      venue: b.venue,
      city: b.city,
      date: b.date,
      stage: b.stage,
      fee: b.fee,
      merchCutBps: b.merchCutBps,
      feeTransactionId: b.feeTransactionId,
    }));

  // Everything inside the tour's dates. Transactions tagged to one of these
  // shows land on that show; the rest become the unallocated bucket rather
  // than being dropped from the total.
  const windowTransactions = await db.transaction.findMany({
    where: { workspaceId: workspace.id, occurredAt: { gte: tour.startDate, lte: tour.endDate } },
    orderBy: { occurredAt: "desc" },
  });

  const settlement = computeTourSettlement(
    bookings,
    windowTransactions.map((t) => ({ id: t.id, kind: t.kind, category: t.category, amount: t.amount, bookingId: t.bookingId }))
  );
  const forecast = forecastTour(settlement);

  const splits = await db.split.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: "asc" } });
  const allocation = allocateSplits(Math.max(0, settlement.net), splits);

  const ranked = [...settlement.shows].sort((a, b) => b.net - a.net);
  const best = ranked[0];
  const worst = ranked[ranked.length - 1];

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-5 sm:px-8 sm:py-7">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-[22px] tracking-[-.02em] sm:text-[26px]">{tour.name}</h1>
        <Link href="/app/settlement/splits" className="text-[12.5px] text-accent hover:underline">
          Payment splits →
        </Link>
      </div>
      <div className="mb-[18px] text-[13px] text-text/50">
        {bookings.length} show{bookings.length === 1 ? "" : "s"} · {fmtDateUTC(tour.startDate, { month: "short", day: "numeric" })} –{" "}
        {fmtDateUTC(tour.endDate, { month: "short", day: "numeric", year: "numeric" })}
      </div>

      <div className="mb-3.5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <Stat label="Money in" value={money(settlement.totalIncome)} />
        <Stat label="Money out" value={money(settlement.totalExpenses)} tone="orange" />
        <Stat label="Net" value={money(settlement.net)} tone={settlement.net >= 0 ? "accent" : "pink"} />
        <Stat
          label="Still owed"
          value={settlement.expectedIncome > 0 ? money(settlement.expectedIncome) : "—"}
          sub={settlement.expectedIncome > 0 ? "guarantees not yet collected" : "every fee collected"}
        />
      </div>

      {settlement.unsettledVenueCuts > 0 && (
        <div className="mb-3.5 rounded-card border border-orange/25 bg-orange/[.06] px-[18px] py-3.5 text-[12.5px] leading-relaxed">
          <span className="font-semibold text-orange">{money(settlement.unsettledVenueCuts)} of venue merch cuts is estimated — </span>
          <span className="text-text/70">
            worked out from each room&rsquo;s percentage, with nothing recorded as actually paid. It is already subtracted above,
            so the net is only as right as those percentages. Open a show to record what the venue really took.
          </span>
        </div>
      )}

      {(settlement.unallocatedIncome > 0 || settlement.unallocatedExpenses > 0) && (
        <div className="mb-3.5 rounded-card border border-yellow/25 bg-yellow-soft px-[18px] py-3.5 text-[12.5px] leading-relaxed">
          <span className="font-semibold text-yellow">Not assigned to a show — </span>
          <span className="text-text/70">
            {settlement.unallocatedExpenses > 0 && <>{money(settlement.unallocatedExpenses)} of costs</>}
            {settlement.unallocatedIncome > 0 && settlement.unallocatedExpenses > 0 && " and "}
            {settlement.unallocatedIncome > 0 && <>{money(settlement.unallocatedIncome)} of income</>}{" "}
            fall inside these dates without belonging to a night. They count in the tour total above, but not in any row below.
            Tag them on a show to see where they land.
          </span>
        </div>
      )}

      <div className="mb-3.5 overflow-x-auto rounded-card border border-border bg-surface">
        <div className="min-w-[620px]">
          <div className="grid grid-cols-[1.6fr_.9fr_.9fr_.9fr_.5fr] gap-2.5 border-b border-border px-[18px] py-[11px] font-mono text-[10.5px] tracking-[.1em] text-text/40">
            <div>SHOW</div>
            <div className="text-right">IN</div>
            <div className="text-right">OUT</div>
            <div className="text-right">NET</div>
            <div />
          </div>
          {settlement.shows.map((s) => {
            const nothingYet = s.totalIncome === 0 && s.totalExpenses === 0;
            return (
              <Link
                key={s.booking.id}
                href={`/app/settlement/show/${s.booking.id}`}
                className="grid grid-cols-[1.6fr_.9fr_.9fr_.9fr_.5fr] items-center gap-2.5 border-b border-text/[.05] px-[18px] py-3 hover:bg-text/[.03]"
              >
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold">{s.booking.city}</div>
                  <div className="truncate text-[11px] text-text/40">
                    {s.booking.venue} · {fmtDateUTC(s.booking.date, { month: "short", day: "numeric" })}
                  </div>
                </div>
                {nothingYet ? (
                  <div className="col-span-3 text-right font-mono text-[12px] text-text/30">
                    {s.expectedFee ? `${money(s.expectedFee)} expected` : "nothing recorded"}
                  </div>
                ) : (
                  <>
                    <div className="text-right font-mono text-[12.5px]">{money(s.totalIncome)}</div>
                    <div className="text-right font-mono text-[12.5px] text-text/55">{money(s.totalExpenses)}</div>
                    <div className={`text-right font-mono text-[12.5px] font-semibold ${s.net >= 0 ? "text-accent" : "text-pink"}`}>
                      {s.net >= 0 ? "+" : ""}
                      {money(s.net)}
                    </div>
                  </>
                )}
                <div className="text-right text-[13px] text-text/25">›</div>
              </Link>
            );
          })}
          {settlement.shows.length === 0 && (
            <div className="px-[18px] py-7 text-center text-[13px] text-text/40">No shows on this tour yet.</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div className="rounded-card border border-border bg-surface px-5 py-[18px]">
          <div className="mb-1 text-[14.5px] font-semibold">Where this lands</div>
          {forecast.projectedNet === null ? (
            <div className="text-[12.5px] leading-relaxed text-text/50">
              Nothing recorded yet. Once a show has real numbers on it, this projects the rest of the tour from what the played
              shows actually did — rather than guessing from the guarantees.
            </div>
          ) : (
            <>
              <div className={`mb-1.5 font-mono text-[26px] font-bold ${forecast.projectedNet >= 0 ? "text-accent" : "text-pink"}`}>
                {money(forecast.projectedNet)}
              </div>
              <div className="text-[12.5px] leading-relaxed text-text/55">
                Projected tour net, from {forecast.basisShows} show{forecast.basisShows === 1 ? "" : "s"} with numbers on{" "}
                {forecast.basisShows === 1 ? "it" : "them"} — averaging {money(forecast.avgNetPerShow ?? 0)} a night across{" "}
                {forecast.remainingShows} still to play.
                {forecast.basisShows < 3 && (
                  <span className="text-text/40"> Thin basis; treat it as a direction, not a number.</span>
                )}
              </div>
            </>
          )}
        </div>

        <div className="rounded-card border border-border bg-surface px-5 py-[18px]">
          <div className="mb-2.5 text-[14.5px] font-semibold">Splits</div>
          {splits.length === 0 ? (
            <div className="text-[12.5px] leading-relaxed text-text/50">
              No one set up yet.{" "}
              <Link href="/app/settlement/splits" className="text-accent hover:underline">
                Decide who gets what
              </Link>{" "}
              and this shows each person&rsquo;s cut of the tour as it earns.
            </div>
          ) : settlement.net <= 0 ? (
            <div className="text-[12.5px] leading-relaxed text-text/50">
              Nothing to split yet — the tour is {money(Math.abs(settlement.net))} down. Shares divide profit, so this fills in
              once the tour clears its costs.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {splits.map((s) => (
                <div key={s.id} className="flex items-baseline justify-between gap-3 text-[12.5px]">
                  <span className="min-w-0 truncate">
                    {s.name}
                    {s.role && <span className="text-text/40"> · {s.role}</span>}
                  </span>
                  <span className="flex-none font-mono font-semibold">{money(allocation.get(s.id) ?? 0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {best && worst && best.booking.id !== worst.booking.id && best.net !== 0 && (
        <div className="mt-3.5 rounded-card border border-border bg-surface px-5 py-[18px] text-[12.5px] leading-relaxed text-text/60">
          <span className="font-semibold text-text">{best.booking.city}</span> is the best night of the run at{" "}
          {money(best.net)}. <span className="font-semibold text-text">{worst.booking.city}</span> is the worst at{" "}
          {money(worst.net)}
          {worst.net < 0 ? " — it costs more than it brings in." : "."}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "accent" | "orange" | "pink" }) {
  const color = tone === "accent" ? "text-accent" : tone === "orange" ? "text-orange" : tone === "pink" ? "text-pink" : "text-text";
  return (
    <div className="rounded-card border border-border bg-surface px-[18px] py-3.5">
      <div className="mb-1.5 font-mono text-[10.5px] tracking-[.1em] text-text/40">{label.toUpperCase()}</div>
      <div className={`font-mono text-[20px] font-bold ${color}`}>{value}</div>
      {sub && <div className="mt-1 text-[11px] text-text/40">{sub}</div>}
    </div>
  );
}

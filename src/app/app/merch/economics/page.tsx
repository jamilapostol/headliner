import Link from "next/link";
import { redirect } from "next/navigation";
import { requireWorkspace } from "@/lib/workspace";
import { db } from "@/lib/db";
import { planAtLeast } from "@/lib/plan-limits";
import { money } from "@/lib/format";
import { itemPerformance, restockAdvice, shrinkage, unitsByShow } from "@/lib/merch-economics";

export const dynamic = "force-dynamic";

// What merch actually earns, per item. Built on MerchSale line items, which
// only started being recorded when the POS learned to write them — so this
// says so rather than presenting a short history as the whole story.

export default async function MerchEconomicsPage() {
  const { workspace } = await requireWorkspace();
  if (!planAtLeast(workspace.plan, "pro")) redirect("/app/billing?locked=merch");

  // Bounded to a rolling year. Line items accumulate for as long as an
  // artist keeps selling, and an all-time query would read every row ever
  // written on each page load. A year is also the more useful window: what
  // sold two tours and a merch redesign ago says little about what to print
  // next. Aligned with the (workspaceId, soldAt) index.
  const since = new Date();
  since.setUTCFullYear(since.getUTCFullYear() - 1);

  const [items, sales, counts, tour] = await Promise.all([
    db.merchItem.findMany({ where: { workspaceId: workspace.id }, orderBy: { name: "asc" } }),
    db.merchSale.findMany({ where: { workspaceId: workspace.id, soldAt: { gte: since } }, orderBy: { soldAt: "asc" } }),
    db.stockCount.findMany({ where: { workspaceId: workspace.id, countedAt: { gte: since } }, orderBy: { countedAt: "desc" } }),
    db.tour.findFirst({
      where: { workspaceId: workspace.id },
      orderBy: { startDate: "desc" },
      include: { stops: { include: { booking: true } } },
    }),
  ]);

  const lines = sales.map((s) => ({
    merchItemId: s.merchItemId,
    bookingId: s.bookingId,
    qty: s.qty,
    unitPrice: s.unitPrice,
    unitCogs: s.unitCogs,
  }));

  const byId = new Map(items.map((i) => [i.id, i]));
  const performance = itemPerformance(lines);
  const perShow = unitsByShow(lines);

  const now = new Date();
  const showsRemaining =
    tour?.stops.filter((s) => s.booking && s.booking.date >= now).length ?? 0;
  const restock = restockAdvice(items, lines, showsRemaining).filter((r) => r.shortfall > 0);

  const loss = shrinkage(counts.map((c) => ({ merchItemId: c.merchItemId, expected: c.expected, counted: c.counted, unitCogs: c.unitCogs })));

  const totalGross = performance.reduce((a, p) => a + p.gross, 0);
  const totalContribution = performance.reduce((a, p) => a + p.contribution, 0);
  const totalUnits = performance.reduce((a, p) => a + p.unitsSold, 0);

  const bestShow = [...perShow.entries()].sort((a, b) => b[1] - a[1])[0];
  const bestShowBooking = bestShow
    ? tour?.stops.find((s) => s.booking?.id === bestShow[0])?.booking ?? null
    : null;

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-5 sm:px-8 sm:py-7">
      <Link href="/app/merch" className="mb-4 inline-block text-[12.5px] text-accent hover:underline">
        ← Merch
      </Link>

      <h1 className="mb-1 text-[22px] tracking-[-.02em] sm:text-[26px]">Merch economics</h1>
      <div className="mb-[18px] text-[13px] text-text/50">
        What each item earns after what it cost to make — before the venue&rsquo;s cut and every other tour expense. Last 12
        months.
      </div>

      {(loss.unitsShort > 0 || loss.unitsOver > 0) && (
        <div className="mb-3.5 rounded-card border border-orange/25 bg-orange/[.06] px-[18px] py-3.5">
          <div className="mb-1.5 text-[13.5px] font-semibold text-orange">
            {loss.unitsShort > 0
              ? `${loss.unitsShort} unit${loss.unitsShort === 1 ? "" : "s"} unaccounted for`
              : `${loss.unitsOver} unit${loss.unitsOver === 1 ? "" : "s"} more than expected`}
          </div>
          <div className="text-[12.5px] leading-relaxed text-text/60">
            {loss.unitsShort > 0 && (
              <>
                Across {counts.length} count{counts.length === 1 ? "" : "s"} — {money(loss.costOfShortfall)} at what they cost to
                make.{" "}
              </>
            )}
            {loss.unitsOver > 0 && loss.unitsShort > 0 && (
              <>
                Separately, {loss.unitsOver} turned up beyond what was expected — usually an earlier miscount or stock added
                without being recorded.{" "}
              </>
            )}
            {loss.unitsOver > 0 && loss.unitsShort === 0 && (
              <>Usually an earlier miscount, or stock added without being recorded. </>
            )}
            Counts are recorded from Merch → Count the van.
          </div>
        </div>
      )}

      {sales.length === 0 ? (
        <div className="rounded-card border border-border bg-surface px-5 py-10 text-center">
          <div className="mb-1.5 text-[14px] font-semibold">Nothing sold through the register yet</div>
          <div className="mx-auto max-w-[440px] text-[13px] leading-relaxed text-text/50">
            This reads the point of sale line by line, so it fills in as you sell. Earlier merch income recorded before the
            register tracked individual items is still in Finance — it just can&rsquo;t be broken down per item here.
          </div>
        </div>
      ) : (
        <>
          <div className="mb-3.5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
            <Stat label="Units sold" value={String(totalUnits)} />
            <Stat label="Gross" value={money(totalGross)} />
            <Stat label="After cost of goods" value={money(totalContribution)} tone="accent" />
            <Stat
              label="Best night"
              value={bestShowBooking ? `${bestShow?.[1] ?? 0} units` : "—"}
              sub={bestShowBooking ? bestShowBooking.city : "no sales tied to a show yet"}
            />
          </div>

          {restock.length > 0 && showsRemaining > 0 && (
            <div className="mb-3.5 rounded-card border border-orange/25 bg-orange/[.06] px-[18px] py-3.5">
              <div className="mb-1.5 text-[13.5px] font-semibold text-orange">
                Runs out before the tour does
              </div>
              <div className="mb-2.5 text-[12.5px] leading-relaxed text-text/60">
                At the rate each has been selling, with {showsRemaining} show{showsRemaining === 1 ? "" : "s"} left.
              </div>
              <div className="flex flex-col gap-1.5">
                {restock.map((r) => (
                  <div key={r.merchItemId} className="flex items-baseline justify-between gap-3 text-[12.5px]">
                    <span className="min-w-0 truncate">{byId.get(r.merchItemId)?.name ?? "Item"}</span>
                    <span className="flex-none font-mono text-text/60">
                      {r.stock} left · {r.perShow}/show ·{" "}
                      <span className="font-semibold text-orange">order {r.shortfall}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-card border border-border bg-surface">
            <div className="min-w-[620px]">
              <div className="grid grid-cols-[1.7fr_.6fr_.9fr_.9fr_.7fr] gap-2.5 border-b border-border px-[18px] py-[11px] font-label text-[10.5px] tracking-[.1em] text-text/40">
                <div>ITEM</div>
                <div className="text-right">UNITS</div>
                <div className="text-right">GROSS</div>
                <div className="text-right">AFTER COGS</div>
                <div className="text-right">MARGIN</div>
              </div>
              {performance.map((p) => {
                const item = byId.get(p.merchItemId);
                return (
                  <div
                    key={p.merchItemId}
                    className="grid grid-cols-[1.7fr_.6fr_.9fr_.9fr_.7fr] items-center gap-2.5 border-b border-text/[.05] px-[18px] py-3 last:border-b-0"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div
                        className="grid h-7 w-7 flex-none place-items-center rounded-[7px] text-[12px] font-bold text-ink"
                        style={{ background: item?.color ?? "#3FCB86" }}
                      >
                        {item?.glyph ?? "M"}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-semibold">{item?.name ?? "Deleted item"}</div>
                        {item?.variant && <div className="truncate text-[11px] text-text/40">{item.variant}</div>}
                      </div>
                    </div>
                    <div className="text-right font-mono text-[12.5px]">{p.unitsSold}</div>
                    <div className="text-right font-mono text-[12.5px]">{money(p.gross)}</div>
                    <div className="text-right font-mono text-[12.5px] font-semibold text-accent">{money(p.contribution)}</div>
                    <div className="text-right font-mono text-[12.5px] text-text/55">
                      {p.marginBps === null ? "—" : `${Math.round(p.marginBps / 100)}%`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3.5 rounded-card border border-border bg-surface px-5 py-[18px] text-[12.5px] leading-relaxed text-text/55">
            <span className="font-semibold text-text">After cost of goods is not profit.</span> The venue&rsquo;s cut of merch
            comes out of this, along with everything else a tour spends — see{" "}
            <Link href="/app/settlement" className="text-accent hover:underline">
              Settlement
            </Link>{" "}
            for what a night actually cleared.
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "accent" }) {
  return (
    <div className="rounded-card border border-border bg-surface px-[18px] py-3.5">
      <div className="mb-1.5 font-label text-[10.5px] tracking-[.1em] text-text/40">{label.toUpperCase()}</div>
      <div className={`font-mono text-[20px] font-bold ${tone === "accent" ? "text-accent" : "text-text"}`}>{value}</div>
      {sub && <div className="mt-1 truncate text-[11px] text-text/40">{sub}</div>}
    </div>
  );
}

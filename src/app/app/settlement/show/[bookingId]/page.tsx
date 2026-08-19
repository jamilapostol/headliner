import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireWorkspace } from "@/lib/workspace";
import { db } from "@/lib/db";
import { planAtLeast } from "@/lib/plan-limits";
import { money, fmtDateUTC, stageLabel } from "@/lib/format";
import { computeShowPnl } from "@/lib/settlement";
import { ShowSettlementControls } from "@/components/show-settlement-controls";

export const dynamic = "force-dynamic";

// One night's P&L. Income and costs both come from Transactions tagged to
// this booking; the venue's merch cut is the one derived line, and it is
// labelled as derived because no receipt backs it.

export default async function ShowSettlementPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const { workspace } = await requireWorkspace();
  if (!planAtLeast(workspace.plan, "pro")) redirect("/app/billing?locked=settlement");

  const booking = await db.booking.findFirst({ where: { id: bookingId, workspaceId: workspace.id } });
  if (!booking) notFound();

  const tagged = await db.transaction.findMany({ where: { workspaceId: workspace.id, bookingId }, orderBy: { occurredAt: "asc" } });

  // Candidates to attribute: anything untagged within a few days of the
  // show. A wider net would list a whole tour's transactions on every
  // night, which is how a tagging UI becomes one nobody uses.
  const near = new Date(booking.date);
  const from = new Date(near.getTime() - 3 * 86_400_000);
  const to = new Date(near.getTime() + 3 * 86_400_000);
  const untagged = await db.transaction.findMany({
    where: { workspaceId: workspace.id, bookingId: null, occurredAt: { gte: from, lte: to } },
    orderBy: { occurredAt: "asc" },
    take: 25,
  });

  const pnl = computeShowPnl(
    {
      id: booking.id,
      venue: booking.venue,
      city: booking.city,
      date: booking.date,
      stage: booking.stage,
      fee: booking.fee,
      merchCutBps: booking.merchCutBps,
      feeTransactionId: booking.feeTransactionId,
    },
    tagged.map((t) => ({ id: t.id, kind: t.kind, category: t.category, amount: t.amount, bookingId: t.bookingId }))
  );

  return (
    <div className="mx-auto max-w-[900px] px-4 py-5 sm:px-8 sm:py-7">
      <Link href="/app/settlement" className="mb-4 inline-block text-[12.5px] text-accent hover:underline">
        ← Settlement
      </Link>

      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-[22px] tracking-[-.02em] sm:text-[26px]">{booking.city}</h1>
        <div className={`font-mono text-[20px] font-bold ${pnl.net >= 0 ? "text-accent" : "text-pink"}`}>
          {pnl.net >= 0 ? "+" : ""}
          {money(pnl.net)}
        </div>
      </div>
      <div className="mb-[18px] text-[13px] text-text/50">
        {booking.venue} · {fmtDateUTC(booking.date, { weekday: "short", month: "short", day: "numeric", year: "numeric" })} ·{" "}
        {stageLabel(booking.stage)}
      </div>

      {pnl.expectedFee !== null && (
        <div className="mb-3.5 rounded-card border border-yellow/25 bg-yellow-soft px-[18px] py-3.5 text-[12.5px] leading-relaxed">
          <span className="font-semibold text-yellow">{money(pnl.expectedFee)} guarantee not collected yet. </span>
          <span className="text-text/70">
            It stays out of the numbers below until it lands — marking this booking paid logs it and it appears here.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <Ledger title="In" lines={pnl.income} total={pnl.totalIncome} empty="Nothing recorded as income for this night." />
        <Ledger
          title="Out"
          lines={pnl.expenses}
          total={pnl.totalExpenses}
          empty="No costs recorded against this night."
          tone="orange"
        />
      </div>

      <ShowSettlementControls
        bookingId={booking.id}
        merchCutPct={booking.merchCutBps / 100}
        timezone={booking.timezone}
        merchGross={pnl.merchGross}
        venueMerchCutOwed={pnl.venueMerchCutOwed}
        venueMerchCutSettled={pnl.venueMerchCutSettled}
        venueMerchCutVariance={pnl.venueMerchCutVariance}
        tagged={tagged.map((t) => ({
          id: t.id,
          kind: t.kind,
          category: t.category,
          amount: t.amount,
          source: t.source,
          occurredAt: fmtDateUTC(t.occurredAt, { month: "short", day: "numeric" }),
        }))}
        untagged={untagged.map((t) => ({
          id: t.id,
          kind: t.kind,
          category: t.category,
          amount: t.amount,
          source: t.source,
          occurredAt: fmtDateUTC(t.occurredAt, { month: "short", day: "numeric" }),
        }))}
      />
    </div>
  );
}

function Ledger({
  title,
  lines,
  total,
  empty,
  tone,
}: {
  title: string;
  lines: Array<{ label: string; cents: number; computed?: boolean }>;
  total: number;
  empty: string;
  tone?: "orange";
}) {
  return (
    <div className="rounded-card border border-border bg-surface px-5 py-[18px]">
      <div className="mb-3.5 font-mono text-[10.5px] tracking-[.1em] text-text/40">{title.toUpperCase()}</div>
      {lines.length === 0 ? (
        <div className="py-2 text-[12.5px] text-text/40">{empty}</div>
      ) : (
        <div className="flex flex-col">
          {lines.map((l) => (
            <div key={l.label} className="flex items-baseline justify-between gap-3 border-b border-text/[.05] py-2.5 text-[12.5px]">
              <span className="min-w-0 text-text/70">
                {l.label}
                {l.computed && (
                  <span
                    className="ml-1.5 rounded-full bg-text/[.07] px-1.5 py-[1px] font-mono text-[9.5px] text-text/45"
                    title="Worked out from the venue's cut — not a transaction you recorded"
                  >
                    DERIVED
                  </span>
                )}
              </span>
              <span className="flex-none font-mono font-semibold">{money(l.cents)}</span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-border pt-3 text-[13px] font-bold">
        <span>Total</span>
        <span className={`font-mono ${tone === "orange" ? "text-orange" : ""}`}>{money(total)}</span>
      </div>
    </div>
  );
}

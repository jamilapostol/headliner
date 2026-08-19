import Link from "next/link";
import { redirect } from "next/navigation";
import { requireWorkspace } from "@/lib/workspace";
import { db } from "@/lib/db";
import { planAtLeast } from "@/lib/plan-limits";
import { computeTourSettlement, allocateSplits, payoutStatus, totalShareBps, type BookingLike } from "@/lib/settlement";
import { fmtDateUTC } from "@/lib/format";
import { SplitsEditor } from "@/components/splits-editor";

export const dynamic = "force-dynamic";

// Who gets what share of tour profit. Shares are stored in basis points and
// allocated with largest-remainder (lib/settlement.ts) so the rows always
// add up to the total exactly — a payout screen that is a cent off is a
// payout screen someone has to reconcile by hand.

export default async function SplitsPage() {
  const { workspace } = await requireWorkspace();
  if (!planAtLeast(workspace.plan, "pro")) redirect("/app/billing?locked=settlement");

  const [splits, payouts, tour] = await Promise.all([
    db.split.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: "asc" } }),
    db.payout.findMany({ where: { workspaceId: workspace.id }, orderBy: { paidAt: "desc" } }),
    db.tour.findFirst({
      where: { workspaceId: workspace.id },
      orderBy: { startDate: "desc" },
      include: { stops: { include: { booking: true }, orderBy: { seq: "asc" } } },
    }),
  ]);

  // Live pool: the current tour's net, so the percentages resolve to real
  // money instead of abstractions nobody can sanity-check.
  let poolNet = 0;
  let poolLabel = "No tour to settle yet";
  if (tour) {
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

    const windowTransactions = await db.transaction.findMany({
      where: { workspaceId: workspace.id, occurredAt: { gte: tour.startDate, lte: tour.endDate } },
    });

    const filtered = workspace.splitsIncludeMerch
      ? windowTransactions
      : windowTransactions.filter((t) => !(t.kind === "income" && t.category === "Merchandise"));

    poolNet = computeTourSettlement(
      bookings,
      filtered.map((t) => ({ id: t.id, kind: t.kind, category: t.category, amount: t.amount, bookingId: t.bookingId }))
    ).net;
    poolLabel = tour.name;
  }

  const allocation = allocateSplits(Math.max(0, poolNet), splits);

  return (
    <div className="mx-auto max-w-[820px] px-4 py-5 sm:px-8 sm:py-7">
      <Link href="/app/settlement" className="mb-4 inline-block text-[12.5px] text-accent hover:underline">
        ← Settlement
      </Link>

      <h1 className="mb-1 text-[22px] tracking-[-.02em] sm:text-[26px]">Payment splits</h1>
      <div className="mb-[18px] text-[13px] text-text/50">
        Who gets what share of tour profit, once the tour has covered its costs.
      </div>

      <SplitsEditor
        splits={splits.map((s) => {
          const mine = payouts.filter((p) => p.splitId === s.id);
          const status = payoutStatus(allocation.get(s.id) ?? 0, mine);
          return {
            id: s.id,
            name: s.name,
            role: s.role,
            sharePct: s.shareBps / 100,
            amountCents: status.allocated,
            paidCents: status.paid,
            outstandingCents: status.outstanding,
            overpaidByCents: status.overpaidBy,
            payouts: mine.map((p) => ({
              id: p.id,
              amount: p.amount,
              method: p.method,
              paidAt: fmtDateUTC(p.paidAt, { month: "short", day: "numeric" }),
            })),
          };
        })}
        totalPct={totalShareBps(splits) / 100}
        poolNet={poolNet}
        poolLabel={poolLabel}
        includeMerch={workspace.splitsIncludeMerch}
        tourId={tour?.id ?? null}
      />
    </div>
  );
}

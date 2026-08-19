// Per-show and per-tour profit math, shared by the settlement screens and
// their tests. Pure functions over plain data — no Prisma client, no
// session — so the arithmetic can be tested directly rather than through a
// database.
//
// Everything is integer cents and integer basis points. Money that has been
// rounded twice is money that no longer reconciles, and a settlement screen
// whose columns don't add up is worse than no screen at all.

export const BPS = 10_000;

export type TxnLike = {
  id: string;
  kind: "income" | "expense";
  category: string;
  amount: number;
  bookingId: string | null;
};

export type BookingLike = {
  id: string;
  venue: string;
  city: string;
  date: Date;
  stage: string;
  fee: number;
  merchCutBps: number;
  /** Set once the fee has been auto-logged as a Transaction — see below. */
  feeTransactionId: string | null;
};

export type PnlLine = {
  label: string;
  cents: number;
  /** True when this line is derived rather than read from a recorded
   *  transaction, so the UI can mark it instead of implying it was booked. */
  computed?: boolean;
};

export type ShowPnl = {
  booking: BookingLike;
  income: PnlLine[];
  expenses: PnlLine[];
  totalIncome: number;
  totalExpenses: number;
  net: number;
  merchGross: number;
  venueMerchCut: number;
  /** The guarantee when it has NOT yet been collected. Kept out of income
   *  on purpose: a fee that hasn't landed is a receivable, and counting it
   *  as profit is how a tour looks solvent right up until it isn't. */
  expectedFee: number | null;
};

/**
 * One show's realized profit.
 *
 * The fee is the trap here. Moving a booking to "Paid" already writes a
 * Transaction for the guarantee (see updateBookingStage), so adding
 * `booking.fee` on top of that transaction double-counts every paid show.
 * `feeTransactionId` is the discriminator: when it is set the fee is
 * already present among `transactions` and must not be added again; when
 * it is null the money has not arrived and belongs in `expectedFee`.
 *
 * `transactions` must already be scoped to this booking by the caller.
 */
export function computeShowPnl(booking: BookingLike, transactions: readonly TxnLike[]): ShowPnl {
  const byCategory = (kind: "income" | "expense"): PnlLine[] => {
    const totals = new Map<string, number>();
    for (const t of transactions) {
      if (t.kind !== kind) continue;
      totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
    }
    return [...totals.entries()]
      .map(([label, cents]) => ({ label, cents }))
      .sort((a, b) => b.cents - a.cents);
  };

  const income = byCategory("income");
  const expenses = byCategory("expense");

  const merchGross = transactions
    .filter((t) => t.kind === "income" && t.category === "Merchandise")
    .reduce((sum, t) => sum + t.amount, 0);

  // The venue's cut comes off the top at the merch table — the artist is
  // handed the remainder and usually never records the difference. It is
  // computed here and flagged as such, because the whole point of showing
  // it is that it is money leaving without a receipt.
  const venueMerchCut = Math.round((merchGross * booking.merchCutBps) / BPS);
  if (venueMerchCut > 0) {
    expenses.push({ label: "Venue merch cut", cents: venueMerchCut, computed: true });
  }

  const totalIncome = income.reduce((sum, l) => sum + l.cents, 0);
  const totalExpenses = expenses.reduce((sum, l) => sum + l.cents, 0);

  return {
    booking,
    income,
    expenses,
    totalIncome,
    totalExpenses,
    net: totalIncome - totalExpenses,
    merchGross,
    venueMerchCut,
    expectedFee: booking.feeTransactionId ? null : booking.fee > 0 ? booking.fee : null,
  };
}

export type TourSettlement = {
  shows: ShowPnl[];
  totalIncome: number;
  totalExpenses: number;
  net: number;
  /** Income and expenses inside the tour window that no show claims.
   *  Surfaced rather than dropped: a van repair belongs to the tour even
   *  though it belongs to no single night, and silently excluding it would
   *  overstate profit. */
  unallocatedIncome: number;
  unallocatedExpenses: number;
  expectedIncome: number;
  showsPlayed: number;
  showsRemaining: number;
};

/**
 * Roll every show in a tour into one settlement.
 *
 * `windowTransactions` is everything in the tour's date range; whatever
 * carries no bookingId (or points outside this tour) lands in the
 * unallocated buckets rather than vanishing.
 */
export function computeTourSettlement(
  bookings: readonly BookingLike[],
  windowTransactions: readonly TxnLike[],
  now: Date = new Date()
): TourSettlement {
  const bookingIds = new Set(bookings.map((b) => b.id));

  const shows = bookings.map((booking) =>
    computeShowPnl(
      booking,
      windowTransactions.filter((t) => t.bookingId === booking.id)
    )
  );

  const orphan = windowTransactions.filter((t) => !t.bookingId || !bookingIds.has(t.bookingId));
  const unallocatedIncome = orphan.filter((t) => t.kind === "income").reduce((s, t) => s + t.amount, 0);
  const unallocatedExpenses = orphan.filter((t) => t.kind === "expense").reduce((s, t) => s + t.amount, 0);

  const totalIncome = shows.reduce((s, x) => s + x.totalIncome, 0) + unallocatedIncome;
  const totalExpenses = shows.reduce((s, x) => s + x.totalExpenses, 0) + unallocatedExpenses;

  return {
    shows,
    totalIncome,
    totalExpenses,
    net: totalIncome - totalExpenses,
    unallocatedIncome,
    unallocatedExpenses,
    expectedIncome: shows.reduce((s, x) => s + (x.expectedFee ?? 0), 0),
    showsPlayed: bookings.filter((b) => b.date < now).length,
    showsRemaining: bookings.filter((b) => b.date >= now).length,
  };
}

export type Forecast = {
  /** Null when nothing has been played yet — there is no per-show average
   *  to extrapolate from, and inventing one would be a guess wearing a
   *  number's clothes. */
  projectedNet: number | null;
  avgNetPerShow: number | null;
  basisShows: number;
  remainingShows: number;
};

/**
 * Project a tour's finish from the shows already played.
 *
 * Deliberately refuses to answer with no basis: zero played shows returns
 * nulls rather than a confident zero.
 */
export function forecastTour(settlement: TourSettlement): Forecast {
  // Basis is shows with real numbers on them, not shows whose date has
  // passed: a played show nobody has entered figures for yet tells the
  // projection nothing, and averaging it in as a zero drags the estimate
  // toward zero for no reason.
  const played = settlement.shows.filter((s) => s.totalIncome > 0 || s.totalExpenses > 0);
  if (played.length === 0) {
    return { projectedNet: null, avgNetPerShow: null, basisShows: 0, remainingShows: settlement.showsRemaining };
  }

  const playedNet = played.reduce((s, x) => s + x.net, 0);
  const avgNetPerShow = Math.round(playedNet / played.length);
  const unplayed = Math.max(0, settlement.shows.length - played.length);

  return {
    // Realized net already includes unallocated tour costs; only the
    // not-yet-played shows get extrapolated.
    projectedNet: settlement.net + avgNetPerShow * unplayed,
    avgNetPerShow,
    basisShows: played.length,
    remainingShows: unplayed,
  };
}

export type SplitLike = { id: string; shareBps: number };

export function totalShareBps(splits: readonly SplitLike[]): number {
  return splits.reduce((sum, s) => sum + s.shareBps, 0);
}

/**
 * Divide `netCents` across shares so the parts sum to EXACTLY the whole.
 *
 * Largest-remainder: floor every share, then hand the leftover cents to
 * whoever was rounded down hardest. Rounding each share independently would
 * leave the payout a cent or two off the total — small, but it means the
 * screen and the bank never agree, and someone has to work out why.
 *
 * A loss is not distributed: shares describe how profit is divided, and
 * quietly turning that into a bill for each member is not a thing this
 * should decide on its own. Callers get zeros and say so in the UI.
 */
export function allocateSplits(netCents: number, splits: readonly SplitLike[]): Map<string, number> {
  const out = new Map<string, number>();
  const total = totalShareBps(splits);
  if (splits.length === 0 || total <= 0 || netCents <= 0) {
    for (const s of splits) out.set(s.id, 0);
    return out;
  }

  const exact = splits.map((s) => ({ id: s.id, value: (netCents * s.shareBps) / total }));
  const floors = exact.map((e) => ({ id: e.id, whole: Math.floor(e.value), frac: e.value - Math.floor(e.value) }));

  let remainder = netCents - floors.reduce((sum, f) => sum + f.whole, 0);
  const order = [...floors].sort((a, b) => b.frac - a.frac);
  for (const f of order) {
    if (remainder <= 0) break;
    f.whole += 1;
    remainder -= 1;
  }

  for (const f of floors) out.set(f.id, f.whole);
  return out;
}

// What merch actually earns, per item and per show. Pure functions over
// plain rows so the arithmetic is testable without a database.
//
// The unit economics here deliberately use each sale's OWN recorded price
// and cost rather than the item's current ones: a shirt sold for $25 in
// March stays a $25 sale after the price goes to $30 in June. Reading
// today's numbers over historic sales would silently restate every past
// show's margin.

export type SaleLine = {
  merchItemId: string;
  bookingId: string | null;
  qty: number;
  unitPrice: number;
  unitCogs: number;
};

export type ItemPerformance = {
  merchItemId: string;
  unitsSold: number;
  gross: number;
  cogs: number;
  /** Gross minus cost of goods. NOT profit — the venue's cut and every
   *  other tour cost sit outside this. Named contribution rather than
   *  profit so nobody reads it as money in pocket. */
  contribution: number;
  /** Contribution as a share of gross, in basis points. Null when nothing
   *  sold, because a margin on zero sales is not zero — it is unknown. */
  marginBps: number | null;
};

export function itemPerformance(lines: readonly SaleLine[]): ItemPerformance[] {
  const byItem = new Map<string, { unitsSold: number; gross: number; cogs: number }>();

  for (const line of lines) {
    const acc = byItem.get(line.merchItemId) ?? { unitsSold: 0, gross: 0, cogs: 0 };
    acc.unitsSold += line.qty;
    acc.gross += line.qty * line.unitPrice;
    acc.cogs += line.qty * line.unitCogs;
    byItem.set(line.merchItemId, acc);
  }

  return [...byItem.entries()]
    .map(([merchItemId, a]) => ({
      merchItemId,
      unitsSold: a.unitsSold,
      gross: a.gross,
      cogs: a.cogs,
      contribution: a.gross - a.cogs,
      marginBps: a.gross > 0 ? Math.round(((a.gross - a.cogs) / a.gross) * 10_000) : null,
    }))
    .sort((x, y) => y.contribution - x.contribution);
}

/**
 * Units sold per show, for items that sold at all.
 *
 * Sales with no bookingId are excluded rather than lumped together: they
 * happened somewhere, and inventing a "no show" bucket alongside real
 * venues invites reading it as a place.
 */
export function unitsByShow(lines: readonly SaleLine[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const line of lines) {
    if (!line.bookingId) continue;
    out.set(line.bookingId, (out.get(line.bookingId) ?? 0) + line.qty);
  }
  return out;
}

export type RestockAdvice = {
  merchItemId: string;
  stock: number;
  perShow: number;
  /** Shows the current stock covers at the observed rate. Null when the
   *  item has never sold — no rate, so no runway, and guessing one from a
   *  single restock event would be worse than saying nothing. */
  showsOfCover: number | null;
  shortfall: number;
};

/**
 * What runs out before the tour does.
 *
 * Rate comes from shows where the item ACTUALLY SOLD, not from every show
 * on the tour. An item stocked halfway through a run would otherwise look
 * like it sells half as fast as it does, and get under-ordered for the leg
 * where it was selling best.
 */
export function restockAdvice(
  items: ReadonlyArray<{ id: string; stock: number }>,
  lines: readonly SaleLine[],
  showsRemaining: number
): RestockAdvice[] {
  const stats = new Map<string, { units: number; shows: Set<string> }>();
  for (const line of lines) {
    const acc = stats.get(line.merchItemId) ?? { units: 0, shows: new Set<string>() };
    acc.units += line.qty;
    if (line.bookingId) acc.shows.add(line.bookingId);
    stats.set(line.merchItemId, acc);
  }

  return items
    .map((item) => {
      const stat = stats.get(item.id);
      const showsSelling = stat?.shows.size ?? 0;
      if (!stat || showsSelling === 0) {
        return { merchItemId: item.id, stock: item.stock, perShow: 0, showsOfCover: null, shortfall: 0 };
      }
      const perShow = stat.units / showsSelling;
      const needed = Math.ceil(perShow * showsRemaining);
      return {
        merchItemId: item.id,
        stock: item.stock,
        perShow: Math.round(perShow * 10) / 10,
        showsOfCover: perShow > 0 ? Math.floor(item.stock / perShow) : null,
        shortfall: Math.max(0, needed - item.stock),
      };
    })
    .sort((a, b) => b.shortfall - a.shortfall);
}

export type CountLine = {
  merchItemId: string;
  expected: number;
  counted: number;
  unitCogs: number;
};

export type Shrinkage = {
  /** Units that were expected and were not there. Positive number. */
  unitsShort: number;
  /** Units found beyond what was expected — an earlier miscount, or stock
   *  added without being recorded. Kept separate from shortfall rather than
   *  netted off: four missing shirts and four surplus hoodies is not "all
   *  square", it is two different problems. */
  unitsOver: number;
  /** What the missing units cost to make. The real money lost — retail is
   *  what they might have sold for, which is a different and softer claim. */
  costOfShortfall: number;
};

export function shrinkage(counts: readonly CountLine[]): Shrinkage {
  let unitsShort = 0;
  let unitsOver = 0;
  let costOfShortfall = 0;

  for (const c of counts) {
    const variance = c.counted - c.expected;
    if (variance < 0) {
      unitsShort += -variance;
      costOfShortfall += -variance * c.unitCogs;
    } else if (variance > 0) {
      unitsOver += variance;
    }
  }

  return { unitsShort, unitsOver, costOfShortfall };
}

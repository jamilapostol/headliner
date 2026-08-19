import { test } from "node:test";
import assert from "node:assert/strict";
import {
  allocateSplits,
  computeShowPnl,
  computeTourSettlement,
  forecastTour,
  totalShareBps,
  type BookingLike,
  type TxnLike,
} from "../settlement";

function booking(over: Partial<BookingLike> = {}): BookingLike {
  return {
    id: "b1",
    venue: "The Fillmore",
    city: "San Francisco",
    date: new Date("2026-03-01T00:00:00Z"),
    stage: "Paid",
    fee: 200_000,
    merchCutBps: 0,
    feeTransactionId: null,
    ...over,
  };
}

function txn(over: Partial<TxnLike> = {}): TxnLike {
  return { id: crypto.randomUUID(), kind: "income", category: "Merchandise", amount: 1000, bookingId: "b1", ...over };
}

// --- the double-count trap ------------------------------------------------

test("a collected fee is counted once, from its transaction — not twice", () => {
  // Moving a booking to Paid auto-writes the fee as a Transaction. If the
  // P&L also added booking.fee, every paid show would report double income.
  const b = booking({ feeTransactionId: "t-fee" });
  const pnl = computeShowPnl(b, [txn({ id: "t-fee", category: "Performance fees", amount: 200_000 })]);

  assert.equal(pnl.totalIncome, 200_000);
  assert.equal(pnl.expectedFee, null);
});

test("an uncollected fee is a receivable, never income", () => {
  const pnl = computeShowPnl(booking({ feeTransactionId: null }), []);
  assert.equal(pnl.totalIncome, 0);
  assert.equal(pnl.net, 0);
  assert.equal(pnl.expectedFee, 200_000);
});

// --- the venue's merch cut ------------------------------------------------

test("the venue's merch cut is derived from merch income and flagged as computed", () => {
  const pnl = computeShowPnl(booking({ merchCutBps: 2000 }), [txn({ category: "Merchandise", amount: 124_000 })]);
  const cut = pnl.expenses.find((l) => l.label === "Venue merch cut");

  assert.equal(pnl.merchGross, 124_000);
  assert.equal(pnl.venueMerchCut, 24_800); // 20%
  assert.equal(cut?.computed, true, "must be marked derived — no receipt backs it");
  assert.equal(pnl.net, 124_000 - 24_800);
});

test("no merch cut line when the venue takes nothing", () => {
  const pnl = computeShowPnl(booking({ merchCutBps: 0 }), [txn({ amount: 50_000 })]);
  assert.equal(pnl.venueMerchCut, 0);
  assert.equal(pnl.expenses.find((l) => l.label === "Venue merch cut"), undefined);
});

// --- tour roll-up ---------------------------------------------------------

test("money in the tour window that no show claims is surfaced, not dropped", () => {
  const b = booking({ id: "b1", feeTransactionId: "t1" });
  const t = computeTourSettlement(
    [b],
    [
      txn({ id: "t1", category: "Performance fees", amount: 200_000, bookingId: "b1" }),
      txn({ id: "t2", kind: "expense", category: "Van repair", amount: 80_000, bookingId: null }),
      txn({ id: "t3", kind: "expense", category: "Stray", amount: 5_000, bookingId: "not-in-this-tour" }),
    ]
  );

  assert.equal(t.unallocatedExpenses, 85_000, "untagged AND foreign-tagged both count as unallocated");
  assert.equal(t.totalIncome, 200_000);
  assert.equal(t.totalExpenses, 85_000);
  assert.equal(t.net, 115_000, "tour net must include costs no single night owns");
});

// --- forecast -------------------------------------------------------------

test("forecast refuses to project with nothing played", () => {
  const t = computeTourSettlement([booking({ feeTransactionId: null })], []);
  const f = forecastTour(t);
  assert.equal(f.projectedNet, null);
  assert.equal(f.avgNetPerShow, null);
  assert.equal(f.basisShows, 0);
});

test("forecast extrapolates only the shows with no numbers yet", () => {
  const played = booking({ id: "b1", feeTransactionId: "t1" });
  const upcoming = booking({ id: "b2", date: new Date("2026-04-01T00:00:00Z"), feeTransactionId: null });
  const t = computeTourSettlement(
    [played, upcoming],
    [txn({ id: "t1", category: "Performance fees", amount: 100_000, bookingId: "b1" })]
  );

  const f = forecastTour(t);
  assert.equal(f.basisShows, 1);
  assert.equal(f.avgNetPerShow, 100_000);
  assert.equal(f.remainingShows, 1);
  assert.equal(f.projectedNet, 200_000); // realized 100k + one more like it
});

// --- split allocation -----------------------------------------------------

test("thirds of an indivisible amount still sum to exactly the whole", () => {
  // 100.00 across three equal shares is the classic lost-cent case.
  const splits = [
    { id: "a", shareBps: 3334 },
    { id: "b", shareBps: 3333 },
    { id: "c", shareBps: 3333 },
  ];
  const got = allocateSplits(10_000, splits);
  const sum = [...got.values()].reduce((a, b) => a + b, 0);

  assert.equal(sum, 10_000, "every cent must be assigned to someone");
});

test("leftover cents go to whoever was rounded down hardest", () => {
  const got = allocateSplits(100, [
    { id: "a", shareBps: 5000 },
    { id: "b", shareBps: 2500 },
    { id: "c", shareBps: 2500 },
  ]);
  assert.deepEqual([got.get("a"), got.get("b"), got.get("c")], [50, 25, 25]);
});

test("allocation sums exactly across many awkward amounts", () => {
  const splits = [
    { id: "a", shareBps: 4000 },
    { id: "b", shareBps: 1500 },
    { id: "c", shareBps: 1500 },
    { id: "d", shareBps: 1500 },
    { id: "e", shareBps: 1500 },
  ];
  for (const net of [1, 7, 99, 101, 2_543_211, 999_999]) {
    const sum = [...allocateSplits(net, splits).values()].reduce((a, b) => a + b, 0);
    assert.equal(sum, net, `lost a cent allocating ${net}`);
  }
});

test("a loss is not turned into a bill for each member", () => {
  const got = allocateSplits(-50_000, [{ id: "a", shareBps: 5000 }, { id: "b", shareBps: 5000 }]);
  assert.deepEqual([got.get("a"), got.get("b")], [0, 0]);
});

test("shares that do not add to 100% still allocate the whole amount", () => {
  // A half-configured split table must not silently pay out only part of
  // the money — it allocates proportionally and the UI flags the gap.
  const splits = [{ id: "a", shareBps: 3000 }, { id: "b", shareBps: 3000 }];
  assert.notEqual(totalShareBps(splits), 10_000);
  const sum = [...allocateSplits(90_000, splits).values()].reduce((a, b) => a + b, 0);
  assert.equal(sum, 90_000);
});

test("no splits configured allocates nothing and does not throw", () => {
  assert.equal(allocateSplits(50_000, []).size, 0);
});

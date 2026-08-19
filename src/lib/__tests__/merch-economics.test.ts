import { test } from "node:test";
import assert from "node:assert/strict";
import { itemPerformance, restockAdvice, unitsByShow, type SaleLine } from "../merch-economics";

function line(over: Partial<SaleLine> = {}): SaleLine {
  return { merchItemId: "shirt", bookingId: "show-1", qty: 1, unitPrice: 3000, unitCogs: 1000, ...over };
}

test("performance sums units, gross and cost per item", () => {
  const perf = itemPerformance([line({ qty: 2 }), line({ qty: 3 })]);
  assert.equal(perf.length, 1);
  assert.equal(perf[0].unitsSold, 5);
  assert.equal(perf[0].gross, 15_000);
  assert.equal(perf[0].cogs, 5_000);
  assert.equal(perf[0].contribution, 10_000);
  assert.equal(perf[0].marginBps, 6667); // ~66.67%
});

test("a price change does not restate earlier sales", () => {
  // The reason unitPrice is snapshotted per line rather than read off the
  // item: the same shirt sold at two prices across a tour must report both.
  const perf = itemPerformance([
    line({ qty: 1, unitPrice: 2500, unitCogs: 1000 }),
    line({ qty: 1, unitPrice: 3000, unitCogs: 1000 }),
  ]);
  assert.equal(perf[0].gross, 5_500, "each sale keeps the price it was sold at");
});

test("items rank by contribution, not units moved", () => {
  // A cheap item can outsell a profitable one and still matter less.
  const perf = itemPerformance([
    line({ merchItemId: "sticker", qty: 50, unitPrice: 200, unitCogs: 50 }), // 7,500
    line({ merchItemId: "hoodie", qty: 6, unitPrice: 6000, unitCogs: 2500 }), // 21,000
  ]);
  assert.equal(perf[0].merchItemId, "hoodie");
  assert.equal(perf[1].merchItemId, "sticker");
});

test("margin on nothing sold is unknown, not zero", () => {
  const perf = itemPerformance([line({ qty: 0, unitPrice: 0, unitCogs: 0 })]);
  assert.equal(perf[0].marginBps, null);
});

test("units per show ignores sales that name no show", () => {
  const map = unitsByShow([
    line({ bookingId: "show-1", qty: 2 }),
    line({ bookingId: "show-1", qty: 1 }),
    line({ bookingId: "show-2", qty: 4 }),
    line({ bookingId: null, qty: 9 }),
  ]);
  assert.equal(map.get("show-1"), 3);
  assert.equal(map.get("show-2"), 4);
  assert.equal(map.size, 2, "an unattributed sale is not a venue");
});

test("restock rate comes from shows where it sold, not the whole tour", () => {
  // Stocked late: 20 units across 2 shows is 10 a night, not 20/10 = 2.
  const lines = [line({ bookingId: "s1", qty: 10 }), line({ bookingId: "s2", qty: 10 })];
  const [advice] = restockAdvice([{ id: "shirt", stock: 15 }], lines, 5);

  assert.equal(advice.perShow, 10);
  assert.equal(advice.showsOfCover, 1, "15 in hand at 10 a night covers one more show");
  assert.equal(advice.shortfall, 35, "needs 50 for five shows, has 15");
});

test("an item that never sold has no runway rather than an invented one", () => {
  const [advice] = restockAdvice([{ id: "poster", stock: 40 }], [], 10);
  assert.equal(advice.showsOfCover, null);
  assert.equal(advice.shortfall, 0);
});

test("comfortable stock reports no shortfall", () => {
  const lines = [line({ bookingId: "s1", qty: 2 })];
  const [advice] = restockAdvice([{ id: "shirt", stock: 100 }], lines, 5);
  assert.equal(advice.shortfall, 0);
  assert.equal(advice.showsOfCover, 50);
});

test("the worst shortfall sorts first", () => {
  const lines = [
    line({ merchItemId: "shirt", bookingId: "s1", qty: 10 }),
    line({ merchItemId: "hat", bookingId: "s1", qty: 1 }),
  ];
  const advice = restockAdvice(
    [
      { id: "hat", stock: 2 },
      { id: "shirt", stock: 1 },
    ],
    lines,
    4
  );
  assert.equal(advice[0].merchItemId, "shirt", "39 short beats 2 short");
});

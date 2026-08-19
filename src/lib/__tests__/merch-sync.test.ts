import { test } from "node:test";
import assert from "node:assert/strict";
import { opStockDeltas, effectiveStock, type QueuedMerchOp } from "../merch-sync";
import { dayKeyInZone, isValidTimeZone, utcDayKey } from "../format";

// The optimistic-display math for the merch offline queue. This is what a
// seller sees on the screen while a device is offline — it has to agree
// with what the server will eventually do, or someone oversells an item
// they can already see is out of stock on the same screen.

function op(payload: QueuedMerchOp["payload"], overrides: Partial<QueuedMerchOp> = {}): QueuedMerchOp {
  return { key: crypto.randomUUID(), payload, enqueuedAt: Date.now(), attempts: 0, failedPermanently: false, ...overrides };
}

test("adjustStock deltas map straight through, signed", () => {
  assert.deepEqual(opStockDeltas({ type: "adjustStock", itemId: "a", delta: -1 }), [{ itemId: "a", delta: -1 }]);
  assert.deepEqual(opStockDeltas({ type: "adjustStock", itemId: "a", delta: 10 }), [{ itemId: "a", delta: 10 }]);
});

test("completeSale deltas are negative — a sale only ever reduces stock", () => {
  assert.deepEqual(
    opStockDeltas({ type: "completeSale", cart: [{ itemId: "a", qty: 2 }, { itemId: "b", qty: 1 }] }),
    [{ itemId: "a", delta: -2 }, { itemId: "b", delta: -1 }]
  );
});

test("effectiveStock is the base minus every queued op touching that item", () => {
  const pending = [
    op({ type: "adjustStock", itemId: "shirt", delta: -1 }),
    op({ type: "completeSale", cart: [{ itemId: "shirt", qty: 2 }] }),
    op({ type: "adjustStock", itemId: "hoodie", delta: -1 }), // different item, must not affect "shirt"
  ];
  assert.equal(effectiveStock(10, "shirt", pending), 7); // 10 - 1 - 2
  assert.equal(effectiveStock(10, "hoodie", pending), 9);
});

test("effectiveStock never goes negative, however oversold the queue looks", () => {
  // Two devices queuing sales of the same nearly-sold-out item while both
  // offline — this is exactly the scenario the server's atomic clamp
  // exists for. The display math floors too, so it never claims negative
  // inventory even before the server has weighed in.
  const pending = [op({ type: "completeSale", cart: [{ itemId: "shirt", qty: 5 }] })];
  assert.equal(effectiveStock(2, "shirt", pending), 0);
});

test("effectiveStock with no pending ops is just the base", () => {
  assert.equal(effectiveStock(10, "shirt", []), 10);
});

test("a restock (+10) queued alongside a sale nets correctly", () => {
  const pending = [
    op({ type: "adjustStock", itemId: "shirt", delta: 10 }),
    op({ type: "completeSale", cart: [{ itemId: "shirt", qty: 3 }] }),
  ];
  assert.equal(effectiveStock(0, "shirt", pending), 7);
});

// --- show attribution, added after the queue shipped ----------------------

test("a sale queued before attribution existed still computes its stock deltas", () => {
  // Ops already sitting in a device's IndexedDB carry no bookingId. The
  // field is optional precisely so those replay instead of throwing, and
  // the stock math must not notice its absence.
  const legacy = { type: "completeSale" as const, cart: [{ itemId: "shirt", qty: 2 }] };
  assert.deepEqual(opStockDeltas(legacy), [{ itemId: "shirt", delta: -2 }]);
});

test("attributing a sale to a show does not change what it does to stock", () => {
  const withShow = { type: "completeSale" as const, cart: [{ itemId: "shirt", qty: 2 }], bookingId: "booking-1" };
  const without = { type: "completeSale" as const, cart: [{ itemId: "shirt", qty: 2 }], bookingId: null };
  assert.deepEqual(opStockDeltas(withShow), opStockDeltas(without));
});

test("a show-attributed sale still counts against optimistic stock", () => {
  const pending = [op({ type: "completeSale", cart: [{ itemId: "shirt", qty: 3 }], bookingId: "booking-1" })];
  assert.equal(effectiveStock(10, "shirt", pending), 7);
});

// --- day staleness --------------------------------------------------------
//
// The merch POS compares the day the server rendered against the day on the
// device, to catch a tab that has been asleep in a pocket since the last
// venue. Both sides derive the key the same way, so the comparison is only
// as good as this being stable.

test("a day key is the UTC calendar day, stable across times of day", () => {
  assert.equal(utcDayKey(new Date("2026-08-19T00:00:00Z")), "2026-08-19");
  assert.equal(utcDayKey(new Date("2026-08-19T23:59:59Z")), "2026-08-19");
});

test("day keys differ across midnight — the transition the warning fires on", () => {
  const before = utcDayKey(new Date("2026-08-19T23:59:59Z"));
  const after = utcDayKey(new Date("2026-08-20T00:00:01Z"));
  assert.notEqual(before, after);
  assert.equal(after, "2026-08-20");
});

test("a west-coast evening is still today locally, though tomorrow in UTC", () => {
  // The bug this whole field exists for. 9pm in Los Angeles on Aug 19 is
  // 04:00 UTC on Aug 20 — so a UTC comparison calls the show "yesterday"
  // during the exact hours the merch table is open.
  const showtime = new Date("2026-08-20T04:00:00Z");

  assert.equal(utcDayKey(showtime), "2026-08-20", "UTC has already rolled over");
  assert.equal(dayKeyInZone(showtime, "America/Los_Angeles"), "2026-08-19", "but it is still the 19th at the venue");
});

test("the same instant is different days in different venues", () => {
  const instant = new Date("2026-08-20T04:00:00Z");
  assert.equal(dayKeyInZone(instant, "America/Los_Angeles"), "2026-08-19");
  assert.equal(dayKeyInZone(instant, "America/New_York"), "2026-08-20");
  assert.equal(dayKeyInZone(instant, "Europe/Berlin"), "2026-08-20");
  assert.equal(dayKeyInZone(instant, "Asia/Tokyo"), "2026-08-20");
});

test("a zone's day boundary is its own midnight, not UTC's", () => {
  // One second either side of midnight in Denver.
  assert.equal(dayKeyInZone(new Date("2026-08-20T05:59:59Z"), "America/Denver"), "2026-08-19");
  assert.equal(dayKeyInZone(new Date("2026-08-20T06:00:01Z"), "America/Denver"), "2026-08-20");
});

test("a zone ahead of UTC rolls over before UTC does", () => {
  // Tokyo is +9, so 3pm UTC is already the next day there.
  assert.equal(utcDayKey(new Date("2026-08-19T15:00:00Z")), "2026-08-19");
  assert.equal(dayKeyInZone(new Date("2026-08-19T15:00:00Z"), "Asia/Tokyo"), "2026-08-20");
});

test("day keys survive a daylight-saving transition", () => {
  // US DST ends 2026-11-01. The date must not skip or repeat across it.
  assert.equal(dayKeyInZone(new Date("2026-11-01T05:30:00Z"), "America/New_York"), "2026-11-01");
  assert.equal(dayKeyInZone(new Date("2026-11-01T07:30:00Z"), "America/New_York"), "2026-11-01");
});

test("an unusable zone falls back to UTC instead of throwing", () => {
  // A bad stored value must not take down a merch table mid-show.
  assert.equal(dayKeyInZone(new Date("2026-08-19T12:00:00Z"), "Not/AZone"), "2026-08-19");
  assert.equal(dayKeyInZone(new Date("2026-08-19T12:00:00Z"), ""), "2026-08-19");
});

test("timezone validation accepts real zones and rejects junk", () => {
  assert.equal(isValidTimeZone("America/Los_Angeles"), true);
  assert.equal(isValidTimeZone("UTC"), true);
  assert.equal(isValidTimeZone("Not/AZone"), false);
  assert.equal(isValidTimeZone("America/Los Angeles"), false);
});

test("day keys sort chronologically as plain strings", () => {
  // Why a string and not a Date: it survives the server-to-client boundary
  // without serialization, and still compares correctly.
  const keys = ["2026-08-20", "2026-01-05", "2026-12-31"].sort();
  assert.deepEqual(keys, ["2026-01-05", "2026-08-20", "2026-12-31"]);
});

// Not covered here: that the IndexedDB queue actually persists across a
// reload, that flushOnce stops at the first retryable failure and skips
// past permanent ones, and that the server's idempotency claim and atomic
// delta writes behave correctly under real concurrency. The first two need
// a real browser (no indexedDB in the node:test runtime, and adding a
// polyfill package just for this would be the one new dependency this
// module was written to avoid); the SQL was verified directly against
// Postgres instead (see the commit) rather than left as an assumption.

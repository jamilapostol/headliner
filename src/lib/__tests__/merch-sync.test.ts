import { test } from "node:test";
import assert from "node:assert/strict";
import { opStockDeltas, effectiveStock, type QueuedMerchOp } from "../merch-sync";

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

// Not covered here: that the IndexedDB queue actually persists across a
// reload, that flushOnce stops at the first retryable failure and skips
// past permanent ones, and that the server's idempotency claim and atomic
// delta writes behave correctly under real concurrency. The first two need
// a real browser (no indexedDB in the node:test runtime, and adding a
// polyfill package just for this would be the one new dependency this
// module was written to avoid); the SQL was verified directly against
// Postgres instead (see the commit) rather than left as an assumption.

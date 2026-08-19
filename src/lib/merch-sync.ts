// Shared between the merch server actions (src/lib/actions/merch.ts) and the
// client-side offline queue (src/lib/merch-offline.ts). No "use server" or
// "use client" directive on purpose — every export here is a plain type or a
// pure function, importable from either side without pulling either runtime
// in.

export type AdjustStockPayload = { type: "adjustStock"; itemId: string; delta: number };
export type CompleteSalePayload = {
  type: "completeSale";
  cart: Array<{ itemId: string; qty: number }>;
  /** Which show this sale happened at, for the settlement screens. Optional
   *  because the queue is durable: ops sitting in a device's IndexedDB from
   *  before attribution shipped replay without it, and a sale that cannot
   *  say where it happened is still a sale worth keeping. */
  bookingId?: string | null;
};
export type MerchOpPayload = AdjustStockPayload | CompleteSalePayload;

export type QueuedMerchOp = {
  /** Client-generated UUID. Doubles as the server-side idempotency key — a
   *  retried op must reuse the same key, never mint a new one, or the server
   *  has no way to recognize the replay. */
  key: string;
  payload: MerchOpPayload;
  enqueuedAt: number;
  attempts: number;
  /** Set only on a `permanent` outcome from the server (see MerchSyncOutcome)
   *  — the thing that distinguishes "needs a human" from "still retrying on
   *  its own". A retryable failure also sets `lastError` for display but
   *  leaves this false, so don't infer permanence from attempts or
   *  lastError alone. */
  failedPermanently: boolean;
  lastError?: string;
};

export type AdjustStockResult = { itemId: string; stock: number };
export type CompleteSaleResult = {
  total: number;
  sold: Array<{ itemId: string; requested: number; sold: number }>;
};

/** What a merch sync server action returns. `retryable` means the client
 *  should leave the op queued and try again later (offline, a transient DB
 *  conflict); `permanent` means retrying won't help (validation failure,
 *  session expired, item deleted) and the op needs a human to look at it. */
export type MerchSyncOutcome<T> =
  | { ok: true; result: T; replayed?: true }
  | { ok: false; kind: "retryable" | "permanent"; error: string };

/** Per-item stock deltas implied by one queued op — negative means stock
 *  goes down. For optimistic display only: the server independently
 *  clamps and serializes the real write, so this never has to be exact,
 *  only close enough that a seller doesn't think they have inventory they
 *  don't. */
export function opStockDeltas(payload: MerchOpPayload): Array<{ itemId: string; delta: number }> {
  if (payload.type === "adjustStock") return [{ itemId: payload.itemId, delta: payload.delta }];
  return payload.cart.map((c) => ({ itemId: c.itemId, delta: -c.qty }));
}

/** Server-given stock minus every not-yet-synced queued op's effect on this
 *  item, floored at zero. This is the number to show a seller — it accounts
 *  for sales they've already rung up locally but that haven't reached the
 *  server yet, so the same item can't be sold twice from one device before
 *  the first sale syncs. It is not authoritative: the server's atomic
 *  update is what actually prevents overselling across multiple devices. */
export function effectiveStock(baseStock: number, itemId: string, pending: readonly QueuedMerchOp[]): number {
  const delta = pending
    .flatMap((op) => opStockDeltas(op.payload))
    .filter((d) => d.itemId === itemId)
    .reduce((sum, d) => sum + d.delta, 0);
  return Math.max(0, baseStock + delta);
}

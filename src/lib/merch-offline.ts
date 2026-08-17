"use client";

// Durable client-side queue for merch mutations, so a device at a merch
// table with no signal doesn't lose a sale. Backed by IndexedDB rather than
// localStorage or in-memory state because it has to survive a page refresh
// or an accidental tab close mid-tour — an in-memory queue disappears the
// instant the tab does, which is exactly when a seller is most likely to
// reload out of frustration with a stuck spinner.
//
// No new dependency: this is a small enough surface to write directly
// against the browser's IndexedDB API, matching the rest of this app's
// integrations (see lib/resend.ts, the Resend webhook route) staying
// dependency-free rather than reaching for a wrapper library.

import { useCallback, useEffect, useState } from "react";
import { adjustStock, completeSale } from "@/lib/actions/merch";
import type { AdjustStockResult, CompleteSaleResult, MerchOpPayload, MerchSyncOutcome, QueuedMerchOp } from "@/lib/merch-sync";

const DB_NAME = "headline-merch-sync";
const DB_VERSION = 1;
const STORE = "ops";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Could not open the offline queue."));
  });
}

async function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Offline queue operation failed."));
    tx.oncomplete = () => db.close();
  });
}

function listOps(): Promise<QueuedMerchOp[]> {
  return withStore("readonly", (store) => store.getAll() as IDBRequest<QueuedMerchOp[]>);
}

async function putOp(op: QueuedMerchOp): Promise<void> {
  await withStore("readwrite", (store) => store.put(op));
}

async function deleteOp(key: string): Promise<void> {
  await withStore("readwrite", (store) => store.delete(key));
}

function callServerAction(payload: MerchOpPayload, key: string): Promise<MerchSyncOutcome<AdjustStockResult | CompleteSaleResult>> {
  if (payload.type === "adjustStock") return adjustStock(payload.itemId, payload.delta, key);
  return completeSale(payload.cart, key);
}

/** Attempts every queued op in enqueue order. Stops at the first retryable
 *  failure — usually means we're offline again, and trying the rest would
 *  just fail the same way — but skips past (and keeps) any permanently
 *  failed op so one bad item doesn't block unrelated sales behind it. */
async function flushOnce(onChange: () => void): Promise<void> {
  const ops = (await listOps()).sort((a, b) => a.enqueuedAt - b.enqueuedAt);

  for (const op of ops) {
    let outcome: MerchSyncOutcome<AdjustStockResult | CompleteSaleResult>;
    try {
      outcome = await callServerAction(op.payload, op.key);
    } catch {
      // The server action call itself failed to complete — most likely we
      // never reached the network. Leave it queued, stop this pass.
      await putOp({ ...op, attempts: op.attempts + 1, lastError: "Couldn't reach the server.", failedPermanently: false });
      onChange();
      return;
    }

    if (outcome.ok) {
      await deleteOp(op.key);
      onChange();
      continue;
    }
    if (outcome.kind === "retryable") {
      await putOp({ ...op, attempts: op.attempts + 1, lastError: outcome.error, failedPermanently: false });
      onChange();
      return;
    }
    // Permanent: leave it out of the active retry loop but keep the record
    // visible so the seller sees it rather than it quietly vanishing.
    await putOp({ ...op, lastError: outcome.error, failedPermanently: true });
    onChange();
  }
}

export function useMerchSyncQueue() {
  const [ops, setOps] = useState<QueuedMerchOp[]>([]);
  const [flushing, setFlushing] = useState(false);

  const refresh = useCallback(() => {
    listOps().then(setOps).catch(() => {});
  }, []);

  const flush = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    setFlushing(true);
    try {
      await flushOnce(refresh);
    } finally {
      setFlushing(false);
      refresh();
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
    void flush();

    const onOnline = () => void flush();
    window.addEventListener("online", onOnline);
    // Belt-and-braces: some browsers/networks don't fire `online` reliably
    // (e.g. a captive portal, or flaky venue wifi that never fully drops).
    const interval = window.setInterval(() => void flush(), 20_000);

    return () => {
      window.removeEventListener("online", onOnline);
      window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- flush/refresh are stable via useCallback
  }, []);

  const enqueue = useCallback(
    async (payload: MerchOpPayload) => {
      const op: QueuedMerchOp = { key: crypto.randomUUID(), payload, enqueuedAt: Date.now(), attempts: 0, failedPermanently: false };
      await putOp(op);
      refresh();
      void flush();
      return op.key;
    },
    [refresh, flush]
  );

  const discard = useCallback(
    async (key: string) => {
      await deleteOp(key);
      refresh();
    },
    [refresh]
  );

  const retry = useCallback(
    async (key: string) => {
      // Retrying a permanently-failed op means the seller decided the
      // underlying problem is fixed (e.g. they signed back in) — clear
      // lastError so it's treated as fresh rather than skipped again for
      // the same reason, then let the next flush pick it up.
      const op = ops.find((o) => o.key === key);
      if (!op) return;
      await putOp({ ...op, lastError: undefined, failedPermanently: false });
      refresh();
      void flush();
    },
    [ops, refresh, flush]
  );

  const pending = ops.filter((o) => !o.failedPermanently);
  const failed = ops.filter((o) => o.failedPermanently);

  return {
    /** Queued and either not yet attempted or failed retryably — will keep syncing on its own. */
    pending,
    /** Queued but the server rejected it for a reason retrying won't fix. Needs `retry` or `discard`. */
    failed,
    flushing,
    enqueueAdjustStock: (itemId: string, delta: number) => enqueue({ type: "adjustStock", itemId, delta }),
    enqueueCompleteSale: (cart: Array<{ itemId: string; qty: number }>) => enqueue({ type: "completeSale", cart }),
    discard,
    retry,
  };
}

"use client";

import { useMemo, useState } from "react";
import { money } from "@/lib/format";
import { useMerchSyncQueue } from "@/lib/merch-offline";
import { effectiveStock } from "@/lib/merch-sync";
import { SyncStatus } from "@/components/merch-sync-status";
import type { MerchItemDTO } from "@/components/merch-table";

export function PointOfSale({ items }: { items: MerchItemDTO[] }) {
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({});
  // Set to the queue key returned by enqueueCompleteSale once the sale is
  // recorded locally — null means no sale has been rung up in this session
  // of the drawer being open.
  const [queuedKey, setQueuedKey] = useState<string | null>(null);
  const sync = useMerchSyncQueue();

  // Stock minus every not-yet-synced queued op, including this drawer's own
  // pending sale and any adjustments queued from the inventory table — so
  // the cart can't offer more of an item than actually remains, even while
  // offline and even across the two screens that both touch stock.
  const stockFor = (itemId: string, base: number) => effectiveStock(base, itemId, [...sync.pending, ...sync.failed]);
  const inStock = items.filter((i) => stockFor(i.id, i.stock) > 0);

  const total = useMemo(
    () => items.reduce((a, i) => a + (cart[i.id] ?? 0) * i.price, 0),
    [cart, items]
  );
  const unitCount = Object.values(cart).reduce((a, n) => a + n, 0);

  function bump(id: string, delta: number, base: number) {
    const max = stockFor(id, base);
    setCart((c) => ({ ...c, [id]: Math.max(0, Math.min((c[id] ?? 0) + delta, max)) }));
  }

  async function complete() {
    const cartItems = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([itemId, qty]) => ({ itemId, qty }));
    if (cartItems.length === 0) return;
    const key = await sync.enqueueCompleteSale(cartItems);
    setQueuedKey(key);
  }

  function close() {
    setOpen(false);
    setCart({});
    setQueuedKey(null);
  }

  // Once flushOnce removes a synced op from the queue, its key stops
  // appearing in either list — that transition (present → gone) is exactly
  // "this sale reached the server", with no separate status field to keep
  // in sync with the queue's own state.
  const stillQueued = queuedKey !== null && [...sync.pending, ...sync.failed].some((o) => o.key === queuedKey);
  const failedOp = queuedKey !== null ? sync.failed.find((o) => o.key === queuedKey) : undefined;

  return (
    <>
      <div className="mt-3 flex items-center gap-2.5">
        <div
          onClick={() => setOpen(true)}
          className="flex-1 cursor-pointer rounded-lg bg-accent px-4 py-2.5 text-center text-[12.5px] font-semibold text-ink hover:bg-accent/85"
        >
          Open point of sale
        </div>
        <SyncStatus sync={sync} />
      </div>

      {open && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/60 px-4" onClick={close}>
          <div onClick={(e) => e.stopPropagation()} className="flex max-h-[85vh] w-full max-w-[440px] flex-col rounded-2xl border border-border bg-surface p-6">
            {queuedKey !== null ? (
              <div className="py-6 text-center">
                {failedOp ? (
                  <>
                    <div className="mb-2 text-[15px] font-semibold text-orange">Sale couldn&rsquo;t be recorded</div>
                    <div className="mb-5 text-[13px] leading-relaxed text-text/55">{failedOp.lastError}</div>
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => queuedKey && sync.retry(queuedKey)}
                        className="cursor-pointer rounded-[10px] bg-accent px-5 py-2.5 text-[13.5px] font-semibold text-ink"
                      >
                        Retry
                      </button>
                      <button onClick={close} className="cursor-pointer rounded-[10px] border border-border px-5 py-2.5 text-[13.5px] text-text/70">
                        Close
                      </button>
                    </div>
                  </>
                ) : stillQueued ? (
                  <>
                    <div className="mb-2 text-[15px] font-semibold text-yellow">Sale saved — syncing…</div>
                    <div className="mb-5 text-[13px] leading-relaxed text-text/55">
                      {money(total)} is saved on this device and will log to Finance the moment it reaches the server. Safe to keep
                      selling — it won&rsquo;t be lost if you close this.
                    </div>
                    <button onClick={close} className="cursor-pointer rounded-[10px] bg-accent px-5 py-2.5 text-[13.5px] font-semibold text-ink">
                      Done
                    </button>
                  </>
                ) : (
                  <>
                    <div className="mb-2 text-[15px] font-semibold text-accent">Sale recorded</div>
                    <div className="mb-5 text-[13px] text-text/55">{money(total)} logged to Finance as merch income.</div>
                    <button onClick={close} className="cursor-pointer rounded-[10px] bg-accent px-5 py-2.5 text-[13.5px] font-semibold text-ink">
                      Done
                    </button>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-[17px] font-semibold">Point of sale</div>
                  <button onClick={close} className="cursor-pointer px-1 text-[18px] text-text/50 hover:text-text">
                    ✕
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {inStock.length === 0 && <div className="py-6 text-center text-[13px] text-text/40">No items in stock.</div>}
                  <div className="flex flex-col gap-2.5">
                    {inStock.map((item) => {
                      const qty = cart[item.id] ?? 0;
                      const stock = stockFor(item.id, item.stock);
                      return (
                        <div key={item.id} className="flex items-center gap-3 rounded-[10px] border border-text/[.08] bg-surface-nested px-3.5 py-2.5">
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[13px] font-semibold">{item.name}</div>
                            <div className="text-[11px] text-text/45">
                              {money(item.price)} · {stock} in stock
                            </div>
                          </div>
                          <div className="flex flex-none items-center gap-2">
                            <button
                              onClick={() => bump(item.id, -1, item.stock)}
                              className="grid h-7 w-7 cursor-pointer place-items-center rounded-md border border-text/15 text-[13px] text-text/70 hover:border-text/35"
                            >
                              −
                            </button>
                            <span className="w-5 text-center font-mono text-[13px]">{qty}</span>
                            <button
                              onClick={() => bump(item.id, 1, item.stock)}
                              className="grid h-7 w-7 cursor-pointer place-items-center rounded-md border border-text/15 text-[13px] text-text/70 hover:border-text/35"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-text/[.08] pt-4">
                  <div className="text-[13px] text-text/55">{unitCount} item{unitCount === 1 ? "" : "s"}</div>
                  <div className="text-[19px] font-bold text-accent">{money(total)}</div>
                </div>
                <button
                  onClick={complete}
                  disabled={unitCount === 0}
                  className="mt-3 cursor-pointer rounded-[10px] bg-accent py-2.5 text-center text-[13.5px] font-semibold text-ink disabled:opacity-50"
                >
                  Complete sale
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

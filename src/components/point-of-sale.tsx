"use client";

import { useMemo, useState, useTransition } from "react";
import { money } from "@/lib/format";
import { completeSale } from "@/lib/actions/merch";
import type { MerchItemDTO } from "@/components/merch-table";

export function PointOfSale({ items }: { items: MerchItemDTO[] }) {
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const inStock = items.filter((i) => i.stock > 0);
  const total = useMemo(
    () => items.reduce((a, i) => a + (cart[i.id] ?? 0) * i.price, 0),
    [cart, items]
  );
  const unitCount = Object.values(cart).reduce((a, n) => a + n, 0);

  function bump(id: string, delta: number, max: number) {
    setCart((c) => ({ ...c, [id]: Math.max(0, Math.min((c[id] ?? 0) + delta, max)) }));
  }

  function complete() {
    const cartItems = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([itemId, qty]) => ({ itemId, qty }));
    if (cartItems.length === 0) return;
    startTransition(async () => {
      await completeSale(cartItems);
      setDone(true);
    });
  }

  function close() {
    setOpen(false);
    setCart({});
    setDone(false);
  }

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="mt-3 cursor-pointer rounded-lg bg-accent px-4 py-2.5 text-center text-[12.5px] font-semibold text-ink hover:bg-accent/85"
      >
        Open point of sale
      </div>

      {open && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/60 px-4" onClick={close}>
          <div onClick={(e) => e.stopPropagation()} className="flex max-h-[85vh] w-full max-w-[440px] flex-col rounded-2xl border border-border bg-surface p-6">
            {done ? (
              <div className="py-6 text-center">
                <div className="mb-2 text-[15px] font-semibold text-accent">Sale recorded</div>
                <div className="mb-5 text-[13px] text-text/55">{money(total)} logged to Finance as merch income.</div>
                <button onClick={close} className="cursor-pointer rounded-[10px] bg-accent px-5 py-2.5 text-[13.5px] font-semibold text-ink">
                  Done
                </button>
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
                      return (
                        <div key={item.id} className="flex items-center gap-3 rounded-[10px] border border-text/[.08] bg-surface-nested px-3.5 py-2.5">
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[13px] font-semibold">{item.name}</div>
                            <div className="text-[11px] text-text/45">
                              {money(item.price)} · {item.stock} in stock
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
                  disabled={unitCount === 0 || pending}
                  className="mt-3 cursor-pointer rounded-[10px] bg-accent py-2.5 text-center text-[13.5px] font-semibold text-ink disabled:opacity-50"
                >
                  {pending ? "Recording…" : "Complete sale"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

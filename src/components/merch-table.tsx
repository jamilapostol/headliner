"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { money } from "@/lib/format";
import { createMerchItem, uploadMerchImage, type ActionState } from "@/lib/actions/merch";
import { useMerchSyncQueue } from "@/lib/merch-offline";
import { effectiveStock } from "@/lib/merch-sync";
import { SyncStatus } from "@/components/merch-sync-status";
import { StockCountModal } from "@/components/stock-count-modal";

export type MerchItemDTO = {
  id: string;
  name: string;
  variant: string | null;
  price: number;
  cogs: number;
  stock: number;
  maxStock: number;
  glyph: string;
  color: string;
  imageUrl: string | null;
};

export function MerchTable({ items }: { items: MerchItemDTO[] }) {
  const [showNew, setShowNew] = useState(false);
  const [counting, setCounting] = useState(false);
  const [, startTransition] = useTransition();
  const sync = useMerchSyncQueue();

  // Server-given stock minus whatever's still queued for that item — see
  // src/lib/merch-sync.ts. Keeps the count honest while offline instead of
  // showing a number the seller already knows is stale.
  const displayStock = (item: MerchItemDTO) => effectiveStock(item.stock, item.id, [...sync.pending, ...sync.failed]);

  const totalUnits = items.reduce((a, i) => a + displayStock(i), 0);
  const retailValue = items.reduce((a, i) => a + displayStock(i) * i.price, 0);

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-[22px] tracking-[-.02em] sm:text-[26px]">Merchandise</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="font-mono text-[12px] text-text/45">
            {totalUnits} units in van · {money(retailValue)} retail
          </div>
          <button onClick={() => setCounting(true)} className="cursor-pointer text-[12.5px] text-text/60 hover:text-text">
            Count the van
          </button>
          <Link href="/app/merch/economics" className="text-[12.5px] text-accent hover:underline">
            Economics →
          </Link>
          <button onClick={() => setShowNew(true)} className="cursor-pointer rounded-lg bg-accent px-3.5 py-1.5 text-[12.5px] font-semibold text-ink">
            + New item
          </button>
        </div>
      </div>
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[13px] text-text/50">Inventory travels with the tour — adjust counts after each settle-up.</div>
        <SyncStatus sync={sync} />
      </div>

      <div className="overflow-x-auto rounded-card border border-border bg-surface">
        <div className="min-w-[560px]">
        <div className="grid grid-cols-[1.8fr_.8fr_.8fr_1.1fr_1fr] gap-2.5 border-b border-border px-[18px] py-[11px] font-mono text-[10.5px] tracking-[.1em] text-text/40">
          <div>ITEM</div>
          <div>PRICE</div>
          <div>MARGIN</div>
          <div>STOCK</div>
          <div>STATUS</div>
        </div>
        {items.map((m) => {
          const stock = displayStock(m);
          const pct = m.maxStock ? stock / m.maxStock : 0;
          const low = pct < 0.25;
          const margin = m.price ? Math.round(((m.price - m.cogs) / m.price) * 100) : 0;
          return (
            <div key={m.id} className="grid grid-cols-[1.8fr_.8fr_.8fr_1.1fr_1fr] items-center gap-2.5 border-b border-text/[.05] px-[18px] py-3 hover:bg-text/[.03]">
              <div className="flex items-center gap-2.5">
                <MerchPhoto item={m} />
                <div>
                  <div className="text-[13px] font-semibold">{m.name}</div>
                  <div className="text-[11px] text-text/40">{m.variant}</div>
                </div>
              </div>
              <div className="font-mono text-[12.5px]">{money(m.price)}</div>
              <div className="font-mono text-[12.5px] text-accent">{margin}%</div>
              <div>
                <div className="mb-1 flex items-center gap-2 font-mono text-[12.5px]">
                  <span>
                    {stock}/{m.maxStock}
                  </span>
                  <button onClick={() => sync.enqueueAdjustStock(m.id, -1)} className="cursor-pointer text-text/40 hover:text-text" title="Sell one">
                    −
                  </button>
                  <button onClick={() => sync.enqueueAdjustStock(m.id, 10)} className="cursor-pointer text-text/40 hover:text-text" title="Restock +10">
                    +10
                  </button>
                </div>
                <div className="h-1 w-14 rounded-full bg-text/[.07]">
                  <div className="h-1 rounded-full" style={{ width: `${Math.round(pct * 100)}%`, background: low ? "#e8983f" : "#3fe87a" }} />
                </div>
              </div>
              <div
                className="w-fit rounded-full px-2.5 py-[3px] font-mono text-[10.5px]"
                style={{ background: low ? "rgba(232,152,63,.12)" : "rgba(63,232,122,.1)", color: low ? "#e8983f" : "#3fe87a" }}
              >
                {low ? "LOW STOCK" : "OK"}
              </div>
            </div>
          );
        })}
        {items.length === 0 && <div className="px-[18px] py-7 text-center text-[13px] text-text/40">No merch items yet.</div>}
        </div>
      </div>

      {counting && <StockCountModal items={items} onClose={() => setCounting(false)} />}

      {showNew && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/60 px-4" onClick={() => setShowNew(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[420px] rounded-2xl border border-border bg-surface p-6">
            <div className="mb-4 text-[17px] font-semibold">New merch item</div>
            <form
              action={(fd) =>
                startTransition(async () => {
                  await createMerchItem(fd);
                  setShowNew(false);
                })
              }
              className="flex flex-col gap-3"
            >
              <F label="Name" name="name" placeholder="Tour Tee" />
              <F label="Variant" name="variant" placeholder="Black · S–XL" />
              <div className="grid grid-cols-2 gap-3">
                <F label="Price ($)" name="price" type="number" placeholder="30" />
                <F label="Margin (%)" name="margin" type="number" placeholder="65" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <F label="Starting stock" name="stock" type="number" placeholder="50" />
                <F label="Max stock" name="maxStock" type="number" placeholder="50" />
              </div>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => setShowNew(false)} className="flex-1 cursor-pointer rounded-[10px] border border-border py-2.5 text-[13.5px] text-text/70">
                  Cancel
                </button>
                <button type="submit" className="flex-1 cursor-pointer rounded-[10px] bg-accent py-2.5 text-[13.5px] font-semibold text-ink">
                  Add item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const initialUploadState: ActionState = {};

function MerchPhoto({ item }: { item: MerchItemDTO }) {
  const [state, uploadAction, pending] = useActionState(uploadMerchImage, initialUploadState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={uploadAction} className="relative flex-none">
      <input type="hidden" name="itemId" value={item.id} />
      <label
        title={state.error ?? "Click to change photo"}
        className="grid h-[30px] w-[30px] flex-none cursor-pointer place-items-center overflow-hidden rounded-[7px] text-[12px] font-bold text-ink hover:opacity-80"
        style={{ background: item.imageUrl ? undefined : item.color }}
      >
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.name} width={30} height={30} className="h-full w-full object-cover" />
        ) : pending ? (
          "…"
        ) : (
          item.glyph
        )}
        <input
          type="file"
          name="file"
          accept="image/*"
          className="hidden"
          onChange={() => formRef.current?.requestSubmit()}
        />
      </label>
      {state.error && <div className="absolute top-full left-0 z-10 mt-1 w-max max-w-[160px] text-[10.5px] text-orange">{state.error}</div>}
    </form>
  );
}

function F({ label, name, placeholder, type = "text" }: { label: string; name: string; placeholder?: string; type?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium text-text/50">{label}</span>
      <input
        name={name}
        type={type}
        required
        placeholder={placeholder}
        className="rounded-[10px] border border-border bg-surface-nested px-3.5 py-2.5 text-[13.5px] text-text outline-none focus:border-accent/50"
      />
    </label>
  );
}

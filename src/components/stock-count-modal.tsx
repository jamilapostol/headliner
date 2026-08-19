"use client";

import { useState, useTransition } from "react";
import { recordStockCount } from "@/lib/actions/merch";
import type { MerchItemDTO } from "@/components/merch-table";

// Counting the van. The point is the gap between what the system believed
// and what is physically there — merch walks, and without a count that
// drift just accumulates silently as "stock".

export function StockCountModal({ items, onClose }: { items: MerchItemDTO[]; onClose: () => void }) {
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  // Only items someone actually typed a number for. A blank field means
  // "didn't count this one", which must not be recorded as zero — that
  // would write off the entire stock of anything skipped.
  const entered = items.filter((i) => (counts[i.id] ?? "").trim() !== "");
  const variances = entered.map((i) => ({ item: i, variance: Number(counts[i.id]) - i.stock }));
  const short = variances.filter((v) => v.variance < 0);
  const over = variances.filter((v) => v.variance > 0);

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-[520px] flex-col rounded-2xl border border-border bg-surface p-6"
      >
        <div className="mb-1 flex items-center justify-between">
          <div className="text-[17px] font-semibold">Count the van</div>
          <button onClick={onClose} className="cursor-pointer px-1 text-[18px] text-text/50 hover:text-text">
            ✕
          </button>
        </div>
        <div className="mb-4 text-[12.5px] leading-relaxed text-text/50">
          Type what&rsquo;s actually there. Leave anything you didn&rsquo;t count blank — it stays as it is.
        </div>

        <form
          action={(fd) =>
            startTransition(async () => {
              await recordStockCount(fd);
              onClose();
            })
          }
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="flex flex-col gap-2">
              {items.map((item) => {
                const raw = (counts[item.id] ?? "").trim();
                const variance = raw === "" ? null : Number(raw) - item.stock;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-[10px] border border-text/[.08] bg-surface-nested px-3.5 py-2.5"
                  >
                    <div
                      className="grid h-7 w-7 flex-none place-items-center rounded-[7px] text-[12px] font-bold text-ink"
                      style={{ background: item.color }}
                    >
                      {item.glyph}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold">{item.name}</div>
                      <div className="text-[11px] text-text/45">system says {item.stock}</div>
                    </div>
                    {variance !== null && variance !== 0 && (
                      <span
                        className={`flex-none font-mono text-[11px] ${variance < 0 ? "text-orange" : "text-blue"}`}
                        title={variance < 0 ? "fewer than expected" : "more than expected"}
                      >
                        {variance > 0 ? "+" : ""}
                        {variance}
                      </span>
                    )}
                    <input
                      name={`count-${item.id}`}
                      value={counts[item.id] ?? ""}
                      onChange={(e) => setCounts((c) => ({ ...c, [item.id]: e.target.value }))}
                      inputMode="numeric"
                      placeholder="—"
                      aria-label={`Counted ${item.name}`}
                      className="w-16 flex-none rounded-[8px] border border-border bg-canvas px-2.5 py-1.5 text-right font-mono text-[13px] outline-none focus:border-accent/50"
                    />
                  </div>
                );
              })}
              {items.length === 0 && <div className="py-6 text-center text-[13px] text-text/40">No merch items to count.</div>}
            </div>
          </div>

          <input
            name="note"
            placeholder="Note — where you counted, anything odd"
            className="mt-3 rounded-[10px] border border-border bg-surface-nested px-3 py-2 text-[12.5px] outline-none focus:border-accent/50"
          />

          {entered.length > 0 && (
            <div className="mt-3 border-t border-border pt-3 text-[12.5px] leading-relaxed">
              {short.length === 0 && over.length === 0 ? (
                <span className="text-accent">Everything counted matches the system.</span>
              ) : (
                <>
                  {short.length > 0 && (
                    <span className="text-orange">
                      {short.reduce((a, v) => a + -v.variance, 0)} unit
                      {short.reduce((a, v) => a + -v.variance, 0) === 1 ? "" : "s"} missing
                    </span>
                  )}
                  {short.length > 0 && over.length > 0 && <span className="text-text/40"> · </span>}
                  {over.length > 0 && (
                    <span className="text-blue">{over.reduce((a, v) => a + v.variance, 0)} more than expected</span>
                  )}
                  <span className="text-text/50"> — recording this sets stock to what you counted.</span>
                </>
              )}
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 cursor-pointer rounded-[10px] border border-border py-2.5 text-[13.5px] text-text/70"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={entered.length === 0 || pending}
              className="flex-1 cursor-pointer rounded-[10px] bg-accent py-2.5 text-[13.5px] font-semibold text-ink disabled:opacity-50"
            >
              {pending ? "Recording…" : `Record ${entered.length || ""} count${entered.length === 1 ? "" : "s"}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

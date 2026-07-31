"use client";

import { useState, useTransition } from "react";
import { money } from "@/lib/format";
import { createLiability, deleteLiability } from "@/lib/actions/liabilities";

export type LiabilityDTO = { id: string; name: string; amount: number };

export function LiabilitiesList({ liabilities }: { liabilities: LiabilityDTO[] }) {
  const [showNew, setShowNew] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      {liabilities.length === 0 && !showNew && <div className="text-[13px] text-text/40">None tracked.</div>}
      {liabilities.map((l) => (
        <div key={l.id} className="flex items-center justify-between border-b border-text/[.05] py-[7px] text-[13px]">
          <span className="text-text/65">{l.name}</span>
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-orange">{money(l.amount)}</span>
            <button
              disabled={pending}
              onClick={() => startTransition(() => deleteLiability(l.id))}
              className="cursor-pointer text-[11px] text-text/40 hover:text-orange disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      {showNew ? (
        <form
          action={(fd) =>
            startTransition(async () => {
              await createLiability(fd);
              setShowNew(false);
            })
          }
          className="mt-2 flex gap-2"
        >
          <input
            name="name"
            required
            placeholder="Credit card, loan…"
            className="flex-1 rounded-[8px] border border-border bg-surface-nested px-2.5 py-1.5 text-[12px] text-text outline-none"
          />
          <input
            name="amount"
            type="number"
            step="0.01"
            required
            placeholder="$"
            className="w-[80px] rounded-[8px] border border-border bg-surface-nested px-2.5 py-1.5 text-[12px] text-text outline-none"
          />
          <button type="submit" disabled={pending} className="cursor-pointer rounded-[8px] bg-accent px-2.5 py-1.5 text-[11.5px] font-semibold text-ink disabled:opacity-50">
            Add
          </button>
          <button type="button" onClick={() => setShowNew(false)} className="cursor-pointer text-[11.5px] text-text/50">
            Cancel
          </button>
        </form>
      ) : (
        <button onClick={() => setShowNew(true)} className="mt-2 cursor-pointer text-[11.5px] text-accent hover:text-accent/80">
          + Add liability
        </button>
      )}
    </div>
  );
}

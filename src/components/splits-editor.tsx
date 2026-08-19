"use client";

import { useState, useTransition } from "react";
import { money } from "@/lib/format";
import { addSplit, removeSplit, setSplitsIncludeMerch, updateSplitShare } from "@/lib/actions/settlement";

type Row = { id: string; name: string; role: string | null; sharePct: number; amountCents: number };

const SWATCHES = ["#3fe87a", "#7ab8e8", "#c99df5", "#e8e43f", "#e8983f", "#e87a9a"];

export function SplitsEditor({
  splits,
  totalPct,
  poolNet,
  poolLabel,
  includeMerch,
}: {
  splits: Row[];
  totalPct: number;
  poolNet: number;
  poolLabel: string;
  includeMerch: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [, startTransition] = useTransition();

  // Off by exactly 100 is the only configuration that pays out what people
  // expect; anything else is flagged rather than silently normalised, since
  // "why did I get less than my 20%" is a conversation nobody wants.
  const balanced = Math.abs(totalPct - 100) < 0.005;

  return (
    <>
      <div className="mb-3.5 rounded-card border border-border bg-surface px-5 py-[18px]">
        {splits.length === 0 && !adding && (
          <div className="py-3 text-center">
            <div className="mb-1.5 text-[13.5px] font-semibold">Nobody added yet</div>
            <div className="mx-auto mb-4 max-w-[400px] text-[12.5px] leading-relaxed text-text/50">
              Add everyone who takes a share — band, crew, whoever. They don&rsquo;t need an account here.
            </div>
          </div>
        )}

        {splits.map((s, i) => (
          <SplitRow key={s.id} row={s} color={SWATCHES[i % SWATCHES.length]} />
        ))}

        {adding ? (
          <form
            action={(fd) =>
              startTransition(async () => {
                await addSplit(fd);
                setAdding(false);
              })
            }
            className="mt-3 flex flex-wrap items-end gap-2.5 border-t border-border pt-3.5"
          >
            <label className="flex min-w-[140px] flex-1 flex-col gap-1.5">
              <span className="text-[11.5px] text-text/50">Name</span>
              <input
                name="name"
                required
                autoFocus
                placeholder="Dev Okonkwo"
                className="rounded-[10px] border border-border bg-surface-nested px-3 py-2 text-[13px] outline-none focus:border-accent/50"
              />
            </label>
            <label className="flex min-w-[110px] flex-1 flex-col gap-1.5">
              <span className="text-[11.5px] text-text/50">Role</span>
              <input
                name="role"
                placeholder="Drums"
                className="rounded-[10px] border border-border bg-surface-nested px-3 py-2 text-[13px] outline-none focus:border-accent/50"
              />
            </label>
            <label className="flex w-[92px] flex-col gap-1.5">
              <span className="text-[11.5px] text-text/50">Share %</span>
              <input
                name="share"
                required
                inputMode="decimal"
                placeholder="15"
                className="rounded-[10px] border border-border bg-surface-nested px-3 py-2 text-right font-mono text-[13px] outline-none focus:border-accent/50"
              />
            </label>
            <button type="submit" className="cursor-pointer rounded-[10px] bg-accent px-4 py-2 text-[12.5px] font-semibold text-ink">
              Add
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="cursor-pointer rounded-[10px] border border-border px-4 py-2 text-[12.5px] text-text/70"
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="mt-2 cursor-pointer rounded-[10px] border border-dashed border-text/15 px-3.5 py-2 text-[12.5px] text-text/55 hover:border-text/30"
          >
            + Add person
          </button>
        )}

        {splits.length > 0 && (
          <>
            <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-text/[.06]">
              {splits.map((s, i) => (
                <span key={s.id} style={{ width: `${Math.min(100, s.sharePct)}%`, background: SWATCHES[i % SWATCHES.length] }} />
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-[12.5px]">
              <span className="text-text/50">
                {splits.length} {splits.length === 1 ? "person" : "people"}
              </span>
              <span className={balanced ? "font-semibold text-accent" : "font-semibold text-orange"}>
                {totalPct.toFixed(totalPct % 1 === 0 ? 0 : 2)}% allocated
                {!balanced && ` — ${totalPct > 100 ? "over" : "short"} by ${Math.abs(totalPct - 100).toFixed(2)}%`}
              </span>
            </div>
            {!balanced && (
              <div className="mt-2 text-[12px] leading-relaxed text-text/50">
                Shares still divide the whole amount proportionally, so nothing is lost — but each person gets a different slice
                than the number next to their name suggests. Worth squaring up before anyone is paid.
              </div>
            )}
          </>
        )}
      </div>

      <div className="mb-3.5 rounded-card border border-border bg-surface px-5 py-[18px]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 text-[14.5px] font-semibold">Merch counts toward the split</div>
            <div className="max-w-[500px] text-[12.5px] leading-relaxed text-text/50">
              Off means merch money stays with whoever fronted the print run, and only show income is divided.
            </div>
          </div>
          <button
            onClick={() => startTransition(() => setSplitsIncludeMerch(!includeMerch))}
            role="switch"
            aria-checked={includeMerch}
            aria-label="Merch counts toward the split"
            className={`relative mt-1 h-5 w-9 flex-none cursor-pointer rounded-full transition-colors ${includeMerch ? "bg-accent" : "bg-text/15"}`}
          >
            <span
              className={`absolute top-[3px] h-3.5 w-3.5 rounded-full bg-ink transition-all ${includeMerch ? "left-[19px]" : "left-[3px]"}`}
            />
          </button>
        </div>
      </div>

      <div className="rounded-card border border-accent/25 bg-accent-soft px-5 py-[18px]">
        <div className="mb-1 font-mono text-[10.5px] tracking-[.1em] text-accent/70">POOL TO SPLIT</div>
        <div className={`mb-1.5 font-mono text-[24px] font-bold ${poolNet > 0 ? "text-accent" : "text-text/40"}`}>
          {poolNet > 0 ? money(poolNet) : money(0)}
        </div>
        <div className="text-[12.5px] leading-relaxed text-text/55">
          {poolNet > 0 ? (
            <>
              {poolLabel} net, after costs{includeMerch ? ", merch included" : ", merch excluded"}. Figures above update as the
              tour records money.
            </>
          ) : (
            <>
              {poolLabel === "No tour to settle yet"
                ? "Set up a tour and record a show's money to see real amounts here."
                : `${poolLabel} hasn't cleared its costs yet — shares divide profit, so there's nothing to allocate.`}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function SplitRow({ row, color }: { row: Row; color: string }) {
  const [pct, setPct] = useState(String(row.sharePct));
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3 border-b border-text/[.05] py-2.5 last:border-b-0">
      <div className="grid h-7 w-7 flex-none place-items-center rounded-[7px] text-[12px] font-bold text-ink" style={{ background: color }}>
        {row.name.trim()[0]?.toUpperCase() ?? "?"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold">{row.name}</div>
        {row.role && <div className="truncate text-[11px] text-text/40">{row.role}</div>}
      </div>
      <div className="flex flex-none items-center gap-1 rounded-[8px] border border-border bg-surface-nested px-2.5 py-1.5">
        <input
          value={pct}
          onChange={(e) => setPct(e.target.value)}
          onBlur={() => {
            const n = Number(pct);
            if (Number.isFinite(n) && n !== row.sharePct) startTransition(() => updateSplitShare(row.id, n));
          }}
          inputMode="decimal"
          aria-label={`${row.name} share percent`}
          className="w-9 bg-transparent text-right font-mono text-[12.5px] text-text outline-none"
        />
        <span className="text-[11px] text-text/40">%</span>
      </div>
      <div className="w-[86px] flex-none text-right font-mono text-[12.5px] font-semibold">{money(row.amountCents)}</div>
      <button
        onClick={() => startTransition(() => removeSplit(row.id))}
        disabled={pending}
        aria-label={`Remove ${row.name}`}
        className="flex-none cursor-pointer px-1 text-[14px] text-text/25 hover:text-text/60 disabled:opacity-30"
      >
        ×
      </button>
    </div>
  );
}

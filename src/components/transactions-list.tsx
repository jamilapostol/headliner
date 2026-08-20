"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { money, fmtDateUTC } from "@/lib/format";
import { updateTransaction, deleteTransaction, restoreTransaction } from "@/lib/actions/transactions";
import { TransactionFormModal } from "@/components/transaction-form-modal";

export type TransactionRowDTO = {
  id: string;
  kind: "income" | "expense";
  category: string;
  amount: number;
  source: string | null;
  occurredAt: string; // ISO date
  receiptUrl: string | null;
};

const KIND_CHIPS = ["All", "Income", "Expense"] as const;

export function TransactionsList({ transactions }: { transactions: TransactionRowDTO[] }) {
  const [editing, setEditing] = useState<TransactionRowDTO | null>(null);
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<(typeof KIND_CHIPS)[number]>("All");
  const [toast, setToast] = useState<{ msg: string; undo?: () => void } | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((t) => {
      if (kindFilter !== "All" && t.kind !== kindFilter.toLowerCase()) return false;
      if (!q) return true;
      return t.category.toLowerCase().includes(q) || (t.source ?? "").toLowerCase().includes(q);
    });
  }, [transactions, query, kindFilter]);

  function fireToast(msg: string, undo?: () => void) {
    setToast({ msg, undo });
    setTimeout(() => setToast(null), 6000);
  }

  function remove(t: TransactionRowDTO) {
    startTransition(async () => {
      const deleted = await deleteTransaction(t.id);
      if (!deleted) return;
      fireToast("Transaction deleted", () => startTransition(() => restoreTransaction(deleted)));
    });
  }

  return (
    <div className="relative rounded-card border border-border bg-surface px-5 py-[18px]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
        <div className="text-[14.5px] font-semibold">Transactions</div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search category or source…"
            className="w-[220px] rounded-[10px] border border-border bg-surface-nested px-3 py-1.5 text-[12.5px] text-text outline-none focus:border-accent/50"
          />
          <div className="flex gap-1">
            {KIND_CHIPS.map((c) => (
              <button
                key={c}
                onClick={() => setKindFilter(c)}
                className="cursor-pointer rounded-[20px] px-3 py-1 text-[11.5px]"
                style={{
                  border: `1px solid ${c === kindFilter ? "#3FCB86" : "rgba(var(--border-rgb),.12)"}`,
                  background: c === kindFilter ? "rgba(63,232,122,.1)" : "transparent",
                  color: c === kindFilter ? "#3FCB86" : "rgba(var(--fg-rgb),.6)",
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 && <div className="text-[13px] text-text/40">No transactions match.</div>}
      <div className="flex flex-col">
        {filtered.map((t) => (
          <div key={t.id} className="flex items-center gap-3 border-b border-text/[.05] py-2.5 last:border-b-0">
            {t.receiptUrl ? (
              <Image src={`/api/transactions/${t.id}/receipt`} alt="Receipt" width={64} height={64} className="h-8 w-8 flex-none rounded-md border border-border object-cover" />
            ) : (
              <div className="h-8 w-8 flex-none" />
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold">{t.category}</div>
              <div className="truncate text-[11px] text-text/45">
                {fmtDateUTC(new Date(t.occurredAt), { month: "short", day: "numeric", year: "numeric" })}
                {t.source ? ` · ${t.source}` : ""}
              </div>
            </div>
            <div className={`flex-none font-mono text-[12.5px] ${t.kind === "income" ? "text-accent" : "text-orange"}`}>
              {t.kind === "income" ? "+" : "−"}
              {money(t.amount)}
            </div>
            <div className="flex flex-none items-center gap-2">
              <button onClick={() => setEditing(t)} className="cursor-pointer text-[11.5px] text-text/50 hover:text-text">
                Edit
              </button>
              <button disabled={pending} onClick={() => remove(t)} className="cursor-pointer text-[11.5px] text-orange hover:text-orange/80 disabled:opacity-50">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <TransactionFormModal
          title="Edit transaction"
          submitLabel="Save"
          initial={{
            id: editing.id,
            kind: editing.kind,
            category: editing.category,
            amount: (editing.amount / 100).toString(),
            source: editing.source ?? "",
            occurredAt: editing.occurredAt.slice(0, 10),
            receiptUrl: editing.receiptUrl,
          }}
          onSubmit={(fd) => updateTransaction(editing.id, fd)}
          onClose={() => setEditing(null)}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-accent/35 bg-surface px-4 py-2.5 text-[12.5px] shadow-lg">
          <span className="h-[7px] w-[7px] flex-none rounded-full bg-accent" />
          <span>{toast.msg}</span>
          {toast.undo && (
            <button
              className="cursor-pointer font-semibold text-accent"
              onClick={() => {
                toast.undo?.();
                setToast(null);
              }}
            >
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}

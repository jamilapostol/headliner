"use client";

import { useState, useTransition } from "react";
import { money, fmtDateUTC } from "@/lib/format";
import { updateTransaction, deleteTransaction } from "@/lib/actions/transactions";
import { TransactionFormModal } from "@/components/transaction-form-modal";

export type TransactionRowDTO = {
  id: string;
  kind: "income" | "expense";
  category: string;
  amount: number;
  source: string | null;
  occurredAt: string; // ISO date
};

export function TransactionsList({ transactions }: { transactions: TransactionRowDTO[] }) {
  const [editing, setEditing] = useState<TransactionRowDTO | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-card border border-border bg-surface px-5 py-[18px]">
      <div className="mb-3 text-[14.5px] font-semibold">Transactions</div>
      {transactions.length === 0 && <div className="text-[13px] text-text/40">No transactions logged yet.</div>}
      <div className="flex flex-col">
        {transactions.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-3 border-b border-text/[.05] py-2.5 last:border-b-0">
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
              <button
                disabled={pending}
                onClick={() => {
                  if (!confirm("Delete this transaction?")) return;
                  startTransition(() => deleteTransaction(t.id));
                }}
                className="cursor-pointer text-[11.5px] text-orange hover:text-orange/80 disabled:opacity-50"
              >
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
            kind: editing.kind,
            category: editing.category,
            amount: (editing.amount / 100).toString(),
            source: editing.source ?? "",
            occurredAt: editing.occurredAt.slice(0, 10),
          }}
          onSubmit={(fd) => updateTransaction(editing.id, fd)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

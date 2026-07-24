"use client";

import { useState, useTransition } from "react";
import { createTransaction } from "@/lib/actions/transactions";

export function NewTransactionForm() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="cursor-pointer rounded-lg bg-accent px-3.5 py-1.5 text-[12.5px] font-semibold text-canvas">
        + Add entry
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/60 px-4" onClick={() => setOpen(false)}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[420px] rounded-2xl border border-border bg-surface p-6">
        <div className="mb-4 text-[17px] font-semibold">Add transaction</div>
        <form
          action={(fd) =>
            startTransition(async () => {
              await createTransaction(fd);
              setOpen(false);
            })
          }
          className="flex flex-col gap-3"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-white/50">Type</span>
            <select name="kind" defaultValue="income" className="rounded-[10px] border border-border bg-surface-nested px-3.5 py-2.5 text-[13.5px] text-text outline-none">
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </label>
          <Field label="Category" name="category" placeholder="Performance fees" />
          <Field label="Amount ($)" name="amount" type="number" placeholder="1800" />
          <Field label="Source" name="source" placeholder="Bluebird Theater" />
          <Field label="Date" name="occurredAt" type="date" />
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => setOpen(false)} className="flex-1 cursor-pointer rounded-[10px] border border-border py-2.5 text-[13.5px] text-white/70">
              Cancel
            </button>
            <button type="submit" disabled={pending} className="flex-1 cursor-pointer rounded-[10px] bg-accent py-2.5 text-[13.5px] font-semibold text-canvas disabled:opacity-60">
              {pending ? "Adding…" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, name, placeholder, type = "text" }: { label: string; name: string; placeholder?: string; type?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium text-white/50">{label}</span>
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

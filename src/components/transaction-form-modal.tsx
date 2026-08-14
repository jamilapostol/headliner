"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { categoriesFor } from "@/lib/transaction-categories";

export type TransactionFormValues = {
  kind: "income" | "expense";
  category: string;
  amount: string;
  source: string;
  occurredAt: string;
  receiptUrl?: string | null;
};

export function TransactionFormModal({
  title,
  submitLabel,
  initial,
  onSubmit,
  onClose,
}: {
  title: string;
  submitLabel: string;
  initial?: TransactionFormValues;
  onSubmit: (formData: FormData) => Promise<void>;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [kind, setKind] = useState<"income" | "expense">(initial?.kind ?? "income");
  const categories = categoriesFor(kind);

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[420px] rounded-2xl border border-border bg-surface p-6">
        <div className="mb-4 text-[17px] font-semibold">{title}</div>
        <form
          action={(fd) =>
            startTransition(async () => {
              await onSubmit(fd);
              onClose();
            })
          }
          className="flex flex-col gap-3"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-text/50">Type</span>
            <select
              name="kind"
              value={kind}
              onChange={(e) => setKind(e.target.value === "expense" ? "expense" : "income")}
              className="rounded-[10px] border border-border bg-surface-nested px-3.5 py-2.5 text-[13.5px] text-text outline-none"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-text/50">Category</span>
            <select
              name="category"
              defaultValue={categories.includes(initial?.category ?? "") ? initial?.category : categories[0]}
              key={kind}
              className="rounded-[10px] border border-border bg-surface-nested px-3.5 py-2.5 text-[13.5px] text-text outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <Field label="Amount ($)" name="amount" type="number" placeholder="1800" defaultValue={initial?.amount} />
          <Field label="Source" name="source" placeholder="Bluebird Theater" defaultValue={initial?.source} />
          <Field label="Date" name="occurredAt" type="date" defaultValue={initial?.occurredAt} />
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-text/50">Receipt {initial?.receiptUrl ? "(replace)" : "(optional)"}</span>
            <input
              name="receipt"
              type="file"
              accept="image/*"
              className="rounded-[10px] border border-border bg-surface-nested px-3.5 py-2.5 text-[12.5px] text-text outline-none file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-2.5 file:py-1 file:text-[11px] file:font-semibold file:text-ink"
            />
            {initial?.receiptUrl && (
              <Image src={initial.receiptUrl} alt="Current receipt" width={128} height={128} className="mt-1 h-16 w-16 rounded-lg border border-border object-cover" />
            )}
          </label>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 cursor-pointer rounded-[10px] border border-border py-2.5 text-[13.5px] text-text/70">
              Cancel
            </button>
            <button type="submit" disabled={pending} className="flex-1 cursor-pointer rounded-[10px] bg-accent py-2.5 text-[13.5px] font-semibold text-ink disabled:opacity-60">
              {pending ? "Saving…" : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
  type = "text",
  defaultValue,
}: {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium text-text/50">{label}</span>
      <input
        name={name}
        type={type}
        required
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="rounded-[10px] border border-border bg-surface-nested px-3.5 py-2.5 text-[13.5px] text-text outline-none focus:border-accent/50"
      />
    </label>
  );
}

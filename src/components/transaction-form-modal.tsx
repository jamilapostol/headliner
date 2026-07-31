"use client";

import { useTransition } from "react";

export type TransactionFormValues = {
  kind: "income" | "expense";
  category: string;
  amount: string;
  source: string;
  occurredAt: string;
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
              defaultValue={initial?.kind ?? "income"}
              className="rounded-[10px] border border-border bg-surface-nested px-3.5 py-2.5 text-[13.5px] text-text outline-none"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </label>
          <Field label="Category" name="category" placeholder="Performance fees" defaultValue={initial?.category} />
          <Field label="Amount ($)" name="amount" type="number" placeholder="1800" defaultValue={initial?.amount} />
          <Field label="Source" name="source" placeholder="Bluebird Theater" defaultValue={initial?.source} />
          <Field label="Date" name="occurredAt" type="date" defaultValue={initial?.occurredAt} />
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

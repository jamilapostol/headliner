"use client";

import { useState } from "react";
import { createTransaction } from "@/lib/actions/transactions";
import { TransactionFormModal } from "@/components/transaction-form-modal";

export function NewTransactionForm() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="cursor-pointer rounded-lg bg-accent px-3.5 py-1.5 text-[12.5px] font-semibold text-ink">
        + Add entry
      </button>
    );
  }

  return <TransactionFormModal title="Add transaction" submitLabel="Add" onSubmit={createTransaction} onClose={() => setOpen(false)} />;
}

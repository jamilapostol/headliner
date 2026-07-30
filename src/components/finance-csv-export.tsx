"use client";

import { ExportCsvButton } from "@/components/export-csv-button";
import { toCsv, downloadCsv } from "@/lib/csv-export";
import { planAtLeast } from "@/lib/plan-limits";

export type TransactionDTO = {
  occurredAt: string;
  kind: string;
  category: string;
  amount: number;
  source: string | null;
};

export function FinanceCsvExport({ transactions, plan }: { transactions: TransactionDTO[]; plan: string }) {
  function exportCsv() {
    const csv = toCsv(
      transactions.map((t) => ({
        occurredAt: t.occurredAt,
        kind: t.kind,
        category: t.category,
        amount: (t.amount / 100).toFixed(2),
        source: t.source ?? "",
      })),
      [
        { key: "occurredAt", label: "Date" },
        { key: "kind", label: "Type" },
        { key: "category", label: "Category" },
        { key: "amount", label: "Amount ($)" },
        { key: "source", label: "Source" },
      ]
    );
    downloadCsv("finance.csv", csv);
  }

  return <ExportCsvButton onClick={exportCsv} allowed={planAtLeast(plan, "team")} />;
}

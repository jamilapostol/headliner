import { requireWorkspace } from "@/lib/workspace";
import { db } from "@/lib/db";
import { money, fmtDateUTC } from "@/lib/format";
import { NewTransactionForm } from "@/components/new-transaction-form";
import { CsvImportModal, type CsvColumn } from "@/components/csv-import-modal";
import { importTransactions } from "@/lib/actions/transactions";
import { FinanceCsvExport } from "@/components/finance-csv-export";

const TRANSACTION_CSV_COLUMNS: CsvColumn[] = [
  { key: "kind", label: "Type (income/expense)", aliases: ["type"] },
  { key: "category", label: "Category", required: true },
  { key: "amount", label: "Amount ($)", required: true },
  { key: "source", label: "Source" },
  { key: "occurredAt", label: "Date", required: true, aliases: ["date", "occurred at"] },
];

const SOURCE_COLORS = ["#3fe87a", "#e8e43f", "#7ab8e8", "#e8983f", "#c99df5", "#e87a9a"];

export default async function FinancePage() {
  const { workspace } = await requireWorkspace();
  const year = new Date().getFullYear();
  const yearStart = new Date(year, 0, 1);

  const [transactions, outstanding] = await Promise.all([
    db.transaction.findMany({ where: { workspaceId: workspace.id, occurredAt: { gte: yearStart } }, orderBy: { occurredAt: "desc" } }),
    db.booking.findMany({ where: { workspaceId: workspace.id, stage: "Confirmed" }, orderBy: { date: "asc" } }),
  ]);

  const income = transactions.filter((t) => t.kind === "income");
  const expenses = transactions.filter((t) => t.kind === "expense");

  const bySource = new Map<string, number>();
  for (const t of income) bySource.set(t.category, (bySource.get(t.category) ?? 0) + t.amount);
  const revSources = [...bySource.entries()].sort((a, b) => b[1] - a[1]);
  const maxRev = revSources[0]?.[1] ?? 1;

  const totalRevenue = income.reduce((a, t) => a + t.amount, 0);
  const totalExpenses = expenses.reduce((a, t) => a + t.amount, 0);
  const byExpenseCategory = new Map<string, number>();
  for (const t of expenses) byExpenseCategory.set(t.category, (byExpenseCategory.get(t.category) ?? 0) + t.amount);

  const pnl = [
    { label: "Total revenue", value: money(totalRevenue), color: "text-text", weight: "font-semibold" },
    ...[...byExpenseCategory.entries()].map(([label, amt]) => ({ label, value: "−" + money(amt), color: "text-orange", weight: "font-normal" })),
    { label: "Net (YTD)", value: money(totalRevenue - totalExpenses), color: "text-accent", weight: "font-bold" },
  ];

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-5 sm:px-8 sm:py-7">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-[22px] tracking-[-.02em] sm:text-[26px]">Finance</h1>
        <div className="flex items-center gap-2">
          <CsvImportModal entityLabel="transactions" columns={TRANSACTION_CSV_COLUMNS} onImport={importTransactions} />
          <NewTransactionForm />
        </div>
      </div>
      <div className="mb-5 text-[13px] text-white/50">{year} year to date</div>

      <div className="grid grid-cols-1 items-start gap-3.5 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-card border border-border bg-surface px-5 py-[18px]">
          <div className="mb-4 text-[14.5px] font-semibold">Revenue by source</div>
          <div className="flex flex-col gap-3.5">
            {revSources.length === 0 && <div className="text-[13px] text-white/40">No income logged yet.</div>}
            {revSources.map(([label, amt], i) => (
              <div key={label}>
                <div className="mb-1.5 flex justify-between text-[12.5px]">
                  <span>{label}</span>
                  <span className="font-mono text-white/60">{money(amt)}</span>
                </div>
                <div className="h-2 rounded-full bg-white/[.06]">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${Math.round((amt / maxRev) * 100)}%`, background: SOURCE_COLORS[i % SOURCE_COLORS.length] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="rounded-card border border-border bg-surface px-5 py-[18px]">
            <div className="mb-3 text-[14.5px] font-semibold">P&amp;L snapshot</div>
            {pnl.map((p) => (
              <div key={p.label} className="flex justify-between border-b border-white/[.05] py-[7px] text-[13px]">
                <span className="text-white/65">{p.label}</span>
                <span className={`font-mono ${p.color} ${p.weight}`}>{p.value}</span>
              </div>
            ))}
          </div>
          <div className="rounded-card border border-border bg-surface px-5 py-[18px]">
            <div className="mb-2.5 text-[14.5px] font-semibold">Outstanding (confirmed, unpaid)</div>
            {outstanding.length === 0 && <div className="text-[13px] text-white/40">Nothing outstanding.</div>}
            {outstanding.map((b) => (
              <div key={b.id} className="flex items-center justify-between border-b border-white/[.05] py-2">
                <div>
                  <div className="text-[13px] font-semibold">{b.venue}</div>
                  <div className="text-[11px] text-white/40">{b.city}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[12.5px]">{money(b.fee)}</div>
                  <div className="text-[10.5px] text-white/45">{fmtDateUTC(b.date, { month: "short", day: "numeric" })}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <FinanceCsvExport
        transactions={transactions.map((t) => ({
          occurredAt: fmtDateUTC(t.occurredAt, { month: "short", day: "numeric", year: "numeric" }),
          kind: t.kind,
          category: t.category,
          amount: t.amount,
          source: t.source,
        }))}
      />
    </div>
  );
}

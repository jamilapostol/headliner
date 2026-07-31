import { redirect } from "next/navigation";
import { requireWorkspace } from "@/lib/workspace";
import { db } from "@/lib/db";
import { planAtLeast } from "@/lib/plan-limits";
import { money, fmtDateUTC } from "@/lib/format";
import { NewTransactionForm } from "@/components/new-transaction-form";
import { CsvImportModal, type CsvColumn } from "@/components/csv-import-modal";
import { importTransactions } from "@/lib/actions/transactions";
import { FinanceCsvExport } from "@/components/finance-csv-export";
import { TransactionsList } from "@/components/transactions-list";

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
  if (!planAtLeast(workspace.plan, "pro")) redirect("/app/billing?locked=finance");
  const year = new Date().getFullYear();
  const yearStart = new Date(year, 0, 1);

  const [allTransactions, outstanding, merchItems] = await Promise.all([
    db.transaction.findMany({ where: { workspaceId: workspace.id }, orderBy: { occurredAt: "desc" } }),
    db.booking.findMany({ where: { workspaceId: workspace.id, stage: "Confirmed" }, orderBy: { date: "asc" } }),
    db.merchItem.findMany({ where: { workspaceId: workspace.id } }),
  ]);

  const transactions = allTransactions.filter((t) => t.occurredAt >= yearStart);

  const income = transactions.filter((t) => t.kind === "income");
  const expenses = transactions.filter((t) => t.kind === "expense");

  // Balance sheet — a simplified approximation from the data this app
  // actually tracks (no bank-balance, liabilities, or double-entry
  // ledger), not a formal accountant's balance sheet. Cash is all-time,
  // not YTD, since it's a running balance rather than a period figure.
  const cash = allTransactions.reduce((a, t) => a + (t.kind === "income" ? t.amount : -t.amount), 0);
  const receivable = outstanding.reduce((a, b) => a + Math.max(0, b.fee - (b.depositReceived ? b.deposit : 0)), 0);
  const merchInventoryValue = merchItems.reduce((a, m) => a + m.stock * m.cogs, 0);
  const totalAssets = cash + receivable + merchInventoryValue;
  const totalLiabilities = 0;
  const equity = totalAssets - totalLiabilities;

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
      <div className="mb-5 text-[13px] text-text/50">{year} year to date</div>

      <div className="grid grid-cols-1 items-start gap-3.5 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-card border border-border bg-surface px-5 py-[18px]">
          <div className="mb-4 text-[14.5px] font-semibold">Revenue by source</div>
          <div className="flex flex-col gap-3.5">
            {revSources.length === 0 && <div className="text-[13px] text-text/40">No income logged yet.</div>}
            {revSources.map(([label, amt], i) => (
              <div key={label}>
                <div className="mb-1.5 flex justify-between text-[12.5px]">
                  <span>{label}</span>
                  <span className="font-mono text-text/60">{money(amt)}</span>
                </div>
                <div className="h-2 rounded-full bg-text/[.06]">
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
              <div key={p.label} className="flex justify-between border-b border-text/[.05] py-[7px] text-[13px]">
                <span className="text-text/65">{p.label}</span>
                <span className={`font-mono ${p.color} ${p.weight}`}>{p.value}</span>
              </div>
            ))}
          </div>
          <div className="rounded-card border border-border bg-surface px-5 py-[18px]">
            <div className="mb-2.5 text-[14.5px] font-semibold">Outstanding (confirmed, unpaid)</div>
            {outstanding.length === 0 && <div className="text-[13px] text-text/40">Nothing outstanding.</div>}
            {outstanding.map((b) => (
              <div key={b.id} className="flex items-center justify-between border-b border-text/[.05] py-2">
                <div>
                  <div className="text-[13px] font-semibold">{b.venue}</div>
                  <div className="text-[11px] text-text/40">{b.city}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[12.5px]">{money(b.fee)}</div>
                  <div className="text-[10.5px] text-text/45">{fmtDateUTC(b.date, { month: "short", day: "numeric" })}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-card border border-border bg-surface px-5 py-[18px]">
            <div className="mb-1 text-[14.5px] font-semibold">Balance sheet</div>
            <div className="mb-3 text-[11px] text-text/40">
              A simplified snapshot from your logged transactions, outstanding fees and merch stock — not a formal accountant&rsquo;s statement.
            </div>
            <div className="mb-1.5 font-mono text-[10px] tracking-[.1em] text-text/40">ASSETS</div>
            <Row label="Cash (all-time net)" value={money(cash)} />
            <Row label="Accounts receivable" value={money(receivable)} />
            <Row label="Merch inventory (at cost)" value={money(merchInventoryValue)} />
            <Row label="Total assets" value={money(totalAssets)} weight="font-semibold" />
            <div className="mt-3 mb-1.5 font-mono text-[10px] tracking-[.1em] text-text/40">LIABILITIES</div>
            <Row label="None tracked" value={money(totalLiabilities)} />
            <div className="mt-3 flex justify-between border-t border-text/10 py-[9px] text-[13px]">
              <span className="font-semibold text-text/80">Equity</span>
              <span className="font-mono font-bold text-accent">{money(equity)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3.5">
        <TransactionsList
          transactions={transactions.map((t) => ({
            id: t.id,
            kind: t.kind,
            category: t.category,
            amount: t.amount,
            source: t.source,
            occurredAt: t.occurredAt.toISOString(),
          }))}
        />
      </div>

      <FinanceCsvExport
        plan={workspace.plan}
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

function Row({ label, value, weight = "font-normal" }: { label: string; value: string; weight?: string }) {
  return (
    <div className="flex justify-between border-b border-text/[.05] py-[7px] text-[13px]">
      <span className="text-text/65">{label}</span>
      <span className={`font-mono ${weight}`}>{value}</span>
    </div>
  );
}

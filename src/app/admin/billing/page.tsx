import { db } from "@/lib/db";
import { stripe, stripeEnabled } from "@/lib/stripe";
import { money } from "@/lib/format";

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  active: { bg: "rgba(63,232,122,.1)", color: "#3FCB86" },
  trialing: { bg: "rgba(63,180,232,.1)", color: "#38B6E8" },
  past_due: { bg: "rgba(232,163,63,.1)", color: "#FF7A2F" },
  unpaid: { bg: "rgba(232,83,63,.1)", color: "#F4356E" },
  canceled: { bg: "rgba(var(--border-rgb),.1)", color: "rgba(var(--fg-rgb),.5)" },
  incomplete: { bg: "rgba(232,83,63,.1)", color: "#F4356E" },
  incomplete_expired: { bg: "rgba(232,83,63,.1)", color: "#F4356E" },
};

type Row = {
  workspaceId: string;
  name: string;
  plan: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
  nextInvoiceAmount: number | null;
  nextInvoiceDate: Date | null;
  paymentFailed: boolean;
  error?: string;
};

export default async function AdminBillingPage() {
  const workspaces = await db.workspace.findMany({
    where: { stripeSubId: { not: null } },
    orderBy: { createdAt: "desc" },
  });

  let rows: Row[] = [];

  if (stripeEnabled && stripe) {
    const client = stripe;
    rows = await Promise.all(
      workspaces.map(async (w): Promise<Row> => {
        try {
          const sub = await client.subscriptions.retrieve(w.stripeSubId as string, {
            expand: ["latest_invoice"],
          });
          const latestInvoice = typeof sub.latest_invoice === "object" ? sub.latest_invoice : null;
          const item = sub.items.data[0];
          return {
            workspaceId: w.id,
            name: w.name,
            plan: w.plan,
            status: sub.status,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : null,
            nextInvoiceAmount: latestInvoice ? latestInvoice.amount_due : null,
            nextInvoiceDate: latestInvoice?.due_date ? new Date(latestInvoice.due_date * 1000) : null,
            paymentFailed: latestInvoice?.status === "open" && (latestInvoice.attempt_count ?? 0) > 0,
          };
        } catch (err) {
          return {
            workspaceId: w.id,
            name: w.name,
            plan: w.plan,
            status: "unknown",
            cancelAtPeriodEnd: false,
            currentPeriodEnd: null,
            nextInvoiceAmount: null,
            nextInvoiceDate: null,
            paymentFailed: false,
            error: err instanceof Error ? err.message : "Failed to fetch",
          };
        }
      })
    );
  }

  const atRisk = rows.filter((r) => r.status === "past_due" || r.status === "unpaid" || r.paymentFailed);

  return (
    <div className="max-w-[1150px]">
      <h1 className="mb-1 text-[22px] tracking-[-.02em]">Billing health</h1>
      <div className="mb-6 text-[13px] text-text/50">
        Live Stripe subscription state for workspaces with a subscription on file — not the manually-overridable{" "}
        <span className="font-mono text-text/70">plan</span> field.
      </div>

      {!stripeEnabled && (
        <div className="mb-6 flex items-center gap-3 rounded-[10px] border border-orange/30 bg-orange/[.06] px-4 py-3">
          <div className="text-[13px] text-text/70">
            <strong className="text-orange">Stripe not configured.</strong> Set <code className="text-text/85">STRIPE_SECRET_KEY</code> to see live
            subscription status here.
          </div>
        </div>
      )}

      {stripeEnabled && workspaces.length === 0 && (
        <div className="rounded-card border border-border bg-surface px-[18px] py-7 text-center text-[13px] text-text/40">
          No workspace has a Stripe subscription on file yet.
        </div>
      )}

      {stripeEnabled && atRisk.length > 0 && (
        <div className="mb-4 rounded-[10px] border border-orange/30 bg-orange/[.06] px-4 py-3 text-[13px] text-orange">
          {atRisk.length} workspace{atRisk.length === 1 ? "" : "s"} at risk — past due, unpaid, or a recent payment attempt failed.
        </div>
      )}

      {stripeEnabled && workspaces.length > 0 && (
        <div className="overflow-x-auto rounded-card border border-border bg-surface">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr_1fr] gap-3 border-b border-border px-[18px] py-[11px] font-label text-[10.5px] tracking-[.1em] text-text/40">
              <div>WORKSPACE</div>
              <div>PLAN</div>
              <div>STATUS</div>
              <div>RENEWS</div>
              <div>NEXT INVOICE</div>
              <div>DUE</div>
            </div>
            {rows.map((r) => (
              <div key={r.workspaceId} className="grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr_1fr] items-center gap-3 border-b border-text/[.05] px-[18px] py-3 last:border-b-0 hover:bg-text/[.03]">
                <div>
                  <div className="text-[13px] font-semibold">{r.name}</div>
                  {r.error && <div className="text-[10.5px] text-orange">{r.error}</div>}
                </div>
                <div className="text-[12.5px] text-text/60">{r.plan}</div>
                <div>
                  <span
                    className="inline-block rounded-full px-2.5 py-[3px] font-label text-[10px] tracking-[.05em]"
                    style={{ background: (STATUS_STYLE[r.status] ?? STATUS_STYLE.canceled).bg, color: (STATUS_STYLE[r.status] ?? STATUS_STYLE.canceled).color }}
                  >
                    {r.status.replace("_", " ").toUpperCase()}
                  </span>
                  {r.cancelAtPeriodEnd && <div className="mt-0.5 text-[10.5px] text-orange">Cancels at period end</div>}
                </div>
                <div className="text-[11.5px] text-text/50">
                  {r.currentPeriodEnd ? r.currentPeriodEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }) : "—"}
                </div>
                <div className="font-mono text-[12.5px] text-text/70">{r.nextInvoiceAmount != null ? money(r.nextInvoiceAmount) : "—"}</div>
                <div className="text-[11.5px] text-text/50">
                  {r.nextInvoiceDate ? r.nextInvoiceDate.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }) : "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

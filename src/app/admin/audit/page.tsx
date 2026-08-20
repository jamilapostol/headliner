import { db } from "@/lib/db";

const ACTION_LABEL: Record<string, string> = {
  "workspace.plan.update": "Plan override",
  "record.create": "Record created",
  "record.update": "Record updated",
  "record.delete": "Record deleted",
  "impersonate.start": "Impersonation started",
  "impersonate.stop": "Impersonation stopped",
};

export default async function AdminAuditPage() {
  const entries = await db.adminAuditLog.findMany({ orderBy: { createdAt: "desc" }, take: 300 });

  return (
    <div className="max-w-[1150px]">
      <h1 className="mb-1 text-[22px] tracking-[-.02em]">Audit log</h1>
      <div className="mb-6 text-[13px] text-text/50">Most recent 300 admin actions — plan overrides, raw record edits, and impersonation.</div>

      <div className="overflow-x-auto rounded-card border border-border bg-surface">
        <div className="min-w-[820px]">
          <div className="grid grid-cols-[1fr_1.4fr_1.6fr_2.4fr_1fr] gap-3 border-b border-border px-[18px] py-[11px] font-label text-[10.5px] tracking-[.1em] text-text/40">
            <div>WHEN</div>
            <div>ADMIN</div>
            <div>ACTION</div>
            <div>DETAIL</div>
            <div>TARGET</div>
          </div>
          {entries.map((e) => (
            <div key={e.id} className="grid grid-cols-[1fr_1.4fr_1.6fr_2.4fr_1fr] items-start gap-3 border-b border-text/[.05] px-[18px] py-3 last:border-b-0 hover:bg-text/[.03]">
              <div className="text-[11.5px] text-text/50">
                {e.createdAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" })}
              </div>
              <div className="truncate text-[12.5px]">{e.adminEmail}</div>
              <div className="text-[12.5px] text-text/70">{ACTION_LABEL[e.action] ?? e.action}</div>
              <div className="truncate font-mono text-[11.5px] text-text/45" title={e.detail ?? undefined}>
                {e.detail ?? "—"}
              </div>
              <div>
                <div className="text-[11px] text-text/50">{e.targetType}</div>
                <div className="truncate font-mono text-[10px] text-text/35">{e.targetId}</div>
              </div>
            </div>
          ))}
          {entries.length === 0 && <div className="px-[18px] py-7 text-center text-[13px] text-text/40">No admin actions recorded yet.</div>}
        </div>
      </div>
    </div>
  );
}

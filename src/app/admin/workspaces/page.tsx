import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { fmtDateUTC } from "@/lib/format";
import { AdminPlanForm } from "@/components/admin-plan-form";

export default async function AdminWorkspacesPage() {
  const workspaces = await db.workspace.findMany({
    orderBy: { createdAt: "desc" },
    include: { memberships: { orderBy: { createdAt: "asc" } } },
  });

  const admin = createAdminClient();
  const { data: usersData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const usersById = new Map(usersData?.users.map((u) => [u.id, u]) ?? []);

  return (
    <div className="max-w-[1150px]">
      <h1 className="mb-1 text-[22px] tracking-[-.02em]">Workspaces</h1>
      <div className="mb-6 text-[13px] text-text/50">{workspaces.length} total. Change a workspace&rsquo;s plan directly — no Stripe round-trip.</div>

      <div className="overflow-x-auto rounded-card border border-border bg-surface">
        <div className="min-w-[880px]">
          <div className="grid grid-cols-[1.6fr_1fr_1.6fr_1fr_1fr] gap-3 border-b border-border px-[18px] py-[11px] font-mono text-[10.5px] tracking-[.1em] text-text/40">
            <div>WORKSPACE</div>
            <div>MEMBERS</div>
            <div>OWNER</div>
            <div>CREATED</div>
            <div>PLAN</div>
          </div>
          {workspaces.map((w) => {
            const owner = usersById.get(w.memberships[0]?.userId ?? "");
            return (
              <div key={w.id} className="grid grid-cols-[1.6fr_1fr_1.6fr_1fr_1fr] items-center gap-3 border-b border-white/[.05] px-[18px] py-3 last:border-b-0 hover:bg-white/[.02]">
                <div>
                  <div className="text-[13px] font-semibold">{w.name}</div>
                  <div className="font-mono text-[10px] text-text/35">{w.id}</div>
                </div>
                <div className="text-[12.5px] text-text/60">{w.memberships.length}</div>
                <div className="truncate text-[12px] text-text/60">{owner?.email ?? "—"}</div>
                <div className="text-[11.5px] text-text/50">{fmtDateUTC(w.createdAt, { month: "short", day: "numeric", year: "numeric" })}</div>
                <AdminPlanForm workspaceId={w.id} plan={w.plan} billingCycle={w.billingCycle} />
              </div>
            );
          })}
          {workspaces.length === 0 && <div className="px-[18px] py-7 text-center text-[13px] text-text/40">No workspaces yet.</div>}
        </div>
      </div>
    </div>
  );
}

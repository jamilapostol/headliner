import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminWorkspacesTable, type WorkspaceRow } from "@/components/admin-workspaces-table";

export default async function AdminWorkspacesPage() {
  const workspaces = await db.workspace.findMany({
    orderBy: { createdAt: "desc" },
    include: { memberships: { orderBy: { createdAt: "asc" } } },
  });

  const admin = createAdminClient();
  const { data: usersData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const usersById = new Map(usersData?.users.map((u) => [u.id, u]) ?? []);

  const rows: WorkspaceRow[] = workspaces.map((w) => ({
    id: w.id,
    name: w.name,
    plan: w.plan,
    billingCycle: w.billingCycle,
    memberCount: w.memberships.length,
    ownerEmail: usersById.get(w.memberships[0]?.userId ?? "")?.email ?? null,
    createdAt: w.createdAt.toISOString(),
  }));

  return (
    <div className="max-w-[1250px]">
      <h1 className="mb-1 text-[22px] tracking-[-.02em]">Workspaces</h1>
      <div className="mb-6 text-[13px] text-text/50">{workspaces.length} total. Change a workspace&rsquo;s plan directly — no Stripe round-trip.</div>
      <AdminWorkspacesTable workspaces={rows} />
    </div>
  );
}

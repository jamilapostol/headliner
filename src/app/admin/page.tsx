import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { fmtDateUTC } from "@/lib/format";

const PLAN_LABEL: Record<string, string> = { free: "Free", pro: "Pro Artist", touring: "Touring Artist", team: "Management Team" };

export default async function AdminOverviewPage() {
  const [workspaces, planCounts, recentWorkspaces] = await Promise.all([
    db.workspace.count(),
    db.workspace.groupBy({ by: ["plan"], _count: { plan: true } }),
    db.workspace.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { memberships: { orderBy: { createdAt: "asc" }, take: 1 } } }),
  ]);

  const admin = createAdminClient();
  const { data: usersData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const totalUsers = usersData?.users.length ?? 0;
  const usersById = new Map(usersData?.users.map((u) => [u.id, u]) ?? []);

  const countByPlan = Object.fromEntries(planCounts.map((p) => [p.plan, p._count.plan]));
  const paidWorkspaces = (countByPlan.pro ?? 0) + (countByPlan.touring ?? 0) + (countByPlan.team ?? 0);

  const stats = [
    { label: "WORKSPACES", value: String(workspaces) },
    { label: "USERS", value: String(totalUsers) },
    { label: "PAID WORKSPACES", value: String(paidWorkspaces) },
    { label: "FREE WORKSPACES", value: String(countByPlan.free ?? 0) },
  ];

  return (
    <div className="max-w-[1000px]">
      <h1 className="mb-1 text-[22px] tracking-[-.02em]">Overview</h1>
      <div className="mb-6 text-[13px] text-text/50">Admin-only — visible because your email is on the ADMIN_EMAILS allowlist.</div>

      <div className="mb-8 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-card border border-border bg-surface px-[18px] py-4">
            <div className="mb-2 font-mono text-[10.5px] tracking-[.1em] text-text/45">{s.label}</div>
            <div className="text-[24px] font-bold tracking-[-.02em]">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="mb-8 rounded-card border border-border bg-surface px-5 py-[18px]">
        <div className="mb-3 text-[14.5px] font-semibold">Sign-ups by tier</div>
        <div className="flex flex-col gap-2.5">
          {(["free", "pro", "touring", "team"] as const).map((plan) => {
            const count = countByPlan[plan] ?? 0;
            const pct = workspaces ? Math.round((count / workspaces) * 100) : 0;
            return (
              <div key={plan}>
                <div className="mb-1 flex justify-between text-[12.5px]">
                  <span>{PLAN_LABEL[plan]}</span>
                  <span className="font-mono text-text/50">
                    {count} · {pct}%
                  </span>
                </div>
                <div className="h-[7px] rounded-full bg-text/[.06]">
                  <div className="h-[7px] rounded-full bg-accent" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-card border border-border bg-surface px-5 py-[18px]">
        <div className="mb-3 text-[14.5px] font-semibold">Recent sign-ups</div>
        <div className="flex flex-col">
          {recentWorkspaces.map((w) => {
            const owner = usersById.get(w.memberships[0]?.userId ?? "");
            return (
              <div key={w.id} className="flex items-center justify-between border-b border-text/[.05] py-2.5 last:border-b-0">
                <div>
                  <div className="text-[13px] font-semibold">{w.name}</div>
                  <div className="text-[11.5px] text-text/45">{owner?.email ?? "—"}</div>
                </div>
                <div className="text-right">
                  <div className="text-[12px] text-accent">{PLAN_LABEL[w.plan]}</div>
                  <div className="text-[10.5px] text-text/40">{fmtDateUTC(w.createdAt, { month: "short", day: "numeric", year: "numeric" })}</div>
                </div>
              </div>
            );
          })}
          {recentWorkspaces.length === 0 && <div className="py-4 text-center text-[13px] text-text/40">No workspaces yet.</div>}
        </div>
      </div>
    </div>
  );
}

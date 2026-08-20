"use client";

import { useMemo, useState } from "react";
import { fmtDateUTC } from "@/lib/format";
import { AdminPlanForm } from "@/components/admin-plan-form";
import { AdminImpersonateButton } from "@/components/admin-impersonate-button";
import { AdminDeleteWorkspaceButton } from "@/components/admin-delete-workspace-button";

export type WorkspaceRow = {
  id: string;
  name: string;
  plan: string;
  billingCycle: string;
  memberCount: number;
  ownerEmail: string | null;
  createdAt: string;
};

const PLANS = ["all", "free", "pro", "touring", "team", "beta"] as const;

export function AdminWorkspacesTable({ workspaces }: { workspaces: WorkspaceRow[] }) {
  const [query, setQuery] = useState("");
  const [plan, setPlan] = useState<(typeof PLANS)[number]>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return workspaces.filter((w) => {
      if (plan !== "all" && w.plan !== plan) return false;
      if (!q) return true;
      return w.name.toLowerCase().includes(q) || (w.ownerEmail ?? "").toLowerCase().includes(q) || w.id.toLowerCase().includes(q);
    });
  }, [workspaces, query, plan]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, owner email, or ID…"
          className="w-full max-w-[320px] rounded-[10px] border border-border bg-surface-nested px-3.5 py-2 text-[13px] text-text outline-none focus:border-accent/50"
        />
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value as (typeof PLANS)[number])}
          className="rounded-[10px] border border-border bg-surface-nested px-3 py-2 text-[13px] text-text outline-none"
        >
          {PLANS.map((p) => (
            <option key={p} value={p}>
              {p === "all" ? "All plans" : p}
            </option>
          ))}
        </select>
        <div className="text-[12px] text-text/40">
          {filtered.length} of {workspaces.length}
        </div>
      </div>

      <div className="overflow-x-auto rounded-card border border-border bg-surface">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[1.6fr_1fr_1.6fr_1fr_1fr_auto] gap-3 border-b border-border px-[18px] py-[11px] font-label text-[10.5px] tracking-[.1em] text-text/40">
            <div>WORKSPACE</div>
            <div>MEMBERS</div>
            <div>OWNER</div>
            <div>CREATED</div>
            <div>PLAN</div>
            <div />
          </div>
          {filtered.map((w) => (
            <div key={w.id} className="grid grid-cols-[1.6fr_1fr_1.6fr_1fr_1fr_auto] items-center gap-3 border-b border-text/[.05] px-[18px] py-3 last:border-b-0 hover:bg-text/[.03]">
              <div>
                <div className="text-[13px] font-semibold">{w.name}</div>
                <div className="font-mono text-[10px] text-text/35">{w.id}</div>
              </div>
              <div className="text-[12.5px] text-text/60">{w.memberCount}</div>
              <div className="truncate text-[12px] text-text/60">{w.ownerEmail ?? "—"}</div>
              <div className="text-[11.5px] text-text/50">{fmtDateUTC(new Date(w.createdAt), { month: "short", day: "numeric", year: "numeric" })}</div>
              <AdminPlanForm workspaceId={w.id} plan={w.plan} billingCycle={w.billingCycle} />
              <div className="flex items-center gap-2">
                <AdminImpersonateButton workspaceId={w.id} />
                <AdminDeleteWorkspaceButton workspaceId={w.id} name={w.name} />
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="px-[18px] py-7 text-center text-[13px] text-text/40">No workspaces match.</div>}
        </div>
      </div>
    </div>
  );
}

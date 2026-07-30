"use client";

import { useState, useTransition } from "react";
import { adminUpdateWorkspacePlan } from "@/lib/actions/admin";

const PLANS = ["free", "pro", "touring", "team", "beta"] as const;
const CYCLES = ["monthly", "annual"] as const;

export function AdminPlanForm({ workspaceId, plan, billingCycle }: { workspaceId: string; plan: string; billingCycle: string }) {
  const [selectedPlan, setSelectedPlan] = useState(plan);
  const [selectedCycle, setSelectedCycle] = useState(billingCycle);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const dirty = selectedPlan !== plan || selectedCycle !== billingCycle;

  function save() {
    startTransition(async () => {
      await adminUpdateWorkspacePlan(workspaceId, selectedPlan, selectedCycle);
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={selectedPlan}
        onChange={(e) => setSelectedPlan(e.target.value)}
        className="rounded-md border border-border bg-canvas px-2 py-1 text-[11.5px] text-text outline-none"
      >
        {PLANS.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <select
        value={selectedCycle}
        onChange={(e) => setSelectedCycle(e.target.value)}
        className="rounded-md border border-border bg-canvas px-2 py-1 text-[11.5px] text-text outline-none"
      >
        {CYCLES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      {dirty && (
        <button
          onClick={save}
          disabled={pending}
          className="cursor-pointer rounded-md bg-accent px-2.5 py-1 text-[11px] font-semibold text-ink disabled:opacity-50"
        >
          {pending ? "…" : "Save"}
        </button>
      )}
      {saved && <span className="text-[11px] text-accent">Saved</span>}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { INTEGRATIONS } from "@/lib/integrations";
import { toggleIntegration } from "@/lib/actions/integrations";

export function IntegrationsPanel({ connected }: { connected: Record<string, boolean> }) {
  const [optimistic, setOptimistic] = useState<{ key: string; value: boolean } | null>(null);
  const [, startTransition] = useTransition();

  function toggle(key: string) {
    if (optimistic) return; // one in-flight toggle at a time — avoids races from rapid clicks
    const next = !(connected[key] ?? false);
    setOptimistic({ key, value: next });
    startTransition(async () => {
      try {
        await toggleIntegration(key);
      } finally {
        setOptimistic(null);
      }
    });
  }

  return (
    <section className="rounded-card border border-border bg-surface p-5">
      <div className="mb-1 text-[13.5px] font-semibold">Integrations</div>
      <div className="mb-4 text-[12px] text-white/45">Connect what you use — imports contacts, shows and sales. All optional.</div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {INTEGRATIONS.map((ig) => {
          const isPending = optimistic?.key === ig.key;
          const on = isPending ? optimistic!.value : !!connected[ig.key];
          return (
            <button
              key={ig.key}
              type="button"
              onClick={() => toggle(ig.key)}
              disabled={optimistic !== null}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors hover:border-accent/50 disabled:cursor-default ${
                on ? "border-accent/50 bg-accent-soft" : "border-white/[.08] bg-surface-nested"
              } ${optimistic && !isPending ? "opacity-50" : "cursor-pointer"}`}
            >
              <div className="grid h-8 w-8 flex-none place-items-center rounded-lg font-mono text-[12px] font-bold text-canvas" style={{ background: ig.chipBg }}>
                {ig.chip}
              </div>
              <div className="flex-1">
                <div className="text-[13.5px] font-semibold">{ig.label}</div>
                <div className="text-[11px] text-white/45">{ig.sub}</div>
              </div>
              <div className={`font-mono text-[12px] ${on ? "text-accent" : "text-white/40"}`}>
                {isPending ? "…" : on ? "CONNECTED" : "CONNECT"}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

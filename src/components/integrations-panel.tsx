"use client";

import { useTransition } from "react";
import { INTEGRATIONS } from "@/lib/integrations";
import { toggleIntegration } from "@/lib/actions/integrations";

export function IntegrationsPanel({ connected }: { connected: Record<string, boolean> }) {
  const [, startTransition] = useTransition();

  return (
    <section className="rounded-card border border-border bg-surface p-5">
      <div className="mb-1 text-[13.5px] font-semibold">Integrations</div>
      <div className="mb-4 text-[12px] text-white/45">Connect what you use — imports contacts, shows and sales. All optional.</div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {INTEGRATIONS.map((ig) => {
          const on = !!connected[ig.key];
          return (
            <div
              key={ig.key}
              onClick={() => startTransition(() => toggleIntegration(ig.key))}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3.5 hover:border-accent/50 ${
                on ? "border-accent/50 bg-accent-soft" : "border-white/[.08] bg-surface-nested"
              }`}
            >
              <div className="grid h-8 w-8 flex-none place-items-center rounded-lg font-mono text-[12px] font-bold text-canvas" style={{ background: ig.chipBg }}>
                {ig.chip}
              </div>
              <div className="flex-1">
                <div className="text-[13.5px] font-semibold">{ig.label}</div>
                <div className="text-[11px] text-white/45">{ig.sub}</div>
              </div>
              <div className={`font-mono text-[12px] ${on ? "text-accent" : "text-white/40"}`}>{on ? "CONNECTED" : "CONNECT"}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

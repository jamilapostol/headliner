import { INTEGRATIONS } from "@/lib/integrations";

// Honest roadmap panel — no OAuth exists for these yet, so nothing here
// pretends to connect. When an integration ships, its tile becomes a real
// connect flow and this copy goes away.
export function IntegrationsPanel() {
  return (
    <section className="rounded-card border border-border bg-surface p-5">
      <div className="mb-1 text-[13.5px] font-semibold">Integrations</div>
      <div className="mb-4 text-[12px] text-text/45">
        On the roadmap — these aren&apos;t live yet, and we&apos;d rather say so than show you a connect button that doesn&apos;t connect.
        Want one of these first? Tell us at{" "}
        <a href="mailto:support@headline.world" className="text-accent hover:underline">
          support@headline.world
        </a>
        .
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {INTEGRATIONS.map((ig) => (
          <div
            key={ig.key}
            className="flex items-center gap-3 rounded-xl border border-text/[.08] bg-surface-nested px-4 py-3.5"
          >
            <div
              className="grid h-8 w-8 flex-none place-items-center rounded-lg font-mono text-[12px] font-bold text-ink opacity-70"
              style={{ background: ig.chipBg }}
            >
              {ig.chip}
            </div>
            <div className="flex-1">
              <div className="text-[13.5px] font-semibold">{ig.label}</div>
              <div className="text-[11px] text-text/45">{ig.sub}</div>
            </div>
            <div className="rounded-full border border-border px-2.5 py-1 font-label text-[10px] tracking-[.08em] text-text/45">SOON</div>
          </div>
        ))}
      </div>
    </section>
  );
}

import { requireAdmin } from "@/lib/admin";
import { runIntegrationProbes, type ProbeStatus } from "@/lib/integration-health";

// Integration health. Every probe here calls the real service, because the
// xEnabled flags only prove an env var is non-empty — and a non-empty wrong
// value is the dangerous case: it turns graceful degradation into a hard
// failure exactly when someone tries to use the feature.

export const dynamic = "force-dynamic";

const TONE: Record<ProbeStatus, { dot: string; label: string; className: string }> = {
  ok: { dot: "#3FCB86", label: "OK", className: "text-accent" },
  degraded: { dot: "#FF7A2F", label: "DEGRADED", className: "text-orange" },
  off: { dot: "rgba(var(--fg-rgb),.3)", label: "OFF", className: "text-text/45" },
  error: { dot: "#F4356E", label: "ERROR", className: "text-pink" },
};

export default async function AdminHealthPage() {
  await requireAdmin();
  const probes = await runIntegrationProbes();

  const broken = probes.filter((p) => p.status === "error").length;
  const degraded = probes.filter((p) => p.status === "degraded").length;

  return (
    <div className="max-w-[900px]">
      <h1 className="mb-1 text-[22px] tracking-[-.02em]">Integration health</h1>
      <div className="mb-6 text-[13px] text-text/50">
        Live checks, run each time you open this page. A key being <em>set</em> isn&rsquo;t the same as it working — a wrong key
        makes a feature fail hard rather than degrade, and nothing else surfaces that.
      </div>

      <div
        className={`mb-6 rounded-card border px-[18px] py-3.5 text-[13px] ${
          broken ? "border-pink/30 bg-pink/[.06]" : degraded ? "border-orange/30 bg-orange/[.06]" : "border-accent/25 bg-accent-soft"
        }`}
      >
        {broken > 0
          ? `${broken} integration${broken === 1 ? "" : "s"} failing. Users hit these as errors, not fallbacks.`
          : degraded > 0
            ? `${degraded} integration${degraded === 1 ? "" : "s"} degraded — working, but not fully configured.`
            : "All integrations responding."}
      </div>

      <div className="flex flex-col gap-2.5">
        {probes.map((p) => {
          const tone = TONE[p.status];
          return (
            <div key={p.name} className="rounded-card border border-border bg-surface px-[18px] py-4">
              <div className="mb-1.5 flex items-center gap-2.5">
                <span className="h-[7px] w-[7px] flex-none rounded-full" style={{ background: tone.dot }} />
                <span className="text-[14px] font-semibold">{p.name}</span>
                <span className={`ml-auto font-label text-[10.5px] tracking-[.1em] ${tone.className}`}>{tone.label}</span>
              </div>
              <div className="text-[13px] leading-relaxed text-text/65">{p.detail}</div>
              {p.fix && <div className="mt-1.5 text-[12.5px] text-text/45">Fix: {p.fix}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

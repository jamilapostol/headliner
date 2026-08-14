import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { fmtDateUTC } from "@/lib/format";

// Server-action failures, newest first, plus a frequency roll-up. Before
// this existed every one of these produced a friendly message to the user
// and a line in a Vercel runtime log nobody reads — which during a beta is
// the difference between hearing about a bug and not.

export const dynamic = "force-dynamic";

export default async function AdminErrorsPage() {
  await requireAdmin();

  const since = new Date(Date.now() - 7 * 86_400_000);
  const [recent, byLabel, total] = await Promise.all([
    db.actionError.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    db.actionError.groupBy({ by: ["label"], where: { createdAt: { gte: since } }, _count: true, orderBy: { _count: { label: "desc" } } }),
    db.actionError.count({ where: { createdAt: { gte: since } } }),
  ]);

  return (
    <div className="max-w-[1000px]">
      <h1 className="mb-1 text-[22px] tracking-[-.02em]">Errors</h1>
      <div className="mb-6 text-[13px] text-text/50">
        Every server action that threw. Users saw a friendly message; this is what actually happened.
      </div>

      <div className="mb-6 rounded-card border border-border bg-surface px-[18px] py-4">
        <div className="mb-2 font-mono text-[10.5px] tracking-[.1em] text-text/45">LAST 7 DAYS</div>
        {total === 0 ? (
          <div className="text-[13.5px] text-text/55">No server-action failures. Either it&rsquo;s genuinely quiet or nobody&rsquo;s using it — check the beta cohort to tell which.</div>
        ) : (
          <>
            <div className="mb-2.5 text-[24px] font-bold tracking-[-.02em]">{total}</div>
            <div className="flex flex-col gap-1">
              {byLabel.map((g) => (
                <div key={g.label} className="flex items-baseline gap-2.5 text-[13px]">
                  <span className="font-mono text-[12px] text-text/70">{g.label}</span>
                  <span className="text-text/35">·</span>
                  <span className="text-text/55">
                    {g._count} {g._count === 1 ? "failure" : "failures"}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {recent.length > 0 && (
        <div className="flex flex-col gap-2">
          {recent.map((e) => (
            <details key={e.id} className="rounded-card border border-border bg-surface px-[18px] py-3.5">
              <summary className="cursor-pointer list-none">
                <span className="font-mono text-[12px] text-orange">{e.label}</span>
                <span className="ml-2.5 text-[13px] text-text/70">{e.message}</span>
                <span className="ml-2.5 font-mono text-[11px] text-text/35">
                  {fmtDateUTC(e.createdAt, { month: "short", day: "numeric" })} {e.createdAt.toISOString().slice(11, 16)}Z
                </span>
              </summary>
              {e.stack && (
                <pre className="mt-2.5 overflow-x-auto rounded-lg bg-canvas p-3 font-mono text-[11px] leading-relaxed text-text/55">{e.stack}</pre>
              )}
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { ADMIN_MODELS } from "@/lib/admin-models";

export default async function AdminDataIndexPage() {
  const counts = await Promise.all(ADMIN_MODELS.map((m) => m.delegate.findMany().then((rows: unknown[]) => rows.length)));

  return (
    <div className="max-w-[1000px]">
      <h1 className="mb-1 text-[22px] tracking-[-.02em]">Data browser</h1>
      <div className="mb-6 text-[13px] text-text/50">
        Direct read/write access to every table. There are no guardrails here beyond what the app itself enforces — changes take effect immediately.
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {ADMIN_MODELS.map((m, i) => (
          <Link
            key={m.key}
            href={`/admin/data/${m.key}`}
            className="rounded-card border border-border bg-surface px-4 py-3.5 hover:border-accent/40"
          >
            <div className="text-[13.5px] font-semibold">{m.label}</div>
            <div className="mt-1 font-mono text-[11px] text-text/45">{counts[i]} rows</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

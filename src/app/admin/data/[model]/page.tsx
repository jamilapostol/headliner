import Link from "next/link";
import { notFound } from "next/navigation";
import { getModelDef } from "@/lib/admin-models";
import { AdminDeleteButton } from "@/components/admin-delete-button";

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

export default async function AdminModelPage({ params }: { params: Promise<{ model: string }> }) {
  const { model: modelKey } = await params;
  const model = getModelDef(modelKey);
  if (!model) notFound();

  const rows: Record<string, unknown>[] = await model.delegate.findMany({ orderBy: model.orderBy, take: 200 });
  const columns = model.fields.filter((f) => f.type !== "text");

  return (
    <div className="max-w-[1300px]">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-[22px] tracking-[-.02em]">{model.label}</h1>
        <Link href={`/admin/data/${model.key}/new`} className="rounded-lg bg-accent px-3.5 py-1.5 text-[12.5px] font-semibold text-ink">
          + New
        </Link>
      </div>
      <div className="mb-6 text-[13px] text-text/50">Showing up to 200 rows, most recent first.</div>

      <div className="overflow-x-auto rounded-card border border-border bg-surface">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-border">
              {columns.map((f) => (
                <th key={f.name} className="whitespace-nowrap px-3 py-2.5 text-left font-label text-[10px] tracking-[.08em] text-text/40">
                  {f.name.toUpperCase()}
                </th>
              ))}
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={String(row.id)} className="border-b border-text/[.05] last:border-b-0 hover:bg-text/[.03]">
                {columns.map((f) => (
                  <td key={f.name} className="max-w-[220px] truncate whitespace-nowrap px-3 py-2 text-text/75">
                    {formatCell(row[f.name])}
                  </td>
                ))}
                <td className="whitespace-nowrap px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <Link href={`/admin/data/${model.key}/${row.id}`} className="rounded-md border border-border px-2.5 py-1 text-[11px] text-text/70 hover:text-text">
                      Edit
                    </Link>
                    <AdminDeleteButton modelKey={model.key} id={String(row.id)} label={model.label.toLowerCase().replace(/s$/, "")} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className="px-[18px] py-7 text-center text-[13px] text-text/40">No rows yet.</div>}
      </div>
    </div>
  );
}

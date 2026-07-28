import Link from "next/link";
import { notFound } from "next/navigation";
import { getModelDef } from "@/lib/admin-models";
import { adminCreateRecord } from "@/lib/actions/admin";
import { AdminRecordForm } from "@/components/admin-record-form";

export default async function AdminRecordNewPage({ params }: { params: Promise<{ model: string }> }) {
  const { model: modelKey } = await params;
  const model = getModelDef(modelKey);
  if (!model) notFound();

  return (
    <div className="max-w-[560px]">
      <Link href={`/admin/data/${model.key}`} className="mb-4 inline-block text-[12.5px] text-text/50 hover:text-text">
        ← {model.label}
      </Link>
      <h1 className="mb-6 text-[22px] tracking-[-.02em]">New {model.label.toLowerCase().replace(/s$/, "")}</h1>

      <AdminRecordForm model={model} record={null} action={adminCreateRecord.bind(null, model.key)} submitLabel="Create" />
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { getModelDef } from "@/lib/admin-models";
import { adminUpdateRecord } from "@/lib/actions/admin";
import { AdminRecordForm } from "@/components/admin-record-form";
import { AdminDeleteButton } from "@/components/admin-delete-button";

export default async function AdminRecordEditPage({ params }: { params: Promise<{ model: string; id: string }> }) {
  const { model: modelKey, id } = await params;
  const model = getModelDef(modelKey);
  if (!model) notFound();

  const record = await model.delegate.findUnique({ where: { id } });
  if (!record) notFound();

  return (
    <div className="max-w-[560px]">
      <Link href={`/admin/data/${model.key}`} className="mb-4 inline-block text-[12.5px] text-text/50 hover:text-text">
        ← {model.label}
      </Link>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[22px] tracking-[-.02em]">Edit {model.label.toLowerCase().replace(/s$/, "")}</h1>
        <AdminDeleteButton modelKey={model.key} id={id} label={model.label.toLowerCase().replace(/s$/, "")} />
      </div>

      <AdminRecordForm model={model} record={record} action={adminUpdateRecord.bind(null, model.key, id)} submitLabel="Save changes" />
    </div>
  );
}

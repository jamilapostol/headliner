"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { getModelDef, type FieldDef } from "@/lib/admin-models";

function coerce(field: FieldDef, raw: FormDataEntryValue | null) {
  if (field.type === "boolean") return raw === "on" || raw === "true";
  const str = typeof raw === "string" ? raw.trim() : "";
  if (str === "") return null;
  switch (field.type) {
    case "int":
      return Number.isFinite(Number(str)) ? Math.trunc(Number(str)) : null;
    case "float":
      return Number.isFinite(Number(str)) ? Number(str) : null;
    case "datetime":
      return new Date(str);
    default:
      return str;
  }
}

export async function adminUpdateWorkspacePlan(workspaceId: string, plan: string, billingCycle: string) {
  await requireAdmin();
  await db.workspace.update({ where: { id: workspaceId }, data: { plan: plan as "free" | "pro" | "touring" | "team", billingCycle } });
  revalidatePath("/admin/workspaces");
}

export async function adminUpdateRecord(modelKey: string, id: string, formData: FormData) {
  await requireAdmin();
  const model = getModelDef(modelKey);
  if (!model) throw new Error("Unknown model");

  const data: Record<string, unknown> = {};
  for (const field of model.fields) {
    if (field.readonly) continue;
    const value = coerce(field, formData.get(field.name));
    if (field.required && value === null) throw new Error(`${field.name} is required`);
    data[field.name] = value;
  }

  await model.delegate.update({ where: { id }, data });
  revalidatePath(`/admin/data/${modelKey}`);
  redirect(`/admin/data/${modelKey}`);
}

export async function adminCreateRecord(modelKey: string, formData: FormData) {
  await requireAdmin();
  const model = getModelDef(modelKey);
  if (!model) throw new Error("Unknown model");

  const data: Record<string, unknown> = {};
  for (const field of model.fields) {
    if (field.readonly) continue;
    const value = coerce(field, formData.get(field.name));
    if (field.required && value === null) throw new Error(`${field.name} is required`);
    if (value !== null) data[field.name] = value;
  }

  await model.delegate.create({ data });
  revalidatePath(`/admin/data/${modelKey}`);
  redirect(`/admin/data/${modelKey}`);
}

export async function adminDeleteRecord(modelKey: string, id: string) {
  await requireAdmin();
  const model = getModelDef(modelKey);
  if (!model) throw new Error("Unknown model");

  await model.delegate.delete({ where: { id } });
  revalidatePath(`/admin/data/${modelKey}`);
  redirect(`/admin/data/${modelKey}`);
}

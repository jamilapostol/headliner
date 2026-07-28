"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { getModelDef, type FieldDef } from "@/lib/admin-models";
import { logAdminAction } from "@/lib/audit";

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
  const session = await requireAdmin();
  const before = await db.workspace.findUnique({ where: { id: workspaceId }, select: { plan: true, billingCycle: true, name: true } });
  await db.workspace.update({ where: { id: workspaceId }, data: { plan: plan as "free" | "pro" | "touring" | "team", billingCycle } });
  await logAdminAction({
    adminEmail: session.email,
    action: "workspace.plan.update",
    targetType: "workspace",
    targetId: workspaceId,
    detail: `${before?.name ?? workspaceId}: plan ${before?.plan ?? "?"}→${plan}, cycle ${before?.billingCycle ?? "?"}→${billingCycle}`,
  });
  revalidatePath("/admin/workspaces");
}

export async function adminUpdateRecord(modelKey: string, id: string, formData: FormData) {
  const session = await requireAdmin();
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
  await logAdminAction({
    adminEmail: session.email,
    action: "record.update",
    targetType: modelKey,
    targetId: id,
    detail: JSON.stringify(data),
  });
  revalidatePath(`/admin/data/${modelKey}`);
  redirect(`/admin/data/${modelKey}`);
}

export async function adminCreateRecord(modelKey: string, formData: FormData) {
  const session = await requireAdmin();
  const model = getModelDef(modelKey);
  if (!model) throw new Error("Unknown model");

  const data: Record<string, unknown> = {};
  for (const field of model.fields) {
    if (field.readonly) continue;
    const value = coerce(field, formData.get(field.name));
    if (field.required && value === null) throw new Error(`${field.name} is required`);
    if (value !== null) data[field.name] = value;
  }

  const created = await model.delegate.create({ data });
  await logAdminAction({
    adminEmail: session.email,
    action: "record.create",
    targetType: modelKey,
    targetId: created.id,
    detail: JSON.stringify(data),
  });
  revalidatePath(`/admin/data/${modelKey}`);
  redirect(`/admin/data/${modelKey}`);
}

export async function adminDeleteRecord(modelKey: string, id: string) {
  const session = await requireAdmin();
  const model = getModelDef(modelKey);
  if (!model) throw new Error("Unknown model");

  await model.delegate.delete({ where: { id } });
  await logAdminAction({ adminEmail: session.email, action: "record.delete", targetType: modelKey, targetId: id });
  revalidatePath(`/admin/data/${modelKey}`);
  redirect(`/admin/data/${modelKey}`);
}

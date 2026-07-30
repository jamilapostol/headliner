"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { withErrorLog, withErrorState } from "@/lib/action-error";
import { isAllowedDocument } from "@/lib/file-validation";
import { requireMinPlan } from "@/lib/plan-limits-server";

export type ActionState = { error?: string; success?: string };

const KINDS = ["Performance", "Sponsorship", "Licensing", "Insurance", "Work-for-hire", "Other"] as const;
const STATUSES = ["DRAFT", "AWAITING_SIGN", "SIGNED", "ACTIVE"] as const;

export async function createContract(formData: FormData) {
  return withErrorLog("createContract", async () => {
    const session = await getSession();
    if (!session) return;

    const name = String(formData.get("name") ?? "").trim();
    const kind = String(formData.get("kind") ?? "Other");
    const counterparty = String(formData.get("counterparty") ?? "").trim();
    const value = String(formData.get("value") ?? "").trim();
    const status = String(formData.get("status") ?? "DRAFT");
    const renewsAtRaw = String(formData.get("renewsAt") ?? "").trim();

    if (!name || !KINDS.includes(kind as (typeof KINDS)[number]) || !STATUSES.includes(status as (typeof STATUSES)[number])) return;

    await requireMinPlan(session.workspaceId, "touring");

    await db.contract.create({
      data: {
        workspaceId: session.workspaceId,
        name,
        kind,
        counterparty,
        value,
        status: status as (typeof STATUSES)[number],
        renewsAt: renewsAtRaw ? new Date(renewsAtRaw) : null,
      },
    });
    revalidatePath("/app/contracts");
  });
}

async function requireOwnedContract(contractId: string, workspaceId: string) {
  const contract = await db.contract.findUnique({ where: { id: contractId } });
  if (!contract || contract.workspaceId !== workspaceId) return null;
  return contract;
}

export async function uploadContractDocument(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return withErrorState("uploadContractDocument", async () => {
    const session = await getSession();
    if (!session) return { error: "Not signed in." };

    const contractId = String(formData.get("contractId") ?? "");
    const file = formData.get("file") as File | null;
    if (!contractId) return { error: "Missing contract." };
    if (!file || file.size === 0) return { error: "Choose a file first." };
    if (file.size > 20 * 1024 * 1024) return { error: "File must be under 20MB." };
    if (!isAllowedDocument(file)) return { error: "Please upload a PDF, Word document, or image." };

    const contract = await requireOwnedContract(contractId, session.workspaceId);
    if (!contract) return { error: "Contract not found." };

    const ext = file.name.split(".").pop() ?? "pdf";
    const path = `${session.workspaceId}/${contractId}.${ext}`;

    const admin = createAdminClient();
    if (contract.filePath && contract.filePath !== path) {
      await admin.storage.from("contracts").remove([contract.filePath]);
    }

    const { error: uploadError } = await admin.storage.from("contracts").upload(path, file, { upsert: true });
    if (uploadError) return { error: uploadError.message };

    await db.contract.update({ where: { id: contractId }, data: { filePath: path, fileName: file.name } });
    revalidatePath("/app/contracts");
    return { success: "Document uploaded." };
  });
}

export async function removeContractDocument(contractId: string): Promise<ActionState> {
  return withErrorState("removeContractDocument", async () => {
    const session = await getSession();
    if (!session) return { error: "Not signed in." };

    const contract = await requireOwnedContract(contractId, session.workspaceId);
    if (!contract) return { error: "Contract not found." };
    if (!contract.filePath) return {};

    const admin = createAdminClient();
    await admin.storage.from("contracts").remove([contract.filePath]);

    await db.contract.update({ where: { id: contractId }, data: { filePath: null, fileName: null } });
    revalidatePath("/app/contracts");
    return { success: "Document removed." };
  });
}

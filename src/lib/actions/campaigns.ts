"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function toggleAutomation(automationId: string) {
  const session = await getSession();
  if (!session) return;

  const automation = await db.automation.findUnique({ where: { id: automationId } });
  if (!automation || automation.workspaceId !== session.workspaceId) return;

  await db.automation.update({ where: { id: automationId }, data: { enabled: !automation.enabled } });
  revalidatePath("/app/campaigns");
}

export async function createCampaign(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  const name = String(formData.get("name") ?? "").trim();
  const audienceLabel = String(formData.get("audienceLabel") ?? "").trim();
  if (!name || !audienceLabel) return;

  await db.campaign.create({
    data: {
      workspaceId: session.workspaceId,
      name,
      audienceLabel,
      sentAt: new Date(),
      openRate: 0,
      clickRate: 0,
      revenue: null,
    },
  });
  revalidatePath("/app/campaigns");
}

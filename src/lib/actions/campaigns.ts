"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { resendEnabled, sendEmail } from "@/lib/resend";

type FanTier = "VIP" | "Patron" | "Donor" | "Fan";

export async function toggleAutomation(automationId: string) {
  const session = await getSession();
  if (!session) return;

  const automation = await db.automation.findUnique({ where: { id: automationId } });
  if (!automation || automation.workspaceId !== session.workspaceId) return;

  await db.automation.update({ where: { id: automationId }, data: { enabled: !automation.enabled } });
  revalidatePath("/app/campaigns");
}

function audienceWhere(workspaceId: string, audienceTier: string) {
  return {
    workspaceId,
    unsubscribed: false,
    email: { not: null },
    ...(audienceTier !== "all" ? { tier: audienceTier as FanTier } : {}),
  };
}

export async function createCampaign(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  const name = String(formData.get("name") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const audienceTier = String(formData.get("audienceTier") ?? "all");
  if (!name || !subject || !body) return;

  const recipientCount = await db.fan.count({ where: audienceWhere(session.workspaceId, audienceTier) });

  await db.campaign.create({
    data: {
      workspaceId: session.workspaceId,
      name,
      subject,
      body,
      audienceTier: audienceTier !== "all" ? (audienceTier as FanTier) : null,
      recipientCount,
      status: "Draft",
    },
  });
  revalidatePath("/app/campaigns");
}

export async function sendCampaign(campaignId: string): Promise<{ error?: string; sent?: number }> {
  const session = await getSession();
  if (!session) return { error: "Not signed in." };

  const campaign = await db.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign || campaign.workspaceId !== session.workspaceId) return { error: "Campaign not found." };
  if (campaign.status === "Sent") return { error: "Already sent." };

  if (!resendEnabled) return { error: "No email provider connected. Add RESEND_API_KEY to send." };

  const fans = await db.fan.findMany({
    where: audienceWhere(session.workspaceId, campaign.audienceTier ?? "all"),
  });

  await db.campaign.update({ where: { id: campaignId }, data: { status: "Sending" } });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  let sent = 0;
  let failed = 0;
  for (const fan of fans) {
    if (!fan.email) continue;
    const footer = `\n\n—\nUnsubscribe: ${baseUrl}/unsubscribe/${fan.id}`;
    try {
      await sendEmail({ to: fan.email, subject: campaign.subject, text: campaign.body + footer });
      sent++;
    } catch {
      failed++;
    }
  }

  await db.campaign.update({
    where: { id: campaignId },
    data: { status: failed > 0 && sent === 0 ? "Failed" : "Sent", sentAt: new Date(), recipientCount: sent },
  });

  revalidatePath("/app/campaigns");
  return { sent };
}

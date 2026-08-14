"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { resendEnabled, sendEmail, sendEmailBatch, campaignTag, type OutgoingEmail } from "@/lib/resend";
import { withErrorLog, withErrorState } from "@/lib/action-error";
import { signFanId } from "@/lib/unsubscribe-token";
import { CAMPAIGN_RECIPIENT_CAP, MONTHLY_EMAIL_CAP } from "@/lib/plan-limits";
import { requireMinPlan } from "@/lib/plan-limits-server";

type FanTier = "VIP" | "Patron" | "Donor" | "Fan";

function audienceWhere(workspaceId: string, audienceTier: string) {
  return {
    workspaceId,
    unsubscribed: false,
    email: { not: null },
    ...(audienceTier !== "all" ? { tier: audienceTier as FanTier } : {}),
  };
}

function unsubscribeFooter(fanId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `\n\n—\nUnsubscribe: ${baseUrl}/unsubscribe/${fanId}?t=${signFanId(fanId)}`;
}

export async function createCampaign(formData: FormData) {
  return withErrorLog("createCampaign", async () => {
    const session = await getSession();
    if (!session) return;

    const name = String(formData.get("name") ?? "").trim();
    const subject = String(formData.get("subject") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    const audienceTier = String(formData.get("audienceTier") ?? "all");
    if (!name || !subject || !body) return;

    await requireMinPlan(session.workspaceId, "pro");

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
  });
}

export async function updateCampaign(formData: FormData): Promise<{ error?: string }> {
  return withErrorState("updateCampaign", async () => {
    const session = await getSession();
    if (!session) return { error: "Not signed in." };

    const id = String(formData.get("id") ?? "");
    const campaign = await db.campaign.findUnique({ where: { id } });
    if (!campaign || campaign.workspaceId !== session.workspaceId) return { error: "Campaign not found." };
    if (campaign.status !== "Draft") return { error: "Only drafts can be edited." };

    const name = String(formData.get("name") ?? "").trim();
    const subject = String(formData.get("subject") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    const audienceTier = String(formData.get("audienceTier") ?? "all");
    if (!name || !subject || !body) return { error: "All fields are required." };

    const recipientCount = await db.fan.count({ where: audienceWhere(session.workspaceId, audienceTier) });

    await db.campaign.update({
      where: { id },
      data: {
        name,
        subject,
        body,
        audienceTier: audienceTier !== "all" ? (audienceTier as FanTier) : null,
        recipientCount,
      },
    });
    revalidatePath("/app/campaigns");
    return {};
  });
}

export async function deleteCampaign(campaignId: string): Promise<{ error?: string }> {
  return withErrorState("deleteCampaign", async () => {
    const session = await getSession();
    if (!session) return { error: "Not signed in." };

    const campaign = await db.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.workspaceId !== session.workspaceId) return { error: "Campaign not found." };
    if (campaign.status === "Sent" || campaign.status === "Sending") {
      return { error: "Sent campaigns are part of your history and can't be deleted." };
    }

    await db.campaign.delete({ where: { id: campaignId } });
    revalidatePath("/app/campaigns");
    return {};
  });
}

// Sends the campaign to the signed-in user only — proof of what fans will
// receive (including a sample unsubscribe footer) before the real send.
export async function sendTestCampaign(campaignId: string): Promise<{ error?: string; success?: string }> {
  return withErrorState("sendTestCampaign", async () => {
    const session = await getSession();
    if (!session) return { error: "Not signed in." };
    if (!resendEnabled) return { error: "No email provider connected. Add RESEND_API_KEY to send." };

    const campaign = await db.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.workspaceId !== session.workspaceId) return { error: "Campaign not found." };

    await sendEmail({
      to: session.email,
      subject: `[Test] ${campaign.subject}`,
      text: `${campaign.body}\n\n—\n(Test send — fans will get a working unsubscribe link here.)`,
    });
    return { success: `Test sent to ${session.email}` };
  });
}

export async function sendCampaign(campaignId: string): Promise<{ error?: string; sent?: number }> {
  return withErrorState("sendCampaign", async () => {
    const session = await getSession();
    if (!session) return { error: "Not signed in." };

    const campaign = await db.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.workspaceId !== session.workspaceId) return { error: "Campaign not found." };
    if (campaign.status === "Sent") return { error: "Already sent." };

    if (!resendEnabled) return { error: "No email provider connected. Add RESEND_API_KEY to send." };

    const workspace = await db.workspace.findUniqueOrThrow({ where: { id: session.workspaceId }, select: { plan: true } });
    if (workspace.plan === "free") return { error: "Email campaigns require the Pro plan or higher." };

    const allFans = await db.fan.findMany({
      where: audienceWhere(session.workspaceId, campaign.audienceTier ?? "all"),
    });
    // Pro's "Email campaigns (2k)" cap — Touring/Team send to the full
    // audience. Truncate rather than reject outright so a Pro workspace's
    // campaign still goes out to as many fans as their plan allows.
    const cap = CAMPAIGN_RECIPIENT_CAP[workspace.plan] ?? Infinity;
    const fans = allFans.slice(0, cap);
    if (fans.length === 0) return { error: "No subscribed fans with an email in this audience." };

    // Monthly ceiling across all campaigns this workspace sent this calendar
    // month — bounds platform email spend and protects sender reputation.
    const monthlyCap = MONTHLY_EMAIL_CAP[workspace.plan] ?? 5000;
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const { _sum } = await db.campaign.aggregate({
      where: { workspaceId: session.workspaceId, status: "Sent", sentAt: { gte: monthStart } },
      _sum: { recipientCount: true },
    });
    const sentThisMonth = _sum.recipientCount ?? 0;
    if (sentThisMonth + fans.length > monthlyCap) {
      const remaining = Math.max(0, monthlyCap - sentThisMonth);
      return {
        error: `Monthly send limit: your plan covers ${monthlyCap.toLocaleString()} emails/month and ${sentThisMonth.toLocaleString()} are already sent. ${remaining.toLocaleString()} remaining — shrink the audience or wait for the new month.`,
      };
    }

    await db.campaign.update({ where: { id: campaignId }, data: { status: "Sending" } });

    const messages: OutgoingEmail[] = fans
      .filter((f) => f.email)
      .map((fan) => ({
        to: fan.email as string,
        subject: campaign.subject,
        text: campaign.body + unsubscribeFooter(fan.id),
      }));

    const { sent, failed } = await sendEmailBatch(messages, campaignTag(campaignId));

    await db.campaign.update({
      where: { id: campaignId },
      data: { status: sent === 0 && failed > 0 ? "Failed" : "Sent", sentAt: new Date(), recipientCount: sent },
    });

    revalidatePath("/app/campaigns");
    if (sent === 0) return { error: "Sending failed — check the server logs and your Resend dashboard." };
    return { sent };
  });
}

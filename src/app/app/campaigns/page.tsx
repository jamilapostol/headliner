import { redirect } from "next/navigation";
import { requireWorkspace } from "@/lib/workspace";
import { db } from "@/lib/db";
import { resendEnabled } from "@/lib/resend";
import { planAtLeast } from "@/lib/plan-limits";
import { CampaignsView, type CampaignDTO, type AutomationDTO } from "@/components/campaigns-view";

// Campaign sends fan out ~100 emails per HTTP call; give the action headroom.
export const maxDuration = 60;

const FAN_TIERS = ["VIP", "Patron", "Donor", "Fan"] as const;

export default async function CampaignsPage() {
  const { workspace } = await requireWorkspace();
  if (!planAtLeast(workspace.plan, "pro")) redirect("/app/billing?locked=campaigns");

  const [campaigns, automations, subscribedFans, tierCounts] = await Promise.all([
    db.campaign.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: "desc" } }),
    db.automation.findMany({ where: { workspaceId: workspace.id }, orderBy: { id: "asc" } }),
    db.fan.count({ where: { workspaceId: workspace.id, unsubscribed: false, email: { not: null } } }),
    Promise.all(
      FAN_TIERS.map((tier) =>
        db.fan.count({ where: { workspaceId: workspace.id, tier, unsubscribed: false, email: { not: null } } })
      )
    ),
  ]);

  const campaignDtos: CampaignDTO[] = campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    subject: c.subject,
    body: c.body,
    audienceTier: c.audienceTier,
    status: c.status,
    recipientCount: c.recipientCount,
    sentAt: c.sentAt ? c.sentAt.toISOString() : null,
    revenue: c.revenue,
  }));

  const automationDtos: AutomationDTO[] = automations.map((a) => ({
    id: a.id,
    name: a.name,
    trigger: a.trigger,
    enabled: a.enabled,
  }));

  const audienceCounts = {
    all: subscribedFans,
    VIP: tierCounts[0],
    Patron: tierCounts[1],
    Donor: tierCounts[2],
    Fan: tierCounts[3],
  };

  return (
    <CampaignsView
      campaigns={campaignDtos}
      automations={automationDtos}
      subscriberCount={subscribedFans}
      audienceCounts={audienceCounts}
      resendEnabled={resendEnabled}
      plan={workspace.plan}
    />
  );
}

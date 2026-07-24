import { requireWorkspace } from "@/lib/workspace";
import { db } from "@/lib/db";
import { CampaignsView, type CampaignDTO, type AutomationDTO } from "@/components/campaigns-view";

export default async function CampaignsPage() {
  const { workspace } = await requireWorkspace();

  const [campaigns, automations, fanCount] = await Promise.all([
    db.campaign.findMany({ where: { workspaceId: workspace.id }, orderBy: { sentAt: "desc" } }),
    db.automation.findMany({ where: { workspaceId: workspace.id }, orderBy: { id: "asc" } }),
    db.fan.count({ where: { workspaceId: workspace.id } }),
  ]);

  const campaignDtos: CampaignDTO[] = campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    audienceLabel: c.audienceLabel,
    sentAt: c.sentAt.toISOString(),
    openRate: c.openRate,
    clickRate: c.clickRate,
    revenue: c.revenue,
  }));

  const automationDtos: AutomationDTO[] = automations.map((a) => ({
    id: a.id,
    name: a.name,
    trigger: a.trigger,
    enabled: a.enabled,
  }));

  return <CampaignsView campaigns={campaignDtos} automations={automationDtos} subscriberCount={fanCount} plan={workspace.plan} />;
}

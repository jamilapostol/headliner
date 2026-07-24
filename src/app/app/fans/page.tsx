import { requireWorkspace } from "@/lib/workspace";
import { db } from "@/lib/db";
import { FansView, type FanDTO } from "@/components/fans-view";

export default async function FansPage() {
  const { workspace } = await requireWorkspace();
  const fans = await db.fan.findMany({ where: { workspaceId: workspace.id }, orderBy: { lifetimeSpend: "desc" } });

  const dtos: FanDTO[] = fans.map((f) => ({
    id: f.id,
    name: f.name,
    tier: f.tier,
    tierNote: f.tierNote,
    lifetimeSpend: f.lifetimeSpend,
    showsAttended: f.showsAttended,
    lastSeenLabel: f.lastSeenLabel,
    notes: f.notes,
  }));

  return <FansView fans={dtos} plan={workspace.plan} />;
}

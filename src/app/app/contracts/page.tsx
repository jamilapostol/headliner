import { redirect } from "next/navigation";
import { requireWorkspace } from "@/lib/workspace";
import { db } from "@/lib/db";
import { planAtLeast } from "@/lib/plan-limits";
import { ContractsView, type ContractDTO } from "@/components/contracts-view";

export default async function ContractsPage() {
  const { workspace } = await requireWorkspace();
  if (!planAtLeast(workspace.plan, "touring")) redirect("/app/billing?locked=contracts");
  const contracts = await db.contract.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: "asc" } });

  const dtos: ContractDTO[] = contracts.map((c) => ({
    id: c.id,
    name: c.name,
    kind: c.kind,
    counterparty: c.counterparty,
    value: c.value,
    status: c.status,
    date: c.signedDate ? c.signedDate.toLocaleDateString("en-US", { month: "short", day: "2-digit", timeZone: "UTC" }) : null,
    signedDate: c.signedDate ? c.signedDate.toISOString() : null,
    renewsAt: c.renewsAt ? c.renewsAt.toISOString() : null,
    fileName: c.fileName,
  }));

  return <ContractsView contracts={dtos} plan={workspace.plan} />;
}

import { requireWorkspace } from "@/lib/workspace";
import { db } from "@/lib/db";
import { ContractsView, type ContractDTO } from "@/components/contracts-view";

export default async function ContractsPage() {
  const { workspace } = await requireWorkspace();
  const contracts = await db.contract.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: "asc" } });

  const dtos: ContractDTO[] = contracts.map((c) => ({
    id: c.id,
    name: c.name,
    kind: c.kind,
    counterparty: c.counterparty,
    value: c.value,
    status: c.status,
    date: c.signedDate ? c.signedDate.toLocaleDateString("en-US", { month: "short", day: "2-digit", timeZone: "UTC" }) : null,
    renewsAt: c.renewsAt ? c.renewsAt.toISOString() : null,
    fileName: c.fileName,
  }));

  return <ContractsView contracts={dtos} plan={workspace.plan} />;
}

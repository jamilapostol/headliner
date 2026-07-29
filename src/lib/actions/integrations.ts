"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { INTEGRATIONS } from "@/lib/integrations";
import { withErrorLog } from "@/lib/action-error";

export async function toggleIntegration(key: string) {
  return withErrorLog("toggleIntegration", async () => {
    const session = await getSession();
    if (!session) return;
    if (!INTEGRATIONS.some((i) => i.key === key)) return;

    const existing = await db.integration.findUnique({
      where: { workspaceId_key: { workspaceId: session.workspaceId, key } },
    });

    const connected = !existing?.connected;
    await db.integration.upsert({
      where: { workspaceId_key: { workspaceId: session.workspaceId, key } },
      create: { workspaceId: session.workspaceId, key, connected, connectedAt: connected ? new Date() : null },
      update: { connected, connectedAt: connected ? new Date() : null },
    });

    revalidatePath("/app/account");
  });
}

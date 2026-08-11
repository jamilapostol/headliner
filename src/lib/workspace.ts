import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { enforceMfa } from "@/lib/mfa";

// Cached per-request: the app layout and every page under it call this
// independently, so without cache() each navigation ran the session check
// and workspace lookup twice.
export const requireWorkspace = cache(async () => {
  const session = await getSession();
  if (!session) redirect("/login");
  await enforceMfa();
  if (!session.membershipAccepted) redirect("/invite/accept");

  const workspace = await db.workspace.findUnique({ where: { id: session.workspaceId } });
  if (!workspace) redirect("/login");

  return {
    user: { id: session.userId, name: session.name, email: session.email, avatarUrl: session.avatarUrl, role: session.role },
    workspace,
    impersonatedBy: session.impersonatedBy,
  };
});

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function requireWorkspace() {
  const session = await getSession();
  if (!session) redirect("/login");

  const workspace = await db.workspace.findUnique({ where: { id: session.workspaceId } });
  if (!workspace) redirect("/login");

  return { user: { name: session.name, email: session.email, avatarUrl: session.avatarUrl }, workspace };
}

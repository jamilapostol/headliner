"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { logAdminAction } from "@/lib/audit";
import { IMPERSONATION_COOKIE } from "@/lib/impersonation";

export async function startImpersonation(workspaceId: string) {
  const session = await requireAdmin();
  const workspace = await db.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) throw new Error("Workspace not found");

  (await cookies()).set(IMPERSONATION_COOKIE, workspaceId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 4, // 4 hours
  });

  await logAdminAction({
    adminEmail: session.email,
    action: "impersonate.start",
    targetType: "workspace",
    targetId: workspaceId,
    detail: workspace.name,
  });

  redirect("/app");
}

export async function stopImpersonation() {
  const session = await requireAdmin();
  const cookieStore = await cookies();
  const workspaceId = cookieStore.get(IMPERSONATION_COOKIE)?.value;
  cookieStore.delete(IMPERSONATION_COOKIE);

  if (workspaceId) {
    await logAdminAction({
      adminEmail: session.email,
      action: "impersonate.stop",
      targetType: "workspace",
      targetId: workspaceId,
    });
  }

  redirect("/admin/workspaces");
}

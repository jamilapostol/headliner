"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, isAdminEmail } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/audit";

export type DeleteResult = { error?: string; success?: string };

// Deletes a workspace (all scoped data cascades) and any member auth users
// whose only membership was this workspace. Admin-member workspaces are
// refused so an admin can't nuke their own access from the list view.
export async function deleteWorkspaceAndUsers(workspaceId: string): Promise<DeleteResult> {
  const session = await requireAdmin();

  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    include: { memberships: true },
  });
  if (!workspace) return { error: "Workspace not found — it may already be deleted." };

  const admin = createAdminClient();
  const memberIds = workspace.memberships.map((m) => m.userId);

  // Resolve member emails; refuse if any member is an admin.
  for (const uid of memberIds) {
    const { data } = await admin.auth.admin.getUserById(uid);
    const email = data.user?.email ?? "";
    if (email && (await isAdminEmail(email))) {
      return { error: `Refusing to delete: ${email} is an admin. Remove their admin access first.` };
    }
  }

  await db.workspace.delete({ where: { id: workspaceId } });

  // Only delete auth users who have no membership anywhere else.
  let usersDeleted = 0;
  for (const uid of memberIds) {
    const remaining = await db.membership.count({ where: { userId: uid } });
    if (remaining === 0) {
      const { error } = await admin.auth.admin.deleteUser(uid);
      if (!error) usersDeleted++;
    }
  }

  await logAdminAction({
    adminEmail: session.email,
    action: "workspace.delete",
    targetType: "workspace",
    targetId: workspaceId,
    detail: `"${workspace.name}" — ${memberIds.length} member(s), ${usersDeleted} auth user(s) removed`,
  });

  revalidatePath("/admin/workspaces");
  revalidatePath("/admin");
  return { success: `Deleted "${workspace.name}" and ${usersDeleted} user account(s).` };
}

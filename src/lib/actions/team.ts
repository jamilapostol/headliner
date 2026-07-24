"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { INVITABLE_ROLES, TEAM_MANAGER_ROLES, SEAT_LIMITS } from "@/lib/roles";

export type ActionState = { error?: string; success?: string };

async function requireManager() {
  const session = await getSession();
  if (!session) return { error: "Not signed in." as const };
  if (!TEAM_MANAGER_ROLES.includes(session.role)) {
    return { error: "Only the artist or manager can manage the team." as const };
  }
  return { session };
}

export async function inviteTeamMember(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const guard = await requireManager();
  if ("error" in guard) return { error: guard.error };
  const { session } = guard;

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "");
  if (!email) return { error: "Email is required." };
  if (!INVITABLE_ROLES.includes(role as (typeof INVITABLE_ROLES)[number])) return { error: "Invalid role." };

  const workspace = await db.workspace.findUniqueOrThrow({ where: { id: session.workspaceId } });
  const seatCount = await db.membership.count({ where: { workspaceId: workspace.id } });
  const limit = SEAT_LIMITS[workspace.plan] ?? 1;
  if (seatCount >= limit) {
    return { error: `Your ${workspace.plan} plan includes ${limit} seat${limit === 1 ? "" : "s"}. Upgrade to invite more people.` };
  }

  const admin = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/auth/callback?next=/invite/accept`,
    data: { invited_by: session.name },
  });

  if (error) {
    if (error.message.toLowerCase().includes("registered")) {
      return { error: "That email already has an account. Adding an existing account to a team isn't supported yet." };
    }
    return { error: error.message };
  }
  if (!data.user) return { error: "Could not send invite. Try again." };

  await db.membership.create({
    data: {
      workspaceId: workspace.id,
      userId: data.user.id,
      role: role as (typeof INVITABLE_ROLES)[number],
      invitedBy: session.userId,
      acceptedAt: null,
    },
  });

  revalidatePath("/app/account");
  return { success: `Invite sent to ${email}.` };
}

export async function removeMember(membershipId: string): Promise<ActionState> {
  const guard = await requireManager();
  if ("error" in guard) return { error: guard.error };
  const { session } = guard;

  const membership = await db.membership.findUnique({ where: { id: membershipId } });
  if (!membership || membership.workspaceId !== session.workspaceId) return { error: "Not found." };
  if (membership.userId === session.userId) return { error: "You can't remove yourself." };

  await db.membership.delete({ where: { id: membershipId } });

  // Never-accepted invite — clean up the pending Supabase auth user too,
  // rather than leaving an unconfirmed account with no workspace behind.
  if (membership.acceptedAt === null) {
    const admin = createAdminClient();
    await admin.auth.admin.deleteUser(membership.userId).catch(() => {});
  }

  revalidatePath("/app/account");
  return { success: "Removed." };
}

export async function finishInviteAccept(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "Not signed in." };

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "Passwords don't match." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  await db.membership.updateMany({
    where: { workspaceId: session.workspaceId, userId: session.userId },
    data: { acceptedAt: new Date() },
  });

  redirect("/app");
}

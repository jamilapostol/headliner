"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAdminAction } from "@/lib/audit";
import { withErrorLog, withErrorState } from "@/lib/action-error";

export type ActionState = { error?: string; success?: string };

function generateCode() {
  return "BETA-" + crypto.randomBytes(4).toString("hex").toUpperCase();
}

export async function createBetaInvite(maxUses: number | null) {
  const session = await requireAdmin();

  const code = generateCode();
  await db.betaInvite.create({ data: { code, maxUses, createdBy: session.email } });
  await logAdminAction({ adminEmail: session.email, action: "beta_invite.create", targetType: "BetaInvite", targetId: code, detail: maxUses ? `max ${maxUses} uses` : "unlimited uses" });

  revalidatePath("/admin/beta-invites");
}

export async function revokeBetaInvite(code: string) {
  return withErrorLog("revokeBetaInvite", async () => {
    const session = await requireAdmin();

    await db.betaInvite.update({ where: { code }, data: { active: false } });
    await logAdminAction({ adminEmail: session.email, action: "beta_invite.revoke", targetType: "BetaInvite", targetId: code });

    revalidatePath("/admin/beta-invites");
  });
}

// Called from onboarding — any signed-in user with a code can redeem it for
// their own workspace, no admin gate. Grants "beta" directly, no trial
// clock (matches the "not billed" nature of the plan).
export async function redeemBetaInvite(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return withErrorState("redeemBetaInvite", async () => {
    const session = await getSession();
    if (!session) return { error: "Not signed in." };

    const code = String(formData.get("code") ?? "").trim().toUpperCase();
    if (!code) return { error: "Enter an invite code." };

    const invite = await db.betaInvite.findUnique({ where: { code } });
    if (!invite || !invite.active) return { error: "That invite code isn't valid." };
    if (invite.maxUses !== null && invite.usedCount >= invite.maxUses) return { error: "That invite code has already been fully redeemed." };

    await db.$transaction([
      db.betaInvite.update({ where: { code }, data: { usedCount: { increment: 1 } } }),
      db.workspace.update({ where: { id: session.workspaceId }, data: { plan: "beta", trialEndsAt: null } }),
    ]);
    await logAdminAction({ adminEmail: session.email, action: "beta_invite.redeem", targetType: "BetaInvite", targetId: code });

    redirect("/app");
  });
}

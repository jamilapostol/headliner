"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { logAdminAction } from "@/lib/audit";
import { withErrorState } from "@/lib/action-error";

export type ActionState = { error?: string; success?: string };

export async function addAdminEmail(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return withErrorState("addAdminEmail", async () => {
    const session = await requireAdmin();

    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    if (!email || !email.includes("@")) return { error: "Enter a valid email address." };

    await db.adminUser.upsert({
      where: { email },
      create: { email, addedBy: session.email },
      update: {},
    });
    await logAdminAction({ adminEmail: session.email, action: "admin_user.add", targetType: "AdminUser", targetId: email });

    revalidatePath("/admin/access");
    return { success: `${email} can now sign in as an admin.` };
  });
}

export async function removeAdminEmail(email: string) {
  const session = await requireAdmin();

  if (email.toLowerCase() === session.email.toLowerCase()) {
    throw new Error("You can't remove your own admin access.");
  }

  await db.adminUser.deleteMany({ where: { email: email.toLowerCase() } });
  await logAdminAction({ adminEmail: session.email, action: "admin_user.remove", targetType: "AdminUser", targetId: email });

  revalidatePath("/admin/access");
}

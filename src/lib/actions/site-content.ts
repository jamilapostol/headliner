"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { SITE_CONTENT_FIELDS } from "@/lib/site-content";
import { logAdminAction } from "@/lib/audit";
import { withErrorState } from "@/lib/action-error";
import { uploadSiteImage as uploadSiteImageFile } from "@/lib/site-image-upload";

export type ActionState = { error?: string; success?: string };

export async function uploadSiteImage(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return withErrorState("uploadSiteImage", async () => {
    const session = await requireAdmin();

    const key = String(formData.get("key") ?? "");
    const field = SITE_CONTENT_FIELDS.find((f) => f.key === key);
    if (!field || field.type !== "image") return { error: "Unknown image field." };

    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) return { error: "Choose an image first." };

    const { url, error } = await uploadSiteImageFile(file, key);
    if (error || !url) return { error: error ?? "Upload failed." };

    await db.siteContent.upsert({ where: { key }, create: { key, value: url }, update: { value: url } });
    await logAdminAction({ adminEmail: session.email, action: "site_image.upload", targetType: "SiteContent", targetId: key });

    revalidatePath("/");
    revalidatePath("/admin/content");
    return { success: "Image updated." };
  });
}

export async function updateSiteContent(key: string, value: string) {
  await requireAdmin();
  if (!SITE_CONTENT_FIELDS.some((f) => f.key === key)) throw new Error("Unknown content key");

  await db.siteContent.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });

  revalidatePath("/");
  revalidatePath("/admin/content");
}

export async function resetSiteContent(key: string) {
  await requireAdmin();
  if (!SITE_CONTENT_FIELDS.some((f) => f.key === key)) throw new Error("Unknown content key");

  await db.siteContent.deleteMany({ where: { key } });
  revalidatePath("/");
  revalidatePath("/admin/content");
}

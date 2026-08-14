"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { logAdminAction } from "@/lib/audit";
import { withErrorLog, withErrorState } from "@/lib/action-error";
import { uploadSiteImage } from "@/lib/site-image-upload";

export type ActionState = { error?: string; success?: string };

export async function createLandingBlock(type: "text" | "image") {
  const session = await requireAdmin();

  const last = await db.landingBlock.findFirst({ orderBy: { order: "desc" } });
  const order = (last?.order ?? -1) + 1;

  const block = await db.landingBlock.create({
    data:
      type === "text"
        ? { type, order, heading: "New heading", body: "New body copy." }
        : { type, order, imageUrl: "/hero.webp", imageAlt: "" },
  });

  await logAdminAction({ adminEmail: session.email, action: "landing_block.create", targetType: "LandingBlock", targetId: block.id, detail: type });

  revalidatePath("/");
  revalidatePath("/admin/content");
}

export async function updateLandingBlock(id: string, data: { heading?: string; body?: string; imageAlt?: string }) {
  return withErrorLog("updateLandingBlock", async () => {
    const session = await requireAdmin();

    await db.landingBlock.update({ where: { id }, data });
    await logAdminAction({ adminEmail: session.email, action: "landing_block.update", targetType: "LandingBlock", targetId: id });

    revalidatePath("/");
    revalidatePath("/admin/content");
  });
}

export async function deleteLandingBlock(id: string) {
  const session = await requireAdmin();

  await db.landingBlock.delete({ where: { id } });
  await logAdminAction({ adminEmail: session.email, action: "landing_block.delete", targetType: "LandingBlock", targetId: id });

  revalidatePath("/");
  revalidatePath("/admin/content");
}

export async function moveLandingBlock(id: string, direction: "up" | "down") {
  return withErrorLog("moveLandingBlock", async () => {
    const session = await requireAdmin();

    const blocks = await db.landingBlock.findMany({ orderBy: { order: "asc" } });
    const index = blocks.findIndex((b) => b.id === id);
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (index === -1 || swapWith < 0 || swapWith >= blocks.length) return;

    const a = blocks[index];
    const b = blocks[swapWith];
    await db.$transaction([
      db.landingBlock.update({ where: { id: a.id }, data: { order: b.order } }),
      db.landingBlock.update({ where: { id: b.id }, data: { order: a.order } }),
    ]);

    await logAdminAction({ adminEmail: session.email, action: "landing_block.reorder", targetType: "LandingBlock", targetId: id });

    revalidatePath("/");
    revalidatePath("/admin/content");
  });
}

export async function uploadLandingBlockImage(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return withErrorState("uploadLandingBlockImage", async () => {
    const session = await requireAdmin();

    const id = String(formData.get("id") ?? "");
    if (!id) return { error: "Missing block id." };

    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) return { error: "Choose an image first." };

    const { url, error } = await uploadSiteImage(file, `block-${id}`);
    if (error || !url) return { error: error ?? "Upload failed." };

    await db.landingBlock.update({ where: { id }, data: { imageUrl: url } });
    await logAdminAction({ adminEmail: session.email, action: "landing_block.image_upload", targetType: "LandingBlock", targetId: id });

    revalidatePath("/");
    revalidatePath("/admin/content");
    return { success: "Image updated." };
  });
}

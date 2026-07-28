"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { SITE_CONTENT_FIELDS } from "@/lib/site-content";

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

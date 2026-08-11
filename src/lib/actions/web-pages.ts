"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { logAdminAction } from "@/lib/audit";
import { RESERVED_SLUGS, SYSTEM_PAGES } from "@/lib/web-pages";
import { withErrorState } from "@/lib/action-error";

export type PageActionState = { error?: string; success?: string };

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function revalidateFor(slug: string) {
  const system = SYSTEM_PAGES.find((p) => p.slug === slug);
  revalidatePath(system ? system.path : `/${slug}`);
  revalidatePath("/admin/pages");
  revalidatePath("/sitemap.xml");
}

export async function toggleWebPageVisibility(id: string): Promise<void> {
  const session = await requireAdmin();
  const page = await db.webPage.findUnique({ where: { id } });
  if (!page) return;

  const visibility = page.visibility === "public" ? "private" : "public";
  await db.webPage.update({ where: { id }, data: { visibility } });
  await logAdminAction({
    adminEmail: session.email,
    action: `page.${visibility}`,
    targetType: "webPage",
    targetId: page.slug,
  });
  revalidateFor(page.slug);
}

export async function createWebPage(_prev: PageActionState, formData: FormData): Promise<PageActionState> {
  return withErrorState("createWebPage", async () => {
    const session = await requireAdmin();

    const title = String(formData.get("title") ?? "").trim();
    const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
    const heading = String(formData.get("heading") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();

    if (!title) return { error: "Give the page a title." };
    if (!SLUG_RE.test(slug) || slug.length > 60) return { error: "Slug must be lowercase letters, numbers and hyphens (e.g. press-kit)." };
    if (RESERVED_SLUGS.has(slug)) return { error: `"/${slug}" is reserved by the app — pick another slug.` };
    if (await db.webPage.findUnique({ where: { slug } })) return { error: `A page at /${slug} already exists.` };

    await db.webPage.create({
      data: { slug, title, kind: "custom", visibility: "private", heading: heading || title, body },
    });
    await logAdminAction({ adminEmail: session.email, action: "page.create", targetType: "webPage", targetId: slug });
    revalidateFor(slug);
    return { success: `Created /${slug} — it starts private; flip it public when it's ready.` };
  });
}

export async function updateWebPage(_prev: PageActionState, formData: FormData): Promise<PageActionState> {
  return withErrorState("updateWebPage", async () => {
    const session = await requireAdmin();

    const id = String(formData.get("id") ?? "");
    const page = await db.webPage.findUnique({ where: { id } });
    if (!page || page.kind !== "custom") return { error: "Only custom pages can be edited here." };

    const title = String(formData.get("title") ?? "").trim();
    const heading = String(formData.get("heading") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    if (!title) return { error: "Give the page a title." };

    await db.webPage.update({ where: { id }, data: { title, heading: heading || title, body } });
    await logAdminAction({ adminEmail: session.email, action: "page.update", targetType: "webPage", targetId: page.slug });
    revalidateFor(page.slug);
    return { success: "Saved." };
  });
}

export async function deleteWebPage(id: string): Promise<void> {
  const session = await requireAdmin();
  const page = await db.webPage.findUnique({ where: { id } });
  if (!page || page.kind !== "custom") return; // system gates must never be deleted

  await db.webPage.delete({ where: { id } });
  await logAdminAction({ adminEmail: session.email, action: "page.delete", targetType: "webPage", targetId: page.slug });
  revalidateFor(page.slug);
}

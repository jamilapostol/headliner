"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const CATEGORIES = ["Venues", "Promoters", "Festivals", "Media", "Sponsors"] as const;
export type Category = (typeof CATEGORIES)[number];

export async function createContact(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  const name = String(formData.get("name") ?? "").trim();
  const org = String(formData.get("org") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const category = String(formData.get("category") ?? "Venues");

  if (!name || !CATEGORIES.includes(category as Category)) return;

  await db.contact.create({
    data: { workspaceId: session.workspaceId, name, org, role, city, category: category as Category, strength: 3 },
  });
  revalidatePath("/app/contacts");
  revalidatePath("/app");
}

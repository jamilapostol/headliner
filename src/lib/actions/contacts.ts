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
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const category = String(formData.get("category") ?? "Venues");

  if (!name || !CATEGORIES.includes(category as Category)) return;

  await db.contact.create({
    data: { workspaceId: session.workspaceId, name, org, role, city, email, phone, category: category as Category, strength: 3 },
  });
  revalidatePath("/app/contacts");
  revalidatePath("/app");
}

export async function updateContact(
  contactId: string,
  fields: { email?: string; phone?: string; notes?: string }
) {
  const session = await getSession();
  if (!session) return;

  const contact = await db.contact.findUnique({ where: { id: contactId } });
  if (!contact || contact.workspaceId !== session.workspaceId) return;

  await db.contact.update({
    where: { id: contactId },
    data: {
      ...(fields.email !== undefined ? { email: fields.email || null } : {}),
      ...(fields.phone !== undefined ? { phone: fields.phone || null } : {}),
      ...(fields.notes !== undefined ? { notes: fields.notes || null } : {}),
    },
  });
  revalidatePath("/app/contacts");
}

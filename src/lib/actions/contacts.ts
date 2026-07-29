"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { withErrorLog, withErrorFallback, withErrorState } from "@/lib/action-error";
import { MAX_IMPORT_ROWS } from "@/lib/import-limits";
import { CONTACT_LIMITS } from "@/lib/plan-limits";

const CATEGORIES = ["Venues", "Promoters", "Festivals", "Media", "Sponsors"] as const;
export type Category = (typeof CATEGORIES)[number];

export async function createContact(formData: FormData): Promise<{ error?: string }> {
  return withErrorState("createContact", async () => {
    const session = await getSession();
    if (!session) return { error: "Not signed in." };

    const name = String(formData.get("name") ?? "").trim();
    const org = String(formData.get("org") ?? "").trim();
    const role = String(formData.get("role") ?? "").trim();
    const city = String(formData.get("city") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const category = String(formData.get("category") ?? "Venues");

    if (!name || !CATEGORIES.includes(category as Category)) return {};

    const workspace = await db.workspace.findUniqueOrThrow({ where: { id: session.workspaceId } });
    const limit = CONTACT_LIMITS[workspace.plan] ?? Infinity;
    if (Number.isFinite(limit)) {
      const count = await db.contact.count({ where: { workspaceId: session.workspaceId } });
      if (count >= limit) {
        return { error: `Free plan is limited to ${limit} contacts. Upgrade to add more.` };
      }
    }

    await db.contact.create({
      data: { workspaceId: session.workspaceId, name, org, role, city, email, phone, category: category as Category, strength: 3 },
    });
    revalidatePath("/app/contacts");
    revalidatePath("/app");
    return {};
  });
}

export async function updateContact(
  contactId: string,
  fields: { email?: string; phone?: string; notes?: string; strength?: number }
) {
  return withErrorLog("updateContact", async () => {
    const session = await getSession();
    if (!session) return;

    const contact = await db.contact.findUnique({ where: { id: contactId } });
    if (!contact || contact.workspaceId !== session.workspaceId) return;

    const strength = fields.strength !== undefined ? Math.min(5, Math.max(1, Math.round(fields.strength))) : undefined;

    await db.contact.update({
      where: { id: contactId },
      data: {
        ...(fields.email !== undefined ? { email: fields.email || null } : {}),
        ...(fields.phone !== undefined ? { phone: fields.phone || null } : {}),
        ...(fields.notes !== undefined ? { notes: fields.notes || null } : {}),
        ...(strength !== undefined ? { strength } : {}),
      },
    });
    revalidatePath("/app/contacts");
  });
}

export async function importContacts(rows: Record<string, string>[]) {
  return withErrorFallback("importContacts", { imported: 0, skipped: rows.length }, async () => {
    const session = await getSession();
    if (!session) return { imported: 0, skipped: rows.length };

    let capped = rows.slice(0, MAX_IMPORT_ROWS);
    const workspace = await db.workspace.findUniqueOrThrow({ where: { id: session.workspaceId } });
    const limit = CONTACT_LIMITS[workspace.plan] ?? Infinity;
    if (Number.isFinite(limit)) {
      const existing = await db.contact.count({ where: { workspaceId: session.workspaceId } });
      capped = capped.slice(0, Math.max(0, limit - existing));
    }

    const data = [];
    for (const r of capped) {
      const name = (r.name ?? "").trim();
      if (!name) continue;
      const categoryRaw = (r.category ?? "").trim();
      const category = CATEGORIES.find((c) => c.toLowerCase() === categoryRaw.toLowerCase()) ?? "Venues";
      data.push({
        workspaceId: session.workspaceId,
        name,
        org: (r.org ?? "").trim() || null,
        role: (r.role ?? "").trim() || null,
        category,
        city: (r.city ?? "").trim() || null,
        email: (r.email ?? "").trim() || null,
        phone: (r.phone ?? "").trim() || null,
        notes: (r.notes ?? "").trim() || null,
        strength: 3,
      });
    }
    if (data.length > 0) await db.contact.createMany({ data });

    revalidatePath("/app/contacts");
    revalidatePath("/app");
    return { imported: data.length, skipped: rows.length - data.length };
  });
}

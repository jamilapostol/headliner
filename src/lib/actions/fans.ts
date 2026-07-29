"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { withErrorLog, withErrorFallback } from "@/lib/action-error";
import { MAX_IMPORT_ROWS } from "@/lib/import-limits";

const TIERS = ["VIP", "Patron", "Donor", "Fan"] as const;

export async function createFan(formData: FormData) {
  return withErrorLog("createFan", async () => {
    const session = await getSession();
    if (!session) return;

    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const tier = String(formData.get("tier") ?? "Fan");
    const lifetimeSpend = Number(formData.get("lifetimeSpend") ?? 0);
    const notes = String(formData.get("notes") ?? "").trim();

    if (!name || !TIERS.includes(tier as (typeof TIERS)[number])) return;

    await db.fan.create({
      data: {
        workspaceId: session.workspaceId,
        name,
        email,
        tier: tier as (typeof TIERS)[number],
        lifetimeSpend: Math.round(lifetimeSpend * 100),
        showsAttended: 0,
        notes,
      },
    });
    revalidatePath("/app/fans");
  });
}

export async function importFans(rows: Record<string, string>[]) {
  return withErrorFallback("importFans", { imported: 0, skipped: rows.length }, async () => {
    const session = await getSession();
    if (!session) return { imported: 0, skipped: rows.length };

    const capped = rows.slice(0, MAX_IMPORT_ROWS);
    const data = [];
    for (const r of capped) {
      const name = (r.name ?? "").trim();
      if (!name) continue;
      const tierRaw = (r.tier ?? "").trim();
      const tier = TIERS.find((t) => t.toLowerCase() === tierRaw.toLowerCase()) ?? "Fan";
      const lifetimeSpend = Number(r.lifetimeSpend ?? "") || 0;
      const showsAttended = Math.max(0, Math.round(Number(r.showsAttended ?? "") || 0));
      data.push({
        workspaceId: session.workspaceId,
        name,
        email: (r.email ?? "").trim() || null,
        tier,
        lifetimeSpend: Math.round(lifetimeSpend * 100),
        showsAttended,
        notes: (r.notes ?? "").trim() || null,
      });
    }
    if (data.length > 0) await db.fan.createMany({ data });

    revalidatePath("/app/fans");
    revalidatePath("/app");
    return { imported: data.length, skipped: rows.length - data.length };
  });
}

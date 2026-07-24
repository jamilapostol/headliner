"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const TIERS = ["VIP", "Patron", "Donor", "Fan"] as const;

export async function createFan(formData: FormData) {
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
}

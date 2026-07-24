"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const GLYPH_COLORS = ["#3fe87a", "#e8e43f", "#e8983f", "#7ab8e8", "#c99df5", "#e87a9a"];

export async function createMerchItem(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  const name = String(formData.get("name") ?? "").trim();
  const variant = String(formData.get("variant") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);
  const margin = Number(formData.get("margin") ?? 50) / 100;
  const stock = Number(formData.get("stock") ?? 0);
  const maxStock = Math.max(Number(formData.get("maxStock") ?? stock), stock, 1);

  if (!name || !price) return;

  await db.merchItem.create({
    data: {
      workspaceId: session.workspaceId,
      name,
      variant,
      price: Math.round(price * 100),
      cogs: Math.round(price * 100 * (1 - margin)),
      stock,
      maxStock,
      glyph: name.trim()[0]?.toUpperCase() ?? "M",
      color: GLYPH_COLORS[Math.floor(Math.random() * GLYPH_COLORS.length)],
    },
  });
  revalidatePath("/app/merch");
}

export async function adjustStock(itemId: string, delta: number) {
  const session = await getSession();
  if (!session) return;

  const item = await db.merchItem.findUnique({ where: { id: itemId } });
  if (!item || item.workspaceId !== session.workspaceId) return;

  const stock = Math.max(0, item.stock + delta);
  await db.merchItem.update({ where: { id: itemId }, data: { stock } });
  revalidatePath("/app/merch");
}

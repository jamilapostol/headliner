"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const GLYPH_COLORS = ["#3fe87a", "#e8e43f", "#e8983f", "#7ab8e8", "#c99df5", "#e87a9a"];

export type ActionState = { error?: string; success?: string };

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

export async function uploadMerchImage(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "Not signed in." };

  const itemId = String(formData.get("itemId") ?? "");
  const file = formData.get("file") as File | null;
  if (!itemId) return { error: "Missing item." };
  if (!file || file.size === 0) return { error: "Choose an image first." };
  if (file.size > 5 * 1024 * 1024) return { error: "Image must be under 5MB." };

  const item = await db.merchItem.findUnique({ where: { id: itemId } });
  if (!item || item.workspaceId !== session.workspaceId) return { error: "Item not found." };

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${session.workspaceId}/${itemId}.${ext}`;

  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage.from("merch").upload(path, file, { upsert: true });
  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = admin.storage.from("merch").getPublicUrl(path);

  await db.merchItem.update({ where: { id: itemId }, data: { imageUrl: `${publicUrl}?t=${Date.now()}` } });
  revalidatePath("/app/merch");
  return { success: "Photo updated." };
}

export async function completeSale(cart: Array<{ itemId: string; qty: number }>) {
  const session = await getSession();
  if (!session) return;

  const items = cart.filter((c) => c.qty > 0);
  if (items.length === 0) return;

  const merchItems = await db.merchItem.findMany({
    where: { id: { in: items.map((c) => c.itemId) }, workspaceId: session.workspaceId },
  });

  let total = 0;
  const updates = [];
  for (const c of items) {
    const item = merchItems.find((m) => m.id === c.itemId);
    if (!item) continue;
    const qty = Math.min(c.qty, item.stock);
    if (qty <= 0) continue;
    total += qty * item.price;
    updates.push(db.merchItem.update({ where: { id: item.id }, data: { stock: item.stock - qty } }));
  }
  if (total === 0) return;

  await db.$transaction([
    ...updates,
    db.transaction.create({
      data: { workspaceId: session.workspaceId, kind: "income", category: "Merchandise", amount: total, source: "Point of sale" },
    }),
  ]);

  revalidatePath("/app/merch");
  revalidatePath("/app/finance");
  revalidatePath("/app");
}

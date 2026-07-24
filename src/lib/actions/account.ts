"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ActionState = { error?: string; success?: string };

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "Not signed in." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };

  const addressLine1 = String(formData.get("addressLine1") ?? "").trim() || null;
  const addressLine2 = String(formData.get("addressLine2") ?? "").trim() || null;
  const city = String(formData.get("city") ?? "").trim() || null;
  const state = String(formData.get("state") ?? "").trim() || null;
  const postalCode = String(formData.get("postalCode") ?? "").trim() || null;
  const country = String(formData.get("country") ?? "").trim() || null;

  const supabase = await createClient();
  const { error: authError } = await supabase.auth.updateUser({ data: { name } });
  if (authError) return { error: authError.message };

  await db.workspace.update({
    where: { id: session.workspaceId },
    data: { addressLine1, addressLine2, city, state, postalCode, country },
  });

  revalidatePath("/app", "layout");
  return { success: "Profile updated." };
}

export async function changeEmail(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "Not signed in." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "Email is required." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email });
  if (error) return { error: error.message };

  return { success: "Check your inbox to confirm the new email address." };
}

export async function changePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "Not signed in." };

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "Passwords don't match." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  return { success: "Password updated." };
}

export async function uploadAvatar(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "Not signed in." };

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "Choose an image first." };
  if (file.size > 2 * 1024 * 1024) return { error: "Image must be under 2MB." };

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${session.userId}/avatar.${ext}`;

  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage.from("avatars").upload(path, file, { upsert: true });
  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = admin.storage.from("avatars").getPublicUrl(path);

  const supabase = await createClient();
  const { error: authError } = await supabase.auth.updateUser({ data: { avatar_url: `${publicUrl}?t=${Date.now()}` } });
  if (authError) return { error: authError.message };

  revalidatePath("/app", "layout");
  return { success: "Photo updated." };
}

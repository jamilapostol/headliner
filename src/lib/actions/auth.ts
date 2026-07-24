"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string };

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) {
    return { error: "All fields are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) return { error: error.message };
  if (!data.user) return { error: "Could not create your account. Please try again." };

  await db.workspace.create({
    data: {
      name,
      plan: "free",
      memberships: { create: { userId: data.user.id, role: "artist" } },
    },
  });

  if (!data.session) {
    // Email confirmation is required by the Supabase project — no session
    // yet, so send them to log in once they've confirmed.
    return { error: "Check your email to confirm your account, then log in." };
  }

  redirect("/onboarding");
}

export async function logIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: "Invalid email or password." };
  redirect("/app");
}

export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

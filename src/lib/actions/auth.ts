"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { withErrorState } from "@/lib/action-error";

export type AuthState = { error?: string; success?: string };

const TOO_MANY_ATTEMPTS = "Too many attempts. Please wait a bit and try again.";

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  return withErrorState("signUp", async () => {
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    if (!name || !email || !password) {
      return { error: "All fields are required." };
    }
    if (password.length < 8) {
      return { error: "Password must be at least 8 characters." };
    }

    const ip = await requestIp();
    const ipLimit = await checkRateLimit(`signup:ip:${ip}`, { max: 8, windowMs: 60 * 60 * 1000 });
    if (!ipLimit.ok) return { error: TOO_MANY_ATTEMPTS };

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) return { error: error.message };
    if (!data.user) return { error: "Could not create your account. Please try again." };

    const refCode = String(formData.get("ref") ?? "").trim();
    const referrer = refCode ? await db.workspace.findUnique({ where: { id: refCode }, select: { id: true } }) : null;

    await db.workspace.create({
      data: {
        name,
        plan: "free",
        referredByWorkspaceId: referrer?.id,
        memberships: { create: { userId: data.user.id, role: "artist", acceptedAt: new Date() } },
      },
    });

    if (!data.session) {
      // Email confirmation is required by the Supabase project — no session
      // yet, so send them to log in once they've confirmed.
      return { success: "Almost there — check your email to confirm your account, then log in." };
    }

    redirect("/onboarding");
  });
}

export async function logIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  return withErrorState("logIn", async () => {
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    const ip = await requestIp();
    // Two windows: a tight one per email (stops brute-forcing one account)
    // and a looser one per IP (stops credential-stuffing across many accounts
    // from a single source).
    const emailLimit = await checkRateLimit(`login:email:${email}`, { max: 8, windowMs: 15 * 60 * 1000 });
    const ipLimit = await checkRateLimit(`login:ip:${ip}`, { max: 30, windowMs: 15 * 60 * 1000 });
    if (!emailLimit.ok || !ipLimit.ok) return { error: TOO_MANY_ATTEMPTS };

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return { error: "Invalid email or password." };

    // Honor a ?next= destination (e.g. /admin bounced them here), but only
    // same-site paths — "//evil.com" would be treated as protocol-relative.
    const rawNext = String(formData.get("next") ?? "");
    const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/app";

    // Password puts the session at AAL1; if this account has a verified TOTP
    // factor, the second step happens at /login/verify before anything else.
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal && aal.currentLevel === "aal1" && aal.nextLevel === "aal2") {
      redirect(`/login/verify?next=${encodeURIComponent(next)}`);
    }

    redirect(next);
  });
}

export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  return withErrorState("requestPasswordReset", async () => {
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    if (!email) return { error: "Enter your email address." };

    const emailLimit = await checkRateLimit(`reset:email:${email}`, { max: 3, windowMs: 60 * 60 * 1000 });
    if (!emailLimit.ok) {
      // Same generic message as success — don't reveal that a limit exists,
      // that would itself leak whether the email is registered.
      return { success: "If that email has an account, we've sent a reset link." };
    }

    const supabase = await createClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    // Always return the same success message regardless of whether the email
    // exists — otherwise this becomes a way to enumerate registered accounts.
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/auth/callback?next=/reset-password`,
    });

    return { success: "If that email has an account, we've sent a reset link." };
  });
}

export async function resetPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  return withErrorState("resetPassword", async () => {
    const password = String(formData.get("password") ?? "");
    if (password.length < 8) return { error: "Password must be at least 8 characters." };

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "This reset link has expired. Request a new one." };

    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: error.message };

    redirect("/app");
  });
}

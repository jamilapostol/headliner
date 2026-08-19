"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/site-url";
import { normalizeInviteCode, inviteRedeemable, redeemableWhere } from "@/lib/invites";
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
    const code = normalizeInviteCode(formData.get("code"));

    if (!name || !email || !password) {
      return { error: "All fields are required." };
    }
    if (password.length < 8) {
      return { error: "Password must be at least 8 characters." };
    }

    const ip = await requestIp();
    const ipLimit = await checkRateLimit(`signup:ip:${ip}`, { max: 8, windowMs: 60 * 60 * 1000 });
    if (!ipLimit.ok) return { error: TOO_MANY_ATTEMPTS };

    // Invite gate. Registration is closed during the private beta: without a
    // valid code we stop here, before touching Supabase Auth — so a bot
    // guessing codes can never create an auth user, only burn rate limit.
    // A separate per-IP budget on *code guesses* is much tighter than the
    // signup budget, since a legitimate person types their code correctly
    // on the first or second try.
    if (!code) return { error: "HEADLINE.WORLD is invite-only right now. Enter your invite code to continue." };

    const guessLimit = await checkRateLimit(`signup:code:${ip}`, { max: 5, windowMs: 60 * 60 * 1000 });
    if (!guessLimit.ok) return { error: TOO_MANY_ATTEMPTS };

    const invite = await db.betaInvite.findUnique({ where: { code } });
    if (!invite || !invite.active) return { error: "That invite code isn't valid." };
    if (!inviteRedeemable(invite)) {
      return { error: "That invite code has already been fully redeemed." };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) return { error: error.message };
    if (!data.user) return { error: "Could not create your account. Please try again." };

    const userId = data.user.id;
    const refCode = String(formData.get("ref") ?? "").trim();
    const referrer = refCode ? await db.workspace.findUnique({ where: { id: refCode }, select: { id: true } }) : null;

    // Consume the invite and provision the workspace together — a crash
    // between the two would either burn a use with no workspace or hand out
    // a beta workspace for free. The conditional increment (active + under
    // maxUses) makes the check-then-use race-safe: two requests redeeming the
    // last seat at once means the loser's update matches no rows and throws,
    // rolling the whole transaction back.
    try {
      await db.$transaction(async (tx) => {
        const claimed = await tx.betaInvite.updateMany({
          where: redeemableWhere(code, invite.maxUses),
          data: { usedCount: { increment: 1 } },
        });
        if (claimed.count === 0) throw new Error("invite no longer available");

        await tx.workspace.create({
          data: {
            name,
            plan: "beta",
            referredByWorkspaceId: referrer?.id,
            memberships: { create: { userId, role: "artist", acceptedAt: new Date() } },
          },
        });
      });
    } catch {
      return { error: "That invite code was just fully redeemed. Ask us for a new one." };
    }

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
    const appUrl = siteUrl();
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

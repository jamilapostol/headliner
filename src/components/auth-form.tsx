"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AuthState } from "@/lib/actions/auth";

export function AuthForm({
  mode,
  action,
  referralCode,
}: {
  mode: "login" | "signup";
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
  referralCode?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {mode === "signup" && referralCode && <input type="hidden" name="ref" value={referralCode} />}
      {mode === "signup" && (
        <Field label="Name" name="name" type="text" placeholder="Your name" autoComplete="name" />
      )}
      <Field label="Email" name="email" type="email" placeholder="you@band.com" autoComplete="email" />
      <Field
        label="Password"
        name="password"
        type="password"
        placeholder="••••••••"
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
      />

      {state.error && (
        <div className="rounded-lg border border-orange/30 bg-orange-soft px-3 py-2 text-[13px] text-orange">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-lg border border-accent/30 bg-accent-soft px-3 py-2 text-[13px] text-accent">
          {state.success}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-[10px] bg-accent px-4 py-3 text-[14.5px] font-semibold text-canvas disabled:opacity-60"
      >
        {pending ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
      </button>

      <div className="flex flex-col items-center gap-2 text-center text-[13px] text-muted">
        {mode === "signup" ? (
          <>
            Already have an account? <Link href="/login" className="text-accent">Log in</Link>
          </>
        ) : (
          <>
            <span>
              New to HEADLINE.WORLD? <Link href="/signup" className="text-accent">Start free</Link>
            </span>
            <Link href="/forgot-password" className="text-muted hover:text-text">
              Forgot your password?
            </Link>
          </>
        )}
      </div>
    </form>
  );
}

export function Field({
  label,
  name,
  type,
  placeholder,
  autoComplete,
}: {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  autoComplete: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium text-muted">{label}</span>
      <input
        name={name}
        type={type}
        required
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="rounded-[10px] border border-border bg-surface px-3.5 py-2.5 text-[14px] text-text outline-none focus:border-accent/50"
      />
    </label>
  );
}

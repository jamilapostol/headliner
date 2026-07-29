"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset } from "@/lib/actions/auth";
import { Field } from "@/components/auth-form";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Email" name="email" type="email" placeholder="you@band.com" autoComplete="email" />

      {state.error && (
        <div className="rounded-lg border border-orange/30 bg-orange-soft px-3 py-2 text-[13px] text-orange">{state.error}</div>
      )}
      {state.success && (
        <div className="rounded-lg border border-accent/30 bg-accent-soft px-3 py-2 text-[13px] text-accent">{state.success}</div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-[10px] bg-accent px-4 py-3 text-[14.5px] font-semibold text-canvas disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send reset link"}
      </button>

      <div className="text-center text-[13px] text-muted">
        <Link href="/login" className="text-accent">
          Back to login
        </Link>
      </div>
    </form>
  );
}

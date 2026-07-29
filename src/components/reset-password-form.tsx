"use client";

import { useActionState } from "react";
import { resetPassword } from "@/lib/actions/auth";
import { Field } from "@/components/auth-form";

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(resetPassword, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="New password" name="password" type="password" placeholder="••••••••" autoComplete="new-password" />

      {state.error && (
        <div className="rounded-lg border border-orange/30 bg-orange-soft px-3 py-2 text-[13px] text-orange">{state.error}</div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-[10px] bg-accent px-4 py-3 text-[14.5px] font-semibold text-canvas disabled:opacity-60"
      >
        {pending ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}

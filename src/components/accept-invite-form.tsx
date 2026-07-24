"use client";

import { useActionState } from "react";
import { finishInviteAccept, type ActionState } from "@/lib/actions/team";

const initial: ActionState = {};

export function AcceptInviteForm() {
  const [state, formAction, pending] = useActionState(finishInviteAccept, initial);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] font-medium text-muted">Password</span>
        <input
          name="password"
          type="password"
          required
          placeholder="••••••••"
          autoComplete="new-password"
          className="rounded-[10px] border border-border bg-surface px-3.5 py-2.5 text-[14px] text-text outline-none focus:border-accent/50"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] font-medium text-muted">Confirm password</span>
        <input
          name="confirm"
          type="password"
          required
          placeholder="••••••••"
          autoComplete="new-password"
          className="rounded-[10px] border border-border bg-surface px-3.5 py-2.5 text-[14px] text-text outline-none focus:border-accent/50"
        />
      </label>

      {state.error && (
        <div className="rounded-lg border border-orange/30 bg-orange-soft px-3 py-2 text-[13px] text-orange">{state.error}</div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-[10px] bg-accent px-4 py-3 text-[14.5px] font-semibold text-canvas disabled:opacity-60"
      >
        {pending ? "Joining…" : "Join workspace"}
      </button>
    </form>
  );
}

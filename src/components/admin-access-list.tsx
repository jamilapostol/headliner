"use client";

import { useActionState, useTransition } from "react";
import { addAdminEmail, removeAdminEmail, type ActionState } from "@/lib/actions/admin-emails";

const initial: ActionState = {};

export function AdminAccessList({
  envEmails,
  dbEmails,
  currentEmail,
}: {
  envEmails: string[];
  dbEmails: { email: string; addedBy: string; createdAt: string }[];
  currentEmail: string;
}) {
  const [state, formAction, pending] = useActionState(addAdminEmail, initial);
  const [removing, startRemoving] = useTransition();

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-card border border-border bg-surface px-5 py-4">
        <div className="mb-1 text-[13.5px] font-semibold">Add an admin</div>
        <div className="mb-3 text-[12px] text-text/50">They&rsquo;ll get admin access the next time they sign in with this email.</div>
        <form action={formAction} className="flex gap-2">
          <input
            name="email"
            type="email"
            required
            placeholder="teammate@example.com"
            className="flex-1 rounded-[10px] border border-border bg-canvas px-3.5 py-2.5 text-[13.5px] text-text outline-none"
          />
          <button
            disabled={pending}
            className="cursor-pointer rounded-md bg-accent px-4 py-2 text-[12.5px] font-semibold text-ink disabled:opacity-50"
          >
            {pending ? "Adding…" : "Add"}
          </button>
        </form>
        {state.error && <div className="mt-2 text-[12px] text-orange">{state.error}</div>}
        {state.success && <div className="mt-2 text-[12px] text-accent">{state.success}</div>}
      </div>

      <div className="rounded-card border border-border bg-surface px-5 py-1">
        <div className="border-b border-text/[.06] py-3 text-[13px] font-semibold text-text/70">Added from this panel</div>
        {dbEmails.length === 0 && <div className="py-5 text-[12.5px] text-text/40">No admins added here yet.</div>}
        {dbEmails.map((row) => (
          <div key={row.email} className="flex items-center justify-between border-b border-text/[.05] py-3 last:border-b-0">
            <div>
              <div className="text-[13px]">{row.email}</div>
              <div className="text-[11px] text-text/40">
                added by {row.addedBy} · {new Date(row.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            </div>
            {row.email.toLowerCase() === currentEmail.toLowerCase() ? (
              <span className="text-[11.5px] text-text/35">You</span>
            ) : (
              <button
                disabled={removing}
                onClick={() => startRemoving(() => removeAdminEmail(row.email))}
                className="cursor-pointer text-[11.5px] text-orange hover:text-orange/80 disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-card border border-border bg-surface px-5 py-1">
        <div className="border-b border-text/[.06] py-3 text-[13px] font-semibold text-text/70">Set via ADMIN_EMAILS env var</div>
        <div className="px-0 py-2 text-[12px] text-text/45">
          Bootstrap allowlist — edit in Vercel project settings, not removable from here.
        </div>
        {envEmails.map((email) => (
          <div key={email} className="border-b border-text/[.05] py-2.5 text-[13px] text-text/70 last:border-b-0">
            {email}
          </div>
        ))}
      </div>
    </div>
  );
}

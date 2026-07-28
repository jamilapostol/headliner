"use client";

import { useActionState, useTransition } from "react";
import { inviteTeamMember, removeMember, type ActionState } from "@/lib/actions/team";
import { INVITABLE_ROLES, ROLE_LABEL } from "@/lib/roles";

export type MemberRow = { id: string; name: string; email: string; role: string; accepted: boolean; isSelf: boolean };

const initial: ActionState = {};

export function TeamSection({ members, canManage, seatLabel }: { members: MemberRow[]; canManage: boolean; seatLabel: string }) {
  const [inviteState, inviteAction, invitePending] = useActionState(inviteTeamMember, initial);
  const [, startTransition] = useTransition();

  return (
    <section className="rounded-card border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-[13.5px] font-semibold">Team</div>
        <div className="text-[11.5px] text-text/40">{seatLabel}</div>
      </div>

      <div className="mb-4 flex flex-col gap-2">
        {members.map((m) => (
          <div
            key={m.id}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[10px] border border-text/[.06] bg-surface-nested px-3.5 py-2.5"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold">
                {m.name}
                {m.isSelf ? " (you)" : ""}
              </div>
              <div className="truncate text-[11.5px] text-text/45">{m.email}</div>
            </div>
            <div className="text-[11px] text-text/50">{ROLE_LABEL[m.role] ?? m.role}</div>
            {!m.accepted && (
              <div className="rounded-full bg-yellow/15 px-2 py-0.5 text-[10px] font-semibold text-yellow">Invited</div>
            )}
            {canManage && !m.isSelf && (
              <button
                onClick={() => startTransition(() => void removeMember(m.id))}
                className="cursor-pointer px-1.5 text-[12px] text-text/40 hover:text-orange"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {canManage && (
        <form action={inviteAction} className="flex flex-col gap-2.5 border-t border-text/10 pt-4 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-[12px] font-medium text-text/50">Email</span>
            <input
              name="email"
              type="email"
              required
              placeholder="bandmate@email.com"
              className="rounded-[10px] border border-border bg-surface-nested px-3.5 py-2.5 text-[13.5px] text-text outline-none focus:border-accent/50"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-text/50">Role</span>
            <select
              name="role"
              defaultValue="manager"
              className="rounded-[10px] border border-border bg-surface-nested px-3.5 py-2.5 text-[13.5px] text-text outline-none focus:border-accent/50"
            >
              {INVITABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={invitePending}
            className="cursor-pointer rounded-lg bg-accent px-4 py-2.5 text-[12.5px] font-semibold text-ink disabled:opacity-60"
          >
            {invitePending ? "Sending…" : "Send invite"}
          </button>
        </form>
      )}

      {inviteState.error && <div className="mt-3 text-[12.5px] text-orange">{inviteState.error}</div>}
      {inviteState.success && <div className="mt-3 text-[12.5px] text-accent">{inviteState.success}</div>}
    </section>
  );
}

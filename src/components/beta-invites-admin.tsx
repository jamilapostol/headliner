"use client";

import { useState, useTransition } from "react";
import { createBetaInvite, revokeBetaInvite } from "@/lib/actions/beta-invites";

type Invite = {
  code: string;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  createdBy: string;
  createdAt: string;
};

export function BetaInvitesAdmin({ invites }: { invites: Invite[] }) {
  const [maxUses, setMaxUses] = useState("");
  const [pending, startTransition] = useTransition();

  function create() {
    const parsed = maxUses.trim() === "" ? null : Math.max(1, Math.trunc(Number(maxUses)));
    startTransition(() => createBetaInvite(parsed));
    setMaxUses("");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-card border border-border bg-surface px-5 py-4">
        <div className="mb-1 text-[13.5px] font-semibold">Generate an invite code</div>
        <div className="mb-3 text-[12px] text-text/50">Share it with an early tester — redeeming it grants full Pro-tier access at no charge.</div>
        <div className="flex gap-2">
          <input
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            type="number"
            min={1}
            placeholder="Max uses (blank = unlimited)"
            className="flex-1 rounded-[10px] border border-border bg-canvas px-3.5 py-2.5 text-[13.5px] text-text outline-none"
          />
          <button
            onClick={create}
            disabled={pending}
            className="cursor-pointer rounded-md bg-accent px-4 py-2 text-[12.5px] font-semibold text-ink disabled:opacity-50"
          >
            {pending ? "Generating…" : "Generate code"}
          </button>
        </div>
      </div>

      <div className="rounded-card border border-border bg-surface px-5 py-1">
        <div className="border-b border-text/[.06] py-3 text-[13px] font-semibold text-text/70">All codes</div>
        {invites.length === 0 && <div className="py-5 text-[12.5px] text-text/40">No invite codes yet.</div>}
        {invites.map((inv) => (
          <InviteRow key={inv.code} invite={inv} />
        ))}
      </div>
    </div>
  );
}

function InviteRow({ invite }: { invite: Invite }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between border-b border-text/[.05] py-3 last:border-b-0">
      <div>
        <div className="font-mono text-[13px]">{invite.code}</div>
        <div className="text-[11px] text-text/40">
          {invite.usedCount} / {invite.maxUses ?? "∞"} used · by {invite.createdBy} ·{" "}
          {new Date(invite.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </div>
      </div>
      {invite.active ? (
        <button
          disabled={pending}
          onClick={() => startTransition(() => revokeBetaInvite(invite.code))}
          className="cursor-pointer text-[11.5px] text-orange hover:text-orange/80 disabled:opacity-50"
        >
          Revoke
        </button>
      ) : (
        <span className="text-[11.5px] text-text/35">Revoked</span>
      )}
    </div>
  );
}

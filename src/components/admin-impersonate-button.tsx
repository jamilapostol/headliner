"use client";

import { useTransition } from "react";
import { startImpersonation } from "@/lib/actions/impersonate";

export function AdminImpersonateButton({ workspaceId }: { workspaceId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => startImpersonation(workspaceId))}
      disabled={pending}
      className="cursor-pointer rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-text/70 hover:border-accent/50 hover:text-accent disabled:opacity-50"
    >
      {pending ? "…" : "View as"}
    </button>
  );
}

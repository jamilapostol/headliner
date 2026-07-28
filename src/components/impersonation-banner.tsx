"use client";

import { useTransition } from "react";
import { stopImpersonation } from "@/lib/actions/impersonate";

export function ImpersonationBanner({ adminEmail, workspaceName }: { adminEmail: string; workspaceName: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-none items-center justify-center gap-3 bg-orange px-4 py-2 text-[12.5px] font-medium text-ink">
      <span>
        {adminEmail} is viewing <strong>{workspaceName}</strong> as support
      </span>
      <button
        onClick={() => startTransition(() => stopImpersonation())}
        disabled={pending}
        className="cursor-pointer rounded-md bg-ink/15 px-2.5 py-1 text-[11.5px] font-semibold hover:bg-ink/25 disabled:opacity-50"
      >
        {pending ? "…" : "Exit"}
      </button>
    </div>
  );
}

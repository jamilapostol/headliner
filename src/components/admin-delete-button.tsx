"use client";

import { useTransition } from "react";
import { adminDeleteRecord } from "@/lib/actions/admin";

export function AdminDeleteButton({ modelKey, id, label }: { modelKey: string; id: string; label: string }) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!window.confirm(`Delete this ${label}? This can't be undone.`)) return;
    startTransition(() => adminDeleteRecord(modelKey, id));
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="cursor-pointer rounded-md border border-orange/30 px-2.5 py-1 text-[11px] font-semibold text-orange hover:bg-orange/10 disabled:opacity-50"
    >
      {pending ? "…" : "Delete"}
    </button>
  );
}

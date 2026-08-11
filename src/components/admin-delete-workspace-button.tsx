"use client";

import { useState, useTransition } from "react";
import { deleteWorkspaceAndUsers } from "@/lib/actions/admin-delete-workspace";

export function AdminDeleteWorkspaceButton({ workspaceId, name }: { workspaceId: string; name: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    const typed = window.prompt(
      `This permanently deletes "${name}" — every booking, contact, and its user account(s).\n\nType DELETE to confirm:`
    );
    if (typed !== "DELETE") return;
    setError(null);
    startTransition(async () => {
      const result = await deleteWorkspaceAndUsers(workspaceId);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="cursor-pointer rounded-lg border border-orange/30 px-3 py-1.5 text-[12px] font-medium text-orange/80 hover:bg-orange-soft hover:text-orange disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      {error && <div className="max-w-[260px] text-right text-[11px] text-orange">{error}</div>}
    </div>
  );
}

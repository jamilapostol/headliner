"use client";

import { useState, useTransition } from "react";
import { updateSiteContent, resetSiteContent } from "@/lib/actions/site-content";

export function SiteContentField({
  fieldKey,
  label,
  value,
  isOverridden,
  multiline,
}: {
  fieldKey: string;
  label: string;
  value: string;
  isOverridden: boolean;
  multiline?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const dirty = draft !== value;

  function save() {
    startTransition(async () => {
      await updateSiteContent(fieldKey, draft);
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
    });
  }

  function reset() {
    startTransition(() => resetSiteContent(fieldKey));
  }

  const Input = multiline ? "textarea" : "input";

  return (
    <div className="border-b border-white/[.05] py-3.5 last:border-b-0">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[12px] font-medium text-text/50">{label}</span>
        {isOverridden && <span className="font-mono text-[9.5px] tracking-[.08em] text-orange">EDITED</span>}
      </div>
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={multiline ? 3 : undefined}
        className="w-full resize-y rounded-[10px] border border-border bg-canvas px-3.5 py-2.5 text-[13.5px] text-text outline-none"
      />
      <div className="mt-2 flex items-center gap-2">
        {dirty && (
          <button onClick={save} disabled={pending} className="cursor-pointer rounded-md bg-accent px-3 py-1.5 text-[11.5px] font-semibold text-ink disabled:opacity-50">
            {pending ? "Saving…" : "Save"}
          </button>
        )}
        {!dirty && isOverridden && (
          <button onClick={reset} disabled={pending} className="cursor-pointer rounded-md border border-border px-3 py-1.5 text-[11.5px] text-text/60 hover:text-text disabled:opacity-50">
            Reset to default
          </button>
        )}
        {saved && <span className="text-[11.5px] text-accent">Saved — live now</span>}
      </div>
    </div>
  );
}

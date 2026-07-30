"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { updateSiteContent, resetSiteContent, uploadSiteImage, type ActionState } from "@/lib/actions/site-content";

const initial: ActionState = {};

export function SiteContentField({
  fieldKey,
  label,
  value,
  isOverridden,
  multiline,
  type,
}: {
  fieldKey: string;
  label: string;
  value: string;
  isOverridden: boolean;
  multiline?: boolean;
  type?: "text" | "image";
}) {
  if (type === "image") {
    return <ImageField fieldKey={fieldKey} label={label} value={value} isOverridden={isOverridden} />;
  }
  return <TextField fieldKey={fieldKey} label={label} value={value} isOverridden={isOverridden} multiline={multiline} />;
}

function TextField({
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
    <div className="border-b border-text/[.05] py-3.5 last:border-b-0">
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

function ImageField({
  fieldKey,
  label,
  value,
  isOverridden,
}: {
  fieldKey: string;
  label: string;
  value: string;
  isOverridden: boolean;
}) {
  const [state, action, pending] = useActionState(uploadSiteImage, initial);
  const [resetPending, startResetTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function reset() {
    startResetTransition(() => resetSiteContent(fieldKey));
  }

  return (
    <div className="border-b border-text/[.05] py-3.5 last:border-b-0">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[12px] font-medium text-text/50">{label}</span>
        {isOverridden && <span className="font-mono text-[9.5px] tracking-[.08em] text-orange">EDITED</span>}
      </div>
      <div className="flex items-center gap-4">
        <Image src={value} alt="" width={96} height={64} className="h-16 w-24 flex-none rounded-lg border border-border object-cover" unoptimized />
        <form ref={formRef} action={action} className="flex flex-col gap-1.5">
          <input type="hidden" name="key" value={fieldKey} />
          <label className="cursor-pointer rounded-lg border border-text/15 px-3.5 py-2 text-center text-[12.5px] font-semibold text-text/80 hover:border-text/35">
            {pending ? "Uploading…" : "Change photo"}
            <input
              type="file"
              name="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={() => formRef.current?.requestSubmit()}
            />
          </label>
          <div className="text-[11px] text-text/40">PNG, JPG, GIF or WEBP. Max 8MB.</div>
          {state.error && <div className="text-[12px] text-orange">{state.error}</div>}
          {state.success && <div className="text-[12px] text-accent">{state.success}</div>}
        </form>
        {isOverridden && (
          <button onClick={reset} disabled={resetPending} className="cursor-pointer rounded-md border border-border px-3 py-1.5 text-[11.5px] text-text/60 hover:text-text disabled:opacity-50">
            Reset to default
          </button>
        )}
      </div>
    </div>
  );
}

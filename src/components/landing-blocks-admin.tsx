"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  createLandingBlock,
  updateLandingBlock,
  deleteLandingBlock,
  moveLandingBlock,
  uploadLandingBlockImage,
  type ActionState,
} from "@/lib/actions/landing-blocks";

type Block = {
  id: string;
  type: string;
  order: number;
  heading: string | null;
  body: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
};

const initial: ActionState = {};

export function LandingBlocksAdmin({ blocks }: { blocks: Block[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-card border border-border bg-surface px-5 py-1">
      <div className="flex items-center justify-between border-b border-text/[.06] py-3">
        <span className="text-[13px] font-semibold text-text/70">Custom blocks</span>
        <div className="flex gap-2">
          <button
            disabled={pending}
            onClick={() => startTransition(() => createLandingBlock("text"))}
            className="cursor-pointer rounded-md border border-border px-3 py-1.5 text-[11.5px] text-text/70 hover:text-text disabled:opacity-50"
          >
            + Text block
          </button>
          <button
            disabled={pending}
            onClick={() => startTransition(() => createLandingBlock("image"))}
            className="cursor-pointer rounded-md border border-border px-3 py-1.5 text-[11.5px] text-text/70 hover:text-text disabled:opacity-50"
          >
            + Image block
          </button>
        </div>
      </div>

      {blocks.length === 0 && <div className="py-5 text-[12.5px] text-text/40">No custom blocks yet. Added blocks render between Features and Pricing.</div>}

      {blocks.map((b, i) => (
        <BlockRow key={b.id} block={b} isFirst={i === 0} isLast={i === blocks.length - 1} />
      ))}
    </div>
  );
}

function BlockRow({ block, isFirst, isLast }: { block: Block; isFirst: boolean; isLast: boolean }) {
  const [pending, startTransition] = useTransition();
  const [heading, setHeading] = useState(block.heading ?? "");
  const [body, setBody] = useState(block.body ?? "");
  const [imageAlt, setImageAlt] = useState(block.imageAlt ?? "");
  const [saved, setSaved] = useState(false);

  const [uploadState, uploadAction, uploadPending] = useActionState(uploadLandingBlockImage, initial);
  const formRef = useRef<HTMLFormElement>(null);

  const dirty = block.type === "text" ? heading !== (block.heading ?? "") || body !== (block.body ?? "") : imageAlt !== (block.imageAlt ?? "");

  function save() {
    startTransition(() => updateLandingBlock(block.id, block.type === "text" ? { heading, body } : { imageAlt }));
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  }

  function remove() {
    if (!confirm("Delete this block?")) return;
    startTransition(() => deleteLandingBlock(block.id));
  }

  return (
    <div className="border-b border-text/[.05] py-3.5 last:border-b-0">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-mono text-[9.5px] tracking-[.08em] text-text/40">{block.type === "text" ? "TEXT BLOCK" : "IMAGE BLOCK"}</span>
        <div className="flex items-center gap-2">
          <button disabled={pending || isFirst} onClick={() => startTransition(() => moveLandingBlock(block.id, "up"))} className="cursor-pointer text-[12px] text-text/50 hover:text-text disabled:opacity-25">
            ↑
          </button>
          <button disabled={pending || isLast} onClick={() => startTransition(() => moveLandingBlock(block.id, "down"))} className="cursor-pointer text-[12px] text-text/50 hover:text-text disabled:opacity-25">
            ↓
          </button>
          <button disabled={pending} onClick={remove} className="cursor-pointer text-[11.5px] text-orange hover:text-orange/80 disabled:opacity-50">
            Delete
          </button>
        </div>
      </div>

      {block.type === "text" ? (
        <div className="flex flex-col gap-2">
          <input
            value={heading}
            onChange={(e) => setHeading(e.target.value)}
            placeholder="Heading"
            className="w-full rounded-[10px] border border-border bg-canvas px-3.5 py-2.5 text-[13.5px] text-text outline-none"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Body"
            className="w-full resize-y rounded-[10px] border border-border bg-canvas px-3.5 py-2.5 text-[13.5px] text-text outline-none"
          />
        </div>
      ) : (
        <div className="flex items-center gap-4">
          {block.imageUrl && <Image src={block.imageUrl} alt="" width={96} height={64} className="h-16 w-24 flex-none rounded-lg border border-border object-cover" unoptimized />}
          <form ref={formRef} action={uploadAction} className="flex flex-col gap-1.5">
            <input type="hidden" name="id" value={block.id} />
            <label className="cursor-pointer rounded-lg border border-text/15 px-3.5 py-2 text-center text-[12.5px] font-semibold text-text/80 hover:border-text/35">
              {uploadPending ? "Uploading…" : "Change photo"}
              <input type="file" name="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={() => formRef.current?.requestSubmit()} />
            </label>
            {uploadState.error && <div className="text-[12px] text-orange">{uploadState.error}</div>}
            {uploadState.success && <div className="text-[12px] text-accent">{uploadState.success}</div>}
          </form>
          <input
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
            placeholder="Alt text"
            className="flex-1 rounded-[10px] border border-border bg-canvas px-3.5 py-2.5 text-[13.5px] text-text outline-none"
          />
        </div>
      )}

      <div className="mt-2 flex items-center gap-2">
        {dirty && (
          <button onClick={save} disabled={pending} className="cursor-pointer rounded-md bg-accent px-3 py-1.5 text-[11.5px] font-semibold text-ink disabled:opacity-50">
            {pending ? "Saving…" : "Save"}
          </button>
        )}
        {saved && <span className="text-[11.5px] text-accent">Saved — live now</span>}
      </div>
    </div>
  );
}

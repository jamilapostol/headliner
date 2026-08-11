"use client";

import { useActionState, useState, useTransition } from "react";
import {
  createWebPage,
  updateWebPage,
  toggleWebPageVisibility,
  deleteWebPage,
  type PageActionState,
} from "@/lib/actions/web-pages";

export type AdminPageRow = {
  id: string;
  slug: string;
  title: string;
  kind: string;
  visibility: string;
  heading: string | null;
  body: string | null;
  path: string;
};

const initialState: PageActionState = {};

const inputCls =
  "rounded-[10px] border border-border bg-canvas px-3.5 py-2.5 text-[13px] text-text outline-none focus:border-accent/50";

export function AdminWebPages({ pages }: { pages: AdminPageRow[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const [createState, createAction, createPending] = useActionState(createWebPage, initialState);
  const [editState, editAction, editPending] = useActionState(updateWebPage, initialState);

  function toggle(id: string) {
    if (pendingId) return;
    setPendingId(id);
    startTransition(async () => {
      try {
        await toggleWebPageVisibility(id);
      } finally {
        setPendingId(null);
      }
    });
  }

  function remove(id: string, slug: string) {
    if (!window.confirm(`Delete /${slug}? This can't be undone.`)) return;
    startTransition(() => deleteWebPage(id));
  }

  return (
    <div className="flex max-w-[760px] flex-col gap-6">
      <section className="rounded-card border border-border bg-surface">
        {pages.map((p, i) => {
          const isPublic = p.visibility === "public";
          const busy = pendingId === p.id;
          return (
            <div key={p.id} className={`px-5 py-4 ${i > 0 ? "border-t border-border" : ""}`}>
              <div className="flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="truncate text-[14px] font-semibold">{p.title}</span>
                    {p.kind === "system" && (
                      <span className="rounded-full border border-border px-2 py-0.5 font-sans text-[9.5px] tracking-[.08em] text-text/40">
                        SYSTEM
                      </span>
                    )}
                  </div>
                  <a
                    href={p.path}
                    target="_blank"
                    rel="noreferrer"
                    className="font-sans text-[11.5px] text-text/45 hover:text-accent"
                  >
                    headline.world{p.path === "/" ? "" : p.path} ↗
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(p.id)}
                  disabled={busy}
                  className={`cursor-pointer rounded-full border px-3.5 py-1.5 font-sans text-[11px] font-semibold tracking-[.06em] disabled:opacity-50 ${
                    isPublic ? "border-accent/40 bg-accent-soft text-accent" : "border-border text-text/50"
                  }`}
                >
                  {busy ? "…" : isPublic ? "PUBLIC" : "PRIVATE"}
                </button>
                {p.kind === "custom" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditing(editing === p.id ? null : p.id)}
                      className="cursor-pointer text-[12.5px] text-text/60 hover:text-text"
                    >
                      {editing === p.id ? "Close" : "Edit"}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(p.id, p.slug)}
                      className="cursor-pointer text-[12.5px] text-orange/80 hover:text-orange"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>

              {editing === p.id && (
                <form action={editAction} className="mt-4 flex flex-col gap-2.5 rounded-xl border border-border bg-surface-nested p-4">
                  <input type="hidden" name="id" value={p.id} />
                  <input name="title" defaultValue={p.title} placeholder="Page title" className={inputCls} />
                  <input name="heading" defaultValue={p.heading ?? ""} placeholder="Heading shown on the page" className={inputCls} />
                  <textarea
                    name="body"
                    defaultValue={p.body ?? ""}
                    rows={8}
                    placeholder="Page text — separate paragraphs with a blank line."
                    className={inputCls}
                  />
                  {editState.error && <div className="text-[12px] text-orange">{editState.error}</div>}
                  {editState.success && <div className="text-[12px] text-accent">{editState.success}</div>}
                  <button
                    type="submit"
                    disabled={editPending}
                    className="self-start rounded-[10px] bg-accent px-4 py-2 text-[13px] font-semibold text-ink disabled:opacity-60"
                  >
                    {editPending ? "Saving…" : "Save changes"}
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </section>

      <section className="rounded-card border border-border bg-surface p-5">
        <button
          type="button"
          onClick={() => setShowCreate((s) => !s)}
          className="cursor-pointer text-[13.5px] font-semibold text-accent hover:text-accent/80"
        >
          {showCreate ? "− Cancel" : "+ New page"}
        </button>
        {showCreate && (
          <form action={createAction} className="mt-4 flex flex-col gap-2.5">
            <input name="title" placeholder="Page title (e.g. Press Kit)" className={inputCls} />
            <div className="flex items-center gap-2">
              <span className="font-sans text-[12.5px] text-text/45">headline.world/</span>
              <input name="slug" placeholder="press-kit" className={`flex-1 ${inputCls}`} />
            </div>
            <input name="heading" placeholder="Heading shown on the page (optional — defaults to title)" className={inputCls} />
            <textarea
              name="body"
              rows={8}
              placeholder="Page text — separate paragraphs with a blank line."
              className={inputCls}
            />
            {createState.error && <div className="text-[12px] text-orange">{createState.error}</div>}
            {createState.success && <div className="text-[12px] text-accent">{createState.success}</div>}
            <button
              type="submit"
              disabled={createPending}
              className="self-start rounded-[10px] bg-accent px-4 py-2 text-[13px] font-semibold text-ink disabled:opacity-60"
            >
              {createPending ? "Creating…" : "Create page (starts private)"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

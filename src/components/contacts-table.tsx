"use client";

import { useMemo, useState, useTransition } from "react";
import { createContact } from "@/lib/actions/contacts";

export type ContactDTO = {
  id: string;
  name: string;
  org: string | null;
  role: string | null;
  category: string;
  city: string | null;
  strength: number;
  lastContactedAt: string | null;
};

const CATS = ["All", "Venues", "Promoters", "Festivals", "Media", "Sponsors"];
const AVATAR_COLORS = ["#3fe87a", "#e8e43f", "#7ab8e8", "#e8983f", "#c99df5"];

function daysAgoLabel(iso: string | null) {
  if (!iso) return { label: "—", stale: false };
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return { label: days <= 0 ? "today" : `${days}d ago`, stale: days > 5 };
}

export function ContactsTable({ contacts }: { contacts: ContactDTO[] }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const [showNew, setShowNew] = useState(false);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return contacts.filter(
      (c) =>
        (cat === "All" || c.category === cat) &&
        (!q || `${c.name}${c.org ?? ""}${c.city ?? ""}${c.role ?? ""}`.toLowerCase().includes(q))
    );
  }, [contacts, query, cat]);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-5 sm:px-8 sm:py-7">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-[22px] tracking-[-.02em] sm:text-[26px]">Contacts</h1>
        <button onClick={() => setShowNew(true)} className="cursor-pointer rounded-lg bg-accent px-3.5 py-1.5 text-[12.5px] font-semibold text-canvas">
          + New contact
        </button>
      </div>
      <div className="mb-3.5 flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search contacts…"
          className="w-[220px] rounded-lg border border-white/10 bg-surface px-3 py-2 text-[13px] text-text outline-none"
        />
        {CATS.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className="cursor-pointer rounded-[20px] px-3.5 py-[7px] text-[12px]"
            style={{
              border: `1px solid ${c === cat ? "#3fe87a" : "rgba(255,255,255,.12)"}`,
              background: c === cat ? "rgba(63,232,122,.1)" : "transparent",
              color: c === cat ? "#3fe87a" : "rgba(233,236,232,.65)",
            }}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-card border border-border bg-surface">
        <div className="min-w-[620px]">
          <div className="grid grid-cols-[2fr_1.2fr_1.2fr_1fr_.8fr] gap-3 border-b border-border px-[18px] py-[11px] font-mono text-[10.5px] tracking-[.1em] text-white/40">
            <div>NAME</div>
            <div>ROLE</div>
            <div>CITY</div>
            <div>LAST CONTACT</div>
            <div>STRENGTH</div>
          </div>
          {filtered.map((c, i) => {
            const initials = c.name.split(" ").map((w) => w[0]).join("");
            const last = daysAgoLabel(c.lastContactedAt);
            return (
              <div key={c.id} className="grid grid-cols-[2fr_1.2fr_1.2fr_1fr_.8fr] items-center gap-3 border-b border-white/[.05] px-[18px] py-3 hover:bg-white/[.03]">
                <div className="flex items-center gap-2.5">
                  <div
                    className="grid h-7 w-7 flex-none place-items-center rounded-full text-[11px] font-bold text-canvas"
                    style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                  >
                    {initials}
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold">{c.name}</div>
                    <div className="text-[11px] text-white/40">{c.org}</div>
                  </div>
                </div>
                <div className="text-[12.5px] text-white/70">{c.role}</div>
                <div className="text-[12.5px] text-white/70">{c.city}</div>
                <div className="font-mono text-[11.5px]" style={{ color: last.stale ? "#e8983f" : "rgba(233,236,232,.5)" }}>
                  {last.label}
                </div>
                <div className="flex gap-[3px]">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span key={n} className="h-2 w-2 rounded-full" style={{ background: n <= c.strength ? "#3fe87a" : "rgba(255,255,255,.1)" }} />
                  ))}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <div className="px-[18px] py-7 text-center text-[13px] text-white/40">No contacts match your search.</div>}
        </div>
      </div>

      {showNew && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/60 px-4" onClick={() => setShowNew(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[420px] rounded-2xl border border-border bg-surface p-6">
            <div className="mb-4 text-[17px] font-semibold">New contact</div>
            <form
              action={(fd) =>
                startTransition(async () => {
                  await createContact(fd);
                  setShowNew(false);
                })
              }
              className="flex flex-col gap-3"
            >
              <NField label="Name" name="name" placeholder="Jordan Reyes" />
              <NField label="Organization" name="org" placeholder="Bluebird Theater" />
              <NField label="Role" name="role" placeholder="Talent buyer" />
              <NField label="City" name="city" placeholder="Denver, CO" />
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-white/50">Category</span>
                <select
                  name="category"
                  defaultValue="Venues"
                  className="rounded-[10px] border border-border bg-surface-nested px-3.5 py-2.5 text-[13.5px] text-text outline-none"
                >
                  {CATS.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => setShowNew(false)} className="flex-1 cursor-pointer rounded-[10px] border border-border py-2.5 text-[13.5px] text-white/70">
                  Cancel
                </button>
                <button type="submit" disabled={pending} className="flex-1 cursor-pointer rounded-[10px] bg-accent py-2.5 text-[13.5px] font-semibold text-canvas disabled:opacity-60">
                  {pending ? "Adding…" : "Add contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function NField({ label, name, placeholder }: { label: string; name: string; placeholder?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium text-white/50">{label}</span>
      <input
        name={name}
        required={name === "name"}
        placeholder={placeholder}
        className="rounded-[10px] border border-border bg-surface-nested px-3.5 py-2.5 text-[13.5px] text-text outline-none focus:border-accent/50"
      />
    </label>
  );
}

"use client";

import { useMemo, useState, useTransition } from "react";
import { createContact, updateContact, importContacts } from "@/lib/actions/contacts";
import { CsvImportModal, type CsvColumn } from "@/components/csv-import-modal";
import { ExportCsvButton } from "@/components/export-csv-button";
import { toCsv, downloadCsv } from "@/lib/csv-export";
import { planAtLeast } from "@/lib/plan-limits";

const CONTACT_CSV_COLUMNS: CsvColumn[] = [
  { key: "name", label: "Name", required: true },
  { key: "org", label: "Organization" },
  { key: "role", label: "Role" },
  { key: "category", label: "Category", aliases: ["Venues, Promoters, Festivals, Media, Sponsors or Hosts"] },
  { key: "city", label: "City" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "notes", label: "Notes" },
];

export type ContactDTO = {
  id: string;
  name: string;
  org: string | null;
  role: string | null;
  category: string;
  city: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  strength: number;
  lastContactedAt: string | null;
};

const CATS = ["All", "Venues", "Promoters", "Festivals", "Media", "Sponsors", "Hosts"];

const SORTS = [
  { key: "name", label: "Name" },
  { key: "strength", label: "Strength" },
  { key: "recent", label: "Last contact" },
] as const;
type SortKey = (typeof SORTS)[number]["key"];
// The seven, in canonical order — brand fixes both the colors and the
// sequence, so series and avatars stay recognisable across the product.
const AVATAR_COLORS = ["#F4356E", "#FF7A2F", "#FFC93C", "#3FCB86", "#38B6E8", "#8B5CF6", "#FF4FA3"];

function daysAgoLabel(iso: string | null) {
  if (!iso) return { label: "—", stale: false };
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return { label: days <= 0 ? "today" : `${days}d ago`, stale: days > 5 };
}

export function ContactsTable({ contacts, plan }: { contacts: ContactDTO[]; plan: string }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState<SortKey>("name");
  const [showNew, setShowNew] = useState(false);
  const [newContactError, setNewContactError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    const rows = contacts.filter(
      (c) =>
        (cat === "All" || c.category === cat) &&
        (!q || `${c.name}${c.org ?? ""}${c.city ?? ""}${c.role ?? ""}`.toLowerCase().includes(q))
    );
    const sorted = [...rows];
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "strength") sorted.sort((a, b) => b.strength - a.strength);
    if (sort === "recent")
      sorted.sort((a, b) => (b.lastContactedAt ? new Date(b.lastContactedAt).getTime() : 0) - (a.lastContactedAt ? new Date(a.lastContactedAt).getTime() : 0));
    return sorted;
  }, [contacts, query, cat, sort]);

  const open = contacts.find((c) => c.id === openId) ?? null;

  function exportCsv() {
    const csv = toCsv(
      filtered.map((c) => ({
        name: c.name,
        org: c.org ?? "",
        role: c.role ?? "",
        category: c.category,
        city: c.city ?? "",
        email: c.email ?? "",
        phone: c.phone ?? "",
        lastContactedAt: c.lastContactedAt ? new Date(c.lastContactedAt).toLocaleDateString("en-US") : "",
        strength: c.strength,
        notes: c.notes ?? "",
      })),
      [
        { key: "name", label: "Name" },
        { key: "org", label: "Organization" },
        { key: "role", label: "Role" },
        { key: "category", label: "Category" },
        { key: "city", label: "City" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "lastContactedAt", label: "Last Contacted" },
        { key: "strength", label: "Strength" },
        { key: "notes", label: "Notes" },
      ]
    );
    downloadCsv("contacts.csv", csv);
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-5 sm:px-8 sm:py-7">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-[22px] tracking-[-.02em] sm:text-[26px]">Contacts</h1>
        <div className="flex items-center gap-2">
          <CsvImportModal entityLabel="contacts" columns={CONTACT_CSV_COLUMNS} onImport={importContacts} />
          <button
            onClick={() => {
              setNewContactError(null);
              setShowNew(true);
            }}
            className="cursor-pointer rounded-lg bg-accent px-3.5 py-1.5 text-[12.5px] font-semibold text-ink"
          >
            + New contact
          </button>
        </div>
      </div>
      <div className="mb-3.5 flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search contacts…"
          className="w-[220px] rounded-lg border border-text/10 bg-surface px-3 py-2 text-[13px] text-text outline-none"
        />
        {CATS.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className="cursor-pointer rounded-[20px] px-3.5 py-[7px] text-[12px]"
            style={{
              border: `1px solid ${c === cat ? "#3FCB86" : "rgba(var(--border-rgb),.12)"}`,
              background: c === cat ? "rgba(63,232,122,.1)" : "transparent",
              color: c === cat ? "#3FCB86" : "rgba(var(--fg-rgb),.65)",
            }}
          >
            {c}
          </button>
        ))}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="ml-auto rounded-lg border border-text/10 bg-surface px-3 py-2 text-[12.5px] text-text outline-none"
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              Sort: {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-card border border-border bg-surface">
        <div className="min-w-[620px]">
          <div className="grid grid-cols-[2fr_1.2fr_1.2fr_1fr_.8fr] gap-3 border-b border-border px-[18px] py-[11px] font-label text-[10.5px] tracking-[.1em] text-text/40">
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
              <div
                key={c.id}
                onClick={() => setOpenId(c.id)}
                className="grid cursor-pointer grid-cols-[2fr_1.2fr_1.2fr_1fr_.8fr] items-center gap-3 border-b border-text/[.05] px-[18px] py-3 hover:bg-text/[.03]"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="grid h-7 w-7 flex-none place-items-center rounded-full text-[11px] font-bold text-ink"
                    style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                  >
                    {initials}
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold">{c.name}</div>
                    <div className="text-[11px] text-text/40">{c.org}</div>
                  </div>
                </div>
                <div className="text-[12.5px] text-text/70">{c.role}</div>
                <div className="text-[12.5px] text-text/70">{c.city}</div>
                <div className="font-mono text-[11.5px]" style={{ color: last.stale ? "#FF7A2F" : "rgba(var(--fg-rgb),.5)" }}>
                  {last.label}
                </div>
                <div className="flex gap-[3px]">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span key={n} className="h-2 w-2 rounded-full" style={{ background: n <= c.strength ? "#3FCB86" : "rgba(var(--border-rgb),.1)" }} />
                  ))}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 &&
            // An empty workspace isn't a failed search — telling a new user
            // their search matched nothing when they've never added anyone
            // reads as a broken filter.
            (contacts.length === 0 ? (
              <div className="px-[18px] py-9 text-center">
                <div className="mb-1 text-[14px] font-semibold">No contacts yet</div>
                <div className="mx-auto mb-4 max-w-[420px] text-[13px] leading-relaxed text-text/55">
                  Promoters, buyers, venue staff, press. Add them as you meet them and every booking can point at the person behind
                  it — or import a list you already keep.
                </div>
                <button
                  onClick={() => {
                    setNewContactError(null);
                    setShowNew(true);
                  }}
                  className="cursor-pointer rounded-lg bg-accent px-3.5 py-2 text-[12.5px] font-semibold text-ink"
                >
                  Add your first contact
                </button>
              </div>
            ) : (
              <div className="px-[18px] py-7 text-center text-[13px] text-text/40">No contacts match your search.</div>
            ))}
        </div>
      </div>

      {showNew && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/60 px-4" onClick={() => setShowNew(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[420px] rounded-2xl border border-border bg-surface p-6">
            <div className="mb-4 text-[17px] font-semibold">New contact</div>
            <form
              action={(fd) =>
                startTransition(async () => {
                  const result = await createContact(fd);
                  if (result?.error) {
                    setNewContactError(result.error);
                    return;
                  }
                  setShowNew(false);
                })
              }
              className="flex flex-col gap-3"
            >
              <NField label="Name" name="name" placeholder="Jordan Reyes" />
              <NField label="Organization" name="org" placeholder="Bluebird Theater" />
              <NField label="Role" name="role" placeholder="Talent buyer" />
              <NField label="City" name="city" placeholder="Denver, CO" />
              <div className="grid grid-cols-2 gap-3">
                <NField label="Email" name="email" type="email" placeholder="jordan@bluebird.com" />
                <NField label="Phone" name="phone" type="tel" placeholder="(303) 555-0142" />
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-text/50">Category</span>
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
              {newContactError && (
                <div className="rounded-lg border border-orange/30 bg-orange-soft px-3 py-2 text-[13px] text-orange">{newContactError}</div>
              )}
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => setShowNew(false)} className="flex-1 cursor-pointer rounded-[10px] border border-border py-2.5 text-[13.5px] text-text/70">
                  Cancel
                </button>
                <button type="submit" disabled={pending} className="flex-1 cursor-pointer rounded-[10px] bg-accent py-2.5 text-[13.5px] font-semibold text-ink disabled:opacity-60">
                  {pending ? "Adding…" : "Add contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {open && <ContactDrawer key={open.id} contact={open} onClose={() => setOpenId(null)} />}
      <ExportCsvButton onClick={exportCsv} allowed={planAtLeast(plan, "team")} />
    </div>
  );
}

function ContactDrawer({ contact, onClose }: { contact: ContactDTO; onClose: () => void }) {
  const initials = contact.name.split(" ").map((w) => w[0]).join("");
  const last = daysAgoLabel(contact.lastContactedAt);

  return (
    <div className="animate-tp-fade fixed inset-0 z-20 box-border h-screen w-full overflow-y-auto border-l border-text/[.09] bg-surface px-5 py-[18px] sm:inset-auto sm:top-0 sm:right-0 sm:w-[380px] sm:px-6 sm:py-[22px]">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 flex-none place-items-center rounded-full bg-accent text-[12px] font-bold text-ink">{initials}</div>
          <div className="text-[18px] font-bold">{contact.name}</div>
        </div>
        <button onClick={onClose} className="cursor-pointer px-1 text-[18px] text-text/50 hover:text-text">
          ✕
        </button>
      </div>
      <div className="mb-4 text-[12.5px] text-text/50">
        {contact.role || "—"}
        {contact.org ? ` at ${contact.org}` : ""}
        {contact.city ? ` · ${contact.city}` : ""}
      </div>

      <div className="mb-[18px] grid grid-cols-2 gap-2.5">
        <div className="rounded-[10px] border border-text/[.08] bg-surface-nested p-3">
          <div className="mb-1 font-mono text-[10px] text-text/45">CATEGORY</div>
          <div className="text-[13px] font-semibold leading-tight">{contact.category}</div>
        </div>
        <div className="rounded-[10px] border border-text/[.08] bg-surface-nested p-3">
          <div className="mb-1 font-mono text-[10px] text-text/45">LAST CONTACT</div>
          <div className="text-[13px] font-semibold leading-tight" style={{ color: last.stale ? "#FF7A2F" : "var(--text)" }}>
            {last.label}
          </div>
        </div>
      </div>

      <div className="mb-[18px] flex flex-col gap-2.5">
        <EditableField
          label="EMAIL"
          value={contact.email ?? ""}
          placeholder="Add an email"
          type="email"
          onSave={(v) => updateContact(contact.id, { email: v })}
        />
        <EditableField
          label="PHONE"
          value={contact.phone ?? ""}
          placeholder="Add a phone number"
          type="tel"
          onSave={(v) => updateContact(contact.id, { phone: v })}
        />
      </div>

      <div className="mb-2 font-label text-[10.5px] tracking-[.1em] text-text/40">STRENGTH</div>
      <StrengthPicker contactId={contact.id} strength={contact.strength} />

      <EditableField
        label="NOTES"
        value={contact.notes ?? ""}
        placeholder="Add a note"
        multiline
        onSave={(v) => updateContact(contact.id, { notes: v })}
      />
    </div>
  );
}

function StrengthPicker({ contactId, strength }: { contactId: string; strength: number }) {
  const [committed, setCommitted] = useState(strength);
  const [hovered, setHovered] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  function pick(n: number) {
    setCommitted(n);
    startTransition(() => updateContact(contactId, { strength: n }));
  }

  const shown = hovered ?? committed;

  return (
    <div className="mb-5 flex items-center gap-2.5">
      <div className="flex gap-1" onMouseLeave={() => setHovered(null)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            role="button"
            aria-label={`Set relationship strength to ${n}`}
            onClick={() => pick(n)}
            onMouseEnter={() => setHovered(n)}
            className="h-2.5 w-2.5 cursor-pointer rounded-full transition-transform hover:scale-125"
            style={{ background: n <= shown ? "#3FCB86" : "rgba(var(--border-rgb),.15)" }}
          />
        ))}
      </div>
      <span className="font-mono text-[11px] text-text/40">{committed}/5</span>
    </div>
  );
}

function EditableField({
  label,
  value,
  placeholder,
  type = "text",
  multiline = false,
  onSave,
}: {
  label: string;
  value: string;
  placeholder: string;
  type?: string;
  multiline?: boolean;
  onSave: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [, startTransition] = useTransition();

  function save() {
    setEditing(false);
    if (draft !== value) startTransition(() => onSave(draft));
  }

  return (
    <div className="rounded-[10px] border border-text/[.08] bg-surface-nested p-3">
      <div className="mb-1 font-mono text-[10px] text-text/45">{label}</div>
      {editing ? (
        multiline ? (
          <textarea
            autoFocus
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => e.key === "Escape" && (setDraft(value), setEditing(false))}
            className="w-full resize-none rounded-md border border-accent/40 bg-canvas px-2 py-1.5 text-[13px] text-text outline-none"
          />
        ) : (
          <input
            autoFocus
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") {
                setDraft(value);
                setEditing(false);
              }
            }}
            className="w-full rounded-md border border-accent/40 bg-canvas px-2 py-1.5 text-[13.5px] text-text outline-none"
          />
        )
      ) : (
        <div
          onClick={() => {
            setDraft(value);
            setEditing(true);
          }}
          className="cursor-pointer whitespace-pre-line text-[13.5px] font-semibold leading-snug hover:text-accent"
          style={{ color: value ? undefined : "rgba(var(--fg-rgb),.35)" }}
        >
          {value || placeholder}
        </div>
      )}
    </div>
  );
}

function NField({ label, name, placeholder, type = "text" }: { label: string; name: string; placeholder?: string; type?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium text-text/50">{label}</span>
      <input
        name={name}
        type={type}
        required={name === "name"}
        placeholder={placeholder}
        className="rounded-[10px] border border-border bg-surface-nested px-3.5 py-2.5 text-[13.5px] text-text outline-none focus:border-accent/50"
      />
    </label>
  );
}

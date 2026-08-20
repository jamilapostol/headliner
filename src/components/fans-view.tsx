"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { money } from "@/lib/format";
import { planUnlocksAI } from "@/lib/ai";
import { planAtLeast } from "@/lib/plan-limits";
import { createFan, updateFan, importFans } from "@/lib/actions/fans";
import { CsvImportModal, type CsvColumn } from "@/components/csv-import-modal";
import { ExportCsvButton } from "@/components/export-csv-button";
import { toCsv, downloadCsv } from "@/lib/csv-export";

const FAN_CSV_COLUMNS: CsvColumn[] = [
  { key: "name", label: "Name", required: true },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "city", label: "City" },
  { key: "tier", label: "Tier", aliases: ["VIP, Patron, Donor or Fan"] },
  { key: "lifetimeSpend", label: "Lifetime spend ($)", aliases: ["lifetime spend"] },
  { key: "showsAttended", label: "Shows attended", aliases: ["shows attended"] },
  { key: "notes", label: "Notes" },
];

export type FanDTO = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  tier: "VIP" | "Patron" | "Donor" | "Fan";
  tierNote: string | null;
  lifetimeSpend: number;
  showsAttended: number;
  lastSeenLabel: string | null;
  notes: string | null;
};

// The seven, in canonical order — brand fixes both the colors and the
// sequence, so series and avatars stay recognisable across the product.
const AVATAR_COLORS = ["#F4356E", "#FF7A2F", "#FFC93C", "#3FCB86", "#38B6E8", "#8B5CF6", "#FF4FA3"];
const CHIPS = ["All", "VIP", "Patron", "Donor", "Fan"];

const SORTS = [
  { key: "spend", label: "Lifetime spend" },
  { key: "name", label: "Name" },
  { key: "shows", label: "Shows attended" },
] as const;
type SortKey = (typeof SORTS)[number]["key"];

export function FansView({ fans, plan }: { fans: FanDTO[]; plan: string }) {
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState<SortKey>("spend");
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<FanDTO | null>(null);
  const aiUnlocked = planUnlocksAI(plan);

  const filtered = useMemo(() => {
    const rows = fans.filter((f) => cat === "All" || f.tier === cat);
    const sorted = [...rows];
    if (sort === "spend") sorted.sort((a, b) => b.lifetimeSpend - a.lifetimeSpend);
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "shows") sorted.sort((a, b) => b.showsAttended - a.showsAttended);
    return sorted;
  }, [fans, cat, sort]);
  const vipCount = fans.filter((f) => f.tier === "VIP").length;
  const patronCount = fans.filter((f) => f.tier === "Patron").length;

  function exportCsv() {
    const csv = toCsv(
      filtered.map((f) => ({
        name: f.name,
        email: f.email ?? "",
        phone: f.phone ?? "",
        city: f.city ?? "",
        tier: f.tier,
        tierNote: f.tierNote ?? "",
        lifetimeSpend: (f.lifetimeSpend / 100).toFixed(2),
        showsAttended: f.showsAttended,
        lastSeenLabel: f.lastSeenLabel ?? "",
        notes: f.notes ?? "",
      })),
      [
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "city", label: "City" },
        { key: "tier", label: "Tier" },
        { key: "tierNote", label: "Tier Note" },
        { key: "lifetimeSpend", label: "Lifetime Spend ($)" },
        { key: "showsAttended", label: "Shows Attended" },
        { key: "lastSeenLabel", label: "Last Seen" },
        { key: "notes", label: "Notes" },
      ]
    );
    downloadCsv("fans.csv", csv);
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-5 sm:px-8 sm:py-7">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-[22px] tracking-[-.02em] sm:text-[26px]">Fans</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="font-mono text-[12px] text-text/45">
            {fans.length} supporters tracked · {vipCount} VIP · {patronCount} patrons
          </div>
          <CsvImportModal entityLabel="fans" columns={FAN_CSV_COLUMNS} onImport={importFans} />
          <button onClick={() => setShowNew(true)} className="cursor-pointer rounded-lg bg-accent px-3.5 py-1.5 text-[12.5px] font-semibold text-ink">
            + New fan
          </button>
        </div>
      </div>
      <div className="mb-[18px] text-[13px] text-text/50">Your top supporters, ranked by lifetime engagement. Click a row to edit.</div>

      <div className="mb-3.5 flex flex-wrap items-center gap-2">
        {CHIPS.map((c) => (
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
            {c === "All" ? "All" : c + "s"}
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
        <div className="min-w-[880px]">
          <div className="grid grid-cols-[2fr_1fr_.9fr_1fr_.8fr_1fr_1.1fr] gap-3 border-b border-border px-[18px] py-[11px] font-label text-[10.5px] tracking-[.1em] text-text/40">
            <div>FAN</div>
            <div>PHONE</div>
            <div>CITY</div>
            <div>LIFETIME SPEND</div>
            <div>SHOWS</div>
            <div>LAST SEEN</div>
            <div>NOTES</div>
          </div>
          {filtered.map((f, i) => {
            const initials = f.name.split(" ").map((w) => w[0]).join("");
            return (
              <div
                key={f.id}
                onClick={() => setEditing(f)}
                className="grid cursor-pointer grid-cols-[2fr_1fr_.9fr_1fr_.8fr_1fr_1.1fr] items-center gap-3 border-b border-text/[.05] px-[18px] py-3 hover:bg-text/[.03]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="grid h-7 w-7 flex-none place-items-center rounded-full text-[11px] font-bold text-ink" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                    {initials}
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold">{f.name}</div>
                    <div className="text-[11px]" style={{ color: f.tier === "VIP" ? "#FFC93C" : "rgba(var(--fg-rgb),.45)" }}>
                      {f.tier}
                      {f.tierNote ? ` · ${f.tierNote}` : ""}
                    </div>
                  </div>
                </div>
                <div className="font-mono text-[12px] text-text/60">{f.phone ?? "—"}</div>
                <div className="text-[12px] text-text/60">{f.city ?? "—"}</div>
                <div className="font-mono text-[12.5px] text-accent">{money(f.lifetimeSpend)}</div>
                <div className="font-mono text-[12.5px]">{f.showsAttended}</div>
                <div className="text-[12px] text-text/60">{f.lastSeenLabel ?? "—"}</div>
                <div className="text-[11.5px] text-text/45">{f.notes}</div>
              </div>
            );
          })}
          {filtered.length === 0 && <div className="px-[18px] py-7 text-center text-[13px] text-text/40">No fans in this tier yet.</div>}
        </div>
      </div>

      {aiUnlocked ? (
        <div className="mt-4 flex items-center gap-3 rounded-[10px] border border-accent/25 bg-accent-soft px-4 py-3">
          <span className="h-2 w-2 flex-none rounded-full bg-accent" />
          <div className="text-[13px]">
            <strong className="text-accent">Roadie AI:</strong> {vipCount} VIP{vipCount === 1 ? "" : "s"} on your list — a personal
            note before your next show goes a long way.{" "}
            <Link href="/app/campaigns" className="text-accent underline">
              Start a campaign →
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-3 rounded-[10px] border border-purple/30 bg-purple/[.06] px-4 py-3">
          <div className="text-[13px] text-text/60">
            <strong className="text-purple">Roadie AI:</strong> Follow-up drafts and contract review unlock on the Touring plan.{" "}
            <Link href="/app/billing" className="text-accent underline">
              Upgrade →
            </Link>
          </div>
        </div>
      )}

      {showNew && (
        <FanFormModal
          title="New fan"
          submitLabel="Add fan"
          onSubmit={async (fd) => {
            await createFan(fd);
          }}
          onClose={() => setShowNew(false)}
        />
      )}

      {editing && (
        <FanFormModal
          title="Edit fan"
          submitLabel="Save"
          initial={editing}
          onSubmit={async (fd) => {
            await updateFan(editing.id, {
              name: String(fd.get("name") ?? ""),
              email: String(fd.get("email") ?? ""),
              phone: String(fd.get("phone") ?? ""),
              city: String(fd.get("city") ?? ""),
              tier: String(fd.get("tier") ?? ""),
              lifetimeSpend: Number(fd.get("lifetimeSpend") ?? 0),
              notes: String(fd.get("notes") ?? ""),
            });
          }}
          onClose={() => setEditing(null)}
        />
      )}

      <ExportCsvButton onClick={exportCsv} allowed={planAtLeast(plan, "team")} />
    </div>
  );
}

function FanFormModal({
  title,
  submitLabel,
  initial,
  onSubmit,
  onClose,
}: {
  title: string;
  submitLabel: string;
  initial?: FanDTO;
  onSubmit: (formData: FormData) => Promise<void>;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[420px] rounded-2xl border border-border bg-surface p-6">
        <div className="mb-4 text-[17px] font-semibold">{title}</div>
        <form
          action={(fd) =>
            startTransition(async () => {
              await onSubmit(fd);
              onClose();
            })
          }
          className="flex flex-col gap-3"
        >
          <F label="Name" name="name" placeholder="Dana Okafor" defaultValue={initial?.name} />
          <F label="Email" name="email" placeholder="dana@example.com" type="email" defaultValue={initial?.email ?? undefined} />
          <F label="Phone" name="phone" placeholder="(555) 123-4567" type="tel" defaultValue={initial?.phone ?? undefined} />
          <F label="City" name="city" placeholder="Denver, CO" defaultValue={initial?.city ?? undefined} />
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-text/50">Tier</span>
            <select name="tier" defaultValue={initial?.tier ?? "Fan"} className="rounded-[10px] border border-border bg-surface-nested px-3.5 py-2.5 text-[13.5px] text-text outline-none">
              {CHIPS.filter((c) => c !== "All").map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <F
            label="Lifetime spend ($)"
            name="lifetimeSpend"
            type="number"
            placeholder="0"
            defaultValue={initial ? (initial.lifetimeSpend / 100).toString() : undefined}
          />
          <F label="Notes" name="notes" placeholder="How you know them" defaultValue={initial?.notes ?? undefined} />
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 cursor-pointer rounded-[10px] border border-border py-2.5 text-[13.5px] text-text/70">
              Cancel
            </button>
            <button type="submit" disabled={pending} className="flex-1 cursor-pointer rounded-[10px] bg-accent py-2.5 text-[13.5px] font-semibold text-ink disabled:opacity-60">
              {pending ? "Saving…" : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function F({
  label,
  name,
  placeholder,
  type = "text",
  defaultValue,
}: {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium text-text/50">{label}</span>
      <input
        name={name}
        type={type}
        required={name === "name"}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="rounded-[10px] border border-border bg-surface-nested px-3.5 py-2.5 text-[13.5px] text-text outline-none focus:border-accent/50"
      />
    </label>
  );
}

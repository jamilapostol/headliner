"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { money } from "@/lib/format";
import { planUnlocksAI } from "@/lib/ai";
import { createFan } from "@/lib/actions/fans";

export type FanDTO = {
  id: string;
  name: string;
  tier: "VIP" | "Patron" | "Donor" | "Fan";
  tierNote: string | null;
  lifetimeSpend: number;
  showsAttended: number;
  lastSeenLabel: string | null;
  notes: string | null;
};

const AVATAR_COLORS = ["#3fe87a", "#e8e43f", "#7ab8e8", "#e8983f", "#c99df5"];
const CHIPS = ["All", "VIP", "Patron", "Donor", "Fan"];

export function FansView({ fans, plan }: { fans: FanDTO[]; plan: string }) {
  const [cat, setCat] = useState("All");
  const [showNew, setShowNew] = useState(false);
  const [, startTransition] = useTransition();
  const aiUnlocked = planUnlocksAI(plan);

  const filtered = useMemo(() => fans.filter((f) => cat === "All" || f.tier === cat), [fans, cat]);
  const vipCount = fans.filter((f) => f.tier === "VIP").length;
  const patronCount = fans.filter((f) => f.tier === "Patron").length;

  return (
    <div className="max-w-[1100px] px-8 py-7">
      <div className="mb-1 flex items-baseline justify-between">
        <h1 className="text-[26px] tracking-[-.02em]">Fans</h1>
        <div className="flex items-center gap-3">
          <div className="font-mono text-[12px] text-white/45">
            {fans.length} supporters tracked · {vipCount} VIP · {patronCount} patrons
          </div>
          <button onClick={() => setShowNew(true)} className="cursor-pointer rounded-lg bg-accent px-3.5 py-1.5 text-[12.5px] font-semibold text-canvas">
            + New fan
          </button>
        </div>
      </div>
      <div className="mb-[18px] text-[13px] text-white/50">Your top supporters, ranked by lifetime engagement.</div>

      <div className="mb-3.5 flex gap-2">
        {CHIPS.map((c) => (
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
            {c === "All" ? "All" : c + "s"}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-surface">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.1fr] gap-3 border-b border-border px-[18px] py-[11px] font-mono text-[10.5px] tracking-[.1em] text-white/40">
          <div>FAN</div>
          <div>LIFETIME SPEND</div>
          <div>SHOWS</div>
          <div>LAST SEEN</div>
          <div>NOTES</div>
        </div>
        {filtered.map((f, i) => {
          const initials = f.name.split(" ").map((w) => w[0]).join("");
          return (
            <div key={f.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1.1fr] items-center gap-3 border-b border-white/[.05] px-[18px] py-3 hover:bg-white/[.03]">
              <div className="flex items-center gap-2.5">
                <div className="grid h-7 w-7 flex-none place-items-center rounded-full text-[11px] font-bold text-canvas" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                  {initials}
                </div>
                <div>
                  <div className="text-[13px] font-semibold">{f.name}</div>
                  <div className="text-[11px]" style={{ color: f.tier === "VIP" ? "#e8e43f" : "rgba(233,236,232,.45)" }}>
                    {f.tier}
                    {f.tierNote ? ` · ${f.tierNote}` : ""}
                  </div>
                </div>
              </div>
              <div className="font-mono text-[12.5px] text-accent">{money(f.lifetimeSpend)}</div>
              <div className="font-mono text-[12.5px]">{f.showsAttended}</div>
              <div className="text-[12px] text-white/60">{f.lastSeenLabel ?? "—"}</div>
              <div className="text-[11.5px] text-white/45">{f.notes}</div>
            </div>
          );
        })}
        {filtered.length === 0 && <div className="px-[18px] py-7 text-center text-[13px] text-white/40">No fans in this tier yet.</div>}
      </div>

      {aiUnlocked ? (
        <div className="mt-4 flex items-center gap-3 rounded-[10px] border border-accent/25 bg-accent-soft px-4 py-3">
          <span className="h-2 w-2 flex-none rounded-full bg-accent" />
          <div className="text-[13px]">
            <strong className="text-accent">Pilot AI:</strong> {vipCount} VIPs are within 30 mi of an upcoming show but haven&apos;t bought tickets.{" "}
            <span className="cursor-pointer text-accent underline">Send them a personal invite →</span>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-3 rounded-[10px] border border-purple/30 bg-purple/[.06] px-4 py-3">
          <div className="text-[13px] text-white/60">
            <strong className="text-purple">Pilot AI:</strong> VIP-invite suggestions unlock on the Touring plan.{" "}
            <Link href="/app/billing" className="text-accent underline">
              Upgrade →
            </Link>
          </div>
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/60 px-4" onClick={() => setShowNew(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[420px] rounded-2xl border border-border bg-surface p-6">
            <div className="mb-4 text-[17px] font-semibold">New fan</div>
            <form
              action={(fd) =>
                startTransition(async () => {
                  await createFan(fd);
                  setShowNew(false);
                })
              }
              className="flex flex-col gap-3"
            >
              <F label="Name" name="name" placeholder="Dana Okafor" />
              <F label="Email" name="email" placeholder="dana@example.com" type="email" />
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-white/50">Tier</span>
                <select name="tier" defaultValue="Fan" className="rounded-[10px] border border-border bg-surface-nested px-3.5 py-2.5 text-[13.5px] text-text outline-none">
                  {CHIPS.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <F label="Lifetime spend ($)" name="lifetimeSpend" type="number" placeholder="0" />
              <F label="Notes" name="notes" placeholder="How you know them" />
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => setShowNew(false)} className="flex-1 cursor-pointer rounded-[10px] border border-border py-2.5 text-[13.5px] text-white/70">
                  Cancel
                </button>
                <button type="submit" className="flex-1 cursor-pointer rounded-[10px] bg-accent py-2.5 text-[13.5px] font-semibold text-canvas">
                  Add fan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function F({ label, name, placeholder, type = "text" }: { label: string; name: string; placeholder?: string; type?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium text-white/50">{label}</span>
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

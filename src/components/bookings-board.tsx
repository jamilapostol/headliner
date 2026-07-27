"use client";

import { useState, useTransition } from "react";
import { updateBookingStage, type Stage } from "@/lib/actions/bookings";
import { money } from "@/lib/format";
import { NewBookingForm } from "@/components/new-booking-form";
import { draftFollowupEmail, planUnlocksAI } from "@/lib/ai";

export type BookingDTO = {
  id: string;
  venue: string;
  city: string;
  date: string;
  endDate: string | null;
  fee: number;
  contactName: string | null;
  contactPhone: string | null;
  stage: Stage;
};

const STAGES: Array<{ key: Stage; label: string; dot: string }> = [
  { key: "Lead", label: "LEAD", dot: "rgba(233,236,232,.35)" },
  { key: "Contacted", label: "CONTACTED", dot: "#7ab8e8" },
  { key: "Negotiating", label: "NEGOTIATING", dot: "#e8e43f" },
  { key: "Offer_Sent", label: "OFFER SENT", dot: "#e8983f" },
  { key: "Confirmed", label: "CONFIRMED", dot: "#3fe87a" },
  { key: "Paid", label: "PAID", dot: "#3fe87a" },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit", timeZone: "UTC" });
}

function fmtDateRange(date: string, endDate: string | null) {
  if (!endDate) return fmtDate(date);
  return `${fmtDate(date)}–${fmtDate(endDate)}`;
}

export function BookingsBoard({ bookings, plan, artistName }: { bookings: BookingDTO[]; plan: string; artistName: string }) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<Stage | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [draft, setDraft] = useState<{ bookingId: string; text: string } | null>(null);
  const [, startTransition] = useTransition();
  const aiUnlocked = planUnlocksAI(plan);

  const pipelineTotal = bookings.filter((b) => b.stage !== "Paid").reduce((a, b) => a + b.fee, 0);
  const open = bookings.find((b) => b.id === openId) ?? null;

  function drop(stage: Stage) {
    if (dragId) {
      startTransition(() => updateBookingStage(dragId, stage));
      setDragId(null);
    }
    setDragOverStage(null);
  }

  function moveStage(bookingId: string, stage: Stage) {
    startTransition(() => updateBookingStage(bookingId, stage));
  }

  const checklist = open
    ? [
        { label: "Offer confirmed in writing", on: (["Offer_Sent", "Confirmed", "Paid"] as Stage[]).includes(open.stage) },
        { label: "Contract signed", on: (["Confirmed", "Paid"] as Stage[]).includes(open.stage) },
        { label: "Deposit received", on: open.stage === "Paid" },
        { label: "Tech + hospitality rider sent", on: (["Negotiating", "Offer_Sent", "Confirmed", "Paid"] as Stage[]).includes(open.stage) },
      ]
    : [];

  return (
    <div className="flex h-full flex-col px-4 py-5 sm:px-8 sm:py-7">
      <div className="mb-1 flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
        <h1 className="text-[22px] tracking-[-.02em] sm:text-[26px]">Booking pipeline</h1>
        <div className="font-mono text-[12px] text-white/45">{money(pipelineTotal)} in play</div>
        <button
          onClick={() => setShowNew(true)}
          className="ml-auto cursor-pointer rounded-lg bg-accent px-3.5 py-1.5 text-[12.5px] font-semibold text-canvas"
        >
          + New booking
        </button>
      </div>
      <div className="mb-[18px] text-[13px] text-white/50">Drag cards between stages, or click one to open details and move it from there.</div>

      <div className="flex flex-1 items-start gap-3 overflow-x-auto pb-3">
        {STAGES.map((stage) => {
          const cards = bookings.filter((b) => b.stage === stage.key);
          const isDragTarget = dragOverStage === stage.key && dragId;
          return (
            <div
              key={stage.key}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverStage !== stage.key) setDragOverStage(stage.key);
              }}
              onDragLeave={() => setDragOverStage((cur) => (cur === stage.key ? null : cur))}
              onDrop={() => drop(stage.key)}
              className="min-h-[300px] w-[236px] flex-none rounded-card border p-3 transition-colors"
              style={{
                background: isDragTarget ? "rgba(63,232,122,.06)" : "#12181366",
                borderColor: isDragTarget ? "rgba(63,232,122,.5)" : "rgba(255,255,255,.06)",
              }}
            >
              <div className="mb-3 flex items-center gap-2 px-1">
                <span className="h-[7px] w-[7px] rounded-full" style={{ background: stage.dot }} />
                <span className="font-mono text-[11px] tracking-[.1em] text-white/60">{stage.label}</span>
                <span className="ml-auto font-mono text-[11px] text-white/35">{cards.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {cards.map((c) => (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={() => setDragId(c.id)}
                    onDragEnd={() => {
                      setDragId(null);
                      setDragOverStage(null);
                    }}
                    onClick={() => {
                      setOpenId(c.id);
                      setDraft(null);
                    }}
                    className="cursor-grab rounded-[10px] border border-white/[.08] bg-surface-nested px-[13px] py-3 transition-opacity hover:border-accent/40 active:cursor-grabbing"
                    style={{ opacity: dragId === c.id ? 0.4 : 1 }}
                  >
                    <div className="mb-0.5 text-[13.5px] font-semibold">{c.venue}</div>
                    <div className="mb-2 text-[11.5px] text-white/50">
                      {c.city} · {fmtDateRange(c.date, c.endDate)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[12px] text-accent">{money(c.fee)}</span>
                      <span className="text-[10.5px] text-white/40">{c.contactName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {open && (
        <div className="animate-tp-fade fixed inset-0 z-20 box-border h-screen w-full overflow-y-auto border-l border-white/[.09] bg-[#121813] px-5 py-[18px] sm:inset-auto sm:top-0 sm:right-0 sm:w-[380px] sm:px-6 sm:py-[22px]">
          <div className="mb-1 flex items-center justify-between">
            <div className="text-[18px] font-bold">{open.venue}</div>
            <button
              onClick={() => {
                setOpenId(null);
                setDraft(null);
              }}
              className="cursor-pointer px-1 text-[18px] text-white/50 hover:text-text"
            >
              ✕
            </button>
          </div>
          <div className="mb-4 text-[12.5px] text-white/50">
            {open.city} · {fmtDateRange(open.date, open.endDate)}
          </div>
          <div className="mb-[18px] grid grid-cols-2 gap-2.5">
            <div className="rounded-[10px] border border-white/[.08] bg-surface-nested p-3">
              <div className="mb-1 font-mono text-[10px] text-white/45">GUARANTEE</div>
              <div className="text-[17px] font-bold text-accent">{money(open.fee)}</div>
            </div>
            <div className="rounded-[10px] border border-white/[.08] bg-surface-nested p-3">
              <div className="mb-1 font-mono text-[10px] text-white/45">CONTACT</div>
              <div className="text-[13px] font-semibold leading-tight">{open.contactName || "—"}</div>
              {open.contactPhone && <div className="mt-0.5 text-[11px] text-white/45">{open.contactPhone}</div>}
            </div>
          </div>
          <div className="mb-5">
            <div className="mb-2 font-mono text-[10.5px] tracking-[.1em] text-white/40">STAGE</div>
            <select
              value={open.stage}
              onChange={(e) => moveStage(open.id, e.target.value as Stage)}
              className="w-full cursor-pointer rounded-[10px] border border-white/[.08] bg-surface-nested px-3 py-2.5 text-[13px] text-text outline-none focus:border-accent/50"
            >
              {STAGES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-2 font-mono text-[10.5px] tracking-[.1em] text-white/40">CHECKLIST</div>
          <div className="mb-5 flex flex-col gap-[7px]">
            {checklist.map((c) => (
              <div key={c.label} className="flex items-center gap-2.5 text-[13px]">
                <span className="font-mono text-[12px]" style={{ color: c.on ? "#3fe87a" : "rgba(233,236,232,.3)" }}>
                  {c.on ? "✓" : "○"}
                </span>
                <span style={{ color: c.on ? "#e9ece8" : "rgba(233,236,232,.5)" }}>{c.label}</span>
              </div>
            ))}
          </div>
          {aiUnlocked ? (
            <div className="rounded-xl border border-accent/30 bg-accent-soft p-3.5">
              <div className="mb-2.5 flex items-center gap-2">
                <span className="h-[7px] w-[7px] rounded-full bg-accent" />
                <span className="text-[12.5px] font-semibold text-accent">Roadie AI — draft follow-up</span>
              </div>
              {draft && draft.bookingId === open.id ? (
                <>
                  <div className="whitespace-pre-line rounded-lg border border-white/[.06] bg-[#0f1410] p-3 text-[12.5px] leading-relaxed text-white/85">
                    {draft.text}
                  </div>
                  <div className="mt-2.5 flex gap-2">
                    <div className="flex-1 cursor-pointer rounded-lg bg-accent py-2 text-center text-[12.5px] font-semibold text-canvas">Send via Gmail</div>
                    <button
                      onClick={() =>
                        setDraft({
                          bookingId: open.id,
                          text: draftFollowupEmail({ contactName: open.contactName, venue: open.venue, city: open.city, date: open.date, artistName }),
                        })
                      }
                      className="cursor-pointer rounded-lg border border-white/15 px-3 py-2 text-[12.5px] text-white/70"
                    >
                      Redo
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() =>
                    setDraft({
                      bookingId: open.id,
                      text: draftFollowupEmail({ contactName: open.contactName, venue: open.venue, city: open.city, date: open.date, artistName }),
                    })
                  }
                  className="w-full cursor-pointer rounded-lg border border-accent/40 py-2.5 text-center text-[12.5px] font-semibold text-accent hover:bg-accent/10"
                >
                  Generate email draft
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-purple/30 bg-purple/[.06] p-3.5">
              <div className="mb-1 text-[12.5px] font-semibold text-purple">Roadie AI — draft follow-up</div>
              <div className="text-[12px] leading-relaxed text-white/60">
                Email drafts, contract summaries and routing suggestions unlock on the Touring plan.{" "}
                <a href="/app/billing" className="text-accent underline">
                  Upgrade →
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {showNew && <NewBookingForm onClose={() => setShowNew(false)} />}
    </div>
  );
}

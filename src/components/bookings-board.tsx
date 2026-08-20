"use client";

import { useState, useTransition } from "react";
import { updateBookingStage, updateBookingDetails, toggleBookingChecklist, type Stage, type ChecklistField } from "@/lib/actions/bookings";
import { money } from "@/lib/format";
import { NewBookingForm } from "@/components/new-booking-form";
import { planUnlocksAI } from "@/lib/ai";
import { generateFollowupDraft } from "@/lib/actions/ai";
import { STAGES } from "@/lib/stages";

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
  offerConfirmed: boolean;
  contractSigned: boolean;
  depositReceived: boolean;
  riderSent: boolean;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit", timeZone: "UTC" });
}

function fmtDateRange(date: string, endDate: string | null) {
  if (!endDate) return fmtDate(date);
  return `${fmtDate(date)}–${fmtDate(endDate)}`;
}

export function BookingsBoard({ bookings: bookingsProp, plan }: { bookings: BookingDTO[]; plan: string }) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<Stage | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [draft, setDraft] = useState<{ bookingId: string; text: string; fallback?: true } | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [stageOverride, setStageOverride] = useState<Record<string, Stage>>({});
  const [, startTransition] = useTransition();
  const aiUnlocked = planUnlocksAI(plan);

  function runGenerateDraft(bookingId: string) {
    setDraftError(null);
    startTransition(async () => {
      const result = await generateFollowupDraft(bookingId);
      if (result?.error || !result?.text) {
        setDraftError(result?.error ?? "Couldn't generate a draft. Try again.");
        return;
      }
      setDraft({ bookingId, text: result.text, fallback: result.fallback });
    });
  }

  // Apply optimistic stage moves on top of the server data — a drag or a
  // stage-dropdown change should move the card instantly, not after the
  // round trip + revalidation.
  const bookings = bookingsProp.map((b) => (b.id in stageOverride ? { ...b, stage: stageOverride[b.id] } : b));

  const pipelineTotal = bookings.filter((b) => b.stage !== "Paid").reduce((a, b) => a + b.fee, 0);
  const open = bookings.find((b) => b.id === openId) ?? null;

  function moveBooking(bookingId: string, stage: Stage) {
    setStageOverride((o) => ({ ...o, [bookingId]: stage }));
    startTransition(async () => {
      await updateBookingStage(bookingId, stage);
      setStageOverride((o) => Object.fromEntries(Object.entries(o).filter(([id]) => id !== bookingId)));
    });
  }

  function drop(stage: Stage) {
    if (dragId) {
      moveBooking(dragId, stage);
      setDragId(null);
    }
    setDragOverStage(null);
  }

  function moveStage(bookingId: string, stage: Stage) {
    moveBooking(bookingId, stage);
  }

  const checklist: Array<{ label: string; field: ChecklistField; on: boolean }> = open
    ? [
        { label: "Offer confirmed in writing", field: "offerConfirmed", on: open.offerConfirmed },
        { label: "Contract signed", field: "contractSigned", on: open.contractSigned },
        { label: "Deposit received", field: "depositReceived", on: open.depositReceived },
        { label: "Tech + hospitality rider sent", field: "riderSent", on: open.riderSent },
      ]
    : [];

  return (
    <div className="flex h-full flex-col px-4 py-5 sm:px-8 sm:py-7">
      <div className="mb-1 flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
        <h1 className="text-[22px] tracking-[-.02em] sm:text-[26px]">Booking pipeline</h1>
        <div className="font-mono text-[12px] text-text/45">{money(pipelineTotal)} in play</div>
        <button
          onClick={() => setShowNew(true)}
          className="ml-auto cursor-pointer rounded-lg bg-accent px-3.5 py-1.5 text-[12.5px] font-semibold text-ink"
        >
          + New booking
        </button>
      </div>
      <div className="mb-[18px] text-[13px] text-text/50">Drag cards between stages, or click one to open details and move it from there.</div>

      {bookings.length === 0 && (
        // First thing a new workspace sees. Five empty columns read as a
        // broken page rather than an empty one, so say what this is for and
        // give the one action that starts everything else working.
        <div className="mb-[18px] rounded-card border border-accent/25 bg-accent-soft px-5 py-[18px]">
          <div className="mb-1 text-[14.5px] font-semibold">Start with one hold you&rsquo;re chasing</div>
          <div className="mb-3.5 max-w-[560px] text-[13px] leading-relaxed text-text/60">
            A booking moves left to right as it firms up — lead, contacted, offer sent, negotiating, confirmed, paid. Add the show
            you&rsquo;re waiting to hear back on and the rest of HEADLINE.WORLD fills in around it: the contact, the contract, the
            money, the day sheet.
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="cursor-pointer rounded-lg bg-accent px-3.5 py-2 text-[12.5px] font-semibold text-ink"
          >
            Add your first booking
          </button>
        </div>
      )}

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
                background: isDragTarget ? "rgba(63,232,122,.06)" : "rgba(var(--fg-rgb),.03)",
                borderColor: isDragTarget ? "rgba(63,232,122,.5)" : "rgba(var(--border-rgb),.06)",
              }}
            >
              <div className="mb-3 flex items-center gap-2 px-1">
                <span className="h-[7px] w-[7px] rounded-full" style={{ background: stage.dot }} />
                <span className="font-label text-[11px] tracking-[.1em] text-text/60">{stage.label}</span>
                <span className="ml-auto font-mono text-[11px] text-text/35">{cards.length}</span>
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
                    className="cursor-grab rounded-[10px] border border-text/[.08] bg-surface-nested px-[13px] py-3 transition-opacity hover:border-accent/40 active:cursor-grabbing"
                    style={{ opacity: dragId === c.id ? 0.4 : 1 }}
                  >
                    <div className="mb-0.5 text-[13.5px] font-semibold">{c.venue}</div>
                    <div className="mb-2 text-[11.5px] text-text/50">
                      {c.city} · {fmtDateRange(c.date, c.endDate)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[12px] text-accent">{money(c.fee)}</span>
                      <span className="text-[10.5px] text-text/40">{c.contactName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {open && (
        <div
          key={open.id}
          className="animate-tp-fade fixed inset-0 z-20 box-border h-screen w-full overflow-y-auto border-l border-text/[.09] bg-surface px-5 py-[18px] sm:inset-auto sm:top-0 sm:right-0 sm:w-[380px] sm:px-6 sm:py-[22px]"
        >
          <div className="mb-1 flex items-center justify-between">
            <div className="text-[18px] font-bold">{open.venue}</div>
            <button
              onClick={() => {
                setOpenId(null);
                setDraft(null);
              }}
              className="cursor-pointer px-1 text-[18px] text-text/50 hover:text-text"
            >
              ✕
            </button>
          </div>
          <div className="mb-4 text-[12.5px] text-text/50">
            {open.city} · {fmtDateRange(open.date, open.endDate)}
          </div>
          <div className="mb-[18px] grid grid-cols-2 gap-2.5">
            <EditableStat
              label="GUARANTEE"
              value={open.fee ? String(open.fee / 100) : ""}
              placeholder="—"
              type="number"
              format={(v) => money(Math.round(Number(v) * 100))}
              onSave={(v) => updateBookingDetails(open.id, { fee: v ? Number(v) : 0 })}
            />
            <div className="rounded-[10px] border border-text/[.08] bg-surface-nested p-3">
              <div className="mb-1 font-mono text-[10px] text-text/45">CONTACT</div>
              <InlineEdit
                value={open.contactName ?? ""}
                placeholder="Add a name"
                className="text-[13px] font-semibold leading-tight"
                onSave={(v) => updateBookingDetails(open.id, { contactName: v })}
              />
              <InlineEdit
                value={open.contactPhone ?? ""}
                placeholder="Add a phone"
                className="mt-0.5 text-[11px] text-text/45"
                onSave={(v) => updateBookingDetails(open.id, { contactPhone: v })}
              />
            </div>
          </div>
          <div className="mb-5">
            <div className="mb-2 font-label text-[10.5px] tracking-[.1em] text-text/40">STAGE</div>
            <select
              value={open.stage}
              onChange={(e) => moveStage(open.id, e.target.value as Stage)}
              className="w-full cursor-pointer rounded-[10px] border border-text/[.08] bg-surface-nested px-3 py-2.5 text-[13px] text-text outline-none focus:border-accent/50"
            >
              {STAGES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-2 font-label text-[10.5px] tracking-[.1em] text-text/40">CHECKLIST</div>
          <div className="mb-5 flex flex-col gap-[7px]">
            {checklist.map((c) => (
              <ChecklistItem key={c.label} label={c.label} field={c.field} initialOn={c.on} bookingId={open.id} />
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
                  {draft.fallback && (
                    <div className="mb-2 rounded-lg border border-orange/25 bg-orange/[.06] px-2.5 py-2 text-[12px] leading-relaxed text-text/75">
                      Roadie isn&rsquo;t connected right now, so this is a starter template — not a draft written from your booking history. Read it over before sending.
                    </div>
                  )}
                  <div className="whitespace-pre-line rounded-lg border border-text/[.06] bg-canvas p-3 text-[12.5px] leading-relaxed text-text/85">
                    {draft.text}
                  </div>
                  <div className="mt-2.5 flex gap-2">
                    <div className="flex-1 cursor-pointer rounded-lg bg-accent py-2 text-center text-[12.5px] font-semibold text-ink">Send via Gmail</div>
                    <button
                      onClick={() => runGenerateDraft(open.id)}
                      className="cursor-pointer rounded-lg border border-text/15 px-3 py-2 text-[12.5px] text-text/70"
                    >
                      Redo
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {draftError && <div className="mb-2 text-[12px] text-orange">{draftError}</div>}
                  <button
                    onClick={() => runGenerateDraft(open.id)}
                    className="w-full cursor-pointer rounded-lg border border-accent/40 py-2.5 text-center text-[12.5px] font-semibold text-accent hover:bg-accent/10"
                  >
                    Generate email draft
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-purple/30 bg-purple/[.06] p-3.5">
              <div className="mb-1 text-[12.5px] font-semibold text-purple">Roadie AI — draft follow-up</div>
              <div className="text-[12px] leading-relaxed text-text/60">
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

function EditableStat({
  label,
  value,
  placeholder,
  type = "text",
  format,
  onSave,
}: {
  label: string;
  value: string;
  placeholder: string;
  type?: string;
  format: (value: string) => string;
  onSave: (value: string) => void;
}) {
  const [committed, setCommitted] = useState(value);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(committed);
  const [, startTransition] = useTransition();

  function save() {
    setEditing(false);
    if (draft === committed) return;
    setCommitted(draft); // optimistic — shows instantly, doesn't wait on the round trip
    startTransition(() => onSave(draft));
  }

  return (
    <div className="rounded-[10px] border border-text/[.08] bg-surface-nested p-3">
      <div className="mb-1 font-mono text-[10px] text-text/45">{label}</div>
      {editing ? (
        <input
          autoFocus
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              setDraft(committed);
              setEditing(false);
            }
          }}
          className="w-full rounded-md border border-accent/40 bg-canvas px-2 py-1 text-[15px] font-bold text-accent outline-none"
        />
      ) : (
        <div
          onClick={() => {
            setDraft(committed);
            setEditing(true);
          }}
          className="cursor-pointer text-[17px] font-bold text-accent hover:opacity-80"
        >
          {committed ? format(committed) : placeholder}
        </div>
      )}
    </div>
  );
}

function InlineEdit({
  value,
  placeholder,
  className,
  onSave,
}: {
  value: string;
  placeholder: string;
  className: string;
  onSave: (value: string) => void;
}) {
  const [committed, setCommitted] = useState(value);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(committed);
  const [, startTransition] = useTransition();

  function save() {
    setEditing(false);
    if (draft === committed) return;
    setCommitted(draft); // optimistic — shows instantly, doesn't wait on the round trip
    startTransition(() => onSave(draft));
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") {
            setDraft(committed);
            setEditing(false);
          }
        }}
        className={`w-full rounded-md border border-accent/40 bg-canvas px-1.5 py-0.5 outline-none ${className}`}
      />
    );
  }

  return (
    <div
      onClick={() => {
        setDraft(committed);
        setEditing(true);
      }}
      className={`cursor-pointer hover:opacity-80 ${className}`}
      style={{ color: committed ? undefined : "rgba(var(--fg-rgb),.35)" }}
    >
      {committed || placeholder}
    </div>
  );
}

function ChecklistItem({
  label,
  field,
  initialOn,
  bookingId,
}: {
  label: string;
  field: ChecklistField;
  initialOn: boolean;
  bookingId: string;
}) {
  const [on, setOn] = useState(initialOn);
  const [, startTransition] = useTransition();

  function toggle() {
    setOn((v) => !v); // optimistic
    startTransition(() => toggleBookingChecklist(bookingId, field));
  }

  return (
    <div onClick={toggle} className="flex cursor-pointer items-center gap-2.5 text-[13px] hover:opacity-80">
      <span className="font-mono text-[12px]" style={{ color: on ? "#3FCB86" : "rgba(var(--fg-rgb),.3)" }}>
        {on ? "✓" : "○"}
      </span>
      <span style={{ color: on ? "var(--text)" : "rgba(var(--fg-rgb),.5)" }}>{label}</span>
    </div>
  );
}

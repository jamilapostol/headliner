"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useTransition } from "react";
import { money } from "@/lib/format";
import { logExpense } from "@/lib/actions/mobile";

export type ScheduleEvent = { time: string; what: string; who: string };

export type NextShowDTO = {
  venue: string;
  city: string;
  dateLabel: string;
  daysUntil: number;
  isToday: boolean;
  loadIn: string | null;
  doors: string | null;
  set: string | null;
  driveMiles: number | null;
  hotel: string | null;
  hotelConfNo: string | null;
  schedule: ScheduleEvent[];
};

const ACTIONS = [
  { key: "expense", glyph: "⧉", color: "text-accent", label: "Log expense", sub: "Tour expenses" },
  { key: "merch", glyph: "▣", color: "text-yellow", label: "Merch count", sub: "Update van stock" },
  { key: "voice", glyph: "●", color: "text-orange", label: "Voice note", sub: "Coming soon" },
  { key: "qr", glyph: "⌗", color: "text-blue", label: "QR checkout", sub: "Coming soon" },
] as const;

export function MobileDayView({
  todayLabel,
  nextShow,
  perDiemLeft,
  perDiemTotal,
  tourExpensesTotal,
  receiptCount,
}: {
  todayLabel: string;
  nextShow: NextShowDTO | null;
  perDiemLeft: number;
  perDiemTotal: number;
  tourExpensesTotal: number;
  receiptCount: number;
}) {
  const [toast, setToast] = useState<string | null>(null);
  const [showExpense, setShowExpense] = useState(false);
  const [pending, startTransition] = useTransition();

  function fireToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast((t) => (t === msg ? null : t)), 2600);
  }

  function tap(key: (typeof ACTIONS)[number]["key"]) {
    if (key === "expense") return setShowExpense(true);
    if (key === "merch") return; // real navigation via Link below
    if (key === "voice") return fireToast("Voice capture is coming in a future update.");
    if (key === "qr") return fireToast("Mobile POS is coming in a future update.");
  }

  return (
    <div
      className="min-h-screen overflow-y-auto text-text"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 20px)", paddingBottom: "calc(env(safe-area-inset-bottom) + 32px)", paddingLeft: 18, paddingRight: 18 }}
    >
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" alt="HEADLINER" width={24} height={24} />
          <span className="text-[14px] font-bold">Show day</span>
        </div>
        <div className="font-mono text-[11px] text-white/45">{todayLabel}</div>
      </div>

      {nextShow ? (
        <>
          <div className="mb-3.5 text-[12.5px] text-white/50">
            {nextShow.isToday ? `Today's the day — ${nextShow.city}` : `${nextShow.daysUntil} day${nextShow.daysUntil === 1 ? "" : "s"} to ${nextShow.city}`}
          </div>

          <div
            className="mb-3.5 rounded-2xl border border-accent/30 p-4"
            style={{ background: "linear-gradient(160deg, rgba(63,232,122,.14), rgba(63,232,122,.03))" }}
          >
            <div className="mb-1.5 font-mono text-[10px] tracking-[.12em] text-accent">
              NEXT SHOW · {nextShow.dateLabel}
            </div>
            <div className="mb-0.5 text-[19px] font-bold tracking-[-.02em]">{nextShow.venue}</div>
            <div className="mb-3 text-[12.5px] text-white/60">{nextShow.city}</div>
            <div className="flex gap-2">
              {[
                { label: "LOAD-IN", value: nextShow.loadIn },
                { label: "DOORS", value: nextShow.doors },
                { label: "SET", value: nextShow.set },
              ].map((s) => (
                <div key={s.label} className="flex-1 rounded-[10px] border border-white/[.08] bg-white/5 py-2.5 text-center">
                  <div className="font-mono text-[10px] text-white/45">{s.label}</div>
                  <div className="mt-0.5 text-[14px] font-bold">{s.value ?? "—"}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="mb-3.5 text-[12.5px] text-white/50">No upcoming shows scheduled.</div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-2.5">
        {ACTIONS.map((a) =>
          a.key === "merch" ? (
            <Link
              key={a.key}
              href="/app/merch"
              className="rounded-[14px] border border-white/[.08] bg-surface px-[15px] py-3.5 active:bg-[#1a221b]"
            >
              <div className={`mb-2 font-mono text-[16px] ${a.color}`}>{a.glyph}</div>
              <div className="text-[13px] font-semibold">{a.label}</div>
              <div className="mt-0.5 text-[10.5px] text-white/45">{a.sub}</div>
            </Link>
          ) : (
            <button
              key={a.key}
              onClick={() => tap(a.key)}
              className="cursor-pointer rounded-[14px] border border-white/[.08] bg-surface px-[15px] py-3.5 text-left active:bg-[#1a221b]"
            >
              <div className={`mb-2 font-mono text-[16px] ${a.color}`}>{a.glyph}</div>
              <div className="text-[13px] font-semibold">{a.label}</div>
              <div className="mt-0.5 text-[10.5px] text-white/45">{a.sub}</div>
            </button>
          )
        )}
      </div>

      {toast && (
        <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-accent/35 bg-accent-soft px-3.5 py-2.5 text-[12.5px]">
          <span className="h-[7px] w-[7px] flex-none animate-tp-pulse rounded-full bg-accent" />
          {toast}
        </div>
      )}

      {nextShow && (
        <>
          <div className="mb-2.5 font-mono text-[10.5px] tracking-[.12em] text-white/40">
            {nextShow.isToday ? "TODAY — SHOW DAY" : `TODAY — HEADING TO ${nextShow.city.split(",")[0].toUpperCase()}`}
          </div>
          <div className="mb-4 rounded-[14px] border border-border bg-surface px-4">
            {nextShow.schedule.map((ev, i) => (
              <div key={i} className="flex gap-3.5 border-b border-white/5 py-2.5 last:border-b-0">
                <div className="w-11 flex-none font-mono text-[12px] text-white/40">{ev.time}</div>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold">{ev.what}</div>
                  {ev.who && <div className="text-[11px] text-white/40">{ev.who}</div>}
                </div>
              </div>
            ))}
            {nextShow.schedule.length === 0 && <div className="py-3 text-center text-[12.5px] text-white/40">Nothing scheduled yet.</div>}
          </div>
        </>
      )}

      <div className="mb-2.5 font-mono text-[10.5px] tracking-[.12em] text-white/40">ON THE ROAD</div>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-[14px] border border-border bg-surface px-[15px] py-3.5">
          <div className="mb-1 font-mono text-[10px] text-white/45">PER DIEM LEFT</div>
          <div className="text-[19px] font-bold text-accent">{money(perDiemLeft)}</div>
          <div className="mt-0.5 text-[10.5px] text-white/40">of {money(perDiemTotal)} today</div>
        </div>
        <div className="rounded-[14px] border border-border bg-surface px-[15px] py-3.5">
          <div className="mb-1 font-mono text-[10px] text-white/45">TOUR EXPENSES</div>
          <div className="text-[19px] font-bold">{money(tourExpensesTotal)}</div>
          <div className="mt-0.5 text-[10.5px] text-white/40">
            {receiptCount} receipt{receiptCount === 1 ? "" : "s"} logged
          </div>
        </div>
      </div>

      {showExpense && (
        <div className="fixed inset-0 z-10 flex items-end justify-center bg-black/60" onClick={() => setShowExpense(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[480px] rounded-t-2xl border-t border-border bg-surface p-5 pb-8">
            <div className="mb-4 text-[16px] font-semibold">Log expense</div>
            <form
              action={(fd) =>
                startTransition(async () => {
                  const amount = Number(fd.get("amount"));
                  const note = String(fd.get("note") ?? "");
                  const res = await logExpense(amount, note);
                  setShowExpense(false);
                  if (res.ok) fireToast(`Expense logged — ${money(Math.round(amount * 100))}`);
                })
              }
              className="flex flex-col gap-3"
            >
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-white/50">Amount ($)</span>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  required
                  autoFocus
                  placeholder="52.10"
                  className="rounded-[10px] border border-white/10 bg-surface-nested px-3.5 py-3 text-[16px] text-text outline-none focus:border-accent/50"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-white/50">What for</span>
                <input
                  name="note"
                  placeholder="Gas, food, merch supplies…"
                  className="rounded-[10px] border border-white/10 bg-surface-nested px-3.5 py-3 text-[14px] text-text outline-none focus:border-accent/50"
                />
              </label>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => setShowExpense(false)} className="flex-1 cursor-pointer rounded-[10px] border border-border py-3 text-[13.5px] text-white/70">
                  Cancel
                </button>
                <button type="submit" disabled={pending} className="flex-1 cursor-pointer rounded-[10px] bg-accent py-3 text-[13.5px] font-semibold text-canvas disabled:opacity-60">
                  {pending ? "Logging…" : "Log it"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

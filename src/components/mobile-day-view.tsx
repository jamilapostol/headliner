"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useTransition } from "react";
import { money, fmtDateUTC } from "@/lib/format";
import { logExpense } from "@/lib/actions/mobile";
import { updateTransaction, deleteTransaction, restoreTransaction } from "@/lib/actions/transactions";

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

export type RecentExpenseDTO = {
  id: string;
  amount: number;
  source: string | null;
  occurredAt: string; // ISO
  receiptUrl: string | null;
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
  recentExpenses,
}: {
  todayLabel: string;
  nextShow: NextShowDTO | null;
  perDiemLeft: number;
  perDiemTotal: number;
  tourExpensesTotal: number;
  receiptCount: number;
  recentExpenses: RecentExpenseDTO[];
}) {
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [showExpense, setShowExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RecentExpenseDTO | null>(null);
  const [pending, startTransition] = useTransition();
  const [undoPending, startUndoTransition] = useTransition();

  function fireToast(msg: string) {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2600);
  }

  function tap(key: (typeof ACTIONS)[number]["key"]) {
    if (key === "expense") return setShowExpense(true);
    if (key === "merch") return; // real navigation via Link below
    if (key === "voice") return fireToast("Voice capture is coming in a future update.");
    if (key === "qr") return fireToast("Mobile POS is coming in a future update.");
  }

  function removeExpense(exp: RecentExpenseDTO) {
    startUndoTransition(async () => {
      const deleted = await deleteTransaction(exp.id);
      if (!deleted) return;
      fireToastWithUndo("Expense deleted", () => restoreTransaction(deleted));
    });
  }

  const [undoAction, setUndoAction] = useState<(() => void) | null>(null);

  function fireToastWithUndo(msg: string, onUndo: () => void) {
    setToastMsg(msg);
    setUndoAction(() => onUndo);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
      setUndoAction(null);
    }, 5000);
  }

  return (
    <div
      className="min-h-screen overflow-y-auto text-text"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 20px)", paddingBottom: "calc(env(safe-area-inset-bottom) + 32px)", paddingLeft: 18, paddingRight: 18 }}
    >
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" alt="HEADLINE.WORLD" width={24} height={24} />
          <span className="text-[14px] font-bold">Show day</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="font-mono text-[11px] text-text/45">{todayLabel}</div>
          <Link href="/app" className="rounded-lg border border-text/15 px-2.5 py-1 text-[11.5px] font-medium text-text/70 active:bg-text/[.06]">
            Exit
          </Link>
        </div>
      </div>

      {nextShow ? (
        <>
          <div className="mb-3.5 text-[12.5px] text-text/50">
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
            <div className="mb-3 text-[12.5px] text-text/60">{nextShow.city}</div>
            <div className="flex gap-2">
              {[
                { label: "LOAD-IN", value: nextShow.loadIn },
                { label: "DOORS", value: nextShow.doors },
                { label: "SET", value: nextShow.set },
              ].map((s) => (
                <div key={s.label} className="flex-1 rounded-[10px] border border-text/[.08] bg-text/5 py-2.5 text-center">
                  <div className="font-mono text-[10px] text-text/45">{s.label}</div>
                  <div className="mt-0.5 text-[14px] font-bold">{s.value ?? "—"}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="mb-3.5 text-[12.5px] text-text/50">No upcoming shows scheduled.</div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-2.5">
        {ACTIONS.map((a) =>
          a.key === "merch" ? (
            <Link
              key={a.key}
              href="/app/merch"
              className="rounded-[14px] border border-text/[.08] bg-surface px-[15px] py-3.5 active:bg-text/[.06]"
            >
              <div className={`mb-2 font-mono text-[16px] ${a.color}`}>{a.glyph}</div>
              <div className="text-[13px] font-semibold">{a.label}</div>
              <div className="mt-0.5 text-[10.5px] text-text/45">{a.sub}</div>
            </Link>
          ) : (
            <button
              key={a.key}
              onClick={() => tap(a.key)}
              className="cursor-pointer rounded-[14px] border border-text/[.08] bg-surface px-[15px] py-3.5 text-left active:bg-text/[.06]"
            >
              <div className={`mb-2 font-mono text-[16px] ${a.color}`}>{a.glyph}</div>
              <div className="text-[13px] font-semibold">{a.label}</div>
              <div className="mt-0.5 text-[10.5px] text-text/45">{a.sub}</div>
            </button>
          )
        )}
      </div>

      <div
        className="pointer-events-none fixed inset-x-4 z-20 mx-auto flex max-w-[440px] items-center gap-2.5 rounded-xl border border-accent/35 bg-surface px-3.5 py-2.5 text-[12.5px] shadow-lg transition-all duration-300 ease-out"
        style={{
          bottom: "calc(env(safe-area-inset-bottom) + 20px)",
          opacity: toastVisible ? 1 : 0,
          transform: toastVisible ? "translateY(0)" : "translateY(12px)",
        }}
      >
        <span className="h-[7px] w-[7px] flex-none animate-tp-pulse rounded-full bg-accent" />
        <span className="flex-1">{toastMsg}</span>
        {undoAction && (
          <button
            className="pointer-events-auto flex-none cursor-pointer font-semibold text-accent"
            onClick={() => {
              undoAction();
              setToastVisible(false);
              setUndoAction(null);
            }}
          >
            Undo
          </button>
        )}
      </div>

      {nextShow && (
        <>
          <div className="mb-2.5 font-mono text-[10.5px] tracking-[.12em] text-text/40">
            {nextShow.isToday ? "TODAY — SHOW DAY" : `TODAY — HEADING TO ${nextShow.city.split(",")[0].toUpperCase()}`}
          </div>
          <div className="mb-4 rounded-[14px] border border-border bg-surface px-4">
            {nextShow.schedule.map((ev, i) => (
              <div key={i} className="flex gap-3.5 border-b border-text/5 py-2.5 last:border-b-0">
                <div className="w-11 flex-none font-mono text-[12px] text-text/40">{ev.time}</div>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold">{ev.what}</div>
                  {ev.who && <div className="text-[11px] text-text/40">{ev.who}</div>}
                </div>
              </div>
            ))}
            {nextShow.schedule.length === 0 && <div className="py-3 text-center text-[12.5px] text-text/40">Nothing scheduled yet.</div>}
          </div>
        </>
      )}

      <div className="mb-2.5 font-mono text-[10.5px] tracking-[.12em] text-text/40">ON THE ROAD</div>
      <div className="mb-4 grid grid-cols-2 gap-2.5">
        <div className="rounded-[14px] border border-border bg-surface px-[15px] py-3.5">
          <div className="mb-1 font-mono text-[10px] text-text/45">PER DIEM LEFT</div>
          <div className="text-[19px] font-bold text-accent">{money(perDiemLeft)}</div>
          <div className="mt-0.5 text-[10.5px] text-text/40">of {money(perDiemTotal)} today</div>
        </div>
        <div className="rounded-[14px] border border-border bg-surface px-[15px] py-3.5">
          <div className="mb-1 font-mono text-[10px] text-text/45">TOUR EXPENSES</div>
          <div className="text-[19px] font-bold">{money(tourExpensesTotal)}</div>
          <div className="mt-0.5 text-[10.5px] text-text/40">
            {receiptCount} receipt{receiptCount === 1 ? "" : "s"} logged
          </div>
        </div>
      </div>

      <div className="mb-2.5 font-mono text-[10.5px] tracking-[.12em] text-text/40">RECENT EXPENSES</div>
      <div className="mb-4 rounded-[14px] border border-border bg-surface px-4">
        {recentExpenses.length === 0 && <div className="py-3 text-center text-[12.5px] text-text/40">No expenses logged yet.</div>}
        {recentExpenses.map((exp) => (
          <div key={exp.id} className="flex items-center gap-3 border-b border-text/5 py-2.5 last:border-b-0">
            {exp.receiptUrl ? (
              <Image src={exp.receiptUrl} alt="Receipt" width={72} height={72} className="h-9 w-9 flex-none rounded-md object-cover" />
            ) : (
              <div className="h-9 w-9 flex-none rounded-md bg-text/5" />
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold">{exp.source || "Tour expenses"}</div>
              <div className="text-[11px] text-text/40">{fmtDateUTC(new Date(exp.occurredAt), { month: "short", day: "numeric" })}</div>
            </div>
            <div className="flex-none font-mono text-[12.5px] text-orange">−{money(exp.amount)}</div>
            <div className="flex flex-none items-center gap-2 pl-1">
              <button onClick={() => setEditingExpense(exp)} className="cursor-pointer text-[11px] text-text/50 active:text-text">
                Edit
              </button>
              <button disabled={undoPending} onClick={() => removeExpense(exp)} className="cursor-pointer text-[11px] text-orange active:text-orange/80 disabled:opacity-50">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showExpense && (
        <div className="animate-tp-fade fixed inset-0 z-10 flex items-end justify-center bg-black/60" onClick={() => setShowExpense(false)}>
          <div onClick={(e) => e.stopPropagation()} className="animate-tp-sheet w-full max-w-[480px] rounded-t-2xl border-t border-border bg-surface p-5 pb-8">
            <div className="mb-4 text-[16px] font-semibold">Log expense</div>
            <form
              action={(fd) =>
                startTransition(async () => {
                  const amount = Number(fd.get("amount"));
                  const res = await logExpense(fd);
                  setShowExpense(false);
                  if (res.ok) fireToast(`Expense logged — ${money(Math.round(amount * 100))}`);
                })
              }
              className="flex flex-col gap-3"
            >
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-text/50">Amount ($)</span>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  required
                  autoFocus
                  placeholder="52.10"
                  className="rounded-[10px] border border-text/10 bg-surface-nested px-3.5 py-3 text-[16px] text-text outline-none focus:border-accent/50"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-text/50">What for</span>
                <input
                  name="note"
                  placeholder="Gas, food, merch supplies…"
                  className="rounded-[10px] border border-text/10 bg-surface-nested px-3.5 py-3 text-[14px] text-text outline-none focus:border-accent/50"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-text/50">Receipt photo (optional)</span>
                <input
                  name="receipt"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="rounded-[10px] border border-text/10 bg-surface-nested px-3.5 py-3 text-[13px] text-text outline-none file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-2.5 file:py-1 file:text-[11px] file:font-semibold file:text-ink"
                />
              </label>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => setShowExpense(false)} className="flex-1 cursor-pointer rounded-[10px] border border-border py-3 text-[13.5px] text-text/70">
                  Cancel
                </button>
                <button type="submit" disabled={pending} className="flex-1 cursor-pointer rounded-[10px] bg-accent py-3 text-[13.5px] font-semibold text-ink disabled:opacity-60">
                  {pending ? "Logging…" : "Log it"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingExpense && (
        <div className="animate-tp-fade fixed inset-0 z-10 flex items-end justify-center bg-black/60" onClick={() => setEditingExpense(null)}>
          <div onClick={(e) => e.stopPropagation()} className="animate-tp-sheet w-full max-w-[480px] rounded-t-2xl border-t border-border bg-surface p-5 pb-8">
            <div className="mb-4 text-[16px] font-semibold">Edit expense</div>
            <form
              action={(fd) =>
                startTransition(async () => {
                  fd.set("kind", "expense");
                  fd.set("category", "Tour expenses");
                  fd.set("occurredAt", editingExpense.occurredAt.slice(0, 10));
                  await updateTransaction(editingExpense.id, fd);
                  setEditingExpense(null);
                  fireToast("Expense updated");
                })
              }
              className="flex flex-col gap-3"
            >
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-text/50">Amount ($)</span>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  required
                  defaultValue={(editingExpense.amount / 100).toString()}
                  className="rounded-[10px] border border-text/10 bg-surface-nested px-3.5 py-3 text-[16px] text-text outline-none focus:border-accent/50"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-text/50">What for</span>
                <input
                  name="source"
                  defaultValue={editingExpense.source ?? ""}
                  placeholder="Gas, food, merch supplies…"
                  className="rounded-[10px] border border-text/10 bg-surface-nested px-3.5 py-3 text-[14px] text-text outline-none focus:border-accent/50"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-text/50">Replace receipt photo (optional)</span>
                <input
                  name="receipt"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="rounded-[10px] border border-text/10 bg-surface-nested px-3.5 py-3 text-[13px] text-text outline-none file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-2.5 file:py-1 file:text-[11px] file:font-semibold file:text-ink"
                />
              </label>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => setEditingExpense(null)} className="flex-1 cursor-pointer rounded-[10px] border border-border py-3 text-[13.5px] text-text/70">
                  Cancel
                </button>
                <button type="submit" disabled={pending} className="flex-1 cursor-pointer rounded-[10px] bg-accent py-3 text-[13.5px] font-semibold text-ink disabled:opacity-60">
                  {pending ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

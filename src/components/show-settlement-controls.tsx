"use client";

import { useMemo, useState, useTransition } from "react";
import { deviceTimeZone, isValidTimeZone, money } from "@/lib/format";
import { setBookingTimezone, setMerchCut, settleVenueMerchCut, tagTransaction } from "@/lib/actions/settlement";
import { useClientClock } from "@/lib/use-client-clock";

type Txn = { id: string; kind: string; category: string; amount: number; source: string | null; occurredAt: string };

// The two things about a show's settlement that need editing: what the venue
// takes off merch, and which nearby transactions belong to this night.

export function ShowSettlementControls({
  bookingId,
  merchCutPct,
  merchGross,
  venueMerchCutOwed,
  venueMerchCutSettled,
  venueMerchCutVariance,
  timezone,
  tagged,
  untagged,
}: {
  bookingId: string;
  merchCutPct: number;
  merchGross: number;
  venueMerchCutOwed: number;
  venueMerchCutSettled: number;
  venueMerchCutVariance: number;
  timezone: string | null;
  tagged: Txn[];
  untagged: Txn[];
}) {
  const [cut, setCut] = useState(String(merchCutPct));
  const [pending, startTransition] = useTransition();

  return (
    <>
      <div className="mt-3.5 rounded-card border border-border bg-surface px-5 py-[18px]">
        <div className="mb-1 text-[14.5px] font-semibold">Venue&rsquo;s cut of merch</div>
        <div className="mb-3.5 max-w-[560px] text-[12.5px] leading-relaxed text-text/50">
          Most rooms take a percentage off the merch table before you see it, and it rarely gets written down anywhere you look
          again. Set it here and it comes off this night&rsquo;s numbers.
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-[10px] border border-border bg-surface-nested px-3 py-2">
            <input
              value={cut}
              onChange={(e) => setCut(e.target.value)}
              onBlur={() => {
                const n = Number(cut);
                if (Number.isFinite(n) && n !== merchCutPct) startTransition(() => setMerchCut(bookingId, n));
              }}
              inputMode="decimal"
              className="w-12 bg-transparent text-right font-mono text-[13px] text-text outline-none"
              aria-label="Venue merch cut percent"
            />
            <span className="text-[12px] text-text/40">%</span>
          </div>
          <div className="text-[12.5px] text-text/55">
            {merchGross > 0 ? (
              <>
                {money(merchGross)} sold here → <span className="font-semibold text-orange">{money(venueMerchCutOwed)}</span> to
                the venue
              </>
            ) : (
              <>No merch income tagged to this night yet.</>
            )}
          </div>
          {pending && <span className="font-mono text-[10.5px] text-text/35">SAVING…</span>}
        </div>

        {venueMerchCutOwed > 0 && (
          <VenueCutSettlement
            bookingId={bookingId}
            owed={venueMerchCutOwed}
            settled={venueMerchCutSettled}
            variance={venueMerchCutVariance}
          />
        )}
      </div>

      <VenueTimezone bookingId={bookingId} timezone={timezone} />

      <div className="mt-3.5 rounded-card border border-border bg-surface px-5 py-[18px]">
        <div className="mb-1 text-[14.5px] font-semibold">What&rsquo;s counted here</div>
        <div className="mb-3.5 max-w-[560px] text-[12.5px] leading-relaxed text-text/50">
          Transactions attributed to this show. Anything left untagged still counts toward the tour, just not toward this night.
        </div>

        {tagged.length === 0 && <div className="py-1 text-[12.5px] text-text/40">Nothing tagged to this show yet.</div>}
        {tagged.map((t) => (
          <Row key={t.id} txn={t} action="Remove" onAction={() => tagTransaction(t.id, null)} />
        ))}

        {untagged.length > 0 && (
          <>
            <div className="mt-4 mb-2 font-mono text-[10.5px] tracking-[.1em] text-text/35">NEARBY, NOT ASSIGNED</div>
            {untagged.map((t) => (
              <Row key={t.id} txn={t} action="Add" onAction={() => tagTransaction(t.id, bookingId)} accent />
            ))}
          </>
        )}
      </div>
    </>
  );
}

function Row({ txn, action, onAction, accent }: { txn: Txn; action: string; onAction: () => void; accent?: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center justify-between gap-3 border-b border-text/[.05] py-2.5 text-[12.5px] last:border-b-0">
      <div className="flex min-w-0 items-baseline gap-2">
        <span className={`flex-none font-mono text-[10px] ${txn.kind === "income" ? "text-accent" : "text-orange"}`}>
          {txn.kind === "income" ? "IN" : "OUT"}
        </span>
        <span className="truncate">{txn.category}</span>
        <span className="flex-none truncate text-[11px] text-text/35">
          {txn.source ? `${txn.source} · ` : ""}
          {txn.occurredAt}
        </span>
      </div>
      <div className="flex flex-none items-center gap-3">
        <span className="font-mono font-semibold">{money(txn.amount)}</span>
        <button
          onClick={() => startTransition(onAction)}
          disabled={pending}
          className={`cursor-pointer text-[11.5px] disabled:opacity-40 ${accent ? "text-accent hover:underline" : "text-text/40 hover:text-text"}`}
        >
          {pending ? "…" : action}
        </button>
      </div>
    </div>
  );
}

/**
 * The venue's timezone — what decides when "tonight" starts and ends there,
 * and therefore which show the merch table files its sales against.
 *
 * Shows the current local time at the chosen zone as you type: a zone name
 * is hard to verify by reading, and a clock is not. The device's own zone
 * is offered in one tap because the person setting this up is usually
 * standing at the venue.
 */
function VenueTimezone({ bookingId, timezone }: { bookingId: string; timezone: string | null }) {
  const [value, setValue] = useState(timezone ?? "");
  const [pending, startTransition] = useTransition();
  const now = useClientClock(30_000);

  // Intl.supportedValuesOf is the real IANA list where the browser has it;
  // typing stays free-form either way, and the server validates regardless.
  const zones = useMemo(() => {
    try {
      const supported = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf;
      return supported ? supported("timeZone") : [];
    } catch {
      return [];
    }
  }, []);

  const device = typeof window === "undefined" ? null : deviceTimeZone();
  const valid = value.trim() !== "" && isValidTimeZone(value.trim());
  const localTime =
    valid && now
      ? new Intl.DateTimeFormat("en-US", { timeZone: value.trim(), hour: "numeric", minute: "2-digit", weekday: "short" }).format(now)
      : null;

  const save = (next: string | null) => startTransition(() => setBookingTimezone(bookingId, next));

  return (
    <div className="mt-3.5 rounded-card border border-border bg-surface px-5 py-[18px]">
      <div className="mb-1 text-[14.5px] font-semibold">Venue timezone</div>
      <div className="mb-3.5 max-w-[560px] text-[12.5px] leading-relaxed text-text/50">
        Decides when tonight begins and ends at this venue, so the merch table files sales against the right show. Without it the
        app falls back to the selling device&rsquo;s own timezone.
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <input
          list="tz-options"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => {
            const next = value.trim();
            if (next === (timezone ?? "")) return;
            if (next === "") save(null);
            else if (isValidTimeZone(next)) save(next);
          }}
          placeholder="America/Los_Angeles"
          aria-label="Venue timezone"
          className="min-w-[220px] flex-1 rounded-[10px] border border-border bg-surface-nested px-3 py-2 text-[13px] outline-none focus:border-accent/50"
        />
        <datalist id="tz-options">
          {zones.map((z) => (
            <option key={z} value={z} />
          ))}
        </datalist>

        {device && device !== value && (
          <button
            onClick={() => {
              setValue(device);
              save(device);
            }}
            className="cursor-pointer rounded-[10px] border border-border px-3 py-2 text-[12px] text-text/70 hover:border-text/30"
          >
            Use this device&rsquo;s ({device})
          </button>
        )}
        {pending && <span className="font-mono text-[10.5px] text-text/35">SAVING…</span>}
      </div>

      <div className="mt-2.5 text-[12px] text-text/50">
        {localTime ? (
          <>
            It&rsquo;s <span className="font-semibold text-text">{localTime}</span> there now.
          </>
        ) : value.trim() === "" ? (
          <>Not set — falling back to the selling device&rsquo;s timezone.</>
        ) : (
          <span className="text-orange">Not a timezone this browser recognises, so it won&rsquo;t be saved.</span>
        )}
      </div>
    </div>
  );
}

/**
 * Reconciling the venue's cut: what their percentage says, against what
 * actually left the table.
 *
 * These differ more often than they should — a room takes 25% on the night
 * despite 20% in the contract, or waives it on a slow one — and the gap is
 * the only place that shows up. Until something is recorded the P&L carries
 * a derived estimate; recording turns it into a real expense and the
 * estimate stops being applied.
 */
function VenueCutSettlement({
  bookingId,
  owed,
  settled,
  variance,
}: {
  bookingId: string;
  owed: number;
  settled: number;
  variance: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (settled > 0) {
    const reconciled = variance === 0;
    return (
      <div className="mt-3 border-t border-border pt-3 text-[12.5px]">
        <span className="font-semibold text-text">{money(settled)} settled with the venue.</span>{" "}
        {reconciled ? (
          <span className="text-text/55">Matches their percentage exactly.</span>
        ) : variance > 0 ? (
          <span className="text-orange">{money(variance)} of their cut still unpaid.</span>
        ) : (
          <span className="text-orange">
            {money(-variance)} more than their {(owed > 0 ? "percentage" : "rate")} accounts for — worth checking what they
            actually took.
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3 border-t border-border pt-3">
      {open ? (
        <form
          action={(fd) =>
            startTransition(async () => {
              await settleVenueMerchCut(fd);
              setOpen(false);
            })
          }
          className="flex flex-wrap items-end gap-2"
        >
          <input type="hidden" name="bookingId" value={bookingId} />
          <label className="flex w-[110px] flex-col gap-1">
            <span className="text-[10.5px] text-text/45">Paid them $</span>
            <input
              name="amount"
              required
              autoFocus
              inputMode="decimal"
              defaultValue={(owed / 100).toFixed(2)}
              className="rounded-[8px] border border-border bg-surface-nested px-2.5 py-1.5 text-right font-mono text-[12.5px] outline-none focus:border-accent/50"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="cursor-pointer rounded-[8px] bg-accent px-3 py-1.5 text-[12px] font-semibold text-ink disabled:opacity-50"
          >
            {pending ? "Recording…" : "Record"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="cursor-pointer rounded-[8px] border border-border px-3 py-1.5 text-[12px] text-text/70"
          >
            Cancel
          </button>
          {pending && <span className="font-mono text-[10.5px] text-text/35">SAVING…</span>}
        </form>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 text-[12.5px]">
          <span className="text-text/55">
            Estimated from their percentage — nothing recorded as paid yet.
          </span>
          <button onClick={() => setOpen(true)} className="cursor-pointer text-[11.5px] text-accent hover:underline">
            Record what you paid
          </button>
        </div>
      )}
    </div>
  );
}

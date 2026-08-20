"use client";

import { useState, useTransition } from "react";
import { money } from "@/lib/format";
import { addStop, updateStop, removeStop, moveStop, addScheduleEvent, removeScheduleEvent } from "@/lib/actions/tour";

export type TourStopDTO = {
  id: string;
  venue: string;
  city: string;
  date: string;
  fee: number;
  driveMiles: number | null;
  hotel: string | null;
  hotelConfNo: string | null;
  merchNote: string | null;
  perDiemCents: number | null;
  schedule: Array<{ time: string; what: string; who: string }>;
};

export type TourDTO = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  stops: TourStopDTO[];
};

export type EligibleBookingDTO = { id: string; venue: string; city: string; date: string };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit", timeZone: "UTC" }).toUpperCase();
}

export function TourView({ tour, eligibleBookings }: { tour: TourDTO; eligibleBookings: EligibleBookingDTO[] }) {
  const [selIdx, setSelIdx] = useState(0);
  const [showAddStop, setShowAddStop] = useState(false);
  const [, startTransition] = useTransition();
  const stop = tour.stops[Math.min(selIdx, tour.stops.length - 1)];
  const totalMiles = tour.stops.reduce((a, s) => a + (s.driveMiles ?? 0), 0);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5 sm:px-8 sm:py-7">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-[22px] tracking-[-.02em] sm:text-[26px]">{tour.name}</h1>
        <button
          onClick={() => setShowAddStop(true)}
          className="cursor-pointer rounded-lg bg-accent px-3.5 py-1.5 text-[12.5px] font-semibold text-ink"
        >
          + Add stop
        </button>
      </div>
      <div className="mb-[18px] text-[13px] text-text/50">
        {new Date(tour.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })} –{" "}
        {new Date(tour.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })} · {tour.stops.length} shows ·{" "}
        {totalMiles.toLocaleString()} mi
      </div>

      {tour.stops.length === 0 ? (
        <div className="rounded-card border border-dashed border-text/15 bg-surface px-6 py-10 text-center text-[13px] text-text/50">
          No stops yet. Click &ldquo;+ Add stop&rdquo; to add a confirmed booking to this tour.
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-3.5 lg:grid-cols-[340px_1fr]">
          <div className="flex flex-col gap-0.5 rounded-card border border-border bg-surface p-2.5">
            {tour.stops.map((s, i) => (
              <div
                key={s.id}
                className="group flex items-center gap-2 rounded-lg px-3 py-2.5 hover:bg-text/5"
                style={{ background: i === selIdx ? "rgba(63,203,134,.09)" : "transparent" }}
              >
                <div onClick={() => setSelIdx(i)} className="flex flex-1 cursor-pointer items-center gap-3">
                  <div className="w-[46px] font-mono text-[11px]" style={{ color: i === selIdx ? "#3FCB86" : "rgba(var(--fg-rgb),.5)" }}>
                    {fmtDate(s.date)}
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold">{s.city}</div>
                    <div className="text-[11px] text-text/45">{s.venue}</div>
                  </div>
                  <div className="font-mono text-[10.5px] text-text/40">{s.driveMiles ? `${s.driveMiles} mi` : "—"}</div>
                </div>
                <div className="flex flex-none flex-col opacity-0 group-hover:opacity-100">
                  <button
                    disabled={i === 0}
                    onClick={() => startTransition(() => moveStop(s.id, "up"))}
                    className="cursor-pointer px-1 text-[10px] text-text/40 hover:text-accent disabled:cursor-default disabled:opacity-20"
                  >
                    ▲
                  </button>
                  <button
                    disabled={i === tour.stops.length - 1}
                    onClick={() => startTransition(() => moveStop(s.id, "down"))}
                    className="cursor-pointer px-1 text-[10px] text-text/40 hover:text-accent disabled:cursor-default disabled:opacity-20"
                  >
                    ▼
                  </button>
                </div>
                <button
                  onClick={() => {
                    if (selIdx >= tour.stops.length - 1) setSelIdx(Math.max(0, tour.stops.length - 2));
                    startTransition(() => removeStop(s.id));
                  }}
                  className="cursor-pointer px-1 text-[13px] text-text/30 opacity-0 hover:text-orange group-hover:opacity-100"
                  aria-label="Remove stop"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <StopDetail key={stop.id} stop={stop} />
        </div>
      )}

      {showAddStop && <AddStopModal tourId={tour.id} bookings={eligibleBookings} onClose={() => setShowAddStop(false)} />}
    </div>
  );
}

function StopDetail({ stop }: { stop: TourStopDTO }) {
  const [, startTransition] = useTransition();
  const [eventTime, setEventTime] = useState("");
  const [eventWhat, setEventWhat] = useState("");
  const [eventWho, setEventWho] = useState("");

  function addEvent() {
    if (!eventTime.trim() || !eventWhat.trim()) return;
    startTransition(() => addScheduleEvent(stop.id, eventTime, eventWhat, eventWho));
    setEventTime("");
    setEventWhat("");
    setEventWho("");
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="rounded-card border border-border bg-surface px-5 py-[18px]">
        <div className="mb-3.5 flex items-baseline justify-between">
          <div className="text-[15px] font-semibold">
            {stop.venue} — {stop.city}
          </div>
          <div className="font-mono text-[11px] text-text/45">{fmtDate(stop.date)}</div>
        </div>
        <div className="flex flex-col">
          {stop.schedule.map((ev, i) => (
            <div key={i} className="group flex items-center gap-4 border-b border-text/5 py-2 last:border-b-0">
              <div className="w-14 font-mono text-[12px] text-accent">{ev.time}</div>
              <div className="flex-1 text-[13px]">{ev.what}</div>
              <div className="text-[11.5px] text-text/40">{ev.who}</div>
              <button
                onClick={() => startTransition(() => removeScheduleEvent(stop.id, i))}
                className="cursor-pointer px-1 text-[13px] text-text/30 opacity-0 hover:text-orange group-hover:opacity-100"
                aria-label="Remove event"
              >
                ×
              </button>
            </div>
          ))}
          {stop.schedule.length === 0 && <div className="py-2 text-[12.5px] text-text/35">No schedule yet.</div>}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-text/[.06] pt-2.5">
          <input
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
            placeholder="6:00 PM"
            className="w-20 flex-none rounded-md border border-border bg-surface-nested px-2 py-1.5 font-mono text-[11.5px] text-text outline-none placeholder:text-text/25"
          />
          <input
            value={eventWhat}
            onChange={(e) => setEventWhat(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addEvent()}
            placeholder="What (e.g. Load-in)"
            className="min-w-0 flex-1 rounded-md border border-border bg-surface-nested px-2 py-1.5 text-[12.5px] text-text outline-none placeholder:text-text/25"
          />
          <input
            value={eventWho}
            onChange={(e) => setEventWho(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addEvent()}
            placeholder="Who"
            className="w-24 flex-none rounded-md border border-border bg-surface-nested px-2 py-1.5 text-[12.5px] text-text outline-none placeholder:text-text/25"
          />
          <button onClick={addEvent} className="cursor-pointer px-1.5 text-[15px] text-accent hover:text-accent/70" aria-label="Add event">
            +
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <div className="rounded-card border border-border bg-surface px-4 py-3.5">
          <div className="mb-1.5 font-label text-[10px] tracking-[.1em] text-text/45">GUARANTEE</div>
          <div className="text-[19px] font-bold text-accent">{money(stop.fee)}</div>
        </div>
        <EditableStat
          label="DRIVE MILES"
          value={stop.driveMiles != null ? String(stop.driveMiles) : ""}
          placeholder="—"
          onSave={(v) => updateStop(stop.id, { driveMiles: v ? Number(v) : null })}
        />
        <EditableStat
          label="PER DIEM ($/day)"
          value={stop.perDiemCents != null ? String(stop.perDiemCents / 100) : ""}
          placeholder="—"
          onSave={(v) => updateStop(stop.id, { perDiem: v ? Number(v) : 0 })}
        />
        <EditableStat label="HOTEL" value={stop.hotel ?? ""} placeholder="—" onSave={(v) => updateStop(stop.id, { hotel: v })} />
        <EditableStat
          label="HOTEL CONF #"
          value={stop.hotelConfNo ?? ""}
          placeholder="—"
          onSave={(v) => updateStop(stop.id, { hotelConfNo: v })}
        />
        <EditableStat
          label="MERCH IN VAN"
          value={stop.merchNote ?? ""}
          placeholder="—"
          onSave={(v) => updateStop(stop.id, { merchNote: v })}
        />
      </div>
    </div>
  );
}

function EditableStat({
  label,
  value,
  placeholder,
  onSave,
}: {
  label: string;
  value: string;
  placeholder: string;
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
    <div className="rounded-card border border-border bg-surface px-4 py-3.5">
      <div className="mb-1.5 font-label text-[10px] tracking-[.1em] text-text/45">{label}</div>
      {editing ? (
        <input
          autoFocus
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
          className="w-full rounded-md border border-accent/40 bg-surface-nested px-2 py-1 text-[13.5px] text-text outline-none"
        />
      ) : (
        <div
          onClick={() => {
            setDraft(value);
            setEditing(true);
          }}
          className="cursor-pointer text-[13.5px] font-semibold leading-snug hover:text-accent"
        >
          {value || placeholder}
        </div>
      )}
    </div>
  );
}

function AddStopModal({ tourId, bookings, onClose }: { tourId: string; bookings: EligibleBookingDTO[]; onClose: () => void }) {
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      await addStop(formData);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[420px] rounded-2xl border border-border bg-surface p-6">
        <div className="mb-4 text-[17px] font-semibold">Add stop</div>
        {bookings.length === 0 ? (
          <div className="text-[13px] text-text/55">
            No confirmed bookings available to add. Move a booking to Confirmed or Paid on the Bookings board first.
          </div>
        ) : (
          <form action={submit} className="flex flex-col gap-3">
            <input type="hidden" name="tourId" value={tourId} />
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-text/50">Booking</span>
              <select
                name="bookingId"
                required
                className="rounded-[10px] border border-border bg-surface-nested px-3.5 py-2.5 text-[13.5px] text-text outline-none focus:border-accent/50"
              >
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {new Date(b.date).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })} — {b.venue}, {b.city}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Drive miles" name="driveMiles" type="number" placeholder="180" />
              <Field label="Per diem ($/day)" name="perDiem" type="number" placeholder="40" />
            </div>
            <Field label="Hotel" name="hotel" placeholder="Hampton Inn Downtown" />
            <Field label="Hotel confirmation #" name="hotelConfNo" placeholder="ABC123" />
            <Field label="Merch in van" name="merchNote" placeholder="12 tees, 8 vinyl" />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 cursor-pointer rounded-[10px] border border-border py-2.5 text-[13.5px] text-text/70"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="flex-1 cursor-pointer rounded-[10px] bg-accent py-2.5 text-[13.5px] font-semibold text-ink disabled:opacity-60"
              >
                {pending ? "Adding…" : "Add stop"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, name, placeholder, type = "text" }: { label: string; name: string; placeholder?: string; type?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium text-text/50">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        className="rounded-[10px] border border-border bg-surface-nested px-3.5 py-2.5 text-[13.5px] text-text outline-none focus:border-accent/50"
      />
    </label>
  );
}

"use client";

import { useState } from "react";
import { money } from "@/lib/format";

export type TourStopDTO = {
  id: string;
  venue: string;
  city: string;
  date: string;
  fee: number;
  driveMiles: number | null;
  hotel: string | null;
  merchNote: string | null;
  schedule: Array<{ time: string; what: string; who: string }>;
};

export type TourDTO = {
  name: string;
  startDate: string;
  endDate: string;
  stops: TourStopDTO[];
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit", timeZone: "UTC" }).toUpperCase();
}

export function TourView({ tour }: { tour: TourDTO }) {
  const [selIdx, setSelIdx] = useState(0);
  const stop = tour.stops[selIdx];
  const totalMiles = tour.stops.reduce((a, s) => a + (s.driveMiles ?? 0), 0);

  return (
    <div className="max-w-[1200px] px-8 py-7">
      <h1 className="mb-1 text-[26px] tracking-[-.02em]">{tour.name}</h1>
      <div className="mb-[18px] text-[13px] text-white/50">
        {new Date(tour.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })} –{" "}
        {new Date(tour.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })} · {tour.stops.length} shows ·{" "}
        {totalMiles.toLocaleString()} mi
      </div>

      <div className="mb-[18px] flex items-center gap-3 rounded-[10px] border border-yellow/25 bg-yellow-soft px-4 py-3">
        <span className="h-2 w-2 flex-none rounded-full bg-yellow" />
        <div className="text-[13px]">
          <strong className="text-yellow">Routing:</strong> Swapping Boise and Salt Lake saves 310 mi and one hotel night (~$460).
        </div>
        <div className="ml-auto cursor-pointer whitespace-nowrap text-[12px] text-yellow">Apply →</div>
      </div>

      <div className="grid grid-cols-[340px_1fr] items-start gap-3.5">
        <div className="flex flex-col gap-0.5 rounded-card border border-border bg-surface p-2.5">
          {tour.stops.map((s, i) => (
            <div
              key={s.id}
              onClick={() => setSelIdx(i)}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/5"
              style={{ background: i === selIdx ? "rgba(63,232,122,.09)" : "transparent" }}
            >
              <div className="w-[46px] font-mono text-[11px]" style={{ color: i === selIdx ? "#3fe87a" : "rgba(233,236,232,.5)" }}>
                {fmtDate(s.date)}
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold">{s.city}</div>
                <div className="text-[11px] text-white/45">{s.venue}</div>
              </div>
              <div className="font-mono text-[10.5px] text-white/40">{s.driveMiles ? `${s.driveMiles} mi` : "—"}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="rounded-card border border-border bg-surface px-5 py-[18px]">
            <div className="mb-3.5 flex items-baseline justify-between">
              <div className="text-[15px] font-semibold">
                {stop.venue} — {stop.city}
              </div>
              <div className="font-mono text-[11px] text-white/45">{fmtDate(stop.date)}</div>
            </div>
            <div className="flex flex-col">
              {stop.schedule.map((ev, i) => (
                <div key={i} className="flex gap-4 border-b border-white/5 py-2 last:border-b-0">
                  <div className="w-14 font-mono text-[12px] text-accent">{ev.time}</div>
                  <div className="text-[13px]">{ev.what}</div>
                  <div className="ml-auto text-[11.5px] text-white/40">{ev.who}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3.5">
            <div className="rounded-card border border-border bg-surface px-4 py-3.5">
              <div className="mb-1.5 font-mono text-[10px] tracking-[.1em] text-white/45">GUARANTEE</div>
              <div className="text-[19px] font-bold text-accent">{money(stop.fee)}</div>
            </div>
            <div className="rounded-card border border-border bg-surface px-4 py-3.5">
              <div className="mb-1.5 font-mono text-[10px] tracking-[.1em] text-white/45">HOTEL</div>
              <div className="text-[13.5px] font-semibold leading-snug">{stop.hotel || "—"}</div>
            </div>
            <div className="rounded-card border border-border bg-surface px-4 py-3.5">
              <div className="mb-1.5 font-mono text-[10px] tracking-[.1em] text-white/45">MERCH IN VAN</div>
              <div className="text-[13.5px] font-semibold leading-snug">{stop.merchNote || "—"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

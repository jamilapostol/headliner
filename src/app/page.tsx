"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const REPLACES = ["Spreadsheets", "Notes app", "HubSpot", "Dropbox folders", "Group texts", "Sticky notes on the dash"];

const FEATURES = [
  { glyph: "▤", color: "text-accent", title: "Booking pipeline", body: "Drag every hold from first email to fully paid. Never lose a room to a forgotten follow-up." },
  { glyph: "➤", color: "text-yellow", title: "Tour manager", body: "Route the run, advance every show, and hand the band a day sheet that answers every question." },
  { glyph: "◉", color: "text-blue", title: "Music-native CRM", body: "Promoters, buyers, press and sponsors — with relationship strength and last-contact nudges." },
  { glyph: "▣", color: "text-orange", title: "Merch that counts itself", body: "Per-show inventory, margins, and restock forecasts before you run out in Denver." },
  { glyph: "$", color: "text-accent", title: "Money, settled", body: "Guarantees, settlements, invoices and P&L by tour, city and venue. Tax-season ready." },
  { glyph: "✳", color: "text-purple", title: "Pilot AI", body: "Drafts your follow-ups, summarizes contracts, flags radius clauses, and predicts your best cities." },
];

function tiers(annual: boolean) {
  const price = (m: number) => (annual ? "$" + Math.round((m * 10) / 12) : "$" + m);
  return [
    {
      name: "Free",
      tagline: "Test the waters — your first bookings on us.",
      price: "$0",
      per: "forever",
      popular: false,
      cta: "Start free",
      feats: ["10 active bookings", "Contacts CRM (100)", "Unified calendar", "1 user"],
    },
    {
      name: "Pro Artist",
      tagline: "For working artists gigging every month.",
      price: price(24),
      per: "/mo",
      popular: false,
      cta: "Choose Pro",
      feats: ["Unlimited bookings", "Full CRM + reminders", "Merch inventory", "Financial hub", "Email campaigns (2k)"],
    },
    {
      name: "Touring Artist",
      tagline: "For artists living on the road.",
      price: price(59),
      per: "/mo",
      popular: true,
      cta: "Choose Touring",
      feats: ["Everything in Pro", "Tour routing + day sheets", "Pilot AI (drafts, summaries)", "Contracts + e-sign", "3 team seats"],
    },
    {
      name: "Management Team",
      tagline: "For managers running multiple artists.",
      price: price(129),
      per: "/mo",
      popular: false,
      cta: "Talk to us",
      feats: ["Everything in Touring", "Multi-artist workspaces", "Role-based permissions", "Accountant exports", "10 team seats"],
    },
  ];
}

const MATRIX: Array<[string, string, string, string, string]> = [
  ["Active bookings", "10", "∞", "∞", "∞"],
  ["Contacts", "100", "∞", "∞", "∞"],
  ["Merch inventory", "—", "✓", "✓", "✓"],
  ["Financial hub + P&L", "—", "✓", "✓", "✓"],
  ["Tour routing + day sheets", "—", "—", "✓", "✓"],
  ["Pilot AI", "—", "—", "✓", "✓"],
  ["Contracts + e-sign", "—", "—", "✓", "✓"],
  ["Team seats", "1", "1", "3", "10"],
  ["Multi-artist workspaces", "—", "—", "—", "✓"],
  ["Role-based permissions", "—", "—", "—", "✓"],
];

function matrixColor(v: string, isTouringCol: boolean) {
  if (v === "—") return "text-white/25";
  if (v === "✓") return isTouringCol ? "text-yellow" : "text-accent";
  return isTouringCol ? "text-white/75" : "text-white/60";
}

export default function LandingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <div className="mx-auto flex max-w-[1100px] items-center gap-4 px-4 py-[18px] sm:gap-7 sm:px-10">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.svg" alt="HEADLINER" width={28} height={28} />
          <div className="text-[15px] font-bold">HEADLINER</div>
        </div>
        <div className="ml-auto flex items-center gap-3 text-[13px] text-white/60 sm:gap-5">
          <span className="hidden cursor-pointer hover:text-text sm:inline">Features</span>
          <span className="hidden cursor-pointer hover:text-text sm:inline">Pricing</span>
          <Link href="/app" className="rounded-lg bg-accent px-4 py-2 font-semibold text-canvas">
            Open the app
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="mx-auto max-w-[820px] px-4 pt-12 pb-14 text-center sm:px-10 sm:pt-[72px]">
        <div className="mb-[22px] inline-block rounded-[20px] border border-yellow/30 px-3.5 py-[5px] font-mono text-[11px] tracking-[.14em] text-yellow">
          FOR INDEPENDENT TOURING MUSICIANS
        </div>
        <h1 className="mb-[18px] text-[34px] leading-[1.1] tracking-[-.03em] text-balance sm:text-[52px] sm:leading-[1.08]">
          Your whole career.
          <br />
          One <span className="text-accent">cockpit</span>.
        </h1>
        <p className="mx-auto mb-[30px] max-w-[560px] text-[15px] leading-[1.55] text-white/60 text-pretty sm:text-[17px]">
          Bookings, tours, merch, fans and money — the operating system for artists who run their career without a
          label. Retire the spreadsheets.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/signup" className="rounded-[10px] bg-accent px-[26px] py-[13px] text-[15px] font-semibold text-canvas">
            Start free
          </Link>
          <div className="cursor-pointer rounded-[10px] border border-white/15 px-[26px] py-[13px] text-[15px] text-white/80 hover:border-white/35">
            Watch demo — 2 min
          </div>
        </div>
        <div className="mt-4 text-[12px] text-white/40">Free forever for your first 10 bookings. No card required.</div>
      </div>

      {/* Retires strip */}
      <div className="mx-auto max-w-[900px] px-4 pb-16 text-center sm:px-10">
        <div className="mb-3.5 font-mono text-[11px] tracking-[.14em] text-white/35">RETIRES</div>
        <div className="flex flex-wrap justify-center gap-2.5">
          {REPLACES.map((r) => (
            <div
              key={r}
              className="rounded-[20px] border border-white/[.09] px-3.5 py-1.5 text-[12.5px] text-white/50 line-through decoration-orange/60"
            >
              {r}
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="mx-auto max-w-[1100px] px-4 pb-[72px] sm:px-10">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-tile border border-border bg-surface px-6 py-[22px]">
              <div className={`mb-3 font-mono text-[15px] ${f.color}`}>{f.glyph}</div>
              <div className="mb-[7px] text-[15.5px] font-semibold">{f.title}</div>
              <div className="text-[13px] leading-[1.55] text-white/55 text-pretty">{f.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="mx-auto max-w-[1100px] px-4 pb-10 sm:px-10">
        <h2 className="mb-1.5 text-center text-[24px] tracking-[-.02em] sm:text-[32px]">Priced for how you tour</h2>
        <div className="mb-3 text-center text-[14px] text-white/55">Monthly, cancel anytime. Two months free on annual.</div>
        <div className="mb-[30px] flex justify-center">
          <div className="flex gap-1 rounded-[10px] border border-white/10 bg-surface p-1">
            <button
              onClick={() => setAnnual(false)}
              className="cursor-pointer rounded-[7px] px-4 py-1.5 text-[12.5px] font-semibold"
              style={{ background: annual ? "transparent" : "#3fe87a", color: annual ? "rgba(233,236,232,.6)" : "#0d110e" }}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className="cursor-pointer rounded-[7px] px-4 py-1.5 text-[12.5px] font-semibold"
              style={{ background: annual ? "#3fe87a" : "transparent", color: annual ? "#0d110e" : "rgba(233,236,232,.6)" }}
            >
              Annual · −17%
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 items-stretch gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {tiers(annual).map((t) => (
            <div
              key={t.name}
              className="relative flex flex-col rounded-2xl p-6 px-[22px]"
              style={{
                background: t.popular ? "rgba(63,232,122,.06)" : "#151b16",
                border: `1px solid ${t.popular ? "rgba(63,232,122,.45)" : "rgba(255,255,255,.08)"}`,
              }}
            >
              {t.popular && (
                <div className="absolute -top-[11px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[20px] bg-yellow px-3 py-1 font-mono text-[10px] font-semibold tracking-[.1em] text-canvas">
                  MOST POPULAR
                </div>
              )}
              <div className="mb-1 text-[15px] font-semibold">{t.name}</div>
              <div className="mb-4 min-h-8 text-[12px] text-white/50 text-pretty">{t.tagline}</div>
              <div className="mb-[18px] flex items-baseline gap-[5px]">
                <span className="text-[34px] font-bold tracking-[-.03em]">{t.price}</span>
                <span className="text-[12px] text-white/45">{t.per}</span>
              </div>
              <div className="mb-[22px] flex flex-col gap-[9px]">
                {t.feats.map((f) => (
                  <div key={f} className="flex gap-[9px] text-[12.5px] leading-[1.4]">
                    <span className="flex-none text-accent">✓</span>
                    <span className="text-white/75">{f}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/signup"
                className="mt-auto rounded-[9px] p-[11px] text-center text-[13.5px] font-semibold"
                style={{
                  background: t.popular ? "#3fe87a" : "transparent",
                  color: t.popular ? "#0d110e" : "rgba(233,236,232,.85)",
                  border: `1px solid ${t.popular ? "#3fe87a" : "rgba(255,255,255,.18)"}`,
                }}
              >
                {t.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Feature matrix */}
      <div className="mx-auto max-w-[900px] px-4 pt-6 pb-[72px] sm:px-10">
        <div className="overflow-x-auto rounded-tile border border-border bg-surface">
          <div className="min-w-[560px]">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] border-b border-white/[.08] px-5 py-3 font-mono text-[10.5px] tracking-[.1em] text-white/45">
              <div>FEATURE</div>
              <div className="text-center">FREE</div>
              <div className="text-center">PRO</div>
              <div className="text-center text-yellow">TOURING</div>
              <div className="text-center">TEAM</div>
            </div>
            {MATRIX.map(([name, v1, v2, v3, v4]) => (
              <div
                key={name}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center border-b border-white/[.04] px-5 py-[10px] text-[12.5px]"
              >
                <div className="text-white/80">{name}</div>
                <div className={`text-center font-mono text-[11.5px] ${matrixColor(v1, false)}`}>{v1}</div>
                <div className={`text-center font-mono text-[11.5px] ${matrixColor(v2, false)}`}>{v2}</div>
                <div className={`text-center font-mono text-[11.5px] ${matrixColor(v3, true)}`}>{v3}</div>
                <div className={`text-center font-mono text-[11.5px] ${matrixColor(v4, false)}`}>{v4}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="border-t border-border px-4 py-14 text-center sm:px-10">
        <h2 className="mb-2.5 text-[22px] tracking-[-.02em] sm:text-[28px]">The van is packed. Is your business?</h2>
        <div className="mb-6 text-[14px] text-white/55">Set up your first tour in under ten minutes.</div>
        <Link href="/signup" className="inline-block rounded-[10px] bg-accent px-7 py-[13px] text-[15px] font-semibold text-canvas">
          Start free
        </Link>
        <div className="mt-10 font-mono text-[11px] text-white/30">© 2026 HEADLINER · Made for the road</div>
      </div>
    </div>
  );
}

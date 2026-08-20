"use client";

import { useState } from "react";
import Link from "next/link";

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
      feats: ["5 active bookings", "Contacts CRM (50)", "Unified calendar", "1 user"],
    },
    {
      name: "Pro Artist",
      tagline: "For working artists gigging every month.",
      price: price(24),
      per: "/mo",
      popular: false,
      cta: "Choose Pro",
      feats: ["Unlimited bookings", "Full CRM", "Merch inventory", "Financial hub", "Email campaigns (5k/mo)"],
    },
    {
      name: "Touring Artist",
      tagline: "For artists living on the road.",
      price: price(59),
      per: "/mo",
      popular: true,
      cta: "Choose Touring",
      feats: ["Everything in Pro", "Tour routing + day sheets", "Roadie AI (200 actions/mo)", "Contracts", "3 team seats"],
    },
    {
      name: "Management Team",
      tagline: "For managers running multiple artists.",
      price: price(129),
      per: "/mo",
      popular: false,
      cta: "Talk to us",
      feats: ["Everything in Touring", "Roadie AI (500 actions/mo)", "Multi-artist workspaces", "Role-based permissions", "Accountant exports", "10 team seats"],
    },
  ];
}

const MATRIX: Array<[string, string, string, string, string]> = [
  ["Active bookings", "5", "∞", "∞", "∞"],
  ["Contacts", "50", "∞", "∞", "∞"],
  ["Merch inventory", "—", "✓", "✓", "✓"],
  ["Financial hub + P&L", "—", "✓", "✓", "✓"],
  ["Email campaigns", "—", "5k/mo", "20k/mo", "50k/mo"],
  ["Tour routing + day sheets", "—", "—", "✓", "✓"],
  ["Roadie AI actions", "—", "—", "200/mo", "500/mo"],
  ["Contracts", "—", "—", "✓", "✓"],
  ["Team seats", "1", "1", "3", "10"],
  ["CSV export", "—", "—", "—", "✓"],
  ["Multi-artist workspaces", "—", "—", "—", "✓"],
  ["Role-based permissions", "—", "—", "—", "✓"],
];

function matrixColor(v: string, isTouringCol: boolean) {
  if (v === "—") return "text-white/25";
  if (v === "✓") return isTouringCol ? "text-yellow" : "text-accent";
  return isTouringCol ? "text-white/75" : "text-white/60";
}

export function LandingPricing({ heading, subheading }: { heading: string; subheading: string }) {
  const [annual, setAnnual] = useState(false);

  return (
    <>
      {/* Pricing */}
      <div className="mx-auto max-w-[1100px] px-4 pb-10 sm:px-10">
        <h2 className="mb-1.5 text-center text-[24px] tracking-[-.02em] sm:text-[32px]">{heading}</h2>
        <div className="mb-3 text-center text-[14px] text-white/55">{subheading}</div>
        <div className="mb-[30px] flex justify-center">
          <div className="flex gap-1 rounded-[10px] border border-white/10 bg-surface p-1">
            <button
              onClick={() => setAnnual(false)}
              className="cursor-pointer rounded-[7px] px-4 py-1.5 text-[12.5px] font-semibold"
              style={{ background: annual ? "transparent" : "#3FCB86", color: annual ? "rgba(233,236,232,.6)" : "#0B0A0E" }}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className="cursor-pointer rounded-[7px] px-4 py-1.5 text-[12.5px] font-semibold"
              style={{ background: annual ? "#3FCB86" : "transparent", color: annual ? "#0B0A0E" : "rgba(233,236,232,.6)" }}
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
                background: t.popular ? "rgba(63,232,122,.06)" : "#131118",
                border: `1px solid ${t.popular ? "rgba(63,232,122,.45)" : "rgba(255,255,255,.08)"}`,
              }}
            >
              {t.popular && (
                <div className="absolute -top-[11px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[20px] bg-yellow px-3 py-1 font-label text-[10px] font-semibold tracking-[.1em] text-canvas">
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
                  background: t.popular ? "#3FCB86" : "transparent",
                  color: t.popular ? "#0B0A0E" : "rgba(233,236,232,.85)",
                  border: `1px solid ${t.popular ? "#3FCB86" : "rgba(255,255,255,.18)"}`,
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
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] border-b border-white/[.08] px-5 py-3 font-label text-[10.5px] tracking-[.1em] text-white/45">
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
    </>
  );
}

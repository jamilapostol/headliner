"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { completeOnboarding, type PlanChoice } from "@/lib/actions/onboarding";
import { INTEGRATIONS } from "@/lib/integrations";

type Role = "solo" | "band" | "manager" | "crew";
type Volume = "few" | "half" | "full";

const ROLES: Array<{ key: Role; glyph: string; glyphColor: string; label: string; sub: string }> = [
  { key: "solo", glyph: "♪", glyphColor: "text-accent", label: "Solo artist", sub: "I book and play my own shows" },
  { key: "band", glyph: "♫", glyphColor: "text-yellow", label: "Band", sub: "We share the load across members" },
  { key: "manager", glyph: "◉", glyphColor: "text-blue", label: "Manager / agent", sub: "I run careers for one or more artists" },
  { key: "crew", glyph: "➤", glyphColor: "text-orange", label: "Tour manager / crew", sub: "I advance and run the road" },
];

const VOLUMES: Array<{ key: Volume; label: string; sub: string }> = [
  { key: "few", label: "A handful of shows", sub: "1–4 shows a month, mostly regional" },
  { key: "half", label: "Touring in runs", sub: "2–4 week runs, a few times a year" },
  { key: "full", label: "Living on the road", sub: "100+ shows a year" },
];

const RECS: Record<"light" | "heavy" | "team", { plan: PlanChoice; name: string; price: string; reason: string; feats: string[] }> = {
  light: {
    plan: "pro",
    name: "Pro Artist",
    price: "$24",
    reason: "A few shows a month — Pro covers unlimited bookings, merch and money without paying for tour tooling you won't use yet.",
    feats: ["Unlimited bookings", "Full CRM + reminders", "Merch inventory", "Financial hub"],
  },
  heavy: {
    plan: "touring",
    name: "Touring Artist",
    price: "$59",
    reason: "You're on the road most of the year — routing, day sheets and Roadie AI pay for themselves on the first run.",
    feats: ["Tour routing + day sheets", "Roadie AI drafts & summaries", "Contracts + e-sign", "3 team seats"],
  },
  team: {
    plan: "team",
    name: "Management Team",
    price: "$129",
    reason: "You're running this for more than one artist — you'll want separate workspaces and role-based permissions.",
    feats: ["Multi-artist workspaces", "Role-based permissions", "Accountant exports", "10 team seats"],
  },
};

function radioClasses(sel: boolean) {
  return {
    card: sel ? "border-accent/50 bg-accent-soft" : "border-border bg-surface",
    radio: sel ? "border-accent bg-accent" : "border-text/30 bg-transparent",
  };
}

export function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role | null>(null);
  const [volume, setVolume] = useState<Volume | null>(null);
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const [pending, startTransition] = useTransition();

  const canNext = (step === 1 && role) || (step === 2 && volume) || step === 3;

  const recKey: "light" | "heavy" | "team" = role === "manager" ? "team" : volume === "full" || volume === "half" ? "heavy" : "light";
  const rec = RECS[recKey];

  function finish(plan: PlanChoice) {
    startTransition(() => {
      completeOnboarding(plan, "monthly");
    });
  }

  return (
    <div className="flex min-h-screen flex-col items-center">
      <div className="w-full max-w-[640px] box-border px-8 pt-9 pb-[60px]">
        <div className="mb-9 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.svg" alt="HEADLINER" width={26} height={26} />
            <span className="text-[14px] font-bold">HEADLINER</span>
          </div>
          <div className="font-mono text-[11px] text-text/40">STEP {step} OF 4</div>
        </div>
        <div className="mb-11 flex gap-1.5">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-[3px] flex-1 rounded" style={{ background: n <= step ? "#3fe87a" : "rgba(var(--border-rgb),.1)" }} />
          ))}
        </div>

        {step === 1 && (
          <>
            <h1 className="mb-2 text-[30px] tracking-[-.02em]">Who&apos;s running this show?</h1>
            <p className="mb-7 text-[14.5px] text-text/55">We&apos;ll shape HEADLINER around how you work.</p>
            <div className="flex flex-col gap-2.5">
              {ROLES.map((r) => {
                const c = radioClasses(role === r.key);
                return (
                  <div
                    key={r.key}
                    onClick={() => setRole(r.key)}
                    className={`flex cursor-pointer items-center gap-4 rounded-2xl border px-5 py-[18px] hover:border-accent/50 ${c.card}`}
                  >
                    <div className={`font-mono text-[17px] ${r.glyphColor}`}>{r.glyph}</div>
                    <div className="flex-1">
                      <div className="text-[15px] font-semibold">{r.label}</div>
                      <div className="text-[12.5px] text-text/50">{r.sub}</div>
                    </div>
                    <div className={`grid h-5 w-5 place-items-center rounded-full border-[1.5px] text-[11px] font-bold text-ink ${c.radio}`}>
                      {role === r.key ? "✓" : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="mb-2 text-[30px] tracking-[-.02em]">How much are you on the road?</h1>
            <p className="mb-7 text-[14.5px] text-text/55">This helps us recommend the right plan — you can change it anytime.</p>
            <div className="flex flex-col gap-2.5">
              {VOLUMES.map((v) => {
                const c = radioClasses(volume === v.key);
                return (
                  <div
                    key={v.key}
                    onClick={() => setVolume(v.key)}
                    className={`flex cursor-pointer items-center gap-4 rounded-2xl border px-5 py-[18px] hover:border-accent/50 ${c.card}`}
                  >
                    <div className="flex-1">
                      <div className="text-[15px] font-semibold">{v.label}</div>
                      <div className="text-[12.5px] text-text/50">{v.sub}</div>
                    </div>
                    <div className={`grid h-5 w-5 place-items-center rounded-full border-[1.5px] text-[11px] font-bold text-ink ${c.radio}`}>
                      {volume === v.key ? "✓" : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="mb-2 text-[30px] tracking-[-.02em]">Bring your world in</h1>
            <p className="mb-7 text-[14.5px] text-text/55">
              Connect what you already use — we&apos;ll import contacts, shows and sales. All optional.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {INTEGRATIONS.map((ig) => {
                const on = !!connected[ig.key];
                return (
                  <div
                    key={ig.key}
                    onClick={() => setConnected((c) => ({ ...c, [ig.key]: !on }))}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3.5 hover:border-accent/50 ${
                      on ? "border-accent/50 bg-accent-soft" : "border-border bg-surface"
                    }`}
                  >
                    <div
                      className="grid h-8 w-8 flex-none place-items-center rounded-lg font-mono text-[12px] font-bold text-ink"
                      style={{ background: ig.chipBg }}
                    >
                      {ig.chip}
                    </div>
                    <div className="flex-1">
                      <div className="text-[13.5px] font-semibold">{ig.label}</div>
                      <div className="text-[11px] text-text/45">{ig.sub}</div>
                    </div>
                    <div className={`font-mono text-[12px] ${on ? "text-accent" : "text-text/40"}`}>{on ? "CONNECTED" : "CONNECT"}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="mb-2 text-[30px] tracking-[-.02em]">Your roadie recommends</h1>
            <p className="mb-7 text-[14.5px] text-text/55">{rec.reason}</p>
            <div className="relative mb-3.5 rounded-2xl border border-accent/45 bg-accent-soft p-6">
              <div className="absolute -top-[11px] left-6 rounded-[20px] bg-yellow px-3 py-1 font-mono text-[10px] font-semibold tracking-[.1em] text-ink">
                RECOMMENDED
              </div>
              <div className="mb-3.5 flex items-baseline justify-between">
                <div className="text-[19px] font-bold">{rec.name}</div>
                <div>
                  <span className="text-[26px] font-bold">{rec.price}</span>
                  <span className="text-[12px] text-text/45">/mo</span>
                </div>
              </div>
              <div className="mb-[18px] flex flex-col gap-2">
                {rec.feats.map((f) => (
                  <div key={f} className="flex gap-[9px] text-[13px]">
                    <span className="text-accent">✓</span>
                    <span className="text-text/80">{f}</span>
                  </div>
                ))}
              </div>
              <div className="mb-3.5 flex items-center gap-2.5 rounded-[10px] border border-text/10 bg-surface px-3.5 py-3">
                <div className="font-mono text-[12px] text-text/50">CARD</div>
                <input placeholder="4242 4242 4242 4242" className="flex-1 bg-transparent font-mono text-[13px] text-text outline-none" />
                <input placeholder="MM/YY" className="w-[52px] bg-transparent font-mono text-[13px] text-text outline-none" />
                <input placeholder="CVC" className="w-9 bg-transparent font-mono text-[13px] text-text outline-none" />
              </div>
              <button
                disabled={pending}
                onClick={() => finish(rec.plan)}
                className="block w-full rounded-[10px] bg-accent p-[13px] text-center text-[14.5px] font-semibold text-ink disabled:opacity-60"
              >
                {pending ? "Setting up…" : "Start 14-day free trial"}
              </button>
              <div className="mt-2.5 text-center text-[11.5px] text-text/40">No charge until your trial ends. Cancel in two clicks.</div>
            </div>
            <button disabled={pending} onClick={() => finish("free")} className="block w-full py-2.5 text-center text-[13px] text-text/50">
              Skip — start on the Free plan
            </button>
          </>
        )}

        {step < 4 && (
          <div className="mt-9 flex justify-between">
            <div
              onClick={() => step > 1 && setStep(step - 1)}
              className="cursor-pointer px-1 py-[11px] text-[13.5px]"
              style={{ color: step > 1 ? "rgba(var(--fg-rgb),.6)" : "rgba(var(--fg-rgb),.15)" }}
            >
              ← Back
            </div>
            <div
              onClick={() => canNext && setStep(step + 1)}
              className="rounded-[10px] px-[26px] py-[11px] text-[14px] font-semibold"
              style={{
                background: canNext ? "#3fe87a" : "rgba(var(--border-rgb),.08)",
                color: canNext ? "#0d110e" : "rgba(var(--fg-rgb),.3)",
                cursor: canNext ? "pointer" : "default",
              }}
            >
              Continue
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

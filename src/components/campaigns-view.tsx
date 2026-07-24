"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { money } from "@/lib/format";
import { planUnlocksAI } from "@/lib/ai";
import { toggleAutomation, createCampaign } from "@/lib/actions/campaigns";

export type CampaignDTO = {
  id: string;
  name: string;
  audienceLabel: string;
  sentAt: string;
  openRate: number;
  clickRate: number;
  revenue: number | null;
};

export type AutomationDTO = {
  id: string;
  name: string;
  trigger: string;
  enabled: boolean;
};

export function CampaignsView({
  campaigns,
  automations,
  subscriberCount,
  plan,
}: {
  campaigns: CampaignDTO[];
  automations: AutomationDTO[];
  subscriberCount: number;
  plan: string;
}) {
  const [showNew, setShowNew] = useState(false);
  const [, startTransition] = useTransition();
  const aiUnlocked = planUnlocksAI(plan);

  const avgOpen = campaigns.length ? Math.round((campaigns.reduce((a, c) => a + c.openRate, 0) / campaigns.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-5 sm:px-8 sm:py-7">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-[22px] tracking-[-.02em] sm:text-[26px]">Campaigns</h1>
        <button onClick={() => setShowNew(true)} className="cursor-pointer rounded-lg bg-accent px-4 py-2 text-[12.5px] font-semibold text-canvas">
          + New campaign
        </button>
      </div>
      <div className="mb-[18px] text-[13px] text-white/50">
        {subscriberCount.toLocaleString()} subscribers · avg open rate {avgOpen}%
      </div>

      <div className="grid grid-cols-1 items-start gap-3.5 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-3.5">
          <div className="overflow-x-auto rounded-card border border-border bg-surface">
            <div className="min-w-[480px]">
            <div className="border-b border-border px-[18px] py-3.5 text-[14.5px] font-semibold">Recent sends</div>
            {campaigns.map((c) => (
              <div key={c.id} className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center gap-2.5 border-b border-white/[.05] px-[18px] py-3 hover:bg-white/[.03]">
                <div>
                  <div className="text-[13px] font-semibold">{c.name}</div>
                  <div className="text-[11px] text-white/40">
                    {new Date(c.sentAt).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })} · {c.audienceLabel}
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[12.5px]">{Math.round(c.openRate * 100)}%</div>
                  <div className="text-[10px] text-white/35">OPEN</div>
                </div>
                <div>
                  <div className="font-mono text-[12.5px]">{Math.round(c.clickRate * 100)}%</div>
                  <div className="text-[10px] text-white/35">CLICK</div>
                </div>
                <div>
                  <div className="font-mono text-[12.5px] text-accent">{c.revenue != null ? money(c.revenue) : "—"}</div>
                  <div className="text-[10px] text-white/35">REVENUE</div>
                </div>
              </div>
            ))}
            {campaigns.length === 0 && <div className="px-[18px] py-7 text-center text-[13px] text-white/40">No campaigns sent yet.</div>}
            </div>
          </div>

          {aiUnlocked ? (
            <div className="flex items-center gap-3 rounded-[10px] border border-accent/25 bg-accent-soft px-4 py-3">
              <span className="h-2 w-2 flex-none rounded-full bg-accent" />
              <div className="text-[13px]">
                <strong className="text-accent">Pilot AI:</strong> Next city announce is drafted for subscribers within 50 mi of your next confirmed show.{" "}
                <span className="cursor-pointer text-accent underline">Review draft →</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-[10px] border border-purple/30 bg-purple/[.06] px-4 py-3">
              <div className="text-[13px] text-white/60">
                <strong className="text-purple">Pilot AI:</strong> Auto-drafted announcements unlock on the Touring plan.{" "}
                <Link href="/app/billing" className="text-accent underline">
                  Upgrade →
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-card border border-border bg-surface px-4 py-4">
          <div className="mb-1 text-[14.5px] font-semibold">Automations</div>
          <div className="mb-3 text-[11.5px] text-white/45">Trigger-based sends — toggle on and forget.</div>
          <div className="flex flex-col gap-1">
            {automations.map((a) => (
              <div
                key={a.id}
                onClick={() => startTransition(() => toggleAutomation(a.id))}
                className="flex cursor-pointer items-center gap-3 rounded-[9px] px-2.5 py-2.5 hover:bg-white/[.04]"
              >
                <div className="relative h-5 w-[34px] flex-none rounded-full transition-colors" style={{ background: a.enabled ? "#3fe87a" : "rgba(255,255,255,.12)" }}>
                  <div
                    className="absolute top-0.5 h-4 w-4 rounded-full transition-all"
                    style={{ left: a.enabled ? "16px" : "2px", background: a.enabled ? "#0d110e" : "rgba(233,236,232,.6)" }}
                  />
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold">{a.name}</div>
                  <div className="text-[11px] text-white/45">{a.trigger}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showNew && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/60 px-4" onClick={() => setShowNew(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[420px] rounded-2xl border border-border bg-surface p-6">
            <div className="mb-4 text-[17px] font-semibold">New campaign</div>
            <form
              action={(fd) =>
                startTransition(async () => {
                  await createCampaign(fd);
                  setShowNew(false);
                })
              }
              className="flex flex-col gap-3"
            >
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-white/50">Name</span>
                <input
                  name="name"
                  required
                  placeholder="Fall tour announce"
                  className="rounded-[10px] border border-border bg-surface-nested px-3.5 py-2.5 text-[13.5px] text-text outline-none focus:border-accent/50"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-white/50">Audience</span>
                <input
                  name="audienceLabel"
                  required
                  placeholder="Full list"
                  className="rounded-[10px] border border-border bg-surface-nested px-3.5 py-2.5 text-[13.5px] text-text outline-none focus:border-accent/50"
                />
              </label>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => setShowNew(false)} className="flex-1 cursor-pointer rounded-[10px] border border-border py-2.5 text-[13.5px] text-white/70">
                  Cancel
                </button>
                <button type="submit" className="flex-1 cursor-pointer rounded-[10px] bg-accent py-2.5 text-[13.5px] font-semibold text-canvas">
                  Queue send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

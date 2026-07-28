"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { money } from "@/lib/format";
import { planUnlocksAI } from "@/lib/ai";
import { toggleAutomation, createCampaign, sendCampaign } from "@/lib/actions/campaigns";

export type CampaignDTO = {
  id: string;
  name: string;
  subject: string;
  audienceTier: string | null;
  status: "Draft" | "Sending" | "Sent" | "Failed";
  recipientCount: number;
  sentAt: string | null;
  revenue: number | null;
};

export type AutomationDTO = {
  id: string;
  name: string;
  trigger: string;
  enabled: boolean;
};

const TIERS = ["VIP", "Patron", "Donor", "Fan"] as const;

const STATUS_STYLE: Record<CampaignDTO["status"], { bg: string; color: string }> = {
  Draft: { bg: "rgba(var(--border-rgb),.08)", color: "rgba(var(--fg-rgb),.6)" },
  Sending: { bg: "rgba(232,228,63,.1)", color: "#e8e43f" },
  Sent: { bg: "rgba(63,232,122,.1)", color: "#3fe87a" },
  Failed: { bg: "rgba(232,83,63,.1)", color: "#e8533f" },
};

export function CampaignsView({
  campaigns,
  automations,
  subscriberCount,
  audienceCounts,
  resendEnabled,
  plan,
}: {
  campaigns: CampaignDTO[];
  automations: AutomationDTO[];
  subscriberCount: number;
  audienceCounts: Record<string, number>;
  resendEnabled: boolean;
  plan: string;
}) {
  const [showNew, setShowNew] = useState(false);
  const [audienceTier, setAudienceTier] = useState("all");
  const [, startTransition] = useTransition();
  const aiUnlocked = planUnlocksAI(plan);

  const sentCampaigns = campaigns.filter((c) => c.status === "Sent");

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-5 sm:px-8 sm:py-7">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-[22px] tracking-[-.02em] sm:text-[26px]">Campaigns</h1>
        <button onClick={() => setShowNew(true)} className="cursor-pointer rounded-lg bg-accent px-4 py-2 text-[12.5px] font-semibold text-ink">
          + New campaign
        </button>
      </div>
      <div className="mb-[18px] text-[13px] text-text/50">
        {subscriberCount.toLocaleString()} subscribed fans with an email on file
      </div>

      {!resendEnabled && (
        <div className="mb-[18px] flex items-center gap-3 rounded-[10px] border border-orange/30 bg-orange/[.06] px-4 py-3">
          <div className="text-[13px] text-text/70">
            <strong className="text-orange">No email provider connected.</strong> Campaigns save as drafts with a real audience and
            content, but sending needs <code className="text-text/85">RESEND_API_KEY</code> set in your environment.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-3.5 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-3.5">
          <div className="overflow-x-auto rounded-card border border-border bg-surface">
            <div className="min-w-[520px]">
              <div className="border-b border-border px-[18px] py-3.5 text-[14.5px] font-semibold">Campaigns</div>
              {campaigns.map((c) => (
                <div key={c.id} className="grid grid-cols-[1.6fr_1fr_1fr_auto] items-center gap-2.5 border-b border-text/[.05] px-[18px] py-3 hover:bg-text/[.03]">
                  <div>
                    <div className="text-[13px] font-semibold">{c.name}</div>
                    <div className="text-[11px] text-text/40">
                      {c.audienceTier ?? "All fans"} · {c.recipientCount.toLocaleString()} recipients
                      {c.sentAt ? ` · ${new Date(c.sentAt).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}` : ""}
                    </div>
                  </div>
                  <div>
                    <span
                      className="inline-block rounded-full px-2.5 py-[3px] font-mono text-[10px] tracking-[.05em]"
                      style={{ background: STATUS_STYLE[c.status].bg, color: STATUS_STYLE[c.status].color }}
                    >
                      {c.status.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-mono text-[12.5px] text-accent">{c.revenue != null ? money(c.revenue) : "—"}</div>
                    <div className="text-[10px] text-text/35">REVENUE</div>
                  </div>
                  <div>
                    {c.status === "Draft" && <SendButton campaignId={c.id} resendEnabled={resendEnabled} />}
                  </div>
                </div>
              ))}
              {campaigns.length === 0 && <div className="px-[18px] py-7 text-center text-[13px] text-text/40">No campaigns yet.</div>}
            </div>
          </div>

          {sentCampaigns.length > 0 && (
            <div className="rounded-[10px] border border-border bg-surface px-4 py-3 text-[11.5px] text-text/45">
              Open and click tracking isn&rsquo;t wired up yet — {sentCampaigns.length} campaign{sentCampaigns.length === 1 ? "" : "s"} sent, avg open rate not tracked.
            </div>
          )}

          {aiUnlocked ? (
            <div className="flex items-center gap-3 rounded-[10px] border border-accent/25 bg-accent-soft px-4 py-3">
              <span className="h-2 w-2 flex-none rounded-full bg-accent" />
              <div className="text-[13px]">
                <strong className="text-accent">Roadie AI:</strong> Next city announce is drafted for subscribers within 50 mi of your next confirmed show.{" "}
                <span className="cursor-pointer text-accent underline">Review draft →</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-[10px] border border-purple/30 bg-purple/[.06] px-4 py-3">
              <div className="text-[13px] text-text/60">
                <strong className="text-purple">Roadie AI:</strong> Auto-drafted announcements unlock on the Touring plan.{" "}
                <Link href="/app/billing" className="text-accent underline">
                  Upgrade →
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-card border border-border bg-surface px-4 py-4">
          <div className="mb-1 text-[14.5px] font-semibold">Automations</div>
          <div className="mb-3 text-[11.5px] text-text/45">Trigger-based sends — toggle on and forget.</div>
          <div className="flex flex-col gap-1">
            {automations.map((a) => (
              <div
                key={a.id}
                onClick={() => startTransition(() => toggleAutomation(a.id))}
                className="flex cursor-pointer items-center gap-3 rounded-[9px] px-2.5 py-2.5 hover:bg-text/[.04]"
              >
                <div className="relative h-5 w-[34px] flex-none rounded-full transition-colors" style={{ background: a.enabled ? "#3fe87a" : "rgba(var(--border-rgb),.12)" }}>
                  <div
                    className="absolute top-0.5 h-4 w-4 rounded-full transition-all"
                    style={{ left: a.enabled ? "16px" : "2px", background: a.enabled ? "#0d110e" : "rgba(var(--fg-rgb),.6)" }}
                  />
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold">{a.name}</div>
                  <div className="text-[11px] text-text/45">{a.trigger}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showNew && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/60 px-4" onClick={() => setShowNew(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[440px] rounded-2xl border border-border bg-surface p-6">
            <div className="mb-4 text-[17px] font-semibold">New campaign</div>
            <form
              action={(fd) =>
                startTransition(async () => {
                  await createCampaign(fd);
                  setShowNew(false);
                  setAudienceTier("all");
                })
              }
              className="flex flex-col gap-3"
            >
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-text/50">Internal name</span>
                <input
                  name="name"
                  required
                  placeholder="Fall tour announce"
                  className="rounded-[10px] border border-border bg-surface-nested px-3.5 py-2.5 text-[13.5px] text-text outline-none focus:border-accent/50"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-text/50">Subject line</span>
                <input
                  name="subject"
                  required
                  placeholder="We're coming to your city"
                  className="rounded-[10px] border border-border bg-surface-nested px-3.5 py-2.5 text-[13.5px] text-text outline-none focus:border-accent/50"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-text/50">Email body</span>
                <textarea
                  name="body"
                  required
                  rows={5}
                  placeholder="Hey — we just added a show near you..."
                  className="resize-y rounded-[10px] border border-border bg-surface-nested px-3.5 py-2.5 text-[13.5px] text-text outline-none focus:border-accent/50"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-text/50">Audience</span>
                <select
                  name="audienceTier"
                  value={audienceTier}
                  onChange={(e) => setAudienceTier(e.target.value)}
                  className="rounded-[10px] border border-border bg-surface-nested px-3.5 py-2.5 text-[13.5px] text-text outline-none"
                >
                  <option value="all">All subscribed fans ({(audienceCounts.all ?? 0).toLocaleString()})</option>
                  {TIERS.map((t) => (
                    <option key={t} value={t}>
                      {t} ({(audienceCounts[t] ?? 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </label>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => setShowNew(false)} className="flex-1 cursor-pointer rounded-[10px] border border-border py-2.5 text-[13.5px] text-text/70">
                  Cancel
                </button>
                <button type="submit" className="flex-1 cursor-pointer rounded-[10px] bg-accent py-2.5 text-[13.5px] font-semibold text-ink">
                  Save draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SendButton({ campaignId, resendEnabled }: { campaignId: string; resendEnabled: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function send() {
    setError(null);
    startTransition(async () => {
      const result = await sendCampaign(campaignId);
      if (result.error) setError(result.error);
      else setSent(true);
    });
  }

  if (sent) return <span className="text-[11.5px] text-accent">Sent</span>;

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={send}
        disabled={pending || !resendEnabled}
        title={resendEnabled ? undefined : "Add RESEND_API_KEY to send"}
        className="cursor-pointer rounded-md bg-accent px-3 py-1.5 text-[11.5px] font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? "Sending…" : "Send"}
      </button>
      {error && <span className="max-w-[160px] text-right text-[10.5px] text-orange">{error}</span>}
    </div>
  );
}

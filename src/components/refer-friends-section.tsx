"use client";

import { useState } from "react";
import { REFERRAL_REWARD_LABEL, REFEREE_DISCOUNT_PERCENT } from "@/lib/referral";

export function ReferFriendsSection({
  link,
  referredCount,
  convertedCount,
  creditsEarned,
}: {
  link: string;
  referredCount: number;
  convertedCount: number;
  creditsEarned: number;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <section className="rounded-card border border-border bg-surface p-5">
      <div className="mb-1 text-[13.5px] font-semibold">Refer friends</div>
      <div className="mb-4 text-[12.5px] text-text/50">
        Share your link. When a friend you invite becomes a paying customer, you get {REFERRAL_REWARD_LABEL} — they get{" "}
        {REFEREE_DISCOUNT_PERCENT}% off their first month.
      </div>

      <div className="mb-4 flex gap-2">
        <input
          readOnly
          value={link}
          onClick={(e) => e.currentTarget.select()}
          className="flex-1 rounded-[10px] border border-border bg-canvas px-3.5 py-2.5 font-mono text-[12.5px] text-text/80 outline-none"
        />
        <button onClick={copy} className="cursor-pointer rounded-md bg-accent px-4 py-2 text-[12.5px] font-semibold text-ink">
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-[10px] border border-border bg-canvas px-3.5 py-3 text-center">
          <div className="text-[19px] font-bold">{referredCount}</div>
          <div className="text-[11px] text-text/45">Friends referred</div>
        </div>
        <div className="rounded-[10px] border border-border bg-canvas px-3.5 py-3 text-center">
          <div className="text-[19px] font-bold">{convertedCount}</div>
          <div className="text-[11px] text-text/45">Became customers</div>
        </div>
        <div className="rounded-[10px] border border-border bg-canvas px-3.5 py-3 text-center">
          <div className="text-[19px] font-bold text-accent">{creditsEarned}</div>
          <div className="text-[11px] text-text/45">Free months earned</div>
        </div>
      </div>
    </section>
  );
}

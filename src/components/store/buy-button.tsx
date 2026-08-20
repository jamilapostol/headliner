"use client";

import { useState } from "react";
import { usd } from "@/components/store/store-ui";

// One gold action per view — this is it on a product page.
export function BuyButton({
  slug,
  type,
  price,
  available,
}: {
  slug: string;
  type: "pack" | "bundle";
  price: number;
  available: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function buy() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, type }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok || !data.url) {
        setError(data.error ?? "Couldn't start checkout. Try again.");
        setBusy(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Couldn't reach the server. Try again.");
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        onClick={buy}
        disabled={busy || !available}
        className="min-h-[44px] w-full rounded-[6px] bg-accent px-6 py-3.5 text-[15px] font-bold text-ink transition-[filter] hover:brightness-105 disabled:opacity-50 sm:w-auto"
      >
        {!available ? "Not yet available" : busy ? "Opening checkout…" : `Buy — ${usd(price)}`}
      </button>
      <div aria-live="polite" className="min-h-[18px] pt-2 text-[12.5px] text-orange">
        {error}
      </div>
    </div>
  );
}

"use client";

import { useId, useRef, useState } from "react";

// The free tool page has exactly one job: one email address. One field, one
// button, no name field — every extra field costs real conversions, and the
// brief is explicit that nothing should compete with this.

type Status = "idle" | "sending" | "done" | "error";

export function EmailCapture({
  toolSlug,
  downloadName,
  thanksHref,
  buttonLabel = "Send it to me",
}: {
  toolSlug?: string;
  downloadName?: string;
  thanksHref?: string;
  buttonLabel?: string;
}) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const honeypot = useRef<HTMLInputElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;

    // Client-side check is courtesy only — the route validates again, since
    // anything from a browser is a suggestion.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setStatus("error");
      setMessage("That doesn't look like an email address.");
      return;
    }

    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), toolSlug, company: honeypot.current?.value ?? "" }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Try again.");
        return;
      }
      setDownloadUrl(data.downloadUrl ?? null);
      setStatus("done");
      if (thanksHref) window.location.href = thanksHref;
    } catch {
      setStatus("error");
      setMessage("Couldn't reach the server. Check your connection and try again.");
    }
  }

  if (status === "done" && !thanksHref) {
    return (
      <div className="rounded-[6px] border border-accent/30 bg-accent-soft px-5 py-4">
        <div className="mb-1 text-[15px] font-semibold text-accent">On its way.</div>
        <div className="mb-3 text-[13.5px] leading-relaxed text-text/70">
          Check your inbox in about a minute — and grab it now if you&rsquo;d rather not wait.
        </div>
        {downloadUrl && (
          <a
            href={downloadUrl}
            download={downloadName}
            className="inline-block rounded-[6px] bg-accent px-5 py-2.5 text-[14px] font-bold text-ink"
          >
            Download it now
          </a>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="w-full">
      <label htmlFor={id} className="mb-2 block font-label text-[11px] tracking-[.2em] text-text/50">
        Your email
      </label>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <input
          id={id}
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          placeholder="you@band.com"
          aria-invalid={status === "error"}
          aria-describedby={`${id}-msg`}
          className="min-h-[44px] flex-1 rounded-[6px] border border-border bg-elevated px-4 py-3 text-[15px] text-text outline-none placeholder:text-text/35 focus:border-accent/60"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="min-h-[44px] rounded-[6px] bg-accent px-6 py-3 text-[15px] font-bold text-ink transition-[filter] hover:brightness-105 disabled:opacity-60"
        >
          {status === "sending" ? "Sending…" : buttonLabel}
        </button>
      </div>

      {/* Honeypot. Hidden from people and assistive tech alike; bots fill it. */}
      <input
        ref={honeypot}
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      {/* Announced, and never signalled by colour alone. */}
      <div id={`${id}-msg`} aria-live="polite" className="min-h-[20px] pt-2 text-[12.5px] text-orange">
        {status === "error" ? message : ""}
      </div>

      <div className="text-[12.5px] leading-relaxed text-text/45">
        The file lands in your inbox in about a minute, and downloads right away too.
      </div>
    </form>
  );
}

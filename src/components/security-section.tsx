"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

type Factor = { id: string; friendly_name?: string | null; status: string };

// Two-factor (TOTP) enrollment. Everything talks to Supabase Auth from the
// browser — codes and secrets never pass through our server.
export function SecuritySection() {
  const [factor, setFactor] = useState<Factor | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [enrolling, setEnrolling] = useState<{ factorId: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function refresh() {
    const supabase = createClient();
    const { data } = await supabase.auth.mfa.listFactors();
    setFactor(data?.totp?.[0] ?? null);
    setLoaded(true);
  }
  useEffect(() => {
    refresh();
  }, []);

  function beginEnroll() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Authenticator app" });
      if (error || !data) {
        setError(error?.message ?? "Could not start enrollment.");
        return;
      }
      setEnrolling({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    });
  }

  function confirmEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!enrolling) return;
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId: enrolling.factorId });
      if (cErr || !challenge) {
        setError(cErr?.message ?? "Could not verify. Try again.");
        return;
      }
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId: enrolling.factorId,
        challengeId: challenge.id,
        code: code.trim(),
      });
      if (vErr) {
        setError("That code didn't match — grab the current one and try again.");
        return;
      }
      setEnrolling(null);
      setCode("");
      setNotice("Two-factor is on. You'll be asked for a code at every login.");
      await refresh();
    });
  }

  function cancelEnroll() {
    if (!enrolling) return;
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.mfa.unenroll({ factorId: enrolling.factorId }).catch(() => {});
      setEnrolling(null);
      setCode("");
      setError(null);
    });
  }

  function disable() {
    if (!factor) return;
    if (!window.confirm("Turn off two-factor authentication? Your account will only be protected by your password.")) return;
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
      if (error) {
        setError(error.message);
        return;
      }
      setNotice("Two-factor is off.");
      await refresh();
    });
  }

  const verified = factor?.status === "verified";

  return (
    <section className="rounded-card border border-border bg-surface p-5">
      <div className="mb-1 text-[13.5px] font-semibold">Security</div>
      <div className="mb-4 text-[12px] text-text/45">
        Two-factor authentication adds a 6-digit code from an authenticator app (Google Authenticator, 1Password, Authy) on
        top of your password.
      </div>

      {!loaded ? (
        <div className="text-[12.5px] text-text/40">Checking…</div>
      ) : enrolling ? (
        <form onSubmit={confirmEnroll} className="flex flex-col gap-3">
          <div className="text-[12.5px] text-text/70">1. Scan this with your authenticator app:</div>
          <div
            className="w-fit rounded-xl bg-white p-3 [&_svg]:h-[164px] [&_svg]:w-[164px]"
            dangerouslySetInnerHTML={{ __html: enrolling.qr }}
          />
          <div className="text-[11.5px] text-text/45">
            Can&apos;t scan? Enter this key manually: <span className="font-mono text-text/70">{enrolling.secret}</span>
          </div>
          <div className="text-[12.5px] text-text/70">2. Enter the 6-digit code it shows:</div>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              inputMode="numeric"
              placeholder="000000"
              className="w-[140px] rounded-[10px] border border-border bg-canvas px-3.5 py-2.5 text-center font-label text-[16px] tracking-[.3em] text-text outline-none focus:border-accent/50"
            />
            <button
              type="submit"
              disabled={pending || code.length !== 6}
              className="rounded-[10px] bg-accent px-4 py-2.5 text-[13px] font-semibold text-ink disabled:opacity-60"
            >
              {pending ? "Verifying…" : "Turn on"}
            </button>
            <button type="button" onClick={cancelEnroll} className="px-2 text-[12.5px] text-text/50 hover:text-text">
              Cancel
            </button>
          </div>
        </form>
      ) : verified ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-accent">●</span> Two-factor authentication is <span className="font-semibold">on</span>
          </div>
          <button
            type="button"
            onClick={disable}
            disabled={pending}
            className="rounded-[10px] border border-border px-3.5 py-2 text-[12.5px] text-text/70 hover:text-text disabled:opacity-60"
          >
            Turn off
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={beginEnroll}
          disabled={pending}
          className="rounded-[10px] bg-accent px-4 py-2.5 text-[13px] font-semibold text-ink disabled:opacity-60"
        >
          {pending ? "Starting…" : "Turn on two-factor"}
        </button>
      )}

      {error && <div className="mt-3 rounded-lg border border-orange/30 bg-orange-soft px-3 py-2 text-[12.5px] text-orange">{error}</div>}
      {notice && <div className="mt-3 rounded-lg border border-accent/30 bg-accent-soft px-3 py-2 text-[12.5px] text-accent">{notice}</div>}
    </section>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { logOut } from "@/lib/actions/auth";

export function MfaVerifyForm({ next }: { next?: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const destination = next && next.startsWith("/") && !next.startsWith("//") ? next : "/app";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
      const totp = factors?.totp?.[0];
      if (listError || !totp) {
        setError("No authenticator found on this account. Log out and back in.");
        return;
      }
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: totp.id });
      if (challengeError || !challenge) {
        setError(challengeError?.message ?? "Could not start the check. Try again.");
        return;
      }
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totp.id,
        challengeId: challenge.id,
        code: code.trim(),
      });
      if (verifyError) {
        setError("That code didn't match. Codes rotate every 30 seconds — try the current one.");
        return;
      }
      // Session is AAL2 now — full page load so the server picks up the new token.
      window.location.assign(destination);
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="000000"
        autoFocus
        className="rounded-[10px] border border-border bg-surface px-3.5 py-3 text-center font-label text-[22px] tracking-[.4em] text-text outline-none focus:border-accent/50"
      />
      {error && (
        <div className="rounded-lg border border-orange/30 bg-orange-soft px-3 py-2 text-[13px] text-orange">{error}</div>
      )}
      <button
        type="submit"
        disabled={pending || code.length !== 6}
        className="rounded-[10px] bg-accent px-4 py-3 text-[14.5px] font-semibold text-canvas disabled:opacity-60"
      >
        {pending ? "Checking…" : "Verify"}
      </button>
      <button
        type="button"
        onClick={() => startTransition(() => logOut())}
        className="text-center text-[12.5px] text-muted hover:text-text"
      >
        Use a different account
      </button>
    </form>
  );
}

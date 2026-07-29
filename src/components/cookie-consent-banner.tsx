"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

const STORAGE_KEY = "cookie_consent_ack";

const listeners = new Set<() => void>();

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY) !== "1";
}

function getServerSnapshot() {
  return false;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function dismiss() {
  localStorage.setItem(STORAGE_KEY, "1");
  listeners.forEach((l) => l());
}

export function CookieConsentBanner() {
  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col items-center justify-between gap-3 border-t border-border bg-surface px-5 py-4 text-text sm:flex-row sm:px-8">
      <div className="text-[12.5px] text-text/70">
        We use cookies to keep you signed in and remember your preferences — no ad or tracking cookies.{" "}
        <Link href="/privacy" className="text-accent underline">
          Privacy policy
        </Link>
        .
      </div>
      <button
        onClick={dismiss}
        className="flex-none cursor-pointer rounded-[10px] bg-accent px-4 py-2 text-[12.5px] font-semibold text-ink"
      >
        Got it
      </button>
    </div>
  );
}

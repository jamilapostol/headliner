"use client";

import { useRouter } from "next/navigation";

export function ClosePageButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push("/");
      }}
      aria-label="Close"
      className="fixed top-5 right-5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-text/60 hover:text-text"
    >
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M1 1L14 14M14 1L1 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );
}

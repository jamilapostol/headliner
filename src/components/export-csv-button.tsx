"use client";

import Link from "next/link";

export function ExportCsvButton({ onClick, allowed }: { onClick: () => void; allowed: boolean }) {
  if (!allowed) {
    return (
      <Link
        href="/app/billing?locked=export"
        title="CSV export requires the Team plan"
        className="fixed bottom-6 right-6 z-[5] cursor-pointer rounded-lg border border-text/10 bg-surface px-4 py-2.5 text-[12.5px] font-semibold text-text/40 shadow-lg hover:border-orange/40 hover:text-orange sm:bottom-8 sm:right-8"
      >
        Export CSV 🔒
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-[5] cursor-pointer rounded-lg border border-text/15 bg-surface px-4 py-2.5 text-[12.5px] font-semibold text-text/80 shadow-lg hover:border-accent/50 hover:text-accent sm:bottom-8 sm:right-8"
    >
      Export CSV
    </button>
  );
}

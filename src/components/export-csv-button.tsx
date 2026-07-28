"use client";

export function ExportCsvButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-[5] cursor-pointer rounded-lg border border-text/15 bg-surface px-4 py-2.5 text-[12.5px] font-semibold text-text/80 shadow-lg hover:border-accent/50 hover:text-accent sm:bottom-8 sm:right-8"
    >
      Export CSV
    </button>
  );
}

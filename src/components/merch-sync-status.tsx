"use client";

// Small, shared indicator for the merch offline queue — used by both the
// inventory table and the point-of-sale cart so "3 sales haven't synced yet"
// is visible from wherever the seller happens to be looking, not just the
// screen that queued them.

type Sync = {
  pending: Array<{ key: string; lastError?: string }>;
  failed: Array<{ key: string; lastError?: string }>;
  flushing: boolean;
  discard: (key: string) => void;
  retry: (key: string) => void;
};

export function SyncStatus({ sync }: { sync: Sync }) {
  if (sync.pending.length === 0 && sync.failed.length === 0) return null;

  return (
    <div className="flex items-center gap-2 text-[11.5px]">
      {sync.pending.length > 0 && (
        <span className="rounded-full bg-yellow/10 px-2.5 py-[3px] font-mono text-[10.5px] text-yellow">
          {sync.flushing ? "SYNCING…" : `${sync.pending.length} NOT SYNCED`}
        </span>
      )}
      {sync.failed.length > 0 && (
        <div className="group relative">
          <span className="cursor-default rounded-full bg-orange/10 px-2.5 py-[3px] font-mono text-[10.5px] text-orange">
            {sync.failed.length} NEED{sync.failed.length === 1 ? "S" : ""} ATTENTION
          </span>
          <div className="absolute right-0 top-full z-10 mt-1 hidden w-64 rounded-lg border border-border bg-surface p-2.5 shadow-lg group-hover:block">
            {sync.failed.map((op) => (
              <div key={op.key} className="flex items-center justify-between gap-2 py-1 text-[11px]">
                <span className="min-w-0 truncate text-text/60">{op.lastError ?? "Sync failed."}</span>
                <div className="flex flex-none gap-1.5">
                  <button onClick={() => sync.retry(op.key)} className="cursor-pointer text-accent hover:underline">
                    Retry
                  </button>
                  <button onClick={() => sync.discard(op.key)} className="cursor-pointer text-text/40 hover:underline">
                    Discard
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

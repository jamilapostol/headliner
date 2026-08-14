import { unstable_rethrow } from "next/navigation";
import { db } from "@/lib/db";

export const GENERIC_ERROR = "Something went wrong. Please try again.";

// Records the failure where someone will actually see it (/admin/errors).
// console.error alone means every server-action failure — a campaign send
// that died mid-run, a Roadie 401, a Stripe webhook mismatch — shows the
// user a friendly message and then exists only in a Vercel runtime log
// nobody reads.
//
// Never throws. If the database is the thing that's broken, a failed write
// here must not replace the original error with a confusing one, so this
// swallows its own failure after logging it.
async function record(label: string, err: unknown): Promise<void> {
  try {
    const error = err instanceof Error ? err : new Error(String(err));
    await db.actionError.create({
      data: {
        label,
        message: error.message.slice(0, 1000),
        stack: error.stack?.slice(0, 4000) ?? null,
      },
    });
  } catch (writeErr) {
    console.error(`[action-error:persist-failed]`, writeErr);
  }
}

function logAndRecord(label: string, err: unknown): void {
  console.error(`[action:${label}]`, err);
  // Fire-and-forget: the user's response shouldn't wait on the error log,
  // and an unhandled rejection here would be worse than a missing row.
  void record(label, err);
}

// Wraps a Server Action body so an unexpected throw (a dropped DB
// connection, a Prisma constraint violation, a third-party API blip)
// surfaces as a friendly message instead of Next's raw error overlay.
// Must rethrow redirect()/notFound() control-flow signals unchanged —
// those work by throwing, and swallowing them here would silently break
// every action that redirects on success.
export async function withErrorLog<T>(label: string, fn: () => Promise<T>): Promise<T | undefined> {
  try {
    return await fn();
  } catch (err) {
    unstable_rethrow(err);
    logAndRecord(label, err);
    return undefined;
  }
}

export async function withErrorState<T extends { error?: string }>(label: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    unstable_rethrow(err);
    logAndRecord(label, err);
    return { error: GENERIC_ERROR } as T;
  }
}

// For actions with a fixed return shape that doesn't carry an error field
// (e.g. CSV import's {imported, skipped}) — falls back to a caller-supplied
// value on failure instead of throwing.
export async function withErrorFallback<T>(label: string, fallback: T, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    unstable_rethrow(err);
    logAndRecord(label, err);
    return fallback;
  }
}

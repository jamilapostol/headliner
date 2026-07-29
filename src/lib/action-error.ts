import { unstable_rethrow } from "next/navigation";

export const GENERIC_ERROR = "Something went wrong. Please try again.";

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
    console.error(`[action:${label}]`, err);
    return undefined;
  }
}

export async function withErrorState<T extends { error?: string }>(label: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    unstable_rethrow(err);
    console.error(`[action:${label}]`, err);
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
    console.error(`[action:${label}]`, err);
    return fallback;
  }
}

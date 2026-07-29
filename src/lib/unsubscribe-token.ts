import { createHmac, timingSafeEqual } from "crypto";

// Reuses the Supabase service role key as the HMAC secret — it's already a
// private, high-entropy value that's never exposed client-side, so it's a
// reasonable signing key without asking for a brand-new env var just for
// this. If it's ever missing (shouldn't happen — required for the rest of
// the app too), falls back to a fixed string rather than crashing signup
// emails; that fallback is only ever hit in a misconfigured environment.
const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || "insecure-fallback-secret-set-SUPABASE_SERVICE_ROLE_KEY";

export function signFanId(fanId: string): string {
  return createHmac("sha256", SECRET).update(fanId).digest("hex").slice(0, 32);
}

export function verifyFanToken(fanId: string, token: string | undefined | null): boolean {
  if (!token) return false;
  const expected = Buffer.from(signFanId(fanId));
  const actual = Buffer.from(token);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

import { headers } from "next/headers";
import { db } from "@/lib/db";

// DB-backed so it holds up across Vercel's stateless serverless instances —
// an in-memory counter would reset on every cold start. Self-cleaning: each
// check deletes that key's stale hits before counting, so the table never
// grows past whatever's currently inside the active window.
export async function checkRateLimit(key: string, opts: { max: number; windowMs: number }): Promise<{ ok: boolean }> {
  const since = new Date(Date.now() - opts.windowMs);
  await db.rateLimitHit.deleteMany({ where: { key, createdAt: { lt: since } } });
  const count = await db.rateLimitHit.count({ where: { key } });
  if (count >= opts.max) return { ok: false };
  await db.rateLimitHit.create({ data: { key } });
  return { ok: true };
}

export async function requestIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "unknown";
}

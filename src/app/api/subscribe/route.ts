import { NextResponse } from "next/server";
import { FREE_TOOLS, freeBySlug, freeDownloadUrl } from "@content/products";
import { storeClient } from "@/lib/store/supabase";
import { addToForm, kitConfigured, upsertSubscriber, KIT_FORM_ENV } from "@/lib/store/kit";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";

// Email capture for the free tools.
//
// Order matters and is the brief's, not a preference: our own subscribers
// row is written FIRST because it is the source of truth, then Kit is told.
// If Kit is down, misconfigured, or slow, the subscriber still exists on our
// side and the download still returns. Losing a capture because a third
// party had a bad minute is the one outcome this route exists to prevent.

export const runtime = "nodejs";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: Request) {
  let body: { email?: unknown; tags?: unknown; toolSlug?: unknown; company?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  // Honeypot: a real person never fills a field they cannot see. Answer 200
  // so a bot learns nothing from the response.
  if (typeof body.company === "string" && body.company.trim() !== "") {
    return NextResponse.json({ ok: true, downloadUrl: null });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  }

  // Reuses the app's DB-backed limiter rather than a second in-memory one —
  // an in-process counter resets on every serverless cold start.
  const limited = await checkRateLimit(`subscribe:${await requestIp()}`, { max: 10, windowMs: 60_000 });
  if (!limited.ok) {
    return NextResponse.json({ ok: false, error: "Too many attempts. Try again in a minute." }, { status: 429 });
  }

  const toolSlug = typeof body.toolSlug === "string" ? body.toolSlug : undefined;
  const tool = toolSlug ? freeBySlug(toolSlug) : undefined;
  if (toolSlug && !tool) {
    return NextResponse.json({ ok: false, error: "Unknown tool." }, { status: 400 });
  }

  // Tags come from the catalogue, never from the client — a posted tag list
  // would let anyone write arbitrary labels into our own table and Kit.
  const tags = tool
    ? [...tool.tags]
    : ["src:free-all", ...FREE_TOOLS.flatMap((t) => t.tags)];
  const uniqueTags = [...new Set(tags)];

  // 1. Our table first.
  try {
    const supabase = storeClient();
    const { data: existing } = await supabase.from("subscribers").select("tags").eq("email", email).maybeSingle();
    const merged = [...new Set([...(existing?.tags ?? []), ...uniqueTags])];

    const { error } = await supabase
      .from("subscribers")
      .upsert(
        { email, tags: merged, source: toolSlug ?? "free-all", kit_synced: false },
        { onConflict: "email" }
      );
    if (error) throw error;
  } catch (err) {
    console.error("subscribe: supabase write failed", err);
    return NextResponse.json({ ok: false, error: "Something went wrong saving that. Try again." }, { status: 500 });
  }

  // 2. Kit, best effort. Never awaited into the failure path.
  const downloadUrl = tool ? freeDownloadUrl(tool.file) : null;
  if (kitConfigured()) {
    void (async () => {
      try {
        const synced = await upsertSubscriber(email, uniqueTags);
        await addToForm(email, tool ? KIT_FORM_ENV[tool.slug] : KIT_FORM_ENV["all-tools"]);
        if (synced) {
          const supabase = storeClient();
          await supabase.from("subscribers").update({ kit_synced: true }).eq("email", email);
        }
      } catch (err) {
        console.error("subscribe: kit sync failed (download unaffected)", err);
      }
    })();
  }

  return NextResponse.json({ ok: true, downloadUrl });
}

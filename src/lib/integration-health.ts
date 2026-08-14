import "server-only";
import { aiEnabled, claude, ROADIE_MODEL } from "@/lib/claude";
import { resendEnabled } from "@/lib/resend";
import { stripeEnabled, stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { db } from "@/lib/db";

// Live integration checks for /admin/health.
//
// The xEnabled flags only prove an env var is non-empty — and a non-empty
// wrong value is worse than a missing one, because it turns graceful
// degradation into a hard failure at the moment a user needs the feature.
// A mangled Roadie key, for instance, makes aiEnabled true and then 401s
// every call instead of falling back to a template. Nothing surfaced that
// before this page existed.
//
// So each probe actually calls the service. They cost a little (one
// minimal Roadie call, one Stripe read) which is why this runs on demand,
// not on a schedule.

export type ProbeStatus = "ok" | "degraded" | "off" | "error";

export type Probe = {
  name: string;
  status: ProbeStatus;
  detail: string;
  /** What to do about it, when there's something to do. */
  fix?: string;
};

async function probeRoadie(): Promise<Probe> {
  if (!aiEnabled) {
    return {
      name: "Roadie AI (Anthropic)",
      status: "off",
      detail: "ANTHROPIC_API_KEY is unset. Roadie serves labelled templates instead of real drafts.",
      fix: "Add ANTHROPIC_API_KEY in Vercel, then redeploy.",
    };
  }
  try {
    const response = await claude().messages.create({
      model: ROADIE_MODEL,
      max_tokens: 16,
      messages: [{ role: "user", content: "Reply with OK." }],
    });
    return { name: "Roadie AI (Anthropic)", status: "ok", detail: `Key valid · ${response.model} responded.` };
  } catch (err) {
    const status = (err as { status?: number })?.status;
    return {
      name: "Roadie AI (Anthropic)",
      status: "error",
      detail:
        status === 401
          ? "Key is set but rejected (401). Every Roadie call is failing — it does NOT fall back to templates in this state."
          : `Call failed: ${(err as Error).message}`,
      fix: status === 401 ? "Replace ANTHROPIC_API_KEY with a valid key and redeploy." : undefined,
    };
  }
}

async function probeResend(): Promise<Probe> {
  if (!resendEnabled) {
    return {
      name: "Resend (campaign email)",
      status: "off",
      detail: "RESEND_API_KEY is unset. Campaign sends are disabled.",
      fix: "Add RESEND_API_KEY in Vercel, then redeploy.",
    };
  }
  try {
    const response = await fetch("https://api.resend.com/domains", {
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    });
    if (!response.ok) {
      return {
        name: "Resend (campaign email)",
        status: "error",
        detail: `Key is set but rejected (${response.status}). Campaign sends will fail.`,
        fix: "Replace RESEND_API_KEY and redeploy.",
      };
    }
    const body = (await response.json()) as { data?: Array<{ name: string; status: string }> };
    const verified = (body.data ?? []).filter((d) => d.status === "verified").map((d) => d.name);
    return {
      name: "Resend (campaign email)",
      status: verified.length ? "ok" : "degraded",
      detail: verified.length ? `Key valid · verified domains: ${verified.join(", ")}.` : "Key valid, but no verified sending domain.",
      fix: verified.length ? undefined : "Verify headline.world in the Resend dashboard.",
    };
  } catch (err) {
    return { name: "Resend (campaign email)", status: "error", detail: `Unreachable: ${(err as Error).message}` };
  }
}

async function probeStripe(): Promise<Probe> {
  if (!stripeEnabled || !stripe) {
    return {
      name: "Stripe (billing)",
      status: "off",
      detail: "STRIPE_SECRET_KEY is unset. Upgrades and the billing portal are disabled.",
      fix: "Add STRIPE_SECRET_KEY in Vercel, then redeploy.",
    };
  }
  try {
    await stripe.prices.list({ limit: 1 });
    const webhook = !!process.env.STRIPE_WEBHOOK_SECRET;
    return {
      name: "Stripe (billing)",
      status: webhook ? "ok" : "degraded",
      detail: webhook ? "Key valid · webhook secret present." : "Key valid, but STRIPE_WEBHOOK_SECRET is unset — plan changes won't sync back.",
      fix: webhook ? undefined : "Add STRIPE_WEBHOOK_SECRET from the Stripe dashboard.",
    };
  } catch (err) {
    return { name: "Stripe (billing)", status: "error", detail: `Key rejected: ${(err as Error).message}`, fix: "Replace STRIPE_SECRET_KEY and redeploy." };
  }
}

async function probeDatabase(): Promise<Probe> {
  try {
    const count = await db.workspace.count();
    return { name: "Database (Prisma → Supabase)", status: "ok", detail: `Reachable · ${count} workspaces.` };
  } catch (err) {
    return { name: "Database (Prisma → Supabase)", status: "error", detail: `Unreachable: ${(err as Error).message}` };
  }
}

async function probeStorage(): Promise<Probe> {
  try {
    const { data, error } = await createAdminClient().storage.listBuckets();
    if (error) throw error;
    const priv = (data ?? []).filter((b) => !b.public).map((b) => b.name);
    const pub = (data ?? []).filter((b) => b.public).map((b) => b.name);
    return {
      name: "Supabase storage",
      status: "ok",
      detail: `Private: ${priv.join(", ") || "none"} · Public: ${pub.join(", ") || "none"}.`,
    };
  } catch (err) {
    return { name: "Supabase storage", status: "error", detail: `Unreachable: ${(err as Error).message}` };
  }
}

function probeYantraBridge(): Probe {
  return process.env.YANTRA_BRIDGE_SECRET
    ? { name: "YANTRA OS bridge", status: "ok", detail: "Secret set — /api/integrations/yantra will answer authenticated reads." }
    : {
        name: "YANTRA OS bridge",
        status: "off",
        detail: "YANTRA_BRIDGE_SECRET is unset, so the bridge returns 401 to everyone. Yantra agents will report no live figures.",
        fix: "Add YANTRA_BRIDGE_SECRET (matching Yantra's HEADLINE_BRIDGE_SECRET) and redeploy.",
      };
}

export async function runIntegrationProbes(): Promise<Probe[]> {
  const [roadie, resend, stripeProbe, database, storage] = await Promise.all([
    probeRoadie(),
    probeResend(),
    probeStripe(),
    probeDatabase(),
    probeStorage(),
  ]);
  return [database, storage, roadie, resend, stripeProbe, probeYantraBridge()];
}
